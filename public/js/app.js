// ===========================================
// 🚀 ROOT CAUSE POWER - MAIN APPLICATION
// Advanced Wellness Platform with AI Integration
// ===========================================

class RootCausePowerApp {
    constructor() {
        console.log('🚀 Initializing Root Cause Power Application');
        
        // Core state
        this.currentSection = 'home';
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Logo tap counter for admin access
        this.logoTapCount = 0;
        this.logoTapTimer = null;
        
        // Initialize app
        this.init();
    }

    // ===========================================
    // 🎯 INITIALIZATION
    // ===========================================
    
    async init() {
        try {
            console.log('🔧 Setting up application...');
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup modal handlers
            this.setupModalHandlers();
            
            // Setup login system
            this.setupLoginSystem();
            
            // Check authentication state
            this.checkAuthState();
            
            // Setup accessibility features
            this.setupAccessibility();
            
            // Load user data
            this.loadUserData();
            
            // Setup URL parameter handling
            this.handleUrlParameters();
            
            console.log('✅ Root Cause Power App initialized successfully!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        }
    }

    // ===========================================
    // 🧭 NAVIGATION SYSTEM
    // ===========================================
    
    setupNavigation() {
        // Main navigation buttons
        document.querySelectorAll('[data-section]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburger-menu-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleHamburgerMenu();
            });
        }

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Dropdown navigation items
        document.querySelectorAll('.nav-dropdown-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });
    }

    showSection(sectionName) {
        console.log(`🧭 Navigating to section: ${sectionName}`);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Update page title
            this.updatePageTitle(sectionName);
            
            // Close hamburger menu if open
            this.closeHamburgerMenu();
            
            // Section-specific initialization
            this.initializeSection(sectionName);
        }
    }

    updatePageTitle(sectionName) {
        const titles = {
            'home': 'Root Cause Power - Lifestyle Medicine & Clinical Hypnotherapy',
            'assessment': 'Life Analysis - Root Cause Power',
            'dashboard': 'Dashboard - Root Cause Power',
            'coaches': 'AI Coaches - Root Cause Power',
            'nutrition': 'Nutrition & Wellness - Root Cause Power',
            'media-library': 'Media Library - Root Cause Power',
            'community': 'Community - Root Cause Power',
            'ptsd-corner': 'PTSD Support - Root Cause Power',
            'pricing': 'Pricing & Plans - Root Cause Power',
            'help': 'Help & Support - Root Cause Power'
        };
        
        document.title = titles[sectionName] || 'Root Cause Power';
    }

    initializeSection(sectionName) {
        switch (sectionName) {
            case 'community':
                this.loadCommunityPosts();
                break;
            case 'nutrition':
                this.initializeNutritionSection();
                break;
            case 'media-library':
                this.initializeMediaLibrary();
                break;
            case 'dashboard':
                this.updateDashboardStats();
                break;
            case 'ptsd-corner':
                this.initializePTSDCorner();
                break;
            default:
                // No specific initialization needed
                break;
        }
    }

