// ===========================================
// 🚀 ROOT CAUSE POWER - MAIN APPLICATION
// Advanced PTSD Support Platform with AI Integration
// ===========================================

class RootCausePowerApp {
    constructor() {
        console.log('🚀 Initializing Root Cause Power Application');
        
        // Core state
        this.currentSection = 'home';
        this.isLoggedIn = false;
        this.currentUser = null;
        this.voiceCredits = 0;
        this.dailyCredits = 5;
        this.usedDailyCredits = 0;
        
        // Voice AI state
        this.voiceAIActive = false;
        this.humeConnection = null;
        this.audioContext = null;
        
        // Stripe integration
        this.stripe = null;
        
        // Initialize app
        this.init();
    }

    // ===========================================
    // 🎯 INITIALIZATION
    // ===========================================
    
    async init() {
        try {
            console.log('🔧 Setting up application...');
            
            // Initialize Stripe
            await this.initializeStripe();
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup modal handlers
            this.setupModalHandlers();
            
            // Setup login system
            this.setupLoginSystem();
            
            // Setup voice credit system
            this.setupVoiceCreditSystem();
            
            // Check authentication state
            this.checkAuthState();
            
            // Initialize Hume AI voice system
            await this.initializeHumeAI();
            
            // Setup accessibility features
            this.setupAccessibility();
            
            // Load user data
            this.loadUserData();
            
            console.log('✅ Root Cause Power App initialized successfully!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        }
    }

    // ===========================================
    // 💳 STRIPE PAYMENT INTEGRATION
    // ===========================================
    
    async initializeStripe() {
        try {
            // Initialize Stripe with your publishable key
            if (window.Stripe) {
                this.stripe = Stripe('pk_test_51Placeholder123...');  // Replace with your actual publishable key
                console.log('✅ Stripe initialized');
            } else {
                console.warn('⚠️ Stripe not loaded');
            }
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
        }
    }

    async buyVoiceCredits(credits, price) {
        console.log(`💰 Purchasing ${credits} voice credits for £${price}`);
        
        if (!this.isLoggedIn) {
            this.showLoginModal();
            return;
        }

        if (!this.stripe) {
            this.showError('Payment system not available. Please try again later.');
            return;
        }

        try {
            // Create checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'voice_credits',
                    credits: credits,
                    amount: Math.round(price * 100), // Convert to pence
                    currency: 'gbp'
                })
            });

            const session = await response.json();

