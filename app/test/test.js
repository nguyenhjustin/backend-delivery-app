const request = require('request');
const expect = require('chai').expect;

//const Address = "http://192.168.99.100:8080";
const Address = "http://localhost:8080";

const StatusUnassign = "UNASSIGN";
const StatusSuccess = "SUCCESS";
const ErrorOrderTaken = "ORDER_ALREADY_BEEN_TAKEN";

var server;

before(function() {
  server = require('../app.js');
});

after(function() {
  server.close();
});

describe('backend delivery app tests', function () {
  var orderId;

  it('place order with number params', function(done) {
    var options = GetOptionsForPlaceOrder(
      22.3312061, 114.1491771, 22.325685, 114.164495);
    request.post(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      orderId = body.id;
      expect(body.status).to.equal(StatusUnassign);
      expect(body.distance).to.equal(2302);
      done();
    });
  });

  it('place order with numbers in string params', function(done) {
    var options = GetOptionsForPlaceOrder(
      "33.9093817", "-118.4238669", "33.8915236", "-118.373441");
    request.post(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body.status).to.equal(StatusUnassign);
      expect(body.distance).to.equal(6412);
      done();
    });
  });

  it('place order error', function(done) {
    var options = GetOptionsForPlaceOrder("a", "b", "c", "d");
    request.post(options, function(err, res, body) {
      expect(res.statusCode).to.equal(500);
      console.log(body.error);
      done();
    });
  });

  it('take order success', function(done) {
    var options = GetOptionsForTakeOrder(orderId);
    request.put(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body.status).to.equal(StatusSuccess);
      done();
    });
  });

  it('take order already been taken', function(done) {
    var options = GetOptionsForTakeOrder(orderId);
    request.put(options, function(err, res, body) {
      expect(res.statusCode).to.equal(409);
      expect(body.error).to.equal(ErrorOrderTaken);
      done();
    });
  });

  it("take order doesn't exist", function(done) {
    var options = GetOptionsForTakeOrder("doesNotExistId");
    request.put(options, function(err, res, body) {
      expect(res.statusCode).to.equal(409);
      console.log(body.error);
      done();
    });
  });

  it("list orders page 1 limit 1", function(done) {
    var options = GetOptionsForListOrders(1, 1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.has.lengthOf(1);
      
      done();
    });
  });

  it("list orders page 1 limit 2", function(done) {
    var options = GetOptionsForListOrders(1, 2);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.has.lengthOf(2);
      done();
    });
  });

  it("list orders page 2 limit 1", function(done) {
    var options = GetOptionsForListOrders(2, 1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.has.lengthOf(1);
      done();
    });
  });

  it("list orders high page low limit", function(done) {
    var options = GetOptionsForListOrders(9999, 1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.is.empty;
      done();
    });
  });

  it("list orders decimal params", function(done) {
    var options = GetOptionsForListOrders(1.99, 2.99);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.has.lengthOf(2);
      done();
    });
  });

  it("list orders invalid page", function(done) {
    var options = GetOptionsForListOrders(-1, 1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.is.empty;
      done();
    });
  });

  it("list orders invalid limit", function(done) {
    var options = GetOptionsForListOrders(1, -1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.is.empty;
      done();
    });
  });

  it("list orders invalid params", function(done) {
    var options = GetOptionsForListOrders("a", "b");
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body).to.be.an('array').that.is.empty;
      done();
    });
  });
});

/**
 * Gets the options needed for the request to place an order.
 * @param {number} startLatDeg 
 * @param {number} startLonDeg 
 * @param {number} endLatDeg 
 * @param {number} endLonDeg 
 */
function GetOptionsForPlaceOrder(startLatDeg, startLonDeg, endLatDeg, endLonDeg) {
  return {
    url: Address + "/order", 
    json: {
      "origin": [startLatDeg, startLonDeg],
      "destination": [endLatDeg, endLonDeg]
    }
  };
}

/**
 * Gets the options needed for the request to take an order.
 * @param {string} id 
 */
function GetOptionsForTakeOrder(id) {
  return {
    url: Address + "/order/" + id, 
    json: {
      "status": "taken"
    }
  };
}

/**
 * Gets the options needed for the request to list orders.
 * @param {number} page 
 * @param {number} limit 
 */
function GetOptionsForListOrders(page, limit) {
  return {
    url: Address + "/orders",
    json: true,
    qs: {
      "page": page,
      "limit": limit
    }
  };
}