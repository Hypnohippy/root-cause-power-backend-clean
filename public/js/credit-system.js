/**
 * Credit System for Root Cause Power Platform
 * Handles daily credits, voice credits, and Stripe payments
 */

class CreditSystem {
    constructor() {
        this.dailyCredits = this.loadDailyCredits();
        this.voiceCredits = this.loadVoiceCredits();
        this.stripe = null;
        this.initStripe();
        this.updateCreditDisplays();
        this.startDailyReset();
    }

    // Initialize Stripe
    async initStripe() {
        try {
            // Get publishable key from server
            const response = await fetch('/api/stripe-config');
            const config = await response.json();
            
            if (config.publishableKey) {
                this.stripe = Stripe(config.publishableKey);
                console.log('✅ Stripe initialized successfully');
            } else {
                console.warn('⚠️ Stripe not configured - using test mode');
                // For development, you can use Stripe's test key
                this.stripe = Stripe('pk_test_51234567890abcdef'); // Replace with actual test key
            }
        } catch (error) {
            console.error('❌ Failed to initialize Stripe:', error);
        }
    }

    // Load daily credits from localStorage
    loadDailyCredits() {
        const stored = localStorage.getItem('dailyCredits');
        if (!stored) {
            return { count: 5, maxDaily: 5, lastReset: new Date().toDateString() };
        }
        
        const credits = JSON.parse(stored);
        
        // Check if we need to reset daily credits
        if (credits.lastReset !== new Date().toDateString()) {
            credits.count = credits.maxDaily;
            credits.lastReset = new Date().toDateString();
            this.saveDailyCredits(credits);
        }
        
        return credits;
    }

    // Save daily credits
    saveDailyCredits(credits) {
        localStorage.setItem('dailyCredits', JSON.stringify(credits));
        this.dailyCredits = credits;
        this.updateCreditDisplays();
    }

    // Load voice credits
    loadVoiceCredits() {
        const stored = localStorage.getItem('voiceCredits');
        return stored ? parseInt(stored) : 0;
    }

    // Save voice credits
    saveVoiceCredits(credits) {
        localStorage.setItem('voiceCredits', credits.toString());
        this.voiceCredits = credits;
        this.updateCreditDisplays();
    }

    // Update all credit displays in the UI
    updateCreditDisplays() {
        // Daily credits counter
        const dailyCounter = document.getElementById('daily-credit-count');
        if (dailyCounter) {
            dailyCounter.textContent = `${this.dailyCredits.count}/${this.dailyCredits.maxDaily}`;
            
            // Add warning styling if low
            const dailyContainer = document.getElementById('daily-credit-counter');
            if (this.dailyCredits.count <= 1) {
                dailyContainer.classList.add('credit-low');
            } else {
                dailyContainer.classList.remove('credit-low');
            }
        }

        // Voice credits counter
        const voiceCounter = document.getElementById('voice-credit-count');
        if (voiceCounter) {
            voiceCounter.textContent = this.voiceCredits;
        }

        // Voice session credits display
        const sessionCredits = document.getElementById('voice-session-credits');
        if (sessionCredits) {
            sessionCredits.textContent = `${this.voiceCredits} minutes`;
        }

        // Current balance in modal
        const currentBalance = document.getElementById('current-voice-balance');
        if (currentBalance) {
            currentBalance.textContent = this.voiceCredits;
        }
    }

    // Use a daily credit
    useDailyCredit(purpose = 'AI interaction') {
        if (this.dailyCredits.count <= 0) {
            this.showCreditWarning('daily');
            return false;
        }

        this.dailyCredits.count--;
        this.saveDailyCredits(this.dailyCredits);
        
        console.log(`💰 Daily credit used for: ${purpose}. Remaining: ${this.dailyCredits.count}`);
        return true;
    }

    // Use voice credits (in minutes)
    useVoiceCredits(minutes, purpose = 'Voice AI session') {
        if (this.voiceCredits < minutes) {
            this.showCreditWarning('voice');
            return false;
        }

        this.voiceCredits -= minutes;
        this.saveVoiceCredits(this.voiceCredits);
        
        console.log(`🎤 Voice credits used: ${minutes} minutes for ${purpose}. Remaining: ${this.voiceCredits}`);
        return true;
    }

    // Add voice credits (after purchase)
    addVoiceCredits(minutes) {
        this.voiceCredits += minutes;
        this.saveVoiceCredits(this.voiceCredits);
        
        // Show success message
        this.showCreditSuccess('voice', minutes);
        console.log(`✅ Added ${minutes} voice minutes. Total: ${this.voiceCredits}`);
    }

    // Show credit warning modal
    showCreditWarning(type) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const content = type === 'daily' ? {
            icon: 'fas fa-coins',
            title: 'Daily Credits Used Up',
            message: 'You\'ve used all your daily AI interaction credits.',
            action: 'Get More Credits',
            actionFn: () => app.showSection('pricing')
        } : {
            icon: 'fas fa-microphone',
            title: 'Voice Credits Needed',
            message: 'You need voice credits to use the AI voice coach.',
            action: 'Buy Voice Credits',
            actionFn: () => app.showVoiceCreditStore()
        };

        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="${content.icon} text-orange-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${content.title}</h3>
                    <p class="text-gray-600">${content.message}</p>
                </div>
                
