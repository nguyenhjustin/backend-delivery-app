var express = require('express');

var app = express();
app.use(express.json());

// Start the database.
var redis = require('redis');
var client = redis.createClient(6379, 'redis');
//var client = redis.createClient(6379, "192.168.99.100");

client.on('connect', function() {
 console.log('Redis is now connected!\n');
});

client.on('error', function(err) {
  console.log("Error " + err);
});

// // Uncomment this function to clear the database.
// client.flushdb( function(err, succeeded) {
//  console.log(succeeded);
// });

const uuidv4 = require('uuid/v4');

var OrdersHashPrefix = "Orders:";
var OrdersSetKey = "Orders:Ids";
var IdField = "id";
var DistanceField = "distance";
var StatusField = "status";
var ErrorDatabase = "Error in database command.";
var StatusUnassign = "UNASSIGN";
var StatusTaken = "taken";

// Setup routes.
app.post('/order', PostOrder);
app.put('/order/:id', PutOrderId);
app.get('/orders', GetOrders);

// Start the server.
var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
   
  console.log("App listening at http://%s:%s", host, port)
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

  // TODO: Check that orderId doesn't already exist in the database.
  var orderId = uuidv4();
  // TODO: Use Google Maps API to get distance for the order.
  var dist = 101;
  var status = "UNASSIGN";

  var batch = client.batch();

  batch.HMSET(OrdersHashPrefix + orderId, 
    IdField, orderId,
    DistanceField, dist, 
    StatusField, status);
  batch.SADD(OrdersSetKey, orderId);

  batch.EXEC(function(err, replies) {
    if ( err != null )
    {
      console.log("Error: " + err + "\n");

      res.status(500).send({
        "error": err
      });
    }
    else
    {
      console.log(orderId + " " + dist + " " + status);
      res.status(200).send({
        [IdField]: orderId,
        [DistanceField]: dist,
        [StatusField]: status
      });
    }
  });
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

  if (req.body.status != StatusTaken)
  {
    // TODO: Is this the correct status code?
    res.status(409).send({
      "error": "Request body is invalid."
    });
    return;
  }

  client.HGET(OrdersHashPrefix + orderId, StatusField, function(err, status){
    if (err != null)
    {
      console.log("Error: " + err + "\n");

      // TODO: Is this the correct status code?
      res.status(409).send({
        "error": ErrorDatabase
      });
      return;
    }

    if (status == null)
    {
      // TODO: Is this the correct status code?
      res.status(409).send({
        "error": "ORDER_DOES_NOT_EXIST"
      });
    }
    else if (status == StatusTaken)
    {
      res.status(409).send({
        "error": "ORDER_ALREADY_BEEN_TAKEN"
      });
    }
    else if (status == StatusUnassign)
    {
      client.HSET(OrdersHashPrefix + orderId, StatusField, StatusTaken, function(err, reply) {
        if (err != null)
        {
          console.log("Error: " + err + "\n");
  
          // TODO: Is this the correct status code?
          res.status(409).send({
            "error": ErrorDatabase
          });
        }
        else
        {
          res.status(200).send({
            "status": "SUCCESS"
          });
        }
      });
    }

  });

}

/**
 * 
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
  var page = parseInt(req.query.page);
  var limit = parseInt(req.query.limit);

  console.log(
    "Received GET with page: " + page + " and limit: " + limit + "!\n");

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1)
  {
    res.send(orders);
    return;
  }

  client.SMEMBERS(OrdersSetKey, function(err, orderIds) {
    if ( err != null )
    {
      console.log("Error: " + err + "\n");
      res.send(orders);
      return;
    }

    var batch = client.batch();

    for (var i = 0; i < orderIds.length; i++)
    {
      batch.HGETALL(OrdersHashPrefix + orderIds[i]);
    }

    batch.EXEC(function(err, objects) {
      if ( err != null )
      {
        console.log("Error: " + err + "\n");
        res.send(orders);
        return;
      }

      // TODO: Get the objects back based on the time their order was put in.
      //       For instance, the latest order should be at the end of the array.

      var startIndex = (page - 1) * limit;
      var counter = 0;
      for (var i = startIndex; i < objects.length && counter < limit; i++)
      {
        orders.push(objects[i]);
        counter++;
      }

      console.log(orders.length);

      res.send(orders);
    });

  });

}