            if (session.error) {
                throw new Error(session.error);
            }

            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.sessionId
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('❌ Payment failed:', error);
            this.showError('Payment failed: ' + error.message);
        }
    }

    async selectPlan(planType) {
        console.log('📋 Selecting plan:', planType);
        
        if (planType === 'free') {
            // Handle free plan
            localStorage.setItem('userPlan', 'free');
            this.showSuccess('Welcome to Root Cause Power! You now have access to essential PTSD support tools.');
            this.showSection('dashboard');
            return;
        }

        if (!this.isLoggedIn) {
            this.showLoginModal();
            return;
        }

        const planPrices = {
            'standard': 29.00,
            'premium': 49.00,
            'enterprise-essential': 12.00,
            'enterprise-professional': 18.00,
            'enterprise-plus': 25.00
        };

        const price = planPrices[planType];
        if (!price) {
            this.showError('Invalid plan selected');
            return;
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'subscription',
                    planType: planType,
                    amount: Math.round(price * 100),
                    currency: 'gbp'
                })
            });

            const session = await response.json();

            if (session.error) {
                throw new Error(session.error);
            }

            const result = await this.stripe.redirectToCheckout({
                sessionId: session.sessionId
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('❌ Subscription failed:', error);
            this.showError('Subscription failed: ' + error.message);
        }
    }

    // ===========================================
    // 🔐 AUTHENTICATION SYSTEM
    // ===========================================
    
    setupLoginSystem() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log('🔐 Attempting login:', email);

        // Founder login system
        if (email === 'david@fuelgeist.co.uk' && password === 'Founder-1!') {
            this.currentUser = {
                email: email,
                name: 'David Prince',
                role: 'founder',
                plan: 'premium',
                voiceCredits: 100
            };
            
            this.isLoggedIn = true;
            this.voiceCredits = 100;
            
            // Save auth state
            localStorage.setItem('authUser', JSON.stringify(this.currentUser));
            localStorage.setItem('authToken', 'founder-token-' + Date.now());
            
            this.closeModal('login-modal');
            this.updateUI();
            this.showSuccess('Welcome back, David! Founder access granted.');
            
            console.log('✅ Founder login successful');
            return;
        }

        // Regular user authentication would go here
        try {
            // For now, simulate successful login
            this.currentUser = {
                email: email,
                name: email.split('@')[0],
                role: 'user',
                plan: 'free',
                voiceCredits: 0
            };
            
            this.isLoggedIn = true;
            
            localStorage.setItem('authUser', JSON.stringify(this.currentUser));
            localStorage.setItem('authToken', 'user-token-' + Date.now());
            
            this.closeModal('login-modal');
            this.updateUI();
            this.showSuccess('Login successful! Welcome to Root Cause Power.');
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.showError('Login failed. Please check your credentials.');
        }
    }

    checkAuthState() {
        const savedUser = localStorage.getItem('authUser');
        const authToken = localStorage.getItem('authToken');
        
        if (savedUser && authToken) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.voiceCredits = this.currentUser.voiceCredits || 0;
            this.updateUI();
            
            console.log('✅ Authentication restored:', this.currentUser.email);
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.voiceCredits = 0;
        
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        
        this.updateUI();
        this.showSuccess('Logged out successfully');
        this.showSection('home');
    }

    // ===========================================
    // 🎤 HUME AI VOICE INTEGRATION
    // ===========================================
    
    async initializeHumeAI() {
        try {
            console.log('🎤 Initializing Hume AI voice system...');
            
            // For now, we'll create a placeholder system
            // Replace this with actual Hume EVI integration when API keys are available
            this.humeAI = {
                isConnected: false,
                connect: async () => {
                    console.log('🔗 Connecting to Hume AI...');
                    // Placeholder for Hume WebSocket connection
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            this.humeAI.isConnected = true;
                            console.log('✅ Hume AI connected (simulated)');
                            resolve(true);
                        }, 1000);
                    });
                },
                disconnect: () => {
                    this.humeAI.isConnected = false;
                    console.log('🔌 Hume AI disconnected');
                },
                startVoiceSession: async () => {
                    if (!this.humeAI.isConnected) {
                        await this.humeAI.connect();
                    }
                    console.log('🎙️ Starting Hume AI voice session...');
                    return true;
                }
            };
            
            console.log('✅ Hume AI system ready');
            
        } catch (error) {
            console.error('❌ Hume AI initialization failed:', error);
        }
    }

    async openVoiceCoach() {
        console.log('🎙️ Opening Voice AI Coach...');
        
        if (!this.isLoggedIn) {
            this.showError('Please login to access voice coaching');
            this.showLoginModal();
            return;
        }

        // Check if user has voice credits or premium plan
        if (this.voiceCredits <= 0 && this.currentUser.plan === 'free') {
            this.showVoiceCreditStore();
            return;
        }

        // Check if user has Standard plan and needs to purchase credits
        if (this.currentUser.plan === 'standard' && this.voiceCredits <= 0) {
            this.showVoiceCreditStore();
            return;
        }

        try {
            // Open voice AI modal
            const modal = document.getElementById('voice-ai-modal');
            const content = document.getElementById('voice-ai-content');
            
            if (modal && content) {
                content.innerHTML = `
                    <div class="voice-ai-interface">
                        <div class="text-center mb-6">
                            <div class="relative inline-block">
                                <div class="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-4xl mb-4 voice-pulse">
                                    <i class="fas fa-microphone"></i>
                                </div>
                                <div class="absolute inset-0 rounded-full border-4 border-purple-300 animate-ping"></div>
                            </div>
                            <h3 class="text-2xl font-bold mb-2">🧠 Empathic Voice Coach</h3>
                            <p class="text-gray-600">Your AI companion is ready to listen and support you</p>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-shield-heart text-green-600 mr-2"></i>
                                    <span class="font-semibold text-green-800">Trauma-Informed AI</span>
                                </div>
                                <p class="text-sm text-green-700">This AI understands PTSD and trauma responses. It's designed to provide safe, supportive conversation.</p>
                            </div>
                            
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <i class="fas fa-microphone text-purple-600 mr-2"></i>
                                        <span class="font-semibold">Voice Credits</span>
                                    </div>
                                    <span class="text-purple-600 font-bold">${this.voiceCredits} remaining</span>
                                </div>
                                <p class="text-sm text-purple-700">Each session uses 1 credit • Premium members get unlimited access</p>
                            </div>
                            
                            <div id="voice-status" class="text-center p-4 bg-gray-50 rounded-lg">
                                <p class="text-gray-600">Click "Start Session" to begin your voice conversation</p>
                            </div>
                            
                            <div class="flex space-x-4">
                                <button id="start-voice-btn" onclick="app.startVoiceSession()" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold">
                                    <i class="fas fa-play mr-2"></i>Start Voice Session
                                </button>
                                <button onclick="app.showVoiceCreditStore()" class="px-6 py-3 border border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition-colors">
                                    Buy More Credits
                                </button>
                            </div>
                        </div>
                        
                        <div class="mt-6 text-xs text-gray-500 text-center">
                            <p>🔒 Your conversations are private and secure • Crisis support available 24/7</p>
                        </div>
                    </div>
                `;
                
                modal.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('❌ Failed to open voice coach:', error);
            this.showError('Voice coach temporarily unavailable');
        }
    }

    async startVoiceSession() {
        console.log('🎙️ Starting voice session...');
        
        try {
            // Check credits
            if (this.voiceCredits <= 0 && this.currentUser.plan !== 'premium') {
                this.showError('No voice credits available');
                return;
            }

            // Update UI
            const statusDiv = document.getElementById('voice-status');
            const startBtn = document.getElementById('start-voice-btn');
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-2"></div>
                        <p class="text-purple-600 font-semibold">Connecting to AI coach...</p>
                    </div>
                `;
            }
            
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i>Connecting...';
            }

            // Initialize Hume if not already done
            if (!window.humeVoice) {
                window.humeVoice = new HumeVoiceIntegration();
            }
            
            // Initialize and connect to Hume
            const initialized = await window.humeVoice.initialize();
            if (initialized) {
                const connected = await window.humeVoice.connect();
                
                if (connected) {
                    // Start session
                    window.humeVoice.startSession(this.currentUser?.email || 'anonymous');
                    await window.humeVoice.startRecording();
                    
                    // Deduct credit (unless premium)
                    if (this.currentUser.plan !== 'premium') {
                        this.voiceCredits -= 1;
                        this.updateVoiceCreditDisplay();
                    }
                    
                    // Update UI for active session
                    if (statusDiv) {
                        statusDiv.innerHTML = `
                            <div class="text-center">
                                <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-2 voice-active">
                                    <i class="fas fa-microphone"></i>
                                </div>
                                <p class="text-green-600 font-semibold">🎙️ AI Coach is listening...</p>
                                <p class="text-sm text-gray-600 mt-1">Speak naturally - I'm here to support you</p>
                            </div>
                            
                            <!-- Live transcript display -->
                            <div id="voice-transcript" class="mt-4 bg-gray-50 rounded-lg p-3 h-32 overflow-y-auto text-left">
                                <p class="text-sm text-gray-500 italic">Conversation will appear here...</p>
                            </div>
                            
                            <!-- Emotional state display -->
                            <div id="emotional-state" class="mt-4"></div>
                        `;
                    }
                    
                    if (startBtn) {
                        startBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>End Session';
                        startBtn.onclick = () => this.endVoiceSession();
                        startBtn.disabled = false;
                        startBtn.className = startBtn.className.replace('from-purple-500 to-pink-500', 'from-red-500 to-red-600');
                    }

                    this.voiceAIActive = true;
                    console.log('✅ Hume Voice session started successfully');
                    
                } else {
                    throw new Error('Failed to connect to Hume voice system');
                }
            } else {
                throw new Error('Hume voice system not configured');
            }
            
        } catch (error) {
            console.error('❌ Voice session failed:', error);
            this.showError('Failed to start voice session: ' + error.message);
            
            // Reset UI
            const startBtn = document.getElementById('start-voice-btn');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Voice Session';
            }
        }
    }

    endVoiceSession() {
        console.log('🔌 Ending voice session...');
        
        try {
            if (window.humeVoice) {
                window.humeVoice.endSession();
            }
            
            this.voiceAIActive = false;
            
            // Update UI
            const statusDiv = document.getElementById('voice-status');
            const startBtn = document.getElementById('start-voice-btn');
            
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="text-center p-4">
                        <div class="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-2">
                            <i class="fas fa-check"></i>
                        </div>
                        <p class="text-gray-600 font-semibold">Session completed</p>
                        <p class="text-sm text-gray-500 mt-1">Thank you for using Voice AI coaching</p>
                    </div>
                `;
            }
            
            if (startBtn) {
                startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start New Session';
                startBtn.onclick = () => this.startVoiceSession();
                startBtn.className = startBtn.className.replace('from-red-500 to-red-600', 'from-purple-500 to-pink-500');
            }

            console.log('✅ Voice session ended');
            
        } catch (error) {
            console.error('❌ Error ending voice session:', error);
        }
    }

    // ===========================================
    // 💰 VOICE CREDIT SYSTEM
    // ===========================================
    
    setupVoiceCreditSystem() {
        this.voiceCreditOptions = [
            { credits: 1, price: 7.99, popular: false },
            { credits: 5, price: 29.99, popular: true },
            { credits: 10, price: 49.99, popular: false }
        ];
    }

    showVoiceCreditStore() {
        console.log('🛒 Opening voice credit store...');
        
        const modal = document.getElementById('voice-credit-modal');
        if (!modal) {
            console.error('❌ Voice credit modal not found');
            return;
        }

        // Generate credit options
        const optionsContainer = document.getElementById('voice-credit-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = this.voiceCreditOptions.map((option, index) => `
                <div class="credit-option p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 transition-all ${option.popular ? 'border-purple-500 bg-purple-50' : ''}" 
                     onclick="app.selectCreditOption(${index})">
                    ${option.popular ? '<div class="text-xs bg-purple-500 text-white px-2 py-1 rounded-full mb-2">Best Value</div>' : ''}
                    <div class="text-center">
                        <div class="text-2xl font-bold">${option.credits}</div>
                        <div class="text-sm text-gray-600">Session${option.credits > 1 ? 's' : ''}</div>
                        <div class="text-lg font-bold text-purple-600 mt-2">£${option.price}</div>
                        ${option.credits > 1 ? `<div class="text-xs text-gray-500">£${(option.price / option.credits).toFixed(2)} each</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        modal.classList.remove('hidden');
    }

    selectCreditOption(optionIndex) {
        const option = this.voiceCreditOptions[optionIndex];
        if (!option) return;

        // Update selection UI
        document.querySelectorAll('.credit-option').forEach((el, index) => {
            if (index === optionIndex) {
                el.classList.add('border-purple-500', 'bg-purple-100');
            } else {
                el.classList.remove('border-purple-500', 'bg-purple-100');
            }
        });

        // Update total display
        const totalDisplay = document.getElementById('credit-total');
        if (totalDisplay) {
            totalDisplay.textContent = `£${option.price}`;
        }

        // Enable purchase button
        const purchaseBtn = document.getElementById('purchase-credits-btn');
        if (purchaseBtn) {
            purchaseBtn.disabled = false;
            purchaseBtn.onclick = () => this.buyVoiceCredits(option.credits, option.price);
        }

        console.log('📋 Selected credit option:', option);
    }

    updateVoiceCreditDisplay() {
        // Update voice credit counter
        const creditCount = document.getElementById('voice-credit-count');
        if (creditCount) {
            creditCount.textContent = this.voiceCredits;
        }

        // Update any other displays
        const voiceCreditCounter = document.getElementById('voice-credit-counter');
        if (voiceCreditCounter) {
            if (this.voiceCredits > 0 || this.currentUser?.plan === 'premium') {
                voiceCreditCounter.classList.remove('bg-red-500');
                voiceCreditCounter.classList.add('bg-purple-500');
            } else {
                voiceCreditCounter.classList.remove('bg-purple-500');
                voiceCreditCounter.classList.add('bg-red-500');
            }
        }
    }

    // ===========================================
    // 🧭 NAVIGATION SYSTEM
    // ===========================================
    
    setupNavigation() {
        console.log('🧭 Setting up navigation...');
        
        // Main navigation buttons
        document.querySelectorAll('[data-section]').forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => this.toggleHamburgerMenu());
        }

        // Logo tap handler for admin access
        const logo = document.getElementById('logo');
        if (logo) {
            let tapCount = 0;
            logo.addEventListener('click', () => {
                tapCount++;
                if (tapCount === 3) {
                    this.showAdminAccess();
                    tapCount = 0;
                }
                setTimeout(() => { tapCount = 0; }, 2000);
            });
        }
    }

    showSection(sectionName) {
        console.log('📍 Navigating to section:', sectionName);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            this.currentSection = sectionName;
            
            // Update navigation state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-green-100', 'text-green-600');
            });
            
            const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeBtn && activeBtn.classList.contains('nav-btn')) {
                activeBtn.classList.add('bg-green-100', 'text-green-600');
            }
        }
        
        // Close hamburger menu if open
        const dropdown = document.getElementById('hamburger-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    toggleHamburgerMenu() {
        const dropdown = document.getElementById('hamburger-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    // ===========================================
    // 🎯 MODAL MANAGEMENT
    // ===========================================
    
    setupModalHandlers() {
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Click outside to close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });
    }

    showLoginModal() {
        this.openModal('login-modal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            console.log('✅ Modal opened:', modalId);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            console.log('✅ Modal closed:', modalId);
        }
    }

    // ===========================================
    // ♿ ACCESSIBILITY FEATURES
    // ===========================================
    
    setupAccessibility() {
        console.log('♿ Setting up accessibility features...');
        
        // Load saved preferences
        const savedPrefs = localStorage.getItem('accessibilityPrefs');
        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            if (prefs.fontSize) this.setFontSize(prefs.fontSize);
            if (prefs.highContrast) this.toggleHighContrast(true);
            if (prefs.reducedMotion) this.toggleReducedMotion(true);
            if (prefs.voiceSpeed) this.setVoiceSpeed(prefs.voiceSpeed);
        }
    }

    setFontSize(size) {
        document.body.classList.remove('large-text', 'extra-large-text');
        if (size === 'large') {
            document.body.classList.add('large-text');
        } else if (size === 'extra-large') {
            document.body.classList.add('extra-large-text');
        }
        
        this.saveAccessibilityPref('fontSize', size);
        console.log('🔤 Font size set to:', size);
    }

    toggleHighContrast(force = null) {
        const shouldEnable = force !== null ? force : !document.body.classList.contains('high-contrast');
        
        if (shouldEnable) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        this.saveAccessibilityPref('highContrast', shouldEnable);
        console.log('🎨 High contrast:', shouldEnable ? 'enabled' : 'disabled');
    }

    toggleReducedMotion(force = null) {
        const shouldEnable = force !== null ? force : !document.body.classList.contains('reduced-motion');
        
        if (shouldEnable) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        
        this.saveAccessibilityPref('reducedMotion', shouldEnable);
        console.log('🎭 Reduced motion:', shouldEnable ? 'enabled' : 'disabled');
    }

    setVoiceSpeed(speed) {
        this.voiceSpeed = parseFloat(speed);
        this.saveAccessibilityPref('voiceSpeed', this.voiceSpeed);
        console.log('🗣️ Voice speed set to:', this.voiceSpeed);
    }

    toggleScreenReaderMode() {
        this.screenReaderMode = !this.screenReaderMode;
        this.saveAccessibilityPref('screenReaderMode', this.screenReaderMode);
        console.log('📢 Screen reader mode:', this.screenReaderMode ? 'enabled' : 'disabled');
    }

    toggleFocusIndicators() {
        this.focusIndicators = !this.focusIndicators;
        this.saveAccessibilityPref('focusIndicators', this.focusIndicators);
        console.log('🎯 Focus indicators:', this.focusIndicators ? 'enabled' : 'disabled');
    }

    resetAccessibilitySettings() {
        localStorage.removeItem('accessibilityPrefs');
        document.body.classList.remove('large-text', 'extra-large-text', 'high-contrast', 'reduced-motion');
        this.voiceSpeed = 1;
        this.screenReaderMode = false;
        this.focusIndicators = true;
        
        // Reset form controls
        document.getElementById('high-contrast-toggle').checked = false;
        document.getElementById('reduced-motion-toggle').checked = false;
        document.getElementById('voice-speed').value = 1;
        document.getElementById('screen-reader-toggle').checked = false;
        document.getElementById('focus-indicators-toggle').checked = true;
        
        console.log('🔄 Accessibility settings reset');
        this.showSuccess('Accessibility settings reset to defaults');
    }

    saveAccessibilityPref(key, value) {
        const prefs = JSON.parse(localStorage.getItem('accessibilityPrefs') || '{}');
        prefs[key] = value;
        localStorage.setItem('accessibilityPrefs', JSON.stringify(prefs));
    }

    announceToScreenReader(message) {
        const announcer = document.getElementById('sr-announcements');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => { announcer.textContent = ''; }, 1000);
        }
    }

    // ===========================================
    // 🚨 CRISIS SUPPORT SYSTEM
    // ===========================================
    
    triggerCrisisSupport() {
        console.log('🚨 Activating crisis support...');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-heart text-red-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">🚨 Crisis Support</h3>
                    <p class="text-gray-600">Immediate help is available right now</p>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div class="bg-red-50 p-4 rounded-lg">
                        <h4 class="font-bold text-red-800 mb-2">🇬🇧 UK - Available 24/7</h4>
                        <div class="text-sm text-red-700 space-y-1">
                            <p><strong>Samaritans:</strong> <a href="tel:116123" class="underline">116 123</a> (Free)</p>
                            <p><strong>Emergency:</strong> <a href="tel:999" class="underline">999</a></p>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-bold text-blue-800 mb-2">🇺🇸 US - Available 24/7</h4>
                        <div class="text-sm text-blue-700 space-y-1">
                            <p><strong>Crisis Lifeline:</strong> <a href="tel:988" class="underline">988</a></p>
                            <p><strong>Emergency:</strong> <a href="tel:911" class="underline">911</a></p>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h4 class="font-bold text-green-800 mb-2">💚 Online Support</h4>
                        <div class="text-sm text-green-700 space-y-1">
                            <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                            <p><strong>Online Chat:</strong> samaritans.org</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-4">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        Close
                    </button>
                    <button onclick="window.open('tel:116123')" class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        Call Now
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ===========================================
    // 🎵 AUDIO MANAGEMENT
    // ===========================================
    
    stopAllAudio() {
        console.log('🔇 Stopping all audio...');
        
        // Stop any playing audio elements
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Stop EMDR audio if playing
        if (window.EMDRHelper && window.EMDRHelper.currentAudio) {
            window.EMDRHelper.currentAudio.pause();
            window.EMDRHelper.currentAudio.currentTime = 0;
        }
        
        // Stop voice AI if active
        if (this.voiceAIActive) {
            this.endVoiceSession();
        }
        
        this.showSuccess('All audio stopped');
    }

    // ===========================================
    // 🔧 UTILITY FUNCTIONS
    // ===========================================
    
    updateUI() {
        // Update login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            if (this.isLoggedIn) {
                loginBtn.textContent = this.currentUser.name || 'Profile';
                loginBtn.onclick = () => this.showUserMenu();
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = () => this.showLoginModal();
            }
        }
        
        // Update voice credit display
        this.updateVoiceCreditDisplay();
        
        // Update plan-specific features
        if (this.currentUser) {
            this.updatePlanFeatures();
        }
    }

    updatePlanFeatures() {
        const plan = this.currentUser.plan;
        
        // Show/hide features based on plan
        const voiceCreditElements = document.querySelectorAll('[data-plan-feature="voice-credits"]');
        voiceCreditElements.forEach(el => {
            if (plan === 'premium') {
                el.style.display = 'none'; // Hide credit purchases for premium users
            } else {
                el.style.display = 'block';
            }
        });
    }

    showUserMenu() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 class="text-xl font-bold mb-4">👤 Account</h3>
                <div class="space-y-3">
                    <div class="text-sm">
                        <p><strong>Name:</strong> ${this.currentUser.name}</p>
                        <p><strong>Email:</strong> ${this.currentUser.email}</p>
                        <p><strong>Plan:</strong> ${this.currentUser.plan}</p>
                        <p><strong>Voice Credits:</strong> ${this.voiceCredits}</p>
                    </div>
                    <div class="border-t pt-3 space-y-2">
                        <button onclick="app.showSection('pricing'); this.parentElement.parentElement.parentElement.parentElement.remove();" class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Manage Plan
                        </button>
                        <button onclick="app.logout(); this.parentElement.parentElement.parentElement.parentElement.remove();" class="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="mt-4 text-gray-500 hover:text-gray-700">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showAdminAccess() {
        if (this.currentUser && this.currentUser.role === 'founder') {
            console.log('🔑 Admin access available');
            this.showSuccess('Admin features available (founder account detected)');
        } else {
            console.log('🔒 Admin access denied');
            this.showError('Admin access requires founder credentials');
        }
    }

    loadUserData() {
        // Load saved user preferences and data
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            const data = JSON.parse(savedData);
            // Apply saved preferences
            console.log('📂 User data loaded');
        }
    }

    saveUserData() {
        // Save user preferences and progress
        const userData = {
            voiceCredits: this.voiceCredits,
            usedDailyCredits: this.usedDailyCredits,
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('💾 User data saved');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-sm w-full mx-4 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }

    // ===========================================
    // 🤖 AI COACH INTEGRATION
    // ===========================================
    
    openCoachModal(coachType) {
        console.log('🤖 Opening AI coach modal:', coachType);
        
        const modal = document.getElementById('coach-modal');
        const content = document.getElementById('coach-content');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="coach-chat-interface">
                    <div class="flex items-center mb-4 pb-4 border-b">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl mr-4">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">AI ${coachType} Coach</h3>
                            <p class="text-gray-600">Specialized AI support for your ${coachType} needs</p>
                        </div>
                    </div>
                    
                    <div id="coach-messages" class="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto mb-4 border border-gray-200">
                        <div class="mb-3">
                            <div class="bg-blue-100 p-3 rounded-lg">
                                <p>Hello! I'm your AI ${coachType} coach. I'm here to provide personalized support based on your assessment. How can I help you today?</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <input type="text" id="coach-user-input" placeholder="Type your message..." 
                               class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <button id="send-coach-btn" class="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="text-xs text-gray-500 text-center mt-2">
                        Press Enter to send • AI responses are for educational purposes
                    </div>
                </div>
            `;
            
            // Setup chat functionality
            this.setupCoachChat(coachType);
            
            modal.classList.remove('hidden');
        }
    }

    setupCoachChat(coachType) {
        const input = document.getElementById('coach-user-input');
        const sendBtn = document.getElementById('send-coach-btn');
        const messagesContainer = document.getElementById('coach-messages');
        
        const sendMessage = async () => {
            const message = input.value.trim();
            if (!message) return;
            
            // Add user message
            this.addChatMessage(messagesContainer, message, 'user');
            input.value = '';
            
            // Simulate AI response (replace with actual AI integration)
            setTimeout(() => {
                const response = this.generateCoachResponse(coachType, message);
                this.addChatMessage(messagesContainer, response, 'ai');
            }, 1000);
        };
        
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            input.focus();
        }
    }

    addChatMessage(container, message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `mb-3 ${sender === 'user' ? 'text-right' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="inline-block p-3 rounded-lg max-w-xs ${
                sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }">
                <p class="text-sm">${message}</p>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    generateCoachResponse(coachType, userMessage) {
        // Placeholder AI responses (replace with actual AI integration)
        const responses = {
            nutrition: [
                "Based on your assessment, I recommend focusing on anti-inflammatory foods to support your recovery.",
                "Let's explore some meal planning strategies that can help stabilize your energy levels throughout the day.",
                "Nutrition plays a crucial role in mental health. Would you like some specific recommendations for mood-supporting foods?"
            ],
            sleep: [
                "Sleep quality is essential for trauma recovery. Let's work on establishing a calming bedtime routine.",
                "I notice sleep disturbances are common with PTSD. Here are some evidence-based techniques that might help.",
                "Creating a sleep sanctuary can significantly improve your rest. Would you like some practical tips?"
            ],
            ptsd: [
                "Thank you for sharing that with me. Your feelings are completely valid and understandable.",
                "Many people with similar experiences find grounding techniques helpful. Would you like me to guide you through one?",
                "Remember, healing is not linear. You're showing incredible strength by seeking support."
            ]
        };
        
        const typeResponses = responses[coachType] || responses.ptsd;
        return typeResponses[Math.floor(Math.random() * typeResponses.length)];
    }

    // ===========================================
    // 🎯 LOGO TAP HANDLER
    // ===========================================
    
    logoTapHandler() {
        // This function is called by the logo click handler in setupNavigation
        // Triple-tap functionality is handled there
        this.showSection('home');
    }
}

// ===========================================
// 🚀 INITIALIZE APPLICATION
// ===========================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded - initializing app...');
    window.app = new RootCausePowerApp();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RootCausePowerApp;
}

console.log('✅ Root Cause Power App script loaded!');