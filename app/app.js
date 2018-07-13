const uuidv4 = require('uuid/v4');

const express = require('express');
const app = express();
app.use(express.json());

// Create Google Maps client.
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyD8voOeC0AU27q7l91viJbnue45Z9eUlLs',
  Promise: Promise
});

// Connect to the database.
const redis = require('redis');
const client = redis.createClient(6379, 'redis');
//const client = redis.createClient(6379, "192.168.99.100");

client.on('connect', function() {
 console.log('Redis is now connected!\n');
});

client.on('error', function(err) {
  console.log("Redis Error: " + err);
});

// // Uncomment this function to clear the database.
// client.flushdb( function(err, succeeded) {
//  console.log(succeeded);
// });

const OrdersHashPrefix = "Orders:";
const OrdersSetKey = "Orders:Ids";
const IdField = "id";
const DistanceField = "distance";
const StatusField = "status";
const StatusUnassign = "UNASSIGN";
const StatusTaken = "taken";

// Setup routes.
app.post('/order', PostOrder);
app.put('/order/:id', PutOrderId);
app.get('/orders', GetOrders);

// Start the server.
var server = module.exports = app.listen(8080, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("App listening at http://%s:%s", host, port);
});

server.on('close', function(err) {
  console.log("Server closed!");
});

/**
 * Handles the creation of an order from a client.
 * @param {Request} req The request body contains:
 * {
 *   "origin": ["START_LATITUDE", "START_LONGTITUDE"],
 *   "destination": ["END_LATITUDE", "END_LONGTITUDE"]
 * }
 * @param {Response} res The response will send:
 * Header: HTTP 200, Body:
 * {
 *   "id": <order_id>,
 *   "distance": <total_distance>,
 *   "status": "UNASSIGN"
 * }
 * OR
 * Header: HTTP 500, Body:
 * {
 *   "error": "ERROR_DESCRIPTION"
 * }
 */
function PostOrder(req, res)
{
  var origin = req.body.origin;
  var destination = req.body.destination;
  console.log("Received POST with origin: " + origin + " and " +
    "destination: " + destination + "!\n");

  if (isNaN(origin[0]) || isNaN(origin[1]) || 
    isNaN(destination[0]) || isNaN(destination[1])) {
    HandleError(res, 500, "Body's origin or destination is invalid.");
    return;
  }

  // TODO: Even though it's unlikely, we should check that the generated 
  //       orderId doesn't already exist in the database.
  var orderId = uuidv4();
  var status = "UNASSIGN";

  // Use Google Maps API to get the distance.
  googleMapsClient.distanceMatrix({
    origins: [{lat: origin[0], lng: origin[1]}],
    destinations: [{lat: destination[0], lng: destination[1]}],
  })
  .asPromise()
  .then(response => { 
    if (response.status == 200) {
      console.log(response.json);
      let distance = response.json["rows"][0].elements[0].distance;
      console.log(distance);
      return Promise.resolve(distance.value);
    }
    else {
      return Promise.reject("Unable to get distance from Google Maps.");
    } 
  })

  .then((distance) => {
    // Store the order information in the database.
    var batch = client.batch();
    batch.HMSET(OrdersHashPrefix + orderId, 
      IdField, orderId,
      DistanceField, distance, 
      StatusField, status);
    batch.SADD(OrdersSetKey, orderId);
    batch.EXEC();

    // Send successful response back.
    res.status(200).send({
      [IdField]: orderId,
      [DistanceField]: distance,
      [StatusField]: status }); 
  })

  .catch(error => HandleError(res, 500, error) );
}

/**
 * Handles the taking of an order from a client.
 * @param {Request} req The request body contains:
 * {
 *   "status":"taken"
 * }
 * The request params contains: {int} id - The order id. 
 * @param {Response} res The response will send:
 * Header: HTTP 200, Body:
 * {
 *   "status": "SUCCESS"
 * }
 * OR
 * Header: HTTP 409, Body:
 * {
 *   "error": "ORDER_ALREADY_BEEN_TAKEN"
 * }
 */
function PutOrderId(req, res)
{
  var orderId = req.params.id;
  console.log("Received PUT with id: " + orderId + "!\n");

  // Validate the request body.
  if (req.body.status.toLowerCase() != StatusTaken) {
    HandleError(res, 409, "Request body is invalid.");
    return;
  }

  // Get the order information from the database.
  Promise.resolve()
  .then(() => {
    return new Promise((resolve, reject) => { 
      client.HGET(OrdersHashPrefix + orderId, StatusField, (err, status) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(status);
        }
      })
    }); 
  })

  .then((status) => {
    if (status == null) {
      return Promise.reject("ORDER_DOES_NOT_EXIST");
    }
    else if (status.toLowerCase() == StatusTaken) {
      return Promise.reject("ORDER_ALREADY_BEEN_TAKEN");
    }
    else if (status == StatusUnassign) {
      client.HSET(OrdersHashPrefix + orderId, StatusField, StatusTaken);
      res.status(200).send({ "status": "SUCCESS" }); 
    }
    else {
      return Promise.reject("Unknown order status: " + status);
    } 
  })

  .catch(error => HandleError(res, 409, error) );
}

/**
 * Handles the listing of orders based on the page number and limit number.
 * @param {Request} req The request query string contains:
 * {
 *   "page": <page_number>
 *   "limit": <number_of_orders_per_page>
 * }
 * @param {Response} res The response will send:
 * [
 *   {
 *     "id": <order_id>,
 *     "distance": <total_distance>,
 *     "status": <ORDER_STATUS>
 *   },
 *   ...
 * ]
 */
function GetOrders(req, res)
{
  var orders = [];

  // Parse the query string. Note: A number with a decimal will drop the 
  // numbers after the decimal.
  var page = parseInt(req.query.page);
  var limit = parseInt(req.query.limit);
  console.log(
    "Received GET with page: " + page + " and limit: " + limit + "!\n");

  // Validate that page and limit are whole numbers.
  if (!Number.isInteger(page) || !Number.isInteger(limit) || 
    page < 1 || limit < 1) 
  {
    res.send(orders);
    return;
  }

  // Get all the orders in the database.
  Promise.resolve()
  .then(() => {
    return new Promise((resolve, reject) => { 
      client.SMEMBERS(OrdersSetKey, (err, orderIds) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(orderIds);
        }
      })
    }); 
  })

  // Get all the information for each order.
  .then((orderIds) => {
    var batch = client.batch();
    for (var i = 0; i < orderIds.length; i++) {
      batch.HGETALL(OrdersHashPrefix + orderIds[i]);
    }

    return new Promise((resolve, reject) => { 
      batch.EXEC((err, objects) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(objects);
        } 
      }) 
    }); 
  })
  
  // Determine which orders to send back based on the page and limit.
  // TODO: The orders retrieved from the database may not be sorted 
  //       from oldest to newest.
  .then(objects => {
    var startIndex = (page - 1) * limit;
    var counter = 0;
    for (var i = startIndex; i < objects.length && counter < limit; i++) {
      orders.push(objects[i]);
      counter++;
    }

    console.log(orders.length);
    res.send(orders);
  })

  .catch(error => {
    console.log(error);
    res.send(orders); 
  });
}

/**
 * Responds an error back to the client.
 * @param {Response} res 
 * @param {integer} statusCode 
 * @param {string} error 
 */
function HandleError(res, statusCode, error) {
  console.log("Error: " + error);
  res.status(statusCode).send( { "error": error } );
}