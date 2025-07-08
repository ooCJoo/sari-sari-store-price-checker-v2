// Pantry API Configuration - Centralized Database Connection
class PantryAPI {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://getpantry.cloud/apiv1/pantry';
        this.basketName = 'inventory-products';
        this.categoriesBasket = 'inventory-categories';
        this.init();
    }

    // Initialize the API
    async init() {
        console.log('Initializing Pantry API...');
        
        // Check if API key is stored
        this.apiKey = localStorage.getItem('pantry_api_key');
        
        if (!this.apiKey) {
            this.showAPIKeyPopup();
            return false;
        }

        if (this.apiKey === 'demo_mode') {
            console.log('Running in demo mode');
            this.showInfo('Running in demo mode with sample data');
            return true;
        }

        const isValid = await this.validateAPIKey();
        if (isValid) {
            this.showSuccess('Database connected successfully!');
            return true;
        } else {
            // Invalid API key, show popup again
            localStorage.removeItem('pantry_api_key');
            this.showAPIKeyPopup();
            return false;
        }
    }

    // Show API key input popup
    showAPIKeyPopup() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create popup
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            text-align: center;
        `;

        popup.innerHTML = `
            <h2 style="color: #1e293b; margin-bottom: 1rem; font-size: 1.5rem;">🔑 Enter Your Pantry API Key</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem; line-height: 1.6;">
                To connect to your database, please enter your Pantry API key. 
                <br><a href="https://getpantry.cloud" target="_blank" style="color: #3b82f6;">Get your free API key here</a>
            </p>
            <input type="text" id="apiKeyInput" placeholder="Enter your API key here..." 
                style="width: 100%; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; font-size: 1rem;">
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="connectBtn" style="background: #3b82f6; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Connect Database
                </button>
                <button id="demoBtn" style="background: #6b7280; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Use Demo Mode
                </button>
            </div>
            <p style="color: #9ca3af; font-size: 0.9rem; margin-top: 1rem;">
                Your API key is stored securely in your browser
            </p>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        // Handle connect button
        document.getElementById('connectBtn').onclick = async () => {
            const inputKey = document.getElementById('apiKeyInput').value.trim();
            if (!inputKey) {
                this.showError('Please enter your API key');
                return;
            }

            this.apiKey = inputKey;
            const isValid = await this.validateAPIKey();
            
            if (isValid) {
                localStorage.setItem('pantry_api_key', inputKey);
                document.body.removeChild(overlay);
                this.showSuccess('Database connected successfully!');
                // Reload page data
                if (typeof loadDashboardData === 'function') loadDashboardData();
                if (typeof loadProducts === 'function') loadProducts();
            } else {
                this.showError('Invalid API key. Please check and try again.');
            }
        };

        // Handle demo button
        document.getElementById('demoBtn').onclick = () => {
            this.apiKey = 'demo_mode';
            localStorage.setItem('pantry_api_key', 'demo_mode');
            document.body.removeChild(overlay);
            this.showInfo('Running in demo mode with sample data');
            // Reload page data
            if (typeof loadDashboardData === 'function') loadDashboardData();
            if (typeof loadProducts === 'function') loadProducts();
        };

        // Handle Enter key
        document.getElementById('apiKeyInput').onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('connectBtn').click();
            }
        };
    }

    // Validate API key by making a test request
    async validateAPIKey() {
        if (this.apiKey === 'demo_mode') {
            return true;
        }

        try {
            const response = await fetch(`${this.baseURL}/${this.apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('API key validated successfully');
            return true;
        } catch (error) {
            console.error('API validation error:', error);
            return false;
        }
    }

    // Get products from database
    async getProducts() {
        try {
            // Only use demo mode if explicitly set
            if (this.apiKey === 'demo_mode') {
                console.log('Demo mode - returning sample data');
                return this.getSampleProducts();
            }

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 400) {
                    // Basket doesn't exist, return empty array
                    console.log('Basket not found, returning empty products array');
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Successfully fetched products from database');
            return data.products || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            
            // Only fallback to sample data in demo mode
            if (this.apiKey === 'demo_mode') {
                console.log('Using sample data in demo mode');
                return this.getSampleProducts();
            }
            
            throw error;
        }
    }

    // Get categories from database
    async getCategories() {
        try {
            if (this.apiKey === 'demo_mode') {
                return this.getDefaultCategories();
            }

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.categoriesBasket}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 400) {
                    // Categories basket doesn't exist, create with defaults
                    const defaultCategories = this.getDefaultCategories();
                    await this.saveCategories(defaultCategories);
                    return defaultCategories;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.categories || this.getDefaultCategories();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return this.getDefaultCategories();
        }
    }

    // Save categories to database
    async saveCategories(categories) {
        try {
            if (this.apiKey === 'demo_mode') {
                console.log('Demo mode - simulating category save');
                return { success: true };
            }

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.categoriesBasket}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ categories: categories })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error saving categories:', error);
            throw error;
        }
    }

    // Add product to database
    async addProduct(product) {
        try {
            if (this.apiKey === 'demo_mode') {
                console.log('Demo mode - simulating product addition');
                this.showSuccess(`Product "${product.name}" added successfully!`);
                return { success: true, id: 'prod_' + Date.now() };
            }

            // Get existing products
            const existingProducts = await this.getProducts();
            
            // Add new product with unique ID
            const newProduct = {
                ...product,
                id: 'prod_' + Date.now(),
                dateAdded: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            const updatedProducts = [...existingProducts, newProduct];

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products: updatedProducts })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true, id: newProduct.id };
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    // Update product in database
    async updateProduct(productId, updatedData) {
        try {
            if (this.apiKey === 'demo_mode') {
                console.log('Demo mode - simulating product update');
                this.showSuccess('Product updated successfully!');
                return { success: true };
            }

            const existingProducts = await this.getProducts();
            const productIndex = existingProducts.findIndex(p => p.id === productId);
            
            if (productIndex === -1) {
                throw new Error('Product not found');
            }

            existingProducts[productIndex] = {
                ...existingProducts[productIndex],
                ...updatedData,
                lastUpdated: new Date().toISOString()
            };

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products: existingProducts })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    // Delete product from database
    async deleteProduct(productId) {
        try {
            if (this.apiKey === 'demo_mode') {
                console.log('Demo mode - simulating product deletion');
                this.showSuccess('Product deleted successfully!');
                return { success: true };
            }

            const existingProducts = await this.getProducts();
            const filteredProducts = existingProducts.filter(p => p.id !== productId);

            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products: filteredProducts })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Barcode scanner functionality
    async scanBarcode() {
        return new Promise((resolve, reject) => {
            // Check if browser supports camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Camera not supported in this browser');
                reject(new Error('Camera not supported'));
                return;
            }

            // Create scanner overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;

            const scannerContainer = document.createElement('div');
            scannerContainer.style.cssText = `
                background: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            `;

            scannerContainer.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: #1e293b;">📷 Barcode Scanner</h3>
                <video id="scannerVideo" style="width: 100%; max-width: 300px; border-radius: 8px; margin-bottom: 1rem;" autoplay></video>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="cancelScan" style="background: #6b7280; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancel</button>
                    <button id="manualEntry" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Enter Manually</button>
                </div>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 1rem;">Position barcode in front of camera</p>
            `;

            overlay.appendChild(scannerContainer);
            document.body.appendChild(overlay);

            const video = document.getElementById('scannerVideo');
            let stream = null;

            // Start camera
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(mediaStream => {
                    stream = mediaStream;
                    video.srcObject = stream;
                    
                    // Simulate barcode detection after 3 seconds
                    setTimeout(() => {
                        const sampleBarcodes = [
                            '123456789012',
                            '987654321098',
                            '456789123456',
                            '741852963074',
                            '159753486207'
                        ];
                        
                        const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
                        
                        // Stop camera
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                        }
                        
                        document.body.removeChild(overlay);
                        resolve(randomBarcode);
                    }, 3000);
                })
                .catch(error => {
                    console.error('Camera access denied:', error);
                    document.body.removeChild(overlay);
                    this.showError('Camera access denied');
                    reject(error);
                });

            // Handle cancel button
            document.getElementById('cancelScan').onclick = () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                document.body.removeChild(overlay);
                reject(new Error('Scan cancelled'));
            };

            // Handle manual entry
            document.getElementById('manualEntry').onclick = () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                document.body.removeChild(overlay);
                
                const manualBarcode = prompt('Enter barcode manually:');
                if (manualBarcode) {
                    resolve(manualBarcode.trim());
                } else {
                    reject(new Error('Manual entry cancelled'));
                }
            };
        });
    }

    // Reset API key (for settings/logout)
    resetAPIKey() {
        localStorage.removeItem('pantry_api_key');
        this.apiKey = null;
        this.showAPIKeyPopup();
    }

    // Get default categories
    getDefaultCategories() {
        return [
            { id: 'drinks', name: 'Drinks', icon: '🥤' },
            { id: 'food', name: 'Food', icon: '🍞' },
            { id: 'snacks', name: 'Snacks', icon: '🍿' },
            { id: 'personal-care', name: 'Personal Care', icon: '🧴' },
            { id: 'household', name: 'Household', icon: '🧽' },
            { id: 'others', name: 'Others', icon: '📋' }
        ];
    }

    // Get sample products for demo mode
    getSampleProducts() {
        return [
            {
                id: 'prod_1',
                name: 'Coca Cola',
                secondaryName: 'Classic',
                category: 'Drinks',
                price: 2.50,
                quantity: 24,
                size: '330ml',
                barcode: '123456789012',
                description: 'Classic Coca Cola soft drink',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGMyNjI2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q29rZTwvdGV4dD4KPC9zdmc+',
                dateAdded: '2024-01-15T10:30:00Z',
                lastUpdated: '2024-01-15T10:30:00Z'
            },
            {
                id: 'prod_2',
                name: 'Bread',
                secondaryName: 'Whole Wheat',
                category: 'Food',
                price: 3.99,
                quantity: 12,
                size: '500g',
                barcode: '987654321098',
                description: 'Fresh whole wheat bread',
                image: null,
                dateAdded: '2024-01-14T09:15:00Z',
                lastUpdated: '2024-01-14T09:15:00Z'
            },
            {
                id: 'prod_3',
                name: 'Potato Chips',
                secondaryName: 'BBQ Flavor',
                category: 'Snacks',
                price: 4.25,
                quantity: 18,
                size: '150g',
                barcode: '456789123456',
                description: 'Crispy BBQ flavored potato chips',
                image: null,
                dateAdded: '2024-01-13T14:20:00Z',
                lastUpdated: '2024-01-13T14:20:00Z'
            }
        ];
    }

    // Notification methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Add to page
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize API and make it globally available
const pantryAPI = new PantryAPI();