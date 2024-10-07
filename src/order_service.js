const express = require("express");
const app = express();
const axios = require('axios');
const jwt = require("jsonwebtoken");
const secret = require("../jwt-token.json");
// const https = require("https");
// const fs = require("fs");
// const sslOptions = {
//   key: fs.readFileSync("../localhost.key"),
//   cert: fs.readFileSync("../localhost.cert"),
//   requestCert: false,
//   rejectUnauthorized: false
// }

app.use(express.json());

const customerURL = 'http://localhost:3002/customers';
const productURL = 'http://localhost:3001/products';
let orderIdCounter = 0; // global order counter for id
const dataBank = []; // we have db at home
let JWT = '';
//create a new order
app.post("/orders", verifyJWT, verifyRole(["user"]),(req, res) => {
  let orderId = orderIdCounter++;
  // let customerData;
  // let productData;
  const customerId = req.user.id;
  const productId = req.body.productId;
  console.log(req.user.id);
  axios.get(`${customerURL}/${customerId}`, {headers: {"Authorization": `${req.headers.authorization}`}}).then((response) => { //Get request for customer service
    console.log('customer found', /*response.data //this is to check the response*/);
    let customerData = response.data;

    axios.get(`${productURL}/${productId}`, {
      headers: {
        "Authorization": `${req.headers.authorization}`
      }
    }).then((response) => {
      console.log('product found', /*response.data //this is to check the response*/);
      let productData = response.data;
      try{
        const order = {
          orderId : orderId,
          customerId: customerData.customerId,
          productId: productData.productId,
          customerName: customerData.name,
          customerAddress: customerData.address,
          quantity: req.body.quantity,
          totalPrice: productData.price * req.body.quantity
        };
        dataBank.push(order);
        console.log("order created");//testing, pls remove in final
        res.json(order).status(201);
      }catch{
        console.log("order not created"); //testing, pls remove in final
        res.json(500)
      }
    }).catch((error) => {
      console.log('product not found', /*error*/ ); //testing, pls remove in final
      res.status(404).send('product not found');
    });
  }).catch((error) => {
    console.log('customer not found', error); //testing, pls remove in final
    res.status(404).send('customer not found');
  });
  
});


//get an order
app.get("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  const order = dataBank[req.params.orderId]
  if(!order){ //checks if an order isn't found
    return res.status(404).send("order not found");
  }if (order){
    return res.json(order);
  }
});

//update an order
app.put("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  let order = dataBank[req.params.orderId]
  if(!order){ //checks if an order isn't found
    return res.status(404).send("order not found");
  }else{
    const {orderId, customerId, productID, customerName, customerAddress, quantity} = req.body;
    //failsafe for if the json in the PUT request is missing some fields.
    //might add a change for customer and product id, which might need another bunch of axios code, maybe later if naay time
    if(typeof orderId !== "undefined") order.orderId = parseInt(orderId);
    if(typeof customerId !== "undefined") order.customerId = parseInt(customerId);
    if(typeof productID !== "undefined") order.productID = parseInt(productID);
    if(typeof customerName !== "undefined") order.customerName = toString(customerName);
    if(typeof customerAddress !== "undefined") order.customerAddress = toString(customerAddress);
    if(typeof quantity !== "undefined") order.quantity = quantity;

    dataBank[req.params.orderId] = order
    res.json(order);
  }
});

//delete an order
app.delete("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  let order = dataBank[req.params.orderId];
  if(!order){ //checks if an order isn't found
    res.status(404).send("order not found");
  }else{
    dataBank.splice(req.params.orderId, 1);// removes orderID
    orderIdCounter--;// reduces global counter for orderID
    //goes from current index to the end of the list to change the orderId 
    //might remove later
    for(let i = req.params.orderId; i < dataBank.length; i++){
      dataBank[i].orderId = parseInt(i);
      //console.log('changed index ' + i); //used for testing, pls remove on final
    }
    res.send("order deleted");
  }
});

function verifyJWT(req, res, next) {
  const authHeaders = req.headers["authorization"];
  const token = authHeaders && authHeaders.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret.secret, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
  });
}

function verifyRole(allowedRoles) {
  return (req, res, next) => {
      const user = req.user;
      if (!allowedRoles.includes(user.role)) {
          return res.sendStatus(403);
      }
      next();
      
  }
}
app.listen(3003, () => console.log("Order service listening on port 3003!"));
// https.createServer(sslOptions, app).listen(3003, () => {
//   console.log('Local server running on https://localhost');
// }); //getting [EG:policy] warn: self-signed certificate; cannot proceed