    toggleHamburgerMenu() {
        const dropdown = document.getElementById('hamburger-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    closeHamburgerMenu() {
        const dropdown = document.getElementById('hamburger-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    // ===========================================
    // 🔐 AUTHENTICATION SYSTEM
    // ===========================================
    
    setupLoginSystem() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }
    }

    checkAuthState() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
            this.updateUIForLoggedInUser();
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    updateUIForLoggedInUser() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn && this.currentUser) {
            loginBtn.textContent = `Welcome, ${this.currentUser.name || 'User'}`;
            loginBtn.onclick = () => this.showUserMenu();
        }
    }

    showUserMenu() {
        // Implementation for user menu
        console.log('👤 Showing user menu');
    }

    // ===========================================
    // 🎙️ VOICE AI INTEGRATION
    // ===========================================
    
    openVoiceAI() {
        console.log('🎤 Opening Voice AI Coach...');
        
        // Temporarily skip credit check for testing
        // TODO: Re-enable credit system once fully integrated
        // if (!window.creditSystem || !window.creditSystem.canAfford('voice', 2)) {
        //     this.showVoiceCreditStore();
        //     return;
        // }
        
        // Open Hume Voice Modal
        const modal = document.getElementById('hume-voice-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Update credits display in modal
            const creditsDisplay = document.getElementById('voice-session-credits');
            if (creditsDisplay && window.creditSystem) {
                creditsDisplay.textContent = `${window.creditSystem.voiceCredits} minutes`;
            }
        }
    }

    startVoiceSession() {
        console.log('🎙️ Starting Hume AI voice session...');
        
        if (window.humeVoice) {
            return window.humeVoice.startVoiceSession();
        } else {
            console.warn('⚠️ Hume Voice system not available');
            this.showError('Voice system not available. Please try again later.');
            return false;
        }
    }

    stopVoiceSession() {
        console.log('⏹️ Stopping voice session...');
        
        if (window.humeVoice) {
            window.humeVoice.stopVoiceSession();
        }
    }

    closeVoiceSession() {
        const modal = document.getElementById('hume-voice-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        // Also stop any active session
        this.stopVoiceSession();
    }

    // ===========================================
    // 💰 CREDIT SYSTEM INTEGRATION
    // ===========================================
    
    showVoiceCreditStore() {
        console.log('🏪 Opening Voice Credit Store...');
        
        const modal = document.getElementById('voice-credit-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    async purchaseVoiceCredits(packageType, amount, minutes) {
        console.log(`💳 Purchasing voice credits: ${packageType} - £${amount} for ${minutes} minutes`);
        
        if (window.creditSystem) {
            await window.creditSystem.purchaseVoiceCredits(packageType, amount, minutes);
        } else {
            console.error('❌ Credit system not available');
            this.showError('Payment system not available. Please try again later.');
        }
    }

    showCreditInfo() {
        if (window.creditSystem) {
            window.creditSystem.showCreditInfo();
        }
    }

    // ===========================================
    // 🏥 CRISIS SUPPORT SYSTEM
    // ===========================================
    
    triggerCrisisSupport() {
        console.log('🚨 Crisis support triggered');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-heart text-red-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">🚨 Crisis Support Available</h3>
                    <p class="text-gray-600">You are not alone. Help is available right now.</p>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div class="bg-red-50 p-4 rounded-lg">
                        <h4 class="font-bold text-red-800 mb-2">🇬🇧 UK Crisis Support</h4>
                        <div class="text-sm text-red-700 space-y-1">
                            <p><strong>Samaritans:</strong> <a href="tel:116123" class="underline font-bold">116 123</a> (Free, 24/7)</p>
                            <p><strong>Crisis Text:</strong> Text SHOUT to <a href="sms:85258" class="underline font-bold">85258</a></p>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-bold text-blue-800 mb-2">🇺🇸 US Crisis Support</h4>
                        <div class="text-sm text-blue-700 space-y-1">
                            <p><strong>Crisis Lifeline:</strong> <a href="tel:988" class="underline font-bold">988</a> (24/7)</p>
                            <p><strong>Crisis Text:</strong> Text HOME to <a href="sms:741741" class="underline font-bold">741741</a></p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-bold text-gray-800 mb-2">🚑 Emergency Services</h4>
                        <div class="text-sm text-gray-700">
                            <p><strong>UK:</strong> <a href="tel:999" class="underline font-bold">999</a> | <strong>US:</strong> <a href="tel:911" class="underline font-bold">911</a></p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-4">
                    <button onclick="window.open('tel:116123')" class="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-semibold">
                        <i class="fas fa-phone mr-2"></i>Call Now
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50">
                        Close
                    </button>
                </div>
                
                <div class="mt-4 text-center text-xs text-gray-500">
                    Your life has value. Recovery is possible. Help is here.
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ===========================================
    // 🧠 AI COACH INTERACTIONS
    // ===========================================
    
    openCoachModal(coachType) {
        console.log(`🤖 Opening ${coachType} coach`);
        
        // Check daily credits
        if (!window.creditSystem || !window.creditSystem.canAfford('daily', 1)) {
            window.creditSystem.showCreditWarning('daily');
            return;
        }
        
        const modal = document.getElementById('coach-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Initialize chat interface
            this.initializeCoachChat(coachType);
        }
    }

    initializeCoachChat(coachType) {
        const content = document.getElementById('coach-content');
        if (!content) return;
        
        const coachInfo = {
            'nutrition': {
                name: 'Nutrition Coach',
                icon: 'fas fa-apple-alt',
                color: 'green',
                greeting: 'Hello! I\'m your AI Nutrition Coach. I can help you create personalized meal plans based on your health goals and assessment results. What would you like to explore today?'
            },
            'sleep': {
                name: 'Sleep Specialist', 
                icon: 'fas fa-bed',
                color: 'blue',
                greeting: 'Hi there! I\'m your Sleep Specialist. I can help you optimize your sleep patterns for better recovery and mental health. What sleep challenges are you experiencing?'
            },
            'stress': {
                name: 'Stress Coach',
                icon: 'fas fa-spa',
                color: 'purple',
                greeting: 'Welcome! I\'m your Stress Management Coach. I can teach you evidence-based techniques for managing stress and anxiety. How can I support you today?'
            },
            'ptsd': {
                name: 'PTSD Specialist',
                icon: 'fas fa-heart',
                color: 'pink',
                greeting: 'Hello, and welcome to a safe space. I\'m your trauma-informed PTSD Specialist. I\'m here to provide gentle, evidence-based support. How are you feeling right now?'
            }
        };
        
        const coach = coachInfo[coachType] || coachInfo['nutrition'];
        
        content.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="flex items-center mb-4 p-4 bg-${coach.color}-50 rounded-lg">
                    <div class="w-12 h-12 bg-${coach.color}-500 rounded-full flex items-center justify-center text-white mr-4">
                        <i class="${coach.icon}"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${coach.name}</h3>
                        <p class="text-sm text-${coach.color}-600">AI-powered personalized coaching</p>
                    </div>
                </div>
                
                <div id="chat-messages" class="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4 min-h-64">
                    <div class="mb-4">
                        <div class="bg-${coach.color}-100 p-3 rounded-lg max-w-xs">
                            <p class="text-sm">${coach.greeting}</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <input type="text" id="coach-input" placeholder="Type your message..." 
                           class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-${coach.color}-500 focus:border-${coach.color}-500">
                    <button onclick="app.sendCoachMessage('${coachType}')" 
                            class="bg-${coach.color}-500 text-white px-6 py-3 rounded-lg hover:bg-${coach.color}-600 transition-colors">
                        Send
                    </button>
                </div>
                
                <div class="text-xs text-gray-500 mt-2 text-center">
                    Uses 1 daily credit per conversation • ${window.creditSystem ? window.creditSystem.dailyCredits.count : 0} remaining today
                </div>
            </div>
        `;
        
        // Focus input and setup enter key
        const input = document.getElementById('coach-input');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendCoachMessage(coachType);
                }
            });
        }
    }

    async sendCoachMessage(coachType) {
        const input = document.getElementById('coach-input');
        const messages = document.getElementById('chat-messages');
        
        if (!input || !messages || !input.value.trim()) return;
        
        const userMessage = input.value.trim();
        input.value = '';
        
        // Add user message to chat
        this.addChatMessage(messages, userMessage, 'user');
        
        // Use daily credit
        if (window.creditSystem && !window.creditSystem.useDailyCredit(`${coachType} coach conversation`)) {
            this.addChatMessage(messages, 'You\'ve reached your daily limit. Please upgrade or wait for tomorrow\'s reset.', 'system');
            return;
        }
        
        // Show typing indicator
        const typingId = this.showTypingIndicator(messages);
        
        try {
            // Call AI
            const response = await this.callAI(userMessage, coachType);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingId);
            
            // Add AI response
            this.addChatMessage(messages, response, 'ai');
            
        } catch (error) {
            console.error('❌ AI response failed:', error);
            this.removeTypingIndicator(typingId);
            this.addChatMessage(messages, 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.', 'system');
        }
    }

    addChatMessage(container, message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-4';
        
        let className, content;
        if (sender === 'user') {
            className = 'bg-blue-500 text-white ml-12 max-w-xs';
            content = message;
        } else if (sender === 'ai') {
            className = 'bg-gray-100 text-gray-800 mr-12 max-w-xs';
            content = message;
        } else {
            className = 'bg-orange-100 text-orange-800 max-w-xs mx-auto text-center';
            content = message;
        }
        
        messageDiv.innerHTML = `
            <div class="${className} p-3 rounded-lg">
                <p class="text-sm">${content}</p>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator(container) {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.className = 'mb-4';
        typingDiv.innerHTML = `
            <div class="bg-gray-100 text-gray-600 mr-12 max-w-xs p-3 rounded-lg">
                <div class="flex items-center">
                    <div class="typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    removeTypingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    async callAI(prompt, context = 'general') {
        try {
            // Get API configuration
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();
            
            if (!config.groqApiKey) {
                throw new Error('AI service not configured');
            }
            
            // Prepare system prompt based on context
            const systemPrompts = {
                'nutrition': 'You are a compassionate nutrition coach specializing in trauma recovery and lifestyle medicine. Provide evidence-based, gentle guidance.',
                'sleep': 'You are a sleep specialist helping trauma survivors improve their sleep quality. Be understanding and provide practical, trauma-informed advice.',
                'stress': 'You are a stress management coach trained in trauma-informed care. Provide calming, practical strategies.',
                'ptsd': 'You are a trauma-informed PTSD specialist. Be extremely gentle, validating, and provide evidence-based support. Never minimize experiences.',
                'general': 'You are a compassionate health coach specializing in lifestyle medicine and trauma recovery.'
            };
            
            const systemPrompt = systemPrompts[context] || systemPrompts['general'];
            
            // Call Groq AI
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });
            
            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            } else {
                throw new Error('No response from AI');
            }
            
        } catch (error) {
            console.error('❌ AI call failed:', error);
            throw error;
        }
    }

    // ===========================================
    // 🎛️ MODAL SYSTEM
    // ===========================================
    
    setupModalHandlers() {
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            });
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
                e.target.classList.remove('flex');
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                });
            }
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    // ===========================================
    // ♿ ACCESSIBILITY FEATURES
    // ===========================================
    
    setupAccessibility() {
        // Font size controls
        window.app = window.app || {};
        window.app.setFontSize = this.setFontSize.bind(this);
        window.app.toggleHighContrast = this.toggleHighContrast.bind(this);
        window.app.toggleReducedMotion = this.toggleReducedMotion.bind(this);
        window.app.setVoiceSpeed = this.setVoiceSpeed.bind(this);
        window.app.toggleScreenReaderMode = this.toggleScreenReaderMode.bind(this);
        window.app.toggleFocusIndicators = this.toggleFocusIndicators.bind(this);
        window.app.resetAccessibilitySettings = this.resetAccessibilitySettings.bind(this);
        window.app.announceToScreenReader = this.announceToScreenReader.bind(this);
    }

    setFontSize(size) {
        document.body.classList.remove('large-text', 'extra-large-text');
        if (size === 'large') {
            document.body.classList.add('large-text');
        } else if (size === 'extra-large') {
            document.body.classList.add('extra-large-text');
        }
        
        this.saveAccessibilityPreference('fontSize', size);
        this.announceToScreenReader(`Font size changed to ${size}`);
    }

    toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const enabled = document.body.classList.contains('high-contrast');
        this.saveAccessibilityPreference('highContrast', enabled);
        this.announceToScreenReader(`High contrast ${enabled ? 'enabled' : 'disabled'}`);
    }

    toggleReducedMotion() {
        document.body.classList.toggle('reduced-motion');
        const enabled = document.body.classList.contains('reduced-motion');
        this.saveAccessibilityPreference('reducedMotion', enabled);
        this.announceToScreenReader(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
    }

    setVoiceSpeed(speed) {
        // Implementation for voice speed control
        this.saveAccessibilityPreference('voiceSpeed', speed);
        console.log(`🔊 Voice speed set to ${speed}`);
    }

    toggleScreenReaderMode() {
        // Implementation for enhanced screen reader support
        const enabled = !this.screenReaderMode;
        this.screenReaderMode = enabled;
        this.saveAccessibilityPreference('screenReaderMode', enabled);
        this.announceToScreenReader(`Enhanced audio cues ${enabled ? 'enabled' : 'disabled'}`);
    }

    toggleFocusIndicators() {
        // Implementation for enhanced focus indicators
        const enabled = !document.body.classList.contains('enhanced-focus');
        document.body.classList.toggle('enhanced-focus', enabled);
        this.saveAccessibilityPreference('focusIndicators', enabled);
    }

    resetAccessibilitySettings() {
        document.body.classList.remove('large-text', 'extra-large-text', 'high-contrast', 'reduced-motion', 'enhanced-focus');
        localStorage.removeItem('accessibilityPrefs');
        this.announceToScreenReader('Accessibility settings reset to defaults');
    }

    saveAccessibilityPreference(key, value) {
        const prefs = JSON.parse(localStorage.getItem('accessibilityPrefs') || '{}');
        prefs[key] = value;
        localStorage.setItem('accessibilityPrefs', JSON.stringify(prefs));
    }

    announceToScreenReader(message) {
        const announcements = document.getElementById('sr-announcements');
        if (announcements) {
            announcements.textContent = message;
            // Clear after a moment to allow for new announcements
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }

    // ===========================================
    // 📱 PWA & URL HANDLING
    // ===========================================
    
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle payment success
        if (urlParams.get('payment') === 'success') {
            const type = urlParams.get('type');
            const credits = urlParams.get('credits');
            const minutes = urlParams.get('minutes');
            
            if (type === 'voice_credits' && credits) {
                this.showSuccess(`🎉 Payment successful! ${credits} voice minutes added to your account.`);
            } else if (type === 'subscription') {
                this.showSuccess('🎉 Welcome to your new plan! Your subscription is now active.');
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Handle payment cancellation
        if (urlParams.get('payment') === 'cancelled') {
            this.showError('Payment was cancelled. You can try again anytime.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    loadUserData() {
        // Load user preferences and data
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        }
    }

    // ===========================================
    // 👤 ADMIN & LOGO SYSTEM
    // ===========================================
    
    logoTapHandler() {
        this.logoTapCount++;
        
        if (this.logoTapTimer) {
            clearTimeout(this.logoTapTimer);
        }
        
        this.logoTapTimer = setTimeout(() => {
            if (this.logoTapCount >= 3) {
                this.showAdminAccess();
            }
            this.logoTapCount = 0;
        }, 2000);
    }

    showAdminAccess() {
        const password = prompt('Enter admin password:');
        if (password === 'rootcause2024') {
            this.showSuccess('Admin access granted');
            // Add admin functionality here
            this.enableAdminMode();
        } else {
            this.showError('Invalid admin password');
        }
    }

    enableAdminMode() {
        console.log('🔧 Admin mode enabled');
        // Add admin UI elements or functions
    }

    // ===========================================
    // 🎨 UI FEEDBACK SYSTEM
    // ===========================================
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };
        
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 transform translate-y-full transition-transform duration-300`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-full');
        }, 100);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    // ===========================================
    // 🔧 UTILITY FUNCTIONS
    // ===========================================
    
    stopAllAudio() {
        // Stop any playing audio
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Stop voice session
        if (window.humeVoice && window.humeVoice.isRecording) {
            window.humeVoice.stopVoiceSession();
        }
        
        console.log('🔇 All audio stopped');
        this.announceToScreenReader('All audio stopped');
    }

    // Placeholder functions for community, nutrition, etc.
    loadCommunityPosts() {
        console.log('📄 Loading community posts...');
        // Implementation will be added based on existing community system
    }

    initializeNutritionSection() {
        console.log('🥗 Initializing nutrition section...');
        // Implementation will be added based on existing nutrition system
    }

    initializeMediaLibrary() {
        console.log('📺 Initializing media library...');
        // Implementation will be added based on existing media system
    }

    updateDashboardStats() {
        console.log('📊 Updating dashboard statistics...');
        // Implementation will be added based on existing dashboard
    }

    initializePTSDCorner() {
        console.log('🛡️ Initializing PTSD Corner...');
        // Implementation will be added based on existing PTSD system
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new RootCausePowerApp();
    
    // Make key functions globally available for HTML onclick handlers
    window.app.showSection = window.app.showSection.bind(window.app);
    window.app.openVoiceAI = window.app.openVoiceAI.bind(window.app);
    window.app.startVoiceSession = window.app.startVoiceSession.bind(window.app);
    window.app.stopVoiceSession = window.app.stopVoiceSession.bind(window.app);
    window.app.closeVoiceSession = window.app.closeVoiceSession.bind(window.app);
    window.app.showVoiceCreditStore = window.app.showVoiceCreditStore.bind(window.app);
    window.app.purchaseVoiceCredits = window.app.purchaseVoiceCredits.bind(window.app);
    window.app.showCreditInfo = window.app.showCreditInfo.bind(window.app);
    window.app.triggerCrisisSupport = window.app.triggerCrisisSupport.bind(window.app);
    window.app.openCoachModal = window.app.openCoachModal.bind(window.app);
    window.app.sendCoachMessage = window.app.sendCoachMessage.bind(window.app);
    window.app.closeModal = window.app.closeModal.bind(window.app);
    window.app.toggleHamburgerMenu = window.app.toggleHamburgerMenu.bind(window.app);
    window.app.logoTapHandler = window.app.logoTapHandler.bind(window.app);
    window.app.stopAllAudio = window.app.stopAllAudio.bind(window.app);
});

// === AI HELPERS: follow-up questions + prescription (Groq via serverless) ===
window.app = window.app || {};

// Call the follow-up endpoint
app.aiFollowUp = async function (currentQuestion, userResponse) {
  const r = await fetch('/api/followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentQuestion: currentQuestion,
      userResponse: String(userResponse ?? '')
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || 'Follow-up API error');
  return data.followUp || 'Would you like to tell me a little more?';
};

// Call the prescription endpoint
app.aiPrescription = async function (assessmentContext) {
  const r = await fetch('/api/prescription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentContext })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || 'Prescription API error');
  return data.prescription || '';
};

// If an AIAssessment object exists, plug these helpers into it
if (window.AIAssessment) {
  // Replace follow-up generator
  AIAssessment.callAIForFollowUp = function (context) {
    // context.currentQuestion.question, context.userResponse
    return app.aiFollowUp(context.currentQuestion.question, context.userResponse);
  };

  // Replace prescription generator
  AIAssessment.generateAIPrescription = function () {
    return new Promise(async (resolve, reject) => {
      try {
        const analysisContext = this.prepareAssessmentForAI
          ? this.prepareAssessmentForAI()
          : 'No assessment context available.';
        const result = await app.aiPrescription(analysisContext);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };
}


console.log('🚀 Root Cause Power App script loaded successfully!');

// === AI hookup + Minimal fallback assessment renderer ===
// Define AI helper calls if not already present
window.app = window.app || {};

if (!app.aiFollowUp) {
  app.aiFollowUp = async function (currentQuestion, userResponse) {
    const r = await fetch('/api/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentQuestion,
        userResponse: String(userResponse ?? '')
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Follow-up API error');
    return data.followUp || 'Would you like to tell me a little more?';
  };
}

if (!app.aiPrescription) {
  app.aiPrescription = async function (assessmentContext) {
    const r = await fetch('/api/prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentContext })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || 'Prescription API error');
    return data.prescription || '';
  };
}

// Minimal fallback assessment if nothing else renders it
document.addEventListener('DOMContentLoaded', function () {
  // Your page sometimes uses #assessment-questions, sometimes #assessment-content
  const container =
    document.getElementById('assessment-questions') ||
    document.getElementById('assessment-content');

  // Only run if an assessment container exists and is still showing the loader
  if (!container) return;
  if (container.dataset.rcpFallbackLoaded) return;
  container.dataset.rcpFallbackLoaded = '1';

  renderStep1();

  function renderStep1() {
    container.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-gray-100">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">1</div>
            <div>
              <h3 class="text-xl font-semibold text-gray-800">Sleep Quality</h3>
              <p class="text-sm text-gray-600">How well are you sleeping these days?</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-5 gap-2 mb-2" id="rcp-scale">
            ${[1,2,3,4,5].map(i => `
              <button data-value="${i}" class="rcp-scale-btn w-full p-3 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all">
                <div class="text-2xl font-bold text-purple-600 mb-1">${i}</div>
                <div class="text-xs text-gray-600">${['Terrible','Poor','Fair','Good','Excellent'][i-1]}</div>
              </button>
            `).join('')}
          </div>
          <p class="text-xs text-gray-500 text-center mb-4">Click a number to rate your experience</p>

          <div id="rcp-followup" class="hidden mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg text-blue-800 text-sm"></div>

          <div class="mt-6 flex justify-between items-center">
            <button id="rcp-prev" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" disabled>← Previous</button>
            <button id="rcp-next" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50" disabled>
              Continue →
            </button>
          </div>
        </div>
      </div>
    `;

    const scaleBtns = container.querySelectorAll('.rcp-scale-btn');
    const followupDiv = container.querySelector('#rcp-followup');
    const nextBtn = container.querySelector('#rcp-next');

    let selected = null;

    scaleBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        // highlight selection
        scaleBtns.forEach(b => b.classList.remove('bg-purple-100','border-purple-500'));
        btn.classList.add('bg-purple-100','border-purple-500');
        selected = parseInt(btn.dataset.value, 10);
        nextBtn.disabled = false;

        // Ask AI a follow-up
        try {
          followupDiv.classList.remove('hidden');
          followupDiv.textContent = 'Thinking...';
          const q = 'How well are you sleeping these days?';
          const f = await app.aiFollowUp(q, `${selected}/5`);
          followupDiv.innerHTML = `<strong>AI Coach Sarah asks:</strong> ${f}`;
        } catch (e) {
          followupDiv.classList.remove('hidden');
          followupDiv.textContent = 'Follow-up unavailable right now.';
          console.warn(e);
        }
      });
    });

    nextBtn.addEventListener('click', async () => {
      // Show prescription based on the one answer (demo)
      renderPrescriptionLoading();
      try {
        const context = `ASSESSMENT RESULTS:\nSleep Quality: ${selected}/5 (${['Terrible','Poor','Fair','Good','Excellent'][selected-1]})\n`;
        const rx = await app.aiPrescription(context);
        renderPrescription(rx);
      } catch (e) {
        renderPrescription('Sorry—could not generate your prescription right now.');
        console.warn(e);
      }
    });
  }

  function renderPrescriptionLoading() {
    container.innerHTML = `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6 animate-pulse">
          <i class="fas fa-brain text-white text-3xl"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 mb-2">Creating your personalized prescription…</h3>
        <p class="text-gray-600">This usually takes a few seconds.</p>
        <div class="flex justify-center items-center space-x-2 mt-4">
          <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
          <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
  }

  function renderPrescription(text) {
    container.innerHTML = `
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-4">
          <i class="fas fa-heart text-white text-3xl"></i>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Your Personal Recovery Prescription</h2>
        <p class="text-gray-600">Created by AI Coach Sarah for you</p>
      </div>
      <div class="bg-white border-2 border-green-200 rounded-lg p-8 shadow-lg text-left whitespace-pre-wrap leading-relaxed text-gray-800">
        ${escapeHtml(text || 'No content')}
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
    }[s]));
  }
});

// === RCP Single-Paste Stabilizer (clicks, readable text, safe AI fallbacks) ===
window.app = window.app || {};

// Always return a gentle follow-up, even if the API has trouble
app.aiFollowUp = async function (currentQuestion, userResponse) {
  try {
    const r = await fetch('/api/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentQuestion,
        userResponse: String(userResponse ?? '')
      })
    });
    let data = {};
    try { data = await r.json(); } catch {}
    return data.followUp || 'Would you like to tell me a little more?';
  } catch {
    return 'Would you like to tell me a little more?';
  }
};

// Always return a helpful prescription, even if the API has trouble
app.aiPrescription = async function (assessmentContext) {
  try {
    const r = await fetch('/api/prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentContext })
    });
    let data = {};
    try { data = await r.json(); } catch {}
    return data.prescription || `Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;
  } catch {
    return `Short, kind prescription:
- 2-minute box breathing before bed
- Morning sunlight 5–10 minutes
- Keep a gentle sleep log for 3 days
- If distress rises, pause and practice grounding (5-4-3-2-1)
- Celebrate one small win each day`;
  }
};

// Make sure nothing invisible blocks clicks and the assessment is readable
document.addEventListener('DOMContentLoaded', function () {
  // Hide common overlays that can block clicks
  ['mobile-menu', 'nav-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    }
  });

  // Show desktop nav if something left it hidden
  if (window.innerWidth >= 768) {
    document.querySelectorAll('nav.hidden').forEach(n => n.classList.remove('hidden'));
  }

  // Raise the assessment and ensure readable text
  const ac = document.getElementById('assessment-questions') || document.getElementById('assessment-content');
  if (ac) {
    ac.style.position = 'relative';
    ac.style.zIndex = '1000';
    ac.style.color = '#111827'; // readable dark text
    // Optional: ensure the panel is readable on any theme
    if (!ac.style.background || ac.style.background === 'transparent') {
      ac.style.background = '#ffffff';
    }
  }

  // Follow-up bubble readable styling (in case Tailwind isn’t applied)
  const styleId = 'rcp-hotfix-inline';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #rcp-followup{
        background:#eff6ff;
        border-left:4px solid #60a5fa;
        color:#1e40af;
        padding:1rem;
        border-radius:0.5rem;
        margin-top:1rem;
      }
      .rcp-scale-btn { cursor:pointer; }
    `;
    document.head.appendChild(style);
  }
});


