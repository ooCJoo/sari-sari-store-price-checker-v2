// pantry-api.js - Pantry Database Integration
class PantryAPI {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://getpantry.cloud/apiv1/pantry';
        this.basketName = 'inventory-products';
        this.init();
    }

    // Initialize the API system
    async init() {
        this.loadAPIKey();
        
        if (!this.apiKey) {
            this.showAPIKeyPopup();
        } else {
            await this.validateAPIKey();
            this.updateUI();
        }
    }

    // Load API key from localStorage
    loadAPIKey() {
        this.apiKey = localStorage.getItem('pantry_api_key');
    }

    // Save API key to localStorage
    saveAPIKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('pantry_api_key', apiKey);
        localStorage.setItem('pantry_first_visit', 'false');
    }

    // Check if this is the first visit
    isFirstVisit() {
        return localStorage.getItem('pantry_first_visit') !== 'false';
    }

    // Show API key input popup
    showAPIKeyPopup() {
        const popup = document.createElement('div');
        popup.id = 'apiKeyPopup';
        popup.innerHTML = `
            <div class="popup-overlay">
                <div class="popup-container">
                    <div class="popup-header">
                        <h2>🔑 Setup Your Database</h2>
                        <p>Connect your Pantry API to get started</p>
                    </div>
                    
                    <div class="popup-content">
                        <div class="setup-steps">
                            <div class="step">
                                <span class="step-number">1</span>
                                <div class="step-content">
                                    <p><strong>Get your free API key:</strong></p>
                                    <a href="https://getpantry.cloud/" target="_blank" class="pantry-link">
                                        Visit GetPantry.cloud →
                                    </a>
                                </div>
                            </div>
                            
                            <div class="step">
                                <span class="step-number">2</span>
                                <div class="step-content">
                                    <p><strong>Enter your Pantry ID below:</strong></p>
                                    <input 
                                        type="text" 
                                        id="apiKeyInput" 
                                        placeholder="Your Pantry ID (e.g., 12345678-1234-1234-1234-123456789012)"
                                        class="api-input"
                                    >
                                    <div class="input-help">
                                        Your Pantry ID is the unique identifier from GetPantry
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="popup-actions">
                            <button onclick="pantryAPI.connectAPI()" class="connect-btn">
                                Connect Database
                            </button>
                            <button onclick="pantryAPI.skipSetup()" class="skip-btn">
                                Skip for Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add popup styles
        const style = document.createElement('style');
        style.textContent = `
            .popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }

            .popup-container {
                background: white;
                border-radius: 20px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                animation: popupSlideIn 0.3s ease-out;
            }

            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .popup-header {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                padding: 2rem;
                border-radius: 20px 20px 0 0;
                text-align: center;
            }

            .popup-header h2 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
                font-weight: 700;
            }

            .popup-header p {
                margin: 0;
                opacity: 0.9;
                font-size: 1rem;
            }

            .popup-content {
                padding: 2rem;
            }

            .setup-steps {
                margin-bottom: 2rem;
            }

            .step {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
                align-items: flex-start;
            }

            .step-number {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.9rem;
                flex-shrink: 0;
            }

            .step-content {
                flex: 1;
            }

            .step-content p {
                margin: 0 0 0.5rem 0;
                color: #374151;
            }

            .pantry-link {
                display: inline-block;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .pantry-link:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            }

            .api-input {
                width: 100%;
                padding: 0.875rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 0.95rem;
                transition: all 0.3s ease;
                margin-bottom: 0.5rem;
            }

            .api-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .input-help {
                font-size: 0.8rem;
                color: #6b7280;
                font-style: italic;
            }

            .popup-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .connect-btn {
                flex: 1;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border: none;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
            }

            .connect-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            }

            .skip-btn {
                background: #f3f4f6;
                color: #374151;
                border: none;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .skip-btn:hover {
                background: #e5e7eb;
            }

            @media (max-width: 640px) {
                .popup-container {
                    width: 95%;
                    margin: 1rem;
                }

                .popup-header {
                    padding: 1.5rem;
                }

                .popup-content {
                    padding: 1.5rem;
                }

                .popup-actions {
                    flex-direction: column;
                }

                .connect-btn, .skip-btn {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(popup);

        // Focus on input
        setTimeout(() => {
            document.getElementById('apiKeyInput').focus();
        }, 300);

        // Allow Enter key to connect
        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectAPI();
            }
        });
    }

    // Connect to API with provided key
    async connectAPI() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            this.showError('Please enter your Pantry ID');
            return;
        }

        // Show loading state
        const connectBtn = document.querySelector('.connect-btn');
        const originalText = connectBtn.textContent;
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        try {
            // Test the API key by trying to access the pantry
            const response = await fetch(`${this.baseURL}/${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // API key is valid
                this.saveAPIKey(apiKey);
                this.closePopup();
                this.showSuccess('Database connected successfully!');
                await this.initializeDatabase();
                this.updateUI();
            } else {
                throw new Error('Invalid Pantry ID');
            }
        } catch (error) {
            console.error('API connection error:', error);
            this.showError('Failed to connect. Please check your Pantry ID and try again.');
            connectBtn.textContent = originalText;
            connectBtn.disabled = false;
        }
    }

    // Skip setup for now
    skipSetup() {
        localStorage.setItem('pantry_first_visit', 'false');
        this.closePopup();
        this.showInfo('You can connect your database later from the settings.');
    }

    // Close the popup
    closePopup() {
        const popup = document.getElementById('apiKeyPopup');
        if (popup) {
            popup.style.animation = 'popupSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                popup.remove();
            }, 300);
        }
    }

    // Validate existing API key
    async validateAPIKey() {
        if (!this.apiKey) return false;

        try {
            const response = await fetch(`${this.baseURL}/${this.apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                // API key is invalid, remove it and show popup
                localStorage.removeItem('pantry_api_key');
                this.apiKey = null;
                this.showAPIKeyPopup();
                return false;
            }

            return true;
        } catch (error) {
            console.error('API validation error:', error);
            return false;
        }
    }

    // Initialize database with default structure
    async initializeDatabase() {
        if (!this.apiKey) return;

        try {
            // Create initial basket structure if it doesn't exist
            const initialData = {
                products: [],
                categories: ['Drinks', 'Food', 'Snacks', 'Personal Care', 'Household', 'Others'],
                lastUpdated: new Date().toISOString(),
                totalProducts: 0
            };

            await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(initialData)
            });

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
        }
    }

    // Get all products from database
    async getProducts() {
        if (!this.apiKey) {
            console.warn('No API key available');
            return [];
        }

        try {
            const response = await fetch(`${this.baseURL}/${this.apiKey}/basket/${this.basketName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.products || [];
            } else {
                console.error('Failed to fetch products');
                return [];
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Get total product count
    async getTotalProductCount() {
        const products = await this.getProducts();
        return products.length;
    }

    // Update UI with database connection status
    updateUI() {
        // Update total products count on homepage
        if (document.getElementById('totalProducts')) {
            this.getTotalProductCount().then(count => {
                document.getElementById('totalProducts').textContent = count;
            });
        }

        // Add connection status indicator
        this.addConnectionStatus();
    }

    // Add connection status indicator to the page
    addConnectionStatus() {
        if (document.querySelector('.connection-status')) return; // Already exists

        const statusDiv = document.createElement('div');
        statusDiv.className = 'connection-status';
        statusDiv.innerHTML = `
            <div class="status-indicator ${this.apiKey ? 'connected' : 'disconnected'}">
                <span class="status-dot"></span>
                <span class="status-text">
                    ${this.apiKey ? 'Database Connected' : 'Database Disconnected'}
                </span>
            </div>
        `;

        // Add status styles
        const statusStyle = document.createElement('style');
        statusStyle.textContent = `
            .connection-status {
                position: fixed;
                bottom: 1rem;
                right: 1rem;
                z-index: 1000;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: white;
                border-radius: 25px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                font-size: 0.85rem;
                font-weight: 500;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            .status-indicator.connected .status-dot {
                background-color: #10b981;
            }

            .status-indicator.disconnected .status-dot {
                background-color: #ef4444;
            }

            .status-indicator.connected .status-text {
                color: #059669;
            }

            .status-indicator.disconnected .status-text {
                color: #dc2626;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 640px) {
                .connection-status {
                    bottom: 5rem;
                    right: 0.5rem;
                }

                .status-indicator {
                    font-size: 0.8rem;
                    padding: 0.4rem 0.8rem;
                }
            }
        `;

        document.head.appendChild(statusStyle);
        document.body.appendChild(statusDiv);
    }

    // Utility functions for showing messages
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add toast styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const toastStyle = document.createElement('style');
            toastStyle.id = 'toast-styles';
            toastStyle.textContent = `
                .toast {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10001;
                    animation: toastSlideIn 0.3s ease-out;
                    max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .toast-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .toast-error {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .toast-info {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                }

                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }

                @media (max-width: 640px) {
                    .toast {
                        top: 1rem;
                        right: 1rem;
                        left: 1rem;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(toastStyle);
        }

        document.body.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Method to reconnect database (for settings page later)
    reconnectDatabase() {
        localStorage.removeItem('pantry_api_key');
        this.apiKey = null;
        this.showAPIKeyPopup();
    }
}

// Initialize the Pantry API system
const pantryAPI = new PantryAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PantryAPI;
}