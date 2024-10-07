# IT3103 Exercise 3: Designing and Building a Microservices API 
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
git clone https://github.com/HPeroxide-Pe/exercise3_microservices.git
```
2. go inside the root directory
```
cd exercise3_microservices
```
3. Use Node Package Manager to install project dependencies
```
npm install
```
4. Run each file individually in different terminal windows
```
node src/customer_service.js
```

```
node src/product_service.js
```

```
node src/order_service.js
```
### Testing
using any REST API client, send any HTTP Request using any of the methods stated above, here are some test JSON inputs for the body:
1. Product
```JSON
{
	"name": "Nautilus Prime Set",
	"price": 80,
	"stock": 69
}
```
2. Customer
```JSON
{
	"name": "John Sevagoth Prime",
	"email": "johnsevagothprime@voidstorms.com",
	"address": "Veil Proxima St."
}
```
3. Order
```JSON
{
  "customerId": 0,
  "productId": 0,
  "quantity": 1
}
```
