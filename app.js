var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/order', function (req, res) {
  console.log("Received POST!\n");

  var orderId = 1;
  var dist = 101;
  var error = false;

  if (error)
  {
    res.status(500).send({
      "error": "ERROR_DESCRIPTION"
    });
    res.sendStatus(500);
  }
  else
  {
    res.status(200).send({
      "id": orderId,
      "distance": dist,
      "status": "UNASSIGN"
    });
  }
});

app.put('/order/:id', function (req, res) {
  var id = parseInt(req.params.id);

  console.log("Received PUT with id: " + id + "!\n");

  var error = false;

  if (error)
  {
    res.status(409).send({
      "error": "ORDER_ALREADY_BEEN_TAKEN"
    });
    res.sendStatus(500);
  }
  else
  {
    res.status(200).send({
      "status": "SUCCESS"
    });
  }
});

app.get('/orders', function (req, res) {
  var page = parseInt(req.query.page);
  var limit = parseInt(req.query.limit);

  console.log(
    "Received GET with page: " + page + " and limit: " + limit + "!\n");
  
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
});

// Start the server.
var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
   
  console.log("App listening at http://%s:%s", host, port)
});