                <div class="space-y-4">
                    <button onclick="creditSystem.closeModal(this); ${content.actionFn.toString().replace('app.', 'window.app.')}();" 
                            class="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold">
                        ${content.action}
                    </button>
                    <button onclick="creditSystem.closeModal(this)" 
                            class="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        Maybe Later
                    </button>
                </div>
                
                <div class="mt-4 text-xs text-gray-500 text-center">
                    ${type === 'daily' ? 'Daily credits reset every 24 hours' : 'Voice credits never expire'}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Show credit success message
    showCreditSuccess(type, amount) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle text-xl mr-3"></i>
                <div>
                    <div class="font-semibold">Credits Added!</div>
                    <div class="text-sm">${amount} ${type === 'voice' ? 'voice minutes' : 'daily credits'} added to your account</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // Purchase voice credits via Stripe
    async purchaseVoiceCredits(packageType, amount, minutes) {
        if (!this.stripe) {
            alert('Payment system not available. Please try again later.');
            return;
        }

        try {
            console.log(`💳 Initiating purchase: ${packageType} - £${amount} for ${minutes} minutes`);
            
            // Show loading state
            this.showPaymentLoading();
            
            // Create payment session on server
            const response = await fetch('/api/create-payment-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    packageType,
                    amount: amount * 100, // Convert to pence
                    minutes,
                    productName: `Voice Credits - ${packageType.charAt(0).toUpperCase() + packageType.slice(1)}`,
                    description: `${minutes} minutes of AI voice coaching`
                })
            });

            const session = await response.json();
            
            if (session.error) {
                throw new Error(session.error);
            }

            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: session.sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('❌ Payment failed:', error);
            this.hidePaymentLoading();
            
            // Show error message
            alert(`Payment failed: ${error.message || 'Unknown error occurred'}`);
        }
    }

    // Show payment loading overlay
    showPaymentLoading() {
        const overlay = document.createElement('div');
        overlay.id = 'payment-loading';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-8 text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Processing Payment</h3>
                <p class="text-gray-600">Redirecting to secure payment...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // Hide payment loading
    hidePaymentLoading() {
        const overlay = document.getElementById('payment-loading');
        if (overlay) {
            overlay.remove();
        }
    }

    // Handle successful payment (called from success page or webhook)
    handlePaymentSuccess(sessionData) {
        if (sessionData.minutes) {
            this.addVoiceCredits(sessionData.minutes);
        }
        
        // Close any open modals
        this.closeAllModals();
        
        // Show success message
        this.showCreditSuccess('voice', sessionData.minutes);
    }

    // Close modal helper
    closeModal(element) {
        const modal = element.closest('.fixed');
        if (modal) {
            modal.remove();
        }
    }

    // Close all credit-related modals
    closeAllModals() {
        const modals = document.querySelectorAll('#voice-credit-modal, #payment-loading');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // Start daily reset timer
    startDailyReset() {
        // Check every hour if we need to reset
        setInterval(() => {
            const today = new Date().toDateString();
            if (this.dailyCredits.lastReset !== today) {
                this.dailyCredits.count = this.dailyCredits.maxDaily;
                this.dailyCredits.lastReset = today;
                this.saveDailyCredits(this.dailyCredits);
                
                console.log('🔄 Daily credits reset!');
                
                // Show notification if user is active
                if (document.visibilityState === 'visible') {
                    this.showCreditSuccess('daily', this.dailyCredits.maxDaily);
                }
            }
        }, 60000 * 60); // Check every hour
    }

    // Get credit status for API calls
    getCreditStatus() {
        return {
            daily: {
                available: this.dailyCredits.count,
                max: this.dailyCredits.maxDaily,
                resetsAt: this.getNextResetTime()
            },
            voice: {
                available: this.voiceCredits,
                unit: 'minutes'
            }
        };
    }

    // Get next reset time
    getNextResetTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString();
    }

    // Show credit info modal
    showCreditInfo() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const nextReset = this.getNextResetTime();
        const timeUntilReset = new Date(nextReset) - new Date();
        const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-info-circle text-blue-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Your Credits</h3>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold text-green-800">Daily Credits</span>
                            <span class="text-2xl font-bold text-green-600">${this.dailyCredits.count}/${this.dailyCredits.maxDaily}</span>
                        </div>
                        <div class="text-sm text-green-700">
                            Resets in ${hoursUntilReset} hours • Used for AI interactions
                        </div>
                    </div>
                    
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold text-purple-800">Voice Credits</span>
                            <span class="text-2xl font-bold text-purple-600">${this.voiceCredits} min</span>
                        </div>
                        <div class="text-sm text-purple-700">
                            Never expire • Used for voice AI coaching
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 space-y-3">
                    <button onclick="creditSystem.closeModal(this); window.app.showVoiceCreditStore();" 
                            class="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors">
                        <i class="fas fa-microphone mr-2"></i>Buy Voice Credits
                    </button>
                    <button onclick="creditSystem.closeModal(this)" 
                            class="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Check if user has enough credits for an action
    canAfford(type, amount = 1) {
        if (type === 'daily') {
            return this.dailyCredits.count >= amount;
        } else if (type === 'voice') {
            return this.voiceCredits >= amount;
        }
        return false;
    }

    // Get friendly time until reset
    getTimeUntilReset() {
        const nextReset = this.getNextResetTime();
        const timeUntil = new Date(nextReset) - new Date();
        const hours = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

// Initialize credit system
window.creditSystem = new CreditSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreditSystem;
}

console.log('💰 Credit System initialized successfully!');