const express = require("express");
const app = express();
const axios = require('axios');
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit"); // Add rate limiting for security
const secret = require("../jwt-token.json");

app.use(express.json());

// URL of customer and product services
const customerURL = 'http://localhost:3002/customers';
const productURL = 'http://localhost:3001/products';

let orderIdCounter = 0; // global order counter for id
const dataBank = []; // mock database for orders

//let JWT = '';

// Rate Limiting: Prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(apiLimiter);

// Create a new order (Protected route)
app.post("/orders", verifyJWT, verifyRole(["user"]), async (req, res) => {
  const customerId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
      return res.status(400).send("Invalid product or quantity.");
  }

  try {
      // Fetch customer details
      const customerResponse = await axios.get(`${customerURL}/${customerId}`, {
          headers: { "Authorization": `${req.headers.authorization}` }
      });
      const customerData = customerResponse.data;

      // Fetch product details
      const productResponse = await axios.get(`${productURL}/${productId}`, {
          headers: { "Authorization": `${req.headers.authorization}` }
      });
      const productData = productResponse.data;

      // Create a new order
      const order = {
          orderId: orderIdCounter++,
          customerId: customerData.customerId,
          productId: productData.productId,
          customerName: customerData.name,
          customerAddress: customerData.address,
          quantity: quantity,
          totalPrice: productData.price * quantity
      };

      dataBank.push(order);
      console.log("Order created:", order.orderId);
      res.status(201).json(order);
  } catch (error) {
      console.error("Error creating order:", error.message);
      res.status(500).send("Failed to create order. Please check customer/product details.");
  }
});

// Get an order by ID (Protected, admin role only)
app.get("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  const order = dataBank[parseInt(req.params.orderId)];

  if (!order) { //checks if an order isn't found
      return res.status(404).send("Order not found.");
  }

  res.json(order);
});

// Update an order (Protected, admin role only)
app.put("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  const order = dataBank[parseInt(req.params.orderId)];

  if (!order) {
      return res.status(404).send("Order not found.");
  }

  const { productId, quantity } = req.body;

  if (productId) order.productId = productId;
  if (quantity && quantity > 0) order.quantity = quantity;

  res.json(order);
});

// Delete an order (Protected, admin role only)
app.delete("/orders/:orderId", verifyJWT, verifyRole(["admin"]), (req, res) => {
  const orderIndex = parseInt(req.params.orderId);
  const order = dataBank[orderIndex];

  if (!order) {
      return res.status(404).send("Order not found.");
  }

  dataBank.splice(orderIndex, 1); // Remove the order
  console.log("Order deleted:", orderIndex);
  res.send("Order deleted.");
});

// JWT verification middleware
function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, secret.secret, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
  });
}

// Role verification middleware
function verifyRole(allowedRoles) {
  return (req, res, next) => {
      const user = req.user;
      if (!allowedRoles.includes(user.role)) {
          return res.sendStatus(403);
      }
      next();
  };
}

//app.listen(3003, () => console.log("Order service listening on port 3003!"));

// To use HTTPS, uncomment and configure with valid certificates
const https = require("https");
const fs = require("fs");
const sslOptions = {
    key: fs.readFileSync("../localhost.key"),
    cert: fs.readFileSync("../localhost.cert")
};

// Load SSL certificates
https.createServer(sslOptions, app).listen(3003, () => {
    console.log('Secure server running on https://localhost:3003');
});

// Start the HTTPS server
https.createServer(sslOptions, app).listen(3003, () => {
  console.log('Local server running on https://localhost');
}); //getting [EG:policy] warn: self-signed certificate; cannot proceed
