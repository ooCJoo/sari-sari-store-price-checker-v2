// Configuration
// Get Pantry ID from environment variables, window.ENV (from GitHub Actions), or localStorage
const PANTRY_ID = window.ENV?.PANTRY_ID || localStorage.getItem('PANTRY_ID') || "";
const BASKET_NAME = "clayton-store";

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const scanSearchBtn = document.getElementById('scan-search-btn');
const qrReaderSearch = document.getElementById('qr-reader-search');
const scanCodeBtn = document.getElementById('scan-code-btn');
const qrReaderAdd = document.getElementById('qr-reader-add');
const addProductForm = document.getElementById('add-product-form');
const totalProductsElement = document.getElementById('total-products');
const loadingElement = document.getElementById('loading');
const imagePreview = document.getElementById('image-preview');
const productImageInput = document.getElementById('product-image');

// Global variables
let products = [];
let qrScannerSearch = null;
let qrScannerAdd = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if Pantry ID is set
        if (!PANTRY_ID) {
            // Show setup modal
            const apiSetupModal = new bootstrap.Modal(document.getElementById('apiSetupModal'));
            apiSetupModal.show();
            
            // Handle save button click
            document.getElementById('savePantryId').addEventListener('click', () => {
                const pantryId = document.getElementById('pantryIdInput').value.trim();
                if (pantryId) {
                    localStorage.setItem('PANTRY_ID', pantryId);
                    apiSetupModal.hide();
                    window.location.reload(); // Reload to use the new API key
                } else {
                    alert('Please enter a valid Pantry ID');
                }
            });
            
            // Don't proceed with app initialization
            loadingElement.style.display = 'none';
            return;
        }
        
        // Load products
        await loadProducts();
        
        // Set up event listeners
        setupNavigation();
        setupSearch();
        setupQRScanner();
        setupFormHandling();
        
        // Hide loading spinner
        loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing the application. Please check the console for details.');
        loadingElement.style.display = 'none';
    }
});

// Navigation functions
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target page
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === targetPage) {
                    page.classList.add('active');
                }
            });
            
            // Stop QR scanner if active
            if (qrScannerSearch && qrScannerSearch._isScanning) {
                qrScannerSearch.stop();
                qrReaderSearch.style.display = 'none';
            }
            
            if (qrScannerAdd && qrScannerAdd._isScanning) {
                qrScannerAdd.stop();
                qrReaderAdd.style.display = 'none';
            }
        });
    });
}

// Product loading and display functions
async function loadProducts() {
    try {
        const response = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET_NAME}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Basket doesn't exist yet, create it with an empty products array
                products = [];
                await saveProducts();
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } else {
            const data = await response.json();
            products = data.products || [];
        }
        
        // Update total products count
        updateTotalProductsCount();
        
        // Render products
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please check your internet connection and Pantry ID.');
    }
}

function updateTotalProductsCount() {
    totalProductsElement.textContent = products.length.toLocaleString();
}

