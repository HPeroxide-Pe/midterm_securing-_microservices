const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit"); // Add rate limiting for security
const secret = require("../jwt-token.json");

app.use(express.json());

let productIdCounter = 0; // global product counter for id
const productDB = []; // a simple array acting as the product database

// Rate Limiting: Prevent brute-force attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(apiLimiter);

// Input validation utility
const validateProduct = (name, price, stock) => {
    if (!name || typeof price !== "number" || typeof stock !== "number") {
        return false;
    }
    if (price <= 0 || stock < 0) return false;
    return true;
};

// Create a new product (Protected route for admin only)
app.post("/products", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const { name, price, stock } = req.body;
    let productId = productIdCounter++;

    if (!validateProduct(name, price, stock)) {
        return res.status(400).send("Invalid or missing product details.");
    }

    try {
        const product = {
            productId,
            name,
            price,
            stock,
        };

        productDB.push(product);
        console.log("Product created:", productId);
        res.status(201).json(product);
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).send("Internal server error");
    }
});

// Get product details by ID
app.get("/products/:productId", (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = productDB[productId];

    if (!product) {
        return res.status(404).send("Product not found");
    }

    res.json(product);
});

// Update a product (Protected route for admin only)
app.put("/products/:productId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = productDB[productId];

    if (!product) {
        return res.status(404).send("Product not found");
    }

    const { name, price, stock } = req.body;

    if (typeof name !== "undefined") product.name = name;
    if (typeof price !== "undefined") {
        if (price <= 0) return res.status(400).send("Invalid price.");
        product.price = price;
    }
    if (typeof stock !== "undefined") {
        if (stock < 0) return res.status(400).send("Invalid stock.");
        product.stock = stock;
    }

    productDB[productId] = product;
    res.json(product);
});

// Delete a product (Protected route for admin only)
app.delete("/products/:productId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = productDB[productId];

    if (!product) {
        return res.status(404).send("Product not found");
    }

    productDB.splice(productId, 1); // Remove the product
    productIdCounter--; // Adjust the product counter

    // Reassign product IDs for consistency (optional)
    for (let i = productId; i < productDB.length; i++) {
        productDB[i].productId = i;
    }

    res.send("Product deleted");
});

// JWT verification middleware
function verifyJWT(req, res, next) {
    const authHeaders = req.headers["authorization"];
    const token = authHeaders && authHeaders.split(' ')[1];

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
        if (allowedRoles.includes(user.role)) {
            return res.sendStatus(403);
        }
        next();
    };
}

//app.listen(3001, () => console.log("Product service listening on port 3001!"));

// To use HTTPS, uncomment and configure with valid certificates
const https = require("https");
const fs = require("fs");

// Load SSL certificates
const sslOptions = {
    key: fs.readFileSync("./localhost.key"),
    cert: fs.readFileSync("./localhost.cert")
};

// Start the HTTPS server
https.createServer(sslOptions, app).listen(3001, () => {
    console.log('Secure product service running on https://localhost:3001');
});