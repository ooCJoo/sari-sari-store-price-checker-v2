Getting Started
1. Create a Pantry Account
Go to https://getpantry.cloud/
Create a free account
Get your Pantry ID from the dashboard
2. Deploy to GitHub Pages
Fork this repository
Set up your Pantry ID (using either Option 1 or Option 2 below)
GitHub Actions will automatically deploy to GitHub Pages
Clayton Sari-Sari Store Inventory System
A simple inventory web application for price checking and product management. This application is designed to be hosted on GitHub Pages and uses Pantry for data storage.

Features
View all products with prices, quantities, and categories
Add new products with image uploads
Search products by name, code, or category
QR code scanning for product search and data entry
Responsive design that works on mobile and desktop
Setup Instructions
Option 1: Using GitHub Environment Variables (Recommended)
Fork this repository
Set up a GitHub Secret for your Pantry ID:
Go to your GitHub repository
Click "Settings" → "Secrets and variables" → "Actions"
Add a new repository secret with name PANTRY_ID and your Pantry ID as the value
The GitHub Actions workflow will automatically build and deploy your app with the environment variable
Option 2: Enter Pantry ID Manually
If you're not using GitHub Actions:

Deploy the application
When you first open the app, you'll be prompted to enter your Pantry ID
The ID will be saved in your browser's localStorage for future visits
Usage
Home Page
Shows the store name and total number of products in the inventory
Products Page
Displays all products with their details
Search function to filter products
QR scanning to quickly find a product by scanning its code
Add Products Page
Form to add new products to the inventory
Fields for name, price, quantity, code, category, and image
QR scanner to easily input product codes
Customization
Change Logo
Replace the logo URL in the HTML:
html
<img src="https://i.imgur.com/SxeWP0b.png" alt="Logo" class="logo">
Add More Categories
Add more options to the category select dropdown in index.html
Future Improvements
Product editing and deletion
Barcode generation for products
Inventory reports and statistics
User authentication
Offline functionality with local storage
Note on Image Storage
In this version, the app uses placeholder image URLs. For a production application, you will need to implement proper image storage using Google Drive API or another service.

License
This project is open source, feel free to modify and use it for your own purposes.

