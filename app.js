var express = require('express');
var app = express();

app.use(express.json());

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
  var orderId = 1;
  var dist = 101;
  var error = false;

  var origin = req.body.origin;
  var destination = req.body.destination;

  console.log("Received POST with origin: " + origin + " and " +
    "destination: " + destination + "!\n");
  console.log(req.body);

  if (error)
  {
    res.status(500).send({
      "error": "ERROR_DESCRIPTION"
    });
  }
  else
  {
    res.status(200).send({
      "id": orderId,
      "distance": dist,
      "status": "UNASSIGN"
    });
  }
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
  var id = parseInt(req.params.id);

  console.log("Received PUT with id: " + id + "!\n");
  console.log(req.body);

  var error = false;

  if (error)
  {
    res.status(409).send({
      "error": "ORDER_ALREADY_BEEN_TAKEN"
    });
  }
  else
  {
    res.status(200).send({
      "status": "SUCCESS"
    });
  }
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
  var page = parseInt(req.query.page);
  var limit = parseInt(req.query.limit);

  console.log(
    "Received GET with page: " + page + " and limit: " + limit + "!\n");
  console.log(req.body);

  var orders = [];
  orders.push({
    "id": 1,
    "distance": 101,
    "status": "UNASSIGN"
  });
  orders.push({
    "id": 2,
    "distance": 202,
    "status": "taken"
  });

  res.send(orders);
}