# IT3103 Exercise 4: Securing Microservices Architecture
## Microservice Overview
1. Product Service 
- POST /products: Add a new product.
- GET /products/:productId: Get customer details by ID
- PUT /products/:productId: Update a product
- DELETE /products/:productId: delete a product
2. Customer Service
- POST /customers: Add a new customer.
- GET /customers/:customerId: Get customer details by ID.
- PUT /customers/:customerId: Update customer information.
- DELETE /customers/:customerId: Delete a customer.
3. Order Service
- POST /orders: Create a new order. This service will:
Verify that the customer exists by communicating with the Customer Service.
Verify that the product exists by communicating with the Product Service.
Create the order only if the customer and product are valid.
- GET /orders/:orderId: Get order details.
- PUT /orders/:orderId: Update an order.
- DELETE /orders/:orderId: Delete an order.
## Installation and Running
1. Clone the project repository
```
git clone https://github.com/HPeroxide-Pe/midterm_securing-_microservices.git
```
2. Go inside the root directory
```
cd midterm_securing-_microservices
```
3. Generate SSL/TLS Certificates (for local development) : Use Git Bash
```
openssl req -nodes -new -x509 -keyout localhost.key -out localhost.cert -days 365
```
- Country Name (2 letter code): any 2 letters will do
- just press ENTER until the end

This command will generate two files:
- localhost.key (your private key)
- localhost.cert (your certificate)
4. Use Node Package Manager to install project dependencies
```
npm install
```
5. Run each file individually in different terminal windows
```
node src/customer_service.js
```

```
node src/product_service.js
```

```
node src/order_service.js
```
6. Create a jwt-token.json file in the root directory
```JSON
{
    "secret": "mySuperSecretKey12345"
}
```
7. Open Postman and create a new request.
8. Disable SSL Certificate Verification (since you’re using a self-signed certificate):
- Click the gear icon in the upper right of Postman.
- Go to the General tab and toggle SSL certificate verification to OFF.
### Testing
Using any REST API client, send any HTTPS Request using any of the methods stated above, here are some test JSON inputs for the body:
1. Product
* Make a POST request to create a product:
	- Method: POST
	- URL: https://localhost:3001/products
	- Auth: Add the Authorization with the JWT Bearer for an admin user (secret key):
	- Body: Select raw and JSON and use the following body:
```JSON
{
    "name": "Nautilus Prime Set",
    "price": 80,
    "stock": 69
}
```
- Send the Request: Click Send in Postman. If everything is set up correctly, you should receive a 201 Created response with the newly created product.
* Get Product by ID
	- Method: GET
	- URL: https://localhost:3001/products/0 (Assuming product ID 0)
* Update a Product
	- Method: PUT
	- URL: https://localhost:3001/products/0
	- Auth: Add the Authorization with the admin JWT.
	- Body: Select raw and JSON and use the following body:
```JSON
{
    "price": 90,
    "stock": 100
}
```
* Delete a Product
	- Method: DELETE
	- URL: https://localhost:3001/products/0
	- Auth: Add the Authorization with the admin JWT.

2. Customer
* Create a New Customer
	- URL: https://localhost:3002/customers
	- Method: POST
	- Body: Select raw and JSON format, then use this sample data:
```JSON
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "address": "123 Main St",
    "role": "admin",
    "password": "password123"
}
```
* Get Customer Details
	- URL: https://localhost:3002/customers/0
	- Method: GET
	- Auth: Add the Authorization with the admin JWT.
* Update Customer (Requires Admin Role)
	- URL: https://localhost:3002/customers/0
	- Method: PUT
	- Auth: Add the Authorization with the admin JWT.
	- Body: Select raw and JSON format, then use this sample data:
```JSON
{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "address": "456 Oak St"
}
```
* Delete Customer (Requires Admin Role)
	- URL: https://localhost:3002/customers/0
	- Method: DELETE
	- Auth: Add the Authorization with the admin JWT.
3. Order
```JSON
{
  "customerId": 0,
  "productId": 0,
  "quantity": 1
}
```
