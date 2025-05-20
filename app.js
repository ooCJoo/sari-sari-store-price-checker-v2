// Configuration
// Get Pantry ID from environment variables, window.ENV, or localStorage
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
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

// Global variables
let products = [];
let qrScannerSearch = null;
let qrScannerAdd = null;
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Setup mobile menu toggle
        setupMobileMenu();
        
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
                    showToast('Please enter a valid Pantry ID', 'danger');
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
        showToast('Error initializing the application', 'danger');
        loadingElement.style.display = 'none';
    }
});

// Mobile menu setup
function setupMobileMenu() {
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    
    // Close sidebar when window is resized to larger size
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991.98) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarBackdrop.classList.toggle('active');
    
    // Toggle menu icon
    const icon = menuToggle.querySelector('i');
    if (sidebar.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarBackdrop.classList.remove('active');
    
    // Reset menu icon
    const icon = menuToggle.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
}

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
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 991.98) {
                closeSidebar();
            }
        });
    });
}

// Product loading and display functions
async function loadProducts() {
    showLoading();
    
    try {
        const response = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${BASKET_NAME}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Basket doesn't exist yet, create it with an empty products array
                products = [];
                await saveProducts();
                showToast('Created new product database', 'success');
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
        showToast('Failed to load products. Check your internet connection and Pantry ID', 'danger');
    } finally {
        hideLoading();
    }
}

function updateTotalProductsCount() {
    totalProductsElement.textContent = products.length.toLocaleString();
}

function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No products found</h4>
                    <p class="text-muted">Add your first product to get started</p>
                    <button class="btn btn-primary mt-3" id="addFirstProduct">
                        <i class="fas fa-plus me-2"></i> Add Product
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener to "Add Product" button
        document.getElementById('addFirstProduct')?.addEventListener('click', () => {
            document.querySelector('[data-page="add"]').click();
        });
        
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 col-lg-4';
        
        const popularNameDisplay = product.popularName ? ` <span class="popular-name">(${product.popularName})</span>` : '';
        
        productCard.innerHTML = `
            <div class="product-card">
                <div class="d-flex">
                    <div class="product-img-container me-3">
                        <img src="${product.image || 'https://i.imgur.com/dLwTp28.png'}" alt="${product.name}" class="product-img">
                    </div>
                    <div class="product-details">
                        <h5 class="product-title">${product.name}${popularNameDisplay}</h5>
                        <div class="price">₱${parseFloat(product.price).toFixed(2)}</div>
                        <div class="product-info"><i class="fas fa-cubes me-2"></i> Qty: ${product.quantity}</div>
                        <div class="product-info"><i class="fas fa-barcode me-2"></i> Code: ${product.code}</div>
                        <div class="product-info"><i class="fas fa-tag me-2"></i> ${product.category}</div>
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
    
    // Clear search when input is cleared
    searchInput.addEventListener('input', () => {
        if (searchInput.value === '') {
            renderProducts(products);
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
    
    if (filteredProducts.length === 0) {
        showToast(`No products found matching "${query}"`, 'info');
    } else {
        showToast(`Found ${filteredProducts.length} product(s)`, 'success');
    }
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
        
        // Scroll to QR reader
        qrReaderSearch.scrollIntoView({ behavior: 'smooth' });
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
        
        // Scroll to QR reader
        qrReaderAdd.scrollIntoView({ behavior: 'smooth' });
    } else {
        if (qrScannerAdd && qrScannerAdd._isScanning) {
            qrScannerAdd.stop();
        }
        qrReaderAdd.style.display = 'none';
    }
}

function initializeSearchScanner() {
    if (qrScannerSearch) {
        qrScannerSearch.clear();
    }
    
    qrScannerSearch = new Html5Qrcode("qr-reader-search");
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    qrScannerSearch.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Success callback
            searchInput.value = decodedText;
            performSearch();
            
            // Show success toast
            showToast('QR Code scanned successfully!', 'success');
            
            // Stop scanning
            qrScannerSearch.stop();
            qrReaderSearch.style.display = 'none';
        },
        (errorMessage) => {
            // Error callback (we don't need to show these to the user)
            console.log(errorMessage);
        }
    ).catch((err) => {
        console.error(`Unable to start QR scanner: ${err}`);
        showToast('Unable to start camera. Please check permissions.', 'danger');
    });
}

function initializeAddScanner() {
    if (qrScannerAdd) {
        qrScannerAdd.clear();
    }
    
    qrScannerAdd = new Html5Qrcode("qr-reader-add");
    
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    qrScannerAdd.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            // Success callback
            document.getElementById('product-code').value = decodedText;
            
            // Show success toast
            showToast('QR Code scanned successfully!', 'success');
            
            // Stop scanning
            qrScannerAdd.stop();
            qrReaderAdd.style.display = 'none';
        },
        (errorMessage) => {
            // Error callback (we don't need to show these to the user)
            console.log(errorMessage);
        }
    ).catch((err) => {
        console.error(`Unable to start QR scanner: ${err}`);
        showToast('Unable to start camera. Please check permissions.', 'danger');
    });
}

// Form handling functions
function setupFormHandling() {
    // Image preview
    productImageInput.addEventListener('change', handleImageUpload);
    
    // Form submission
    addProductForm.addEventListener('submit', handleAddProduct);
    
    // Reset form when navigating to Add page
    document.querySelector('[data-page="add"]').addEventListener('click', () => {
        setTimeout(() => {
            addProductForm.reset();
            imagePreview.src = 'https://i.imgur.com/dLwTp28.png';
        }, 100);
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size should be less than 2MB', 'warning');
            event.target.value = '';
            return;
        }
        
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
    showLoading();
    
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
            
            try {
                imageUrl = await uploadImage(imagePreview.src);
            } catch (error) {
                console.error('Error uploading image:', error);
                showToast('Failed to upload image. Using default image instead.', 'warning');
                imageUrl = 'https://i.imgur.com/dLwTp28.png';
            }
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
            popularName: popularName || null,
            dateAdded: new Date().toISOString()
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
        showToast('Product added successfully!', 'success');
        
        // Navigate to products page
        document.querySelector('[data-page="products"]').click();
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Failed to add product. Please try again.', 'danger');
    } finally {
        // Hide loading indicator
        hideLoading();
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

function showLoading() {
    isLoading = true;
    loadingElement.style.display = 'flex';
}

function hideLoading() {
    isLoading = false;
    loadingElement.style.display = 'none';
}

// Toast notifications
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast show border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set background color based on type
    let bgClass, iconClass;
    switch (type) {
        case 'success':
            bgClass = 'bg-success text-white';
            iconClass = 'fas fa-check-circle';
            break;
        case 'danger':
            bgClass = 'bg-danger text-white';
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning text-dark';
            iconClass = 'fas fa-exclamation-triangle';
            break;
        default:
            bgClass = 'bg-info text-white';
            iconClass = 'fas fa-info-circle';
    }
    
    toast.classList.add(...bgClass.split(' '));
    
    // Set toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="${iconClass} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after delay
    setTimeout(() => {
        toast.remove();
    }, 3000);
    
    // Add click listener to close button
    toast.querySelector('.btn-close').addEventListener('click', () => {
        toast.remove();
    });
}