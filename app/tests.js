var request = require('request');

//var Address = "http://192.168.99.100:8080";
var Address = "http://localhost:8080";

function PlaceOrder(
  startLatitudeDeg,
  startLongitudeDeg,
  endLatitudeDeg,
  endLongitudeDeg)
{
  console.log("Sending POST request.");
  
  request.post(
    {
      url: Address + "/order", 
      json: {
        "origin": [startLatitudeDeg, startLongitudeDeg],
        "destination": [endLatitudeDeg, endLongitudeDeg]
      }
    }, 
    function(err, httpResponse, body)
    {
      if (!err && httpResponse.statusCode == 200)
      {
        console.log("Response POST: " + body.id + " " + body.distance + 
          " " + body.status);
      }
      else if (httpResponse.statusCode == 500)
      {
        console.log("Response POST: " + body.error);
      }
      else
      {
        console.log("Response POST: " + err + " " + httpResponse + " " + body + "\n");
      }
    }
  );
}

function TakeOrder(id)
{
  console.log("Sending PUT request.");
  
  request.put(
    {
      url: Address + "/order/" + id, 
      json: {
        "status": "taken"
      }
    }, 
    function(err, httpResponse, body)
    {
      if (!err && httpResponse.statusCode == 200)
      {
        console.log("Response PUT: " + body.status);
      }
      else if (httpResponse.statusCode == 409)
      {
        console.log("Response PUT: " + body.error + "\n");
      }
      else
      {
        console.log("Response PUT: " + err + " " + httpResponse + " " + body + "\n");
      }
    }
  );
}

function ListOrders(
  page,
  limit)
{
  console.log("Sending GET request.");
  
  request.get(
    {
      url: Address + "/orders",
      qs: {
        "page": page,
        "limit": limit
      }
    }, 
    function(err, httpResponse, body)
    {
      if (!err && httpResponse.statusCode == 200)
      {
        console.log("Response GET: " + body);
      }
      else
      {
        console.log("Response GET: " + err + " " + httpResponse + " " + body + "\n");
      }    
    }
  );
}

PlaceOrder(1, 2, 3, 4);
TakeOrder(9001);
ListOrders(6, 9);