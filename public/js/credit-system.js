class CreditSystem {
    constructor() {
        // Check if the user is VIP by looking in localStorage (VIP stays true for this session)
        this.isVip = this.loadVipStatus(); // Load VIP status from localStorage
        this.dailyCredits = this.loadDailyCredits();
        this.voiceCredits = this.loadVoiceCredits();
        this.stripe = null;

        // If VIP, provide infinite credits
        if (this.isVip) {
            this.dailyCredits.count = 999999;
            this.dailyCredits.maxDaily = 999999;
            this.voiceCredits = 999999;
        }

        this.initStripe();
        this.updateCreditDisplays();
        this.startDailyReset();
    }

    // Load VIP status (true for VIP, false for non-VIP)
    loadVipStatus() {
        const stored = localStorage.getItem('isVip');
        return stored === 'true'; // Returns true if 'isVip' is stored as 'true', else false
    }

    // Set VIP status (called when admin or user is granted VIP status)
    setVipStatus(isVip) {
        localStorage.setItem('isVip', isVip ? 'true' : 'false');
        this.isVip = isVip;
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
        
        // Check if we need to reset daily credits (skip if VIP)
        if (!this.isVip && credits.lastReset !== new Date().toDateString()) {
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
        const dailyCounter = document.getElementById('daily-credit-count');
        if (dailyCounter) {
            const displayText = this.isVip
                ? '∞'  // VIP users get infinite credits
                : `${this.dailyCredits.count}/${this.dailyCredits.maxDaily}`;
            dailyCounter.textContent = displayText;
            
            const dailyContainer = document.getElementById('daily-credit-counter');
            if (dailyContainer) {
                if (!this.isVip && this.dailyCredits.count <= 1) {
                    dailyContainer.classList.add('credit-low');
                } else {
                    dailyContainer.classList.remove('credit-low');
                }
            }
        }

        const voiceCounter = document.getElementById('voice-credit-count');
        if (voiceCounter) {
            voiceCounter.textContent = this.isVip ? '∞' : this.voiceCredits;
        }

        const sessionCredits = document.getElementById('voice-session-credits');
        if (sessionCredits) {
            sessionCredits.textContent = this.isVip ? '∞ minutes' : `${this.voiceCredits} minutes`;
        }

        const currentBalance = document.getElementById('current-voice-balance');
        if (currentBalance) {
            currentBalance.textContent = this.isVip ? '∞' : this.voiceCredits;
        }
    }

    // Use a daily credit
    useDailyCredit(purpose = 'AI interaction') {
        if (this.isVip) {
            console.log(`👑 VIP: daily credit request for ${purpose} – no deduction applied`);
            return true;  // VIP users always have infinite credits, no deduction
        }

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
        if (this.isVip) {
            console.log(`👑 VIP: voice credit request for ${minutes} minutes (${purpose}) – no deduction applied`);
            return true;  // VIP users always have infinite voice credits
        }

        if (this.voiceCredits < minutes) {
            this.showCreditWarning('voice');
            return false;
        }

        this.voiceCredits -= minutes;
        this.saveVoiceCredits(this.voiceCredits);
        
        console.log(`🎤 Voice credits used: ${minutes} minutes for ${purpose}. Remaining: ${this.voiceCredits}`);
        return true;
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
}

// Initialize credit system
window.creditSystem = new CreditSystem();
