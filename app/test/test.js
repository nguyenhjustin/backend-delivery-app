var request = require('request');

var Address = "http://192.168.99.100:8080";
//var Address = "http://localhost:8080";

async function PlaceOrder(
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

async function TakeOrder(id)
{
  console.log("Sending PUT request.");
  
  request.put(
    {
      url: Address + "/order/" + id, 
      json: {
        "status": "TAKEN"
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

async function ListOrders(
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
        console.log("Count: " + body.length);
        console.log("Response GET: " + body);
      }
      else
      {
        console.log("Response GET: " + err + " " + httpResponse + " " + body + "\n");
      }    
    }
  );
}

async function Test()
{
  await PlaceOrder(33.9093817, -118.4238669, 33.8915236, -118.373441);
  await PlaceOrder("33.9093817", "-118.4238669", "33.8915236", "-118.373441")
  await TakeOrder("550a41b5-210c-4c7b-a669-ea8fd34bd877");
  await TakeOrder("e6d88f4f-052b-4c64-bdd0-3b5163da2efe");
  await TakeOrder("3682a5ab-27a1-49b8-ba0a-1deceaf2b958");
  await ListOrders(1, 20); // 11
  await ListOrders(-1, 20);
  await ListOrders(1, -20);
  await ListOrders(0, 0);
  await ListOrders('a', 'a');
  await ListOrders("b", "b");
  await ListOrders(1, 2); // 2
  await ListOrders(11, 1); // 1
  await ListOrders(1, 10); // 10
}

Test();