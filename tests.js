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
      body: JSON.stringify({
        "origin": [startLatitudeDeg, startLongitudeDeg],
        "destination": [endLatitudeDeg, endLongitudeDeg]
      })
    }, 
    function(err, httpResponse, body)
    {
      console.log("Response POST: " + err + " " + httpResponse + " " + body + "\n");
    }
  );
}

function TakeOrder(id)
{
  console.log("Sending PUT request.");
  
  request.put(
    {
      url: Address + "/order/" + id, 
      body: JSON.stringify({
        "status": "taken"
      })
    }, 
    function(err, httpResponse, body)
    {
      console.log("Response PUT: " + err + " " + httpResponse + " " + body + "\n");
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
      url: Address + "/orders?page=" + page + "&limit=" + limit, 
    }, 
    function(err, httpResponse, body)
    {
      console.log("Response GET: " + err + " " + httpResponse + " " + body + "\n");
    }
  );
}

PlaceOrder(1, 2, 3, 4);
TakeOrder(9001);
ListOrders(6, 9);