const express = require("express");
const jwt = require("jsonwebtoken");
const secret = require("../jwt-token.json");
const app = express();
app.use(express.json());

let customerIdCounter = 0; // global customer counter for id
const customerDB = []; // simple array acting as the customer database

// Create a new customer/register
app.post("/customers", (req, res) => {
    const { name, email, address, role, password} = req.body;
    let customerId = customerIdCounter++;
    console.log(customerId);
    if (!name || !email || !address || !role || !password) {
        return res.status(400).send("Missing customer details.");
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
        console.log("Customer created"); // testing, remove for final
        res.status(201).json(customer);
    } catch (err) {
        console.error("Customer not created", err); // testing, remove for final
        res.status(500).send("Internal server error");
    }
});

// Login 
app.post("/customers/login", (req, res) => {
    const { name, pass }   = req.body;

    customer = customerDB.find(customer => customer.name == name);
    if(!customer ||  customer.pass != pass) return res.status(401).send("INVALID USER");

    const payload = {
        id: customer.customerId,
        role: customer.role
    };
    const token = jwt.sign(payload, secret.secret);

    res.json ({ token, customer});
})


// Get customer details by ID
app.get("/customers/:customerId", verifyJWT, (req, res) => {
    const customer = customerDB[req.params.customerId];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    res.json(customer);
});

// Update customer information
app.put("/customers/:customerId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const customer = customerDB[customerId];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    const { name, email, address, role} = req.body;

    if (typeof name !== "undefined") customer.name = name;
    if (typeof email !== "undefined") customer.email = email;
    if (typeof address !== "undefined") customer.address = address;
    if (typeof role !== "undefined") customer.role = role;

    customerDB[customerId] = customer;
    res.json(customer);
});

// Delete a customer
app.delete("/customers/:customerId", verifyJWT, verifyRole(["admin"]), (req, res) => {
    const customerId = parseInt(req.params.customerId);
    const customer = customerDB[customerId];

    if (!customer) {
        return res.status(404).send("Customer not found");
    }

    customerDB.splice(customerId, 1); // Remove the customer
    customerIdCounter--; // Adjust the customer counter

    // Reassign customer IDs if needed (optional, for consistency)
    for (let i = customerId; i < customerDB.length; i++) {
        customerDB[i].customerId = i;
    }

    res.send("Customer deleted");
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
app.listen(3002, () => console.log("Customer service listening on port 3002!"));