function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center"><p>No products found.</p></div>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 col-lg-4';
        
        const popularNameDisplay = product.popularName ? ` (${product.popularName})` : '';
        
        productCard.innerHTML = `
            <div class="product-card p-3">
                <div class="d-flex">
                    <img src="${product.image || 'https://i.imgur.com/dLwTp28.png'}" alt="${product.name}" class="product-img me-3">
                    <div>
                        <h5>${product.name}${popularNameDisplay}</h5>
                        <div class="price">P${parseFloat(product.price).toFixed(2)}</div>
                        <div>Quantity: ${product.quantity}</div>
                        <div>Code: ${product.code}</div>
                        <div>Category: ${product.category}</div>
                    </div>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
}

// Search functions
function setupSearch() {
    searchBtn.addEventListener('click', () => {
        performSearch();
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        renderProducts(products);
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.code.toString().includes(query) ||
        (product.popularName && product.popularName.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
    );
    
    renderProducts(filteredProducts);
}

// QR Scanner functions
function setupQRScanner() {
    scanSearchBtn.addEventListener('click', toggleSearchScanner);
    scanCodeBtn.addEventListener('click', toggleAddScanner);
}

function toggleSearchScanner() {
    if (qrReaderSearch.style.display === 'none') {
        qrReaderSearch.style.display = 'block';
        initializeSearchScanner();
    } else {
        if (qrScannerSearch && qrScannerSearch._isScanning) {
            qrScannerSearch.stop();
        }
        qrReaderSearch.style.display = 'none';
    }
}

function toggleAddScanner() {
    if (qrReaderAdd.style.display === 'none') {
        qrReaderAdd.style.display = 'block';
        initializeAddScanner();
    } else {
        if (qrScannerAdd && qrScannerAdd._isScanning) {
            qrScannerAdd.stop();
        }
        qrReaderAdd.style.display = 'none';
    }
}

function initializeSearchScanner() {
    qrScannerSearch = new Html5Qrcode("qr-reader-search");
    
    const config = { fps: 10, qrbox: 250 };
    
    qrScannerSearch.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Success callback
            searchInput.value = decodedText;
            performSearch();
            
            // Stop scanning
            qrScannerSearch.stop();
            qrReaderSearch.style.display = 'none';
        },
        (errorMessage) => {
            // Error callback
            console.log(errorMessage);
        }
    ).catch((err) => {
        console.error(`Unable to start QR scanner: ${err}`);
    });
}

function initializeAddScanner() {
    qrScannerAdd = new Html5Qrcode("qr-reader-add");
    
    const config = { fps: 10, qrbox: 250 };
    
    qrScannerAdd.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Success callback
            document.getElementById('product-code').value = decodedText;
            
            // Stop scanning
            qrScannerAdd.stop();
            qrReaderAdd.style.display = 'none';
        },
        (errorMessage) => {
            // Error callback
            console.log(errorMessage);
        }
    ).catch((err) => {
        console.error(`Unable to start QR scanner: ${err}`);
    });
}

// Form handling functions
function setupFormHandling() {
    // Image preview
    productImageInput.addEventListener('change', handleImageUpload);
    
    // Form submission
    addProductForm.addEventListener('submit', handleAddProduct);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function handleAddProduct(event) {
    event.preventDefault();
    
    // Show loading indicator
    loadingElement.style.display = 'flex';
    
    try {
        // Get form values
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = document.getElementById('product-quantity').value;
        const code = document.getElementById('product-code').value;
        const category = document.getElementById('product-category').value;
        const popularName = document.getElementById('popular-name').value;
        
        // Get image data
        let imageUrl = imagePreview.src;
        
        // If it's not the default image, upload to Imgur or another service
        if (imageUrl !== 'https://i.imgur.com/dLwTp28.png' && 
            !imageUrl.startsWith('http://') && 
            !imageUrl.startsWith('https://')) {
            imageUrl = await uploadImage(imagePreview.src);
        }
        
        // Create product object
        const newProduct = {
            id: generateUniqueId(),
            name,
            price,
            quantity,
            code,
            category,
            image: imageUrl,
            popularName: popularName || null
        };
        
        // Add to products array
        products.push(newProduct);
        
        // Save to Pantry
        await saveProducts();
        
        // Update UI
        updateTotalProductsCount();
        renderProducts(products);
        
        // Reset form
        addProductForm.reset();
        imagePreview.src = 'https://i.imgur.com/dLwTp28.png';
        
        // Show success message
        alert('Product added successfully!');
        
        // Navigate to products page
        document.querySelector('[data-page="products"]').click();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product. Please try again.');
    } finally {
        // Hide loading indicator
        loadingElement.style.display = 'none';
    }
}

async function uploadImage(base64Image) {
    // For simplicity, we'll just return the base64 string
    // In a real application, you would upload to Google Drive or another service
    
    // This is a placeholder function that simulates image upload
    // In a real app, you would implement actual image uploading to a service
    
    // For demo purposes, we'll just use a placeholder image URL
    return 'https://i.imgur.com/dLwTp28.png';
    
    // Note: To implement actual Google Drive upload, you would need to:
    // 1. Set up OAuth 2.0 for Google Drive API
    // 2. Create a Google Drive API client
    // 3. Upload the image using the API
    // This is beyond the scope of this demo
}

// Data persistence functions
async function saveProducts() {
    try {
        const response = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET_NAME}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error saving products:', error);
        throw error;
    }
}

// Utility functions
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}