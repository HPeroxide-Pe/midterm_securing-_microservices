const express = require("express");
const jwt = require("jsonwebtoken");
const secret = require("../jwt-token.json");
const rateLimit = require("express-rate-limit"); // Add rate limiting for security
const app = express();
app.use(express.json());

let customerIdCounter = 0; // global customer counter for id
const customerDB = []; // simple array acting as the customer database

// Rate Limiting: Prevent brute-force attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(apiLimiter);

// Input validation utility
const validateCustomer = (name, email, address, role, password) => {
    if (!name || !email || !address || !role || !password) {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email format check
    if (!emailRegex.test(email)) return false;
    return true;
};

// Create a new customer/register
app.post("/customers", (req, res) => {
    const { name, email, address, role, password } = req.body;
    let customerId = customerIdCounter++;
    
    // Input validation
    if (!validateCustomer(name, email, address, role, password)) {
        return res.status(400).send("Invalid or missing customer details.");
    }

    try {
        const customer = {
            customerId,
            name,
            email,
            password,
            address,
            role,
        };

        customerDB.push(customer);
        console.log("Customer created: ", customerId);
        res.status(201).json(customer);
    } catch (err) {
        console.error("Error creating customer:", err);
        res.status(500).send("Internal server error");
    }
});

// Login
app.post("/customers/login", (req, res) => {
    const { name, pass } = req.body;

    if (!name || !pass) return res.status(400).send("Missing username or password.");

    const customer = customerDB.find(customer => customer.name == name);
    if (!customer || customer.password != pass) return res.status(401).send("Invalid credentials.");

    const payload = {
        id: customer.customerId,
        role: customer.role
    };
    const token = jwt.sign(payload, secret.secret, { expiresIn: '1h' });

    res.json({ token, customer });
});

// Get customer details by ID (Protected route)
app.get("/customers/:customerId", verifyJWT, (req, res) => {
    const customer = customerDB[parseInt(req.params.customerId)];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    res.json(customer);
});

// Update customer information (Protected, admin role only)
app.put("/customers/:customerId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const customer = customerDB[customerId];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    const { name, email, address, role } = req.body;

    // Update customer details if provided
    if (typeof name !== "undefined") customer.name = name;
    if (typeof email !== "undefined") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).send("Invalid email format.");
        customer.email = email;
    }
    if (typeof address !== "undefined") customer.address = address;
    if (typeof role !== "undefined") customer.role = role;

    res.json(customer);
});

// Delete a customer (Protected, admin role only)
app.delete("/customers/:customerId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const customer = customerDB[customerId];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    customerDB.splice(customerId, 1); // Remove the customer
    customerIdCounter--; // Adjust the customer counter

    // Reassign customer IDs for consistency (optional)
    for (let i = customerId; i < customerDB.length; i++) {
        customerDB[i].customerId = i;
    }

    res.send("Customer deleted");
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

app.listen(3002, () => console.log("Customer service listening on port 3002!"));
