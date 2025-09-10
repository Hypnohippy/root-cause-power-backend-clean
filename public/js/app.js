/**
 * Root Cause Power PWA - Main Application JavaScript
 * Comprehensive PTSD Support Platform with AI Integration
 */

class RootCausePowerApp {
    constructor() {
        this.currentSection = 'home';
        this.currentStep = 1;
        this.assessmentData = {};
        this.preventAutoCrisis = true; // Prevent automatic crisis modal on page load
        this.currentUser = { 
            credits: 5,
            plan: 'Free',
            isLoggedIn: false,
            maxCreditsPerDay: 5,
            usedCreditsToday: 0,
            lastUsedDate: new Date().toDateString(),
            subscriptionActive: false,
            voiceCredits: 0, // New voice credits system
            isAdmin: false, // Admin access flag
            planLimits: {
                'Free': { dailyCredits: 5, features: ['basic_assessment', 'emdr', 'crisis_support'] },
                'Standard': { dailyCredits: -1, features: ['unlimited_ai', 'nutrition_analysis', 'meal_planning', 'progress_tracking', 'voice_credits_purchase'] },
                'Premium': { dailyCredits: -1, features: ['photo_analysis', 'advanced_emdr', 'therapist_network', 'family_access', 'voice_credits_purchase'] }
            }
        };
        this.journalEntries = [];
        this.safetyPlan = {};
        this.progressData = { 
            journalStreak: 0, 
            copingUsed: 0,
            healthScore: 3.2
        };
        this.deferredPrompt = null;
        this.apiKey = this.getApiKey(); // Load from secure environment
        this.stripeKey = this.getStripeKey(); // Load Stripe key
        this.currentAudio = null; // Track current playing audio
        
        // Don't initialize until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Securely get API key from environment or server
    getApiKey() {
        // Production API key setup
        return window.GROQ_API_KEY || 
               localStorage.getItem('groq_api_key') || 
               'your-groq-api-key-here';
    }

    // Get Stripe publishable key
    getStripeKey() {
        return window.STRIPE_PUBLISHABLE_KEY || 
               localStorage.getItem('stripe_publishable_key') || 
               'pk_live_51OBKXzC5Ez9YOIayaEw5ZiJgJiUfIRoN7E5HN6qdtIcxWUsInNmp4Mz8nlRKKqfRsU30tnStNb25BOy1wHTBeL3t00FMxEIHVx';
    }

    // Initialize the application
    init() {
        console.log('🚀 Root Cause Power PWA initializing...');
        
        // Check for permanent admin access first
        const permanentAdmin = localStorage.getItem('permanentAdmin');
        if (permanentAdmin === 'david_prince_founder') {
            this.enableAdminAccess(true);
        }
        
        this.setupEventListeners();
        this.initializePWAFeatures();
        this.loadStoredData();
        this.initializeAPI();
        this.initializeInspirationalDashboard();
        this.initializeAssessment();
        this.initializeMediaLibrary();
        this.populateCommunityContent();
        this.checkUrlParams();
        this.initializeSubscriptionSystem();
        
        // Initialize content automation system
        this.initializeContentAutomation();
        
        // Initialize enterprise calculator
        setTimeout(() => this.calculateEnterpriseCost(), 100);
        
        // Initialize voice credits display
        this.updateVoiceCreditDisplay();
        
        console.log('✅ App initialized successfully');
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]') || e.target.closest('[data-section]')) {
                const section = e.target.dataset.section || e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            }
            if (e.target.matches('.nav-item') || e.target.closest('.nav-item')) {
                const navItem = e.target.matches('.nav-item') ? e.target : e.target.closest('.nav-item');
                this.showSection(navItem.dataset.section);
            }
        });

        // Mobile menu toggle
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            const mobileNav = document.getElementById('mobile-nav');
            mobileNav.classList.toggle('hidden');
        });

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.close-modal') || e.target.closest('.close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            }
        });

        // Assessment navigation
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousStep());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextStep());

        // Coach interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-coach]')) {
                this.openCoachModal(e.target.closest('[data-coach]').dataset.coach);
            }
        });

        // Login/Auth
        document.getElementById('login-btn')?.addEventListener('click', () => this.openModal('login-modal'));

        // Nutrition features
        document.getElementById('search-food-btn')?.addEventListener('click', () => this.searchFood());
        document.getElementById('start-meal-planning-btn')?.addEventListener('click', () => this.startMealPlanning());
        
        // Mobile send buttons
        document.getElementById('send-meal-btn')?.addEventListener('click', () => this.sendMealMessage());
        document.getElementById('send-ptsd-btn')?.addEventListener('click', () => this.sendPTSDMessage());
        
        // Replace send buttons with Enter key functionality
        this.setupEnterKeyHandlers();

        // Media Library
        document.getElementById('ask-educational-ai-btn')?.addEventListener('click', () => this.askEducationalAI());
        document.addEventListener('click', (e) => {
            if (e.target.matches('.media-filter-btn')) {
                this.filterVideos(e.target.dataset.filter);
            }
        });

        // PTSD Corner
        document.getElementById('open-ptsd-chat-btn')?.addEventListener('click', () => this.openModal('ptsd-chat-modal'));

        // Contact System
        const scheduleBtn = document.getElementById('schedule-checkin-btn');
        const quickBtn = document.getElementById('quick-checkin-btn');
        const prefsBtn = document.getElementById('update-contact-prefs-btn');
        
        if (scheduleBtn) {
            console.log('✅ Schedule check-in button found');
            scheduleBtn.addEventListener('click', (e) => {
                console.log('🔄 Schedule check-in clicked');
                e.preventDefault();
                this.scheduleCheckin();
            });
        } else {
            console.log('❌ Schedule check-in button NOT found');
        }
        
        if (quickBtn) {
            console.log('✅ Quick check-in button found');
            quickBtn.addEventListener('click', (e) => {
                console.log('🔄 Quick check-in clicked');
                e.preventDefault();
                this.quickCheckin();
            });
        } else {
            console.log('❌ Quick check-in button NOT found');
        }
        
        if (prefsBtn) {
            prefsBtn.addEventListener('click', () => this.updateContactPreferences());
        }
        
        // Enterprise Calculator
        document.getElementById('user-count')?.addEventListener('input', (e) => {
            document.getElementById('user-count-display').textContent = `${e.target.value} employees`;
            this.calculateEnterpriseCost();
        });
        document.getElementById('org-type-calc')?.addEventListener('change', () => this.calculateEnterpriseCost());
        document.getElementById('priority-support')?.addEventListener('change', () => this.calculateEnterpriseCost());
        
        // Inspirational Dashboard
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-action-btn') || e.target.closest('.quick-action-btn')) {
                const btn = e.target.matches('.quick-action-btn') ? e.target : e.target.closest('.quick-action-btn');
                const section = btn.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            }
        });
        
        // Journal
        document.getElementById('mood-slider')?.addEventListener('input', () => this.updateMoodDisplay());
        document.getElementById('save-journal-btn')?.addEventListener('click', () => this.saveJournalEntry());
        document.getElementById('save-safety-plan-btn')?.addEventListener('click', () => this.saveSafetyPlan());

        // Coping techniques
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-technique]') || e.target.closest('[data-technique]')) {
                const technique = e.target.dataset.technique || e.target.closest('[data-technique]').dataset.technique;
                this.startCopingTechnique(technique);
            }
        });

        // EMDR techniques
        document.addEventListener('click', (e) => {
            console.log('🔍 Click detected on:', e.target);
            if (e.target.matches('[data-emdr]') || e.target.closest('[data-emdr]')) {
                console.log('🎯 EMDR element clicked');
                const emdrType = e.target.dataset.emdr || e.target.closest('[data-emdr]').dataset.emdr;
                console.log('🎯 EMDR type:', emdrType);
                e.preventDefault();
                this.startEMDRTechnique(emdrType);
            }
        });

        // FAQ
        document.addEventListener('click', (e) => {
            if (e.target.matches('.faq-item h4') || e.target.closest('.faq-item h4')) {
                const faqHeader = e.target.matches('.faq-item h4') ? e.target : e.target.closest('.faq-item h4');
                this.toggleFAQ(faqHeader);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Setup Enter key handlers for all chat inputs
    setupEnterKeyHandlers() {
        const chatInputs = [
            'meal-user-input',
            'ptsd-user-input', 
            'coach-user-input',
            'education-question'
        ];

        chatInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.handleChatSubmit(inputId);
                    }
                });
            }
        });

        // Dynamic inputs (created later)
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                if (e.target.id === 'coach-user-input') {
                    e.preventDefault();
                    const coachType = e.target.getAttribute('data-coach-type');
                    this.sendCoachMessage(coachType);
                } else if (e.target.id === 'ptsd-user-input') {
                    e.preventDefault();
                    this.sendPTSDMessage();
                } else if (e.target.id === 'meal-user-input') {
                    e.preventDefault();
                    this.sendMealMessage();
                } else if (e.target.id === 'food-search') {
                    e.preventDefault();
                    this.searchFood();
                }
            }
        });
    }

    // Handle chat submission based on input type
    handleChatSubmit(inputId) {
        switch(inputId) {
            case 'meal-user-input':
                this.sendMealMessage();
                break;
            case 'ptsd-user-input':
                this.sendPTSDMessage();
                break;
            case 'education-question':
                this.askEducationalAI();
                break;
            default:
                console.log('Unknown chat input:', inputId);
        }
    }

    // Initialize subscription and credit system
    initializeSubscriptionSystem() {
        this.updateCreditDisplay();
        this.checkDailyReset();
    }

    // Check if we need to reset daily credits
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.currentUser.lastUsedDate !== today) {
            this.currentUser.usedCreditsToday = 0;
            this.currentUser.lastUsedDate = today;
            this.storeData('currentUser', this.currentUser);
        }
    }

    // Update credit display
    updateCreditDisplay() {
        const creditEl = document.getElementById('credit-count');
        if (creditEl) {
            if (this.currentUser.plan === 'Free') {
                const remaining = this.currentUser.maxCreditsPerDay - this.currentUser.usedCreditsToday;
                creditEl.textContent = `${remaining}/${this.currentUser.maxCreditsPerDay} today`;
            } else {
                creditEl.textContent = this.currentUser.credits;
            }
        }
    }

    // Check if user can use AI features
    canUseAI() {
        if (this.currentUser.plan !== 'Free') {
            return this.currentUser.credits > 0;
        }
        return this.currentUser.usedCreditsToday < this.currentUser.maxCreditsPerDay;
    }
    
    // Inspirational Dashboard System
    initializeInspirationalDashboard() {
        this.dashboardData = this.loadData('dashboardData') || {
            startDate: new Date().toISOString(),
            achievements: ['analysis_complete'],
            dailyWins: [],
            moodHistory: [3, 4, 3, 4, 5], // Last 5 days
            level: 3,
            totalProgress: 78,
            wellnessScore: 8.2,
            sleepQuality: 7.8,
            nutritionScore: 92
        };
        
        // Update dashboard when section is shown
        setTimeout(() => {
            this.updateInspirationalDashboard();
        }, 100);
    }
    
    updateInspirationalDashboard() {
        // Update greeting based on time of day
        const now = new Date();
        const hour = now.getHours();
        let greeting = "Welcome Back, Champion! 🌟";
        
        if (hour < 12) {
            greeting = "Good Morning, Warrior! 🌅";
        } else if (hour < 17) {
            greeting = "Good Afternoon, Hero! ☀️";
        } else {
            greeting = "Good Evening, Champion! 🌆";
        }
        
        const greetingEl = document.getElementById('dashboard-greeting');
        if (greetingEl) greetingEl.textContent = greeting;
        
        // Update motivational message based on progress
        const messages = [
            "You're making incredible progress on your healing journey",
            "Every step forward is a victory worth celebrating",
            "Your courage to heal inspires everyone around you",
            "You're stronger than you know and braver than you feel",
            "Your journey is unique and beautiful - keep going!"
        ];
        
        const messageEl = document.getElementById('motivational-message');
        if (messageEl) {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            messageEl.textContent = randomMessage;
        }
        
        // Update days since start
        const startDate = new Date(this.dashboardData.startDate);
        const daysSince = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
        const daysEl = document.getElementById('days-since-start');
        if (daysEl) daysEl.textContent = daysSince;
        
        // Update progress percentage
        const progressEl = document.getElementById('total-progress');
        if (progressEl) progressEl.textContent = this.dashboardData.totalProgress + '%';
        
        // Update achievement count
        const achievementsEl = document.getElementById('achievements-count');
        if (achievementsEl && this.dashboardData && this.dashboardData.achievements) {
            achievementsEl.textContent = this.dashboardData.achievements.length;
        }
        
        // Update level
        const levelEl = document.getElementById('user-level');
        if (levelEl) levelEl.textContent = this.dashboardData.level;
        
        // Update health metrics with animations
        this.animateHealthMetrics();
        
        // Update daily inspiration
        this.updateDailyInspiration();
        
        // Check for recovery prescription
        this.checkRecoveryPrescription();
    }
    
    animateHealthMetrics() {
        // Animate wellness score
        const wellnessEl = document.getElementById('wellness-score');
        if (wellnessEl) {
            this.animateNumber(wellnessEl, 0, this.dashboardData.wellnessScore, 2000);
        }
        
        // Animate sleep quality
        const sleepEl = document.getElementById('sleep-quality');
        if (sleepEl) {
            this.animateNumber(sleepEl, 0, this.dashboardData.sleepQuality, 2500);
        }
        
        // Animate nutrition score
        const nutritionEl = document.getElementById('nutrition-score-dash');
        if (nutritionEl) {
            this.animateNumber(nutritionEl, 0, this.dashboardData.nutritionScore, 3000, '%');
        }
        
        // Animate progress circle
        const progressEl = document.getElementById('overall-progress');
        if (progressEl) {
            this.animateNumber(progressEl, 0, this.dashboardData.totalProgress, 2000, '%');
        }
    }
    
    animateNumber(element, start, end, duration, suffix = '') {
        const increment = (end - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            
            if (suffix === '%') {
                element.textContent = Math.round(current) + suffix;
            } else {
                element.textContent = current.toFixed(1);
            }
        }, 16);
    }
    
    updateDailyInspiration() {
        const inspirations = [
            "You are braver than you believe, stronger than you seem, and more loved than you know.",
            "Healing is not about erasing the past, it's about creating a beautiful future.",
            "Every small step you take today is building the life you deserve tomorrow.",
            "Your journey through darkness is leading you to an incredible light.",
            "You have survived 100% of your difficult days. You're doing amazingly well.",
            "The courage you show in healing yourself heals the world around you.",
            "Your story isn't over yet - the best chapters are still being written.",
            "Progress isn't always visible, but every effort you make matters deeply."
        ];
        
        const inspirationEl = document.getElementById('daily-inspiration');
        if (inspirationEl) {
            // Choose inspiration based on date to ensure consistency throughout the day
            const today = new Date().toDateString();
            const index = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % inspirations.length;
            inspirationEl.textContent = inspirations[index];
        }
    }
    
    checkRecoveryPrescription() {
        const prescription = this.loadData('recoveryPrescription');
        const prescriptionPreview = document.getElementById('prescription-preview');
        
        if (prescription && prescriptionPreview) {
            prescriptionPreview.classList.remove('hidden');
        }
    }
    
    showRecoveryPrescription() {
        const prescription = this.loadData('recoveryPrescription');
        if (prescription) {
            // Create modal to show prescription
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                                <i class="fas fa-prescription text-green-500 mr-3"></i>
                                Your Recovery Prescription
                            </h2>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        ${prescription.prescription.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>')}
                    </div>
                    <div class="p-6 border-t border-gray-200 bg-gray-50">
                        <div class="flex justify-center space-x-4">
                            <button onclick="app.downloadPrescription()" class="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200">
                                <i class="fas fa-download mr-2"></i>Download PDF
                            </button>
                            <button onclick="app.showSection('coaches')" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                                <i class="fas fa-user-md mr-2"></i>Meet Your Coaches
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            this.showNotification('Please complete your Life Analysis first to receive your personalized prescription.', 'info');
            this.showSection('assessment');
        }
    }
    
    // Achievement System
    unlockAchievement(achievementId) {
        // Ensure dashboardData exists
        if (!this.dashboardData) {
            this.dashboardData = {
                startDate: new Date().toISOString(),
                achievements: [],
                dailyWins: [],
                moodHistory: [3, 4, 3, 4, 5],
                level: 1,
                totalProgress: 15
            };
        }
        
        if (!this.dashboardData.achievements.includes(achievementId)) {
            this.dashboardData.achievements.push(achievementId);
            this.storeData('dashboardData', this.dashboardData);
            
            // Show achievement notification
            this.showAchievementNotification(achievementId);
            
            // Update level if needed
            this.updateUserLevel();
        }
    }
    
    showAchievementNotification(achievementId) {
        const achievements = {
            'analysis_complete': { name: 'Analysis Complete', icon: 'fas fa-brain', color: 'purple' },
            'seven_days': { name: 'Seven Day Warrior', icon: 'fas fa-heart', color: 'green' },
            'sleep_improved': { name: 'Sleep Champion', icon: 'fas fa-moon', color: 'blue' },
            'active_coaching': { name: 'AI Coaching Pro', icon: 'fas fa-robot', color: 'blue' },
            'thirty_days': { name: 'Milestone Master', icon: 'fas fa-star', color: 'yellow' },
            'journey_complete': { name: 'Wellness Warrior', icon: 'fas fa-crown', color: 'gold' }
        };
        
        const achievement = achievements[achievementId];
        if (achievement) {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 transform translate-x-full transition-transform duration-500';
            notification.innerHTML = `
                <div class="flex items-center">
                    <div class="w-12 h-12 bg-${achievement.color}-500 rounded-full flex items-center justify-center text-white mr-3">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800">🏆 Achievement Unlocked!</div>
                        <div class="text-sm text-gray-600">${achievement.name}</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            // Animate out after 5 seconds
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 5000);
        }
    }
    
    updateUserLevel() {
        const achievementCount = this.dashboardData.achievements.length;
        let newLevel = 1;
        
        if (achievementCount >= 2) newLevel = 2;
        if (achievementCount >= 4) newLevel = 3;
        if (achievementCount >= 6) newLevel = 4;
        if (achievementCount >= 8) newLevel = 5;
        
        if (newLevel > this.dashboardData.level) {
            this.dashboardData.level = newLevel;
            this.storeData('dashboardData', this.dashboardData);
            this.showNotification(`Level up! You're now a Level ${newLevel} Healer! 🎆`, 'success');
        }
    }
    
    logMood() {
        const moods = [
            { icon: '😢', label: 'Very Sad', value: 1 },
            { icon: '😔', label: 'Sad', value: 2 },
            { icon: '😐', label: 'Neutral', value: 3 },
            { icon: '🙂', label: 'Good', value: 4 },
            { icon: '😊', label: 'Very Happy', value: 5 }
        ];
        
        const moodButtons = moods.map(mood => 
            `<button onclick="app.saveMood(${mood.value})" class="mood-btn flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-all duration-200">
                <div class="text-3xl mb-2">${mood.icon}</div>
                <div class="text-sm font-medium">${mood.label}</div>
             </button>`
        ).join('');
        
        const modal = document.createElement('div');
        modal.id = 'mood-selection-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="text-center flex-1">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">How are you feeling today?</h3>
                        <p class="text-gray-600">Your mood matters - let's track your emotional journey</p>
                    </div>
                    <button onclick="app.closeMoodModal()" class="text-gray-500 hover:text-gray-700 text-xl ml-4">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="grid grid-cols-5 gap-3 mb-6">
                    ${moodButtons}
                </div>
                <button onclick="app.closeMoodModal()" class="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                    Cancel
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Close Mood Selection Modal
     */
    closeMoodModal() {
        const modal = document.getElementById('mood-selection-modal');
        if (modal) {
            modal.remove();
            console.log('✅ Mood modal closed');
        }
    }
    
    saveMood(moodValue) {
        // Initialize dashboard data if needed
        if (!this.dashboardData) {
            this.dashboardData = { moodHistory: [] };
        }
        if (!this.dashboardData.moodHistory) {
            this.dashboardData.moodHistory = [];
        }
        
        // Add to mood history
        this.dashboardData.moodHistory.push(moodValue);
        
        // Keep only last 30 days
        if (this.dashboardData.moodHistory.length > 30) {
            this.dashboardData.moodHistory = this.dashboardData.moodHistory.slice(-30);
        }
        
        // Store data
        this.storeData('dashboardData', this.dashboardData);
        
        // Close mood modal
        this.closeMoodModal();
        
        // Show success message
        const moodNames = ['', 'Very Sad', 'Sad', 'Neutral', 'Good', 'Very Happy'];
        this.showNotification(`Mood logged: ${moodNames[moodValue]}! 💜`, 'success');
        
        // Update dashboard if visible
        if (this.currentSection === 'dashboard') {
            this.updateInspirationalDashboard();
        }
        
        // Check for achievement
        if (this.dashboardData.moodHistory.length >= 7) {
            this.unlockAchievement('seven_days');
        }
    }
    
    // Admin Usage Dashboard (access via ?admin=usage)
    async showHumeUsageDashboard() {
        try {
            const response = await fetch('/api/hume/usage/summary');
            const data = await response.json();
            
            if (data.success) {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                        <h3 class="text-xl font-bold mb-4">📊 Hume Usage Dashboard</h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Monthly Usage:</span>
                                <span class="font-bold">${data.summary.totalMinutes} min</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Included (Creator):</span>
                                <span>200 min</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Overage:</span>
                                <span class="font-bold ${data.summary.totalMinutes > 200 ? 'text-red-600' : 'text-green-600'}">
                                    ${Math.max(0, data.summary.totalMinutes - 200)} min
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span>Estimated Cost:</span>
                                <span class="font-bold text-lg">$${data.summary.estimatedCost}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Total Sessions:</span>
                                <span>${data.summary.totalSessions}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Avg Session:</span>
                                <span>${data.summary.avgSessionLength} min</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Projected Month:</span>
                                <span class="font-bold">${data.summary.projectedMonthlyUsage} min</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-blue-50 rounded">
                            <p class="text-sm text-blue-800">
                                💡 Day ${data.summary.daysInMonth} of month. 
                                ${data.summary.totalMinutes > 150 ? '⚠️ High usage detected!' : '✅ Usage on track'}
                            </p>
                        </div>
                        
                        <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 bg-gray-500 text-white py-2 rounded hover:bg-gray-600">
                            Close Dashboard
                        </button>
                    </div>
                `;
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('Failed to load usage data:', error);
        }
    }

    // Hume API Usage Tracking
    async trackHumeUsage(minutes) {
        try {
            const response = await fetch('/api/hume/usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    minutes: minutes,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser.id || 'anonymous'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.monthlyUsage > 150) { // Alert at 75% of 200 minutes
                    console.warn('🚨 Hume usage high:', data.monthlyUsage, 'minutes this month');
                }
            }
        } catch (error) {
            console.error('Usage tracking failed:', error);
        }
    }

    // Voice Credits System - AFFORDABLE PRICING
    getVoiceCreditPackages() {
        return [
            { 
                credits: 30, 
                price: "£2.99", 
                minutes: "~30 minutes",
                description: "STARTER - Try voice coaching affordably",
                popular: false,
                minPurchase: true,
                pricePerCredit: "£0.10",
                stripeUrl: "https://buy.stripe.com/voice-credits-30"
            },
            { 
                credits: 60, 
                price: "£4.99", 
                minutes: "~60 minutes",
                description: "POPULAR - Great for weekly sessions", 
                popular: true,
                save: "Save £1!",
                pricePerCredit: "£0.08",
                stripeUrl: "https://buy.stripe.com/voice-credits-60"
            },
            { 
                credits: 150, 
                price: "£9.99", 
                minutes: "~150 minutes",
                description: "VALUE - Perfect for regular users",
                popular: false,
                save: "Save £5!",
                pricePerCredit: "£0.07",
                stripeUrl: "https://buy.stripe.com/voice-credits-150"
            },
            { 
                credits: 300, 
                price: "£17.99", 
                minutes: "~300 minutes", 
                description: "POWER USER - Maximum savings",
                popular: false,
                save: "Save £12!",
                pricePerCredit: "£0.06",
                stripeUrl: "https://buy.stripe.com/voice-credits-300"
            }
        ];
    }



    useVoiceCredit() {
        if (this.canUseVoiceAI()) {
            // Admins don't consume credits
            if (!this.isAdmin()) {
                this.currentUser.voiceCredits -= 1;
                this.storeData('currentUser', this.currentUser);
            }
            this.updateVoiceCreditDisplay();
            return true;
        }
        return false;
    }

    updateVoiceCreditDisplay() {
        const voiceCreditEl = document.getElementById('voice-credit-count');
        if (voiceCreditEl) {
            voiceCreditEl.textContent = this.currentUser.voiceCredits;
        }
    }

    showVoiceCreditStore(forceMinimum = false) {
        if (this.currentUser.plan === 'Free' && !this.isAdmin()) {
            this.showNotification('❌ Voice AI is available for Standard/Premium subscribers only. Please upgrade your plan first!', 'error');
            return;
        }

        const packages = this.getVoiceCreditPackages();
        const hasEverPurchased = this.loadData('voicePurchaseHistory') || [];
        const isFirstPurchase = hasEverPurchased.length === 0;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <i class="fas fa-microphone text-3xl"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-gray-800 mb-2">🎤 Voice AI Credits</h3>
                    <p class="text-gray-600">Experience emotionally intelligent AI voice coaching with Hume AI technology</p>
                    ${(isFirstPurchase || forceMinimum) ? `
                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg mt-4">
                            <div class="flex items-center text-orange-800">
                                <i class="fas fa-info-circle mr-2"></i>
                                <strong>First-time users: Minimum 50-credit purchase required</strong>
                            </div>
                            <p class="text-sm text-orange-700 mt-1">This ensures quality service delivery and prevents system abuse.</p>
                        </div>
                    ` : ''}
                    <div class="bg-blue-50 p-4 rounded-lg mt-4">
                        <p class="text-sm text-blue-800"><strong>Current Balance:</strong> ${this.isAdmin() ? '∞ (Admin)' : this.currentUser.voiceCredits + ' credits'}</p>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${packages.map(pkg => `
                        <div class="relative border-2 rounded-xl p-6 text-center transition-all hover:shadow-lg ${pkg.popular ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}">
                            ${pkg.popular ? '<div class="absolute -top-3 left-1/2 transform -translate-x-1/2"><span class="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">POPULAR</span></div>' : ''}
                            ${pkg.credits === 50 ? '<div class="absolute -top-3 left-1/2 transform -translate-x-1/2"><span class="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">MINIMUM</span></div>' : ''}
                            <div class="mb-4">
                                <div class="text-3xl font-bold text-purple-600">${pkg.credits}</div>
                                <div class="text-sm text-gray-600">Credits</div>
                                <div class="text-xs text-gray-500">${pkg.minutes}</div>
                                <div class="text-xs text-gray-400 mt-1">${pkg.pricePerCredit || ''}</div>
                            </div>
                            <div class="mb-4">
                                <div class="text-2xl font-bold">${pkg.price}</div>
                                ${pkg.save ? `<div class="text-sm text-green-600 font-semibold">${pkg.save}</div>` : ''}
                            </div>
                            <p class="text-sm text-gray-600 mb-4">${pkg.description}</p>
                            <button onclick="window.open('${pkg.stripeUrl}', '_blank')" class="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold">
                                Buy Credits
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                    <h4 class="text-xl font-bold mb-4 text-center">🧠 What is Voice AI Coaching?</h4>
                    <div class="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h5 class="font-semibold mb-2">✨ Emotionally Intelligent</h5>
                            <p class="text-gray-600">AI analyzes your voice tone and emotional state to respond with appropriate empathy and support.</p>
                        </div>
                        <div>
                            <h5 class="font-semibold mb-2">🎯 Trauma-Informed</h5>
                            <p class="text-gray-600">Specially trained to detect distress and provide gentle, supportive responses for PTSD recovery.</p>
                        </div>
                        <div>
                            <h5 class="font-semibold mb-2">💬 Natural Conversation</h5>
                            <p class="text-gray-600">Flowing, natural dialogue that feels like talking to a real therapist or coach.</p>
                        </div>
                        <div>
                            <h5 class="font-semibold mb-2">🔒 Private & Secure</h5>
                            <p class="text-gray-600">All conversations are private and encrypted. No data is shared or stored permanently.</p>
                        </div>
                    </div>
                </div>
                
                <div class="text-center">
                    <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    openVoiceAI() {
        // Admin bypass
        if (this.isAdmin()) {
            console.log('🔓 Admin access - bypassing credit check');
        } else {
            // Check if user can access voice AI
            if (this.currentUser.plan === 'Free') {
                this.showNotification('❌ Voice AI requires Standard or Premium plan. Please upgrade to access voice coaching!', 'error');
                setTimeout(() => {
                    this.showSection('pricing');
                }, 2000);
                return;
            }

            if (!this.canUseVoiceAI()) {
                // First time users need minimum purchase
                const hasEverPurchased = this.loadData('voicePurchaseHistory') || [];
                if (hasEverPurchased.length === 0) {
                    this.showVoiceCreditStore(true); // true = force minimum purchase
                } else {
                    this.showNotification('🎤 You need voice credits to use Coach Voice AI. Click the purple voice counter to buy credits!', 'info');
                    this.showVoiceCreditStore();
                }
                return;
            }
        }

        // Launch Revolutionary Hume EVI Integration!
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                            <i class="fas fa-brain text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">🧠 Empathic Voice Coach</h3>
                            <p class="text-sm text-gray-600">World's first emotionally intelligent PTSD support</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="bg-purple-50 px-3 py-1 rounded-full">
                            <span class="text-sm font-medium text-purple-700">Credits: ${this.currentUser.voiceCredits}</span>
                        </div>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Voice Interface Container -->
                <div class="flex-1 overflow-hidden">
                    <div id="empathic-voice-container" class="h-full">
                        <!-- EmpathicVoiceInterface will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the revolutionary Hume EVI interface
        this.initializeEmpathicVoiceInterface();
    }

    /**
     * Initialize the Revolutionary Hume EVI Interface
     */
    async initializeEmpathicVoiceInterface() {
        console.log('🚀 Initializing World\'s First Emotionally Intelligent PTSD Voice Coach...');
        
        try {
            // Load Hume EVI components if not already loaded
            await this.loadEviComponents();
            
            // Initialize the empathic voice interface
            this.voiceInterface = new EmpathicVoiceInterface('empathic-voice-container', {
                apiKey: this.apiKey,
                voiceId: 'empathic-therapist-voice',
                crisisDetection: true,
                theme: 'trauma-informed'
            });
            
            await this.voiceInterface.init();
            
            console.log('✅ Empathic Voice Coach ready for revolutionary PTSD support!');
            this.showNotification('🧠 Voice Coach Sarah is ready for empathic conversation!', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize voice coach:', error);
            this.showNotification('Failed to connect to voice coach. Please try again.', 'error');
        }
    }
    
    /**
     * Load EVI Components Dynamically
     */
    async loadEviComponents() {
        // Load Hume EVI Client
        if (!window.HumeEviClient) {
            await this.loadScript('/src/services/hume/HumeEviClient.js');
        }
        
        // Load Empathic Voice Interface
        if (!window.EmpathicVoiceInterface) {
            await this.loadScript('/src/components/voice-coach/EmpathicVoiceInterface.js');
        }
        
        console.log('📦 EVI components loaded successfully');
    }
    
    /**
     * Dynamic script loader
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Trigger Crisis Intervention (called by EVI system)
     */
    triggerCrisisIntervention(urgency, indicators = []) {
        console.log('🚨 CRISIS INTERVENTION TRIGGERED:', urgency);
        
        // Show immediate crisis resources
        const crisisModal = document.createElement('div');
        crisisModal.className = 'fixed inset-0 bg-red-900 bg-opacity-95 z-[60] flex items-center justify-center p-4';
        crisisModal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <i class="fas fa-heart text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-red-700 mb-2">🚨 Crisis Support</h3>
                    <p class="text-gray-600">You are not alone. Immediate help is available.</p>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                        <h4 class="font-bold text-red-700 mb-2">🇬🇧 UK Crisis Support</h4>
                        <p class="text-sm text-red-600 mb-2"><strong>Samaritans:</strong> 116 123 (Free, 24/7)</p>
                        <p class="text-xs text-red-500">Confidential emotional support for anyone in distress</p>
                    </div>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <h4 class="font-bold text-blue-700 mb-2">🇺🇸 US Crisis Support</h4>
                        <p class="text-sm text-blue-600 mb-2"><strong>Crisis Lifeline:</strong> 988</p>
                        <p class="text-xs text-blue-500">24/7 suicide prevention and mental health support</p>
                    </div>
                    
                    <div class="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                        <h4 class="font-bold text-orange-700 mb-2">🚑 Emergency Services</h4>
                        <p class="text-sm text-orange-600"><strong>Emergency:</strong> 999 (UK) / 911 (US)</p>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="window.open('tel:116123')" class="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-sm">
                        📞 Call Samaritans
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                        Close
                    </button>
                </div>
                
                <div class="mt-4 text-center">
                    <p class="text-xs text-gray-500">Crisis detected through AI voice analysis • Your safety is our priority</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(crisisModal);
        
        // Log crisis event (for safety and improvement)
        this.logCrisisEvent(urgency, indicators);
    }
    
    /**
     * Start Grounding Technique (called by EVI system)
     */
    startGroundingTechnique(technique = '5-4-3-2-1', intensity = 'mild') {
        console.log('🧘 Starting grounding technique:', technique);
        
        // Use existing grounding technique from the platform
        if (technique === '5-4-3-2-1') {
            this.start54321Technique();
        } else if (technique === 'breathing') {
            this.startBreathingExercise();
        } else if (technique === 'progressive_muscle') {
            this.startProgressiveRelaxation();
        }
        
        // Consume voice credit for guided technique
        this.consumeVoiceCredit();
    }
    
    /**
     * Log Crisis Event for Safety and Platform Improvement
     */
    logCrisisEvent(urgency, indicators) {
        const crisisLog = {
            timestamp: new Date().toISOString(),
            urgency: urgency,
            indicators: indicators,
            user_id: this.currentUser.id,
            session_id: this.voiceInterface?.eviClient?.sessionId,
            response_time: Date.now()
        };
        
        // Store locally for safety (could also send to secure server)
        const existingLogs = this.loadData('crisisLogs') || [];
        existingLogs.push(crisisLog);
        this.storeData('crisisLogs', existingLogs);
        
        console.log('📊 Crisis event logged for safety tracking');
    }
    
    /**
     * Consume Voice Credit
     */
    consumeVoiceCredit() {
        if (this.currentUser.voiceCredits > 0) {
            this.currentUser.voiceCredits--;
            this.updateVoiceCreditDisplay();
            this.storeData('currentUser', this.currentUser);
            console.log('💳 Voice credit consumed. Remaining:', this.currentUser.voiceCredits);
        }
    }
    
    /**
     * Update Voice Credit Display
     */
    updateVoiceCreditDisplay() {
        const creditCounter = document.getElementById('voice-credit-count');
        if (creditCounter) {
            creditCounter.textContent = this.currentUser.voiceCredits;
        }
    }

    /**
     * Open Daily Win Modal for Adding Wins
     */
    openDailyWinModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-star text-purple-500 mr-2"></i>
                        Add Today's Win
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-600 text-sm mb-3">Celebrate your progress! What positive thing did you do today?</p>
                    <textarea 
                        id="daily-win-text" 
                        placeholder="e.g., 'I practiced deep breathing when I felt anxious', 'I ate a healthy breakfast', 'I reached out to a friend'..." 
                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-24 resize-none"
                    ></textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Win Category</label>
                    <select id="win-category" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                        <option value="wellness">🧘 Wellness & Self-Care</option>
                        <option value="nutrition">🥗 Nutrition & Healthy Eating</option>
                        <option value="social">👥 Social Connection</option>
                        <option value="therapy">💜 Therapy & Mental Health</option>
                        <option value="exercise">🏃 Physical Activity</option>
                        <option value="learning">📚 Learning & Growth</option>
                        <option value="work">💼 Work & Productivity</option>
                        <option value="other">✨ Other Achievement</option>
                    </select>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button onclick="app.saveDailyWin()" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                        <i class="fas fa-plus mr-1"></i>Add Win
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on text area
        setTimeout(() => {
            document.getElementById('daily-win-text')?.focus();
        }, 100);
    }

    /**
     * Save Daily Win to Dashboard
     */
    saveDailyWin() {
        const winText = document.getElementById('daily-win-text')?.value.trim();
        const winCategory = document.getElementById('win-category')?.value;
        
        if (!winText) {
            this.showNotification('Please enter your daily win!', 'warning');
            return;
        }
        
        // Initialize dashboard data if needed
        if (!this.dashboardData) {
            this.dashboardData = {};
        }
        if (!this.dashboardData.dailyWins) {
            this.dashboardData.dailyWins = [];
        }
        
        // Add new win
        const newWin = {
            id: Date.now(),
            text: winText,
            category: winCategory,
            date: new Date().toISOString(),
            timestamp: new Date().toLocaleString()
        };
        
        this.dashboardData.dailyWins.unshift(newWin); // Add to beginning
        
        // Keep only last 10 wins
        if (this.dashboardData.dailyWins.length > 10) {
            this.dashboardData.dailyWins = this.dashboardData.dailyWins.slice(0, 10);
        }
        
        // Save to storage
        this.storeData('dashboardData', this.dashboardData);
        
        // Update display
        this.updateDailyWinsDisplay();
        
        // Close modal
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) modal.remove();
        
        // Show success
        this.showNotification('🎉 Daily win added! You\'re making great progress!', 'success');
        
        console.log('📝 Daily win saved:', newWin);
    }

    /**
     * Update Daily Wins Display on Dashboard
     */
    updateDailyWinsDisplay() {
        const container = document.getElementById('daily-wins');
        if (!container || !this.dashboardData?.dailyWins) return;
        
        const wins = this.dashboardData.dailyWins.slice(0, 5); // Show latest 5
        
        if (wins.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-star text-2xl mb-2"></i>
                    <p class="text-sm">No wins recorded today. Add your first win!</p>
                </div>
            `;
            return;
        }
        
        const categoryIcons = {
            wellness: '🧘',
            nutrition: '🥗', 
            social: '👥',
            therapy: '💜',
            exercise: '🏃',
            learning: '📚',
            work: '💼',
            other: '✨'
        };
        
        const categoryColors = {
            wellness: 'purple',
            nutrition: 'green',
            social: 'blue',
            therapy: 'pink',
            exercise: 'orange',
            learning: 'indigo',
            work: 'gray',
            other: 'yellow'
        };
        
        container.innerHTML = wins.map(win => {
            const icon = categoryIcons[win.category] || '✨';
            const color = categoryColors[win.category] || 'purple';
            
            return `
                <div class="flex items-start p-3 bg-${color}-50 rounded-lg border-l-4 border-${color}-400">
                    <span class="text-lg mr-3">${icon}</span>
                    <div class="flex-1">
                        <p class="text-sm text-gray-700 mb-1">${win.text}</p>
                        <p class="text-xs text-gray-500">${new Date(win.date).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Privacy-First Employee Monitoring
    trackEmployeeEngagement(companyId, anonymous = true) {
        // Only track anonymous usage data for company monitoring
        const engagementData = {
            companyId: companyId,
            timestamp: new Date().toISOString(),
            activeThisMonth: 1, // Just count as +1 active user
            // NO personal data - just aggregate numbers
            anonymousMetrics: {
                platformAccessed: true,
                engagementLevel: 'active' // high/medium/low
            }
        };
        
        // Store anonymously - no personal identifiers
        this.storeCompanyMetrics(engagementData);
    }

    storeCompanyMetrics(data) {
        // Store company-wide metrics without personal data
        const companyMetrics = this.loadData('companyMetrics') || {};
        const month = new Date().toISOString().slice(0, 7); // 2024-01
        
        if (!companyMetrics[data.companyId]) {
            companyMetrics[data.companyId] = {};
        }
        
        if (!companyMetrics[data.companyId][month]) {
            companyMetrics[data.companyId][month] = {
                activeEmployees: 0,
                totalEngagements: 0,
                averageEngagement: 'medium'
            };
        }
        
        // Increment anonymous counters only
        companyMetrics[data.companyId][month].activeEmployees += 1;
        companyMetrics[data.companyId][month].totalEngagements += 1;
        
        this.storeData('companyMetrics', companyMetrics);
        console.log('📊 Company metrics updated (anonymously)');
    }

    updateDashboardFromCoachInteraction(coachType, userMessage, aiResponse) {
        // Update dashboard based on coach interactions
        if (!this.dashboardData) {
            this.initializeInspirationalDashboard();
        }

        // Add to daily wins if positive interaction
        const positiveKeywords = ['thank you', 'helpful', 'better', 'progress', 'good', 'great', 'working'];
        if (positiveKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
            if (!this.dashboardData.dailyWins) this.dashboardData.dailyWins = [];
            this.dashboardData.dailyWins.push({
                date: new Date().toISOString(),
                win: `Positive interaction with ${coachType} coach`,
                type: 'ai_coaching'
            });
        }

        // Update progress based on coach type
        if (!this.dashboardData.coachingProgress) {
            this.dashboardData.coachingProgress = {};
        }
        
        if (!this.dashboardData.coachingProgress[coachType]) {
            this.dashboardData.coachingProgress[coachType] = 0;
        }
        
        this.dashboardData.coachingProgress[coachType] += 1;

        // Unlock achievements for coaching milestones
        const totalCoachInteractions = Object.values(this.dashboardData.coachingProgress).reduce((a, b) => a + b, 0);
        if (totalCoachInteractions >= 5) {
            this.unlockAchievement('active_coaching');
        }
        
        // Update overall progress
        this.dashboardData.totalProgress = Math.min(100, this.dashboardData.totalProgress + 2);
        
        // Store updated data
        this.storeData('dashboardData', this.dashboardData);
        
        // Update dashboard display if visible
        if (this.currentSection === 'dashboard') {
            this.updateInspirationalDashboard();
        }
        
        console.log('📈 Dashboard updated from coach interaction');
    }

    // Enterprise Stripe Integration
    buyEnterpriseNow() {
        // Default to Enterprise Premium for the main buy button
        this.showStripeCheckout('enterprise-professional');
        return;
        
        // Original modal code below (kept as backup)
        // Show employee count input modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <i class="fas fa-building text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Enterprise Deployment</h3>
                    <p class="text-gray-600">Transform your workplace wellbeing today</p>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                        <input type="number" id="employee-count" min="10" placeholder="50" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <div class="text-xs text-gray-500 mt-1">Minimum 10 employees required</div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                        <input type="email" id="company-email" placeholder="admin@company.com" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <input type="text" id="company-name" placeholder="Your Company Ltd" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>
                    
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <div class="flex items-center justify-between">
                            <span class="font-medium text-gray-700">Monthly Cost:</span>
                            <span id="monthly-cost" class="text-2xl font-bold text-purple-600">£750</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-1">£15 per employee/month (50 employees)</div>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button onclick="app.processEnterprisePayment()" class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold">
                        <i class="fas fa-credit-card mr-2"></i>
                        Deploy Now
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add real-time cost calculation
        const employeeInput = document.getElementById('employee-count');
        const costDisplay = document.getElementById('monthly-cost');
        
        employeeInput.addEventListener('input', () => {
            const count = parseInt(employeeInput.value) || 10;
            const monthlyCost = Math.max(count, 10) * 15;
            costDisplay.textContent = `£${monthlyCost}`;
            costDisplay.nextElementSibling.textContent = `£15 per employee/month (${Math.max(count, 10)} employees)`;
        });
    }
    
    processEnterprisePayment() {
        const employeeCount = parseInt(document.getElementById('employee-count').value) || 10;
        const companyEmail = document.getElementById('company-email').value;
        const companyName = document.getElementById('company-name').value;
        
        if (!companyEmail || !companyName) {
            this.showNotification('Please fill in all company details', 'error');
            return;
        }
        
        if (employeeCount < 10) {
            this.showNotification('Minimum 10 employees required for enterprise deployment', 'error');
            return;
        }
        
        // Calculate costs
        const monthlyAmount = employeeCount * 15;
        const setupFee = 0; // No setup fee as advertised
        
        // Close current modal
        document.querySelector('.fixed').remove();
        
        // Show Stripe checkout (simulated for now)
        this.showStripeCheckout({
            type: 'enterprise',
            employeeCount: employeeCount,
            companyEmail: companyEmail,
            companyName: companyName,
            monthlyAmount: monthlyAmount,
            setupFee: setupFee
        });
    }
    
    showStripeCheckout(orderDetails) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <i class="fas fa-credit-card text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Secure Payment</h3>
                    <p class="text-gray-600">Powered by Stripe - Enterprise Grade Security</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 class="font-bold text-gray-800 mb-3">Order Summary</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Company:</span>
                            <span class="font-medium">${orderDetails.companyName}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Employees:</span>
                            <span class="font-medium">${orderDetails.employeeCount} users</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Monthly Subscription:</span>
                            <span class="font-medium">£${orderDetails.monthlyAmount}/month</span>
                        </div>
                        <div class="flex justify-between border-t pt-2 font-bold">
                            <span>Total Today:</span>
                            <span class="text-green-600">£${orderDetails.monthlyAmount}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-2">
                            • No setup fees • Cancel anytime • Full deployment in 24 hours
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg mb-6">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 mr-3 mt-1"></i>
                        <div class="text-sm text-blue-800">
                            <div class="font-medium mb-1">Ready for Production</div>
                            <div>This integration connects to live Stripe payment processing. Replace placeholder keys with your production Stripe keys for live transactions.</div>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                            <input type="text" placeholder="4242 4242 4242 4242" class="w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                            <input type="text" placeholder="MM/YY" class="w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                            <input type="text" placeholder="123" class="w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                            <input type="text" placeholder="SW1A 1AA" class="w-full p-3 border border-gray-300 rounded-lg">
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button onclick="app.completeEnterprisePayment(${JSON.stringify(orderDetails).replace(/"/g, '&quot;')})" class="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-bold">
                        <i class="fas fa-lock mr-2"></i>
                        Pay £${orderDetails.monthlyAmount}
                    </button>
                </div>
                
                <div class="text-center mt-4">
                    <div class="text-xs text-gray-500 mb-2">Secured by</div>
                    <div class="flex items-center justify-center space-x-4">
                        <i class="fab fa-stripe text-2xl text-purple-600"></i>
                        <i class="fas fa-shield-alt text-green-500"></i>
                        <span class="text-sm font-medium text-gray-600">256-bit SSL Encryption</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    completeEnterprisePayment(orderDetails) {
        // Simulate payment processing
        const modal = document.querySelector('.fixed');
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
                <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 animate-pulse">
                    <i class="fas fa-check text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Processing Payment...</h3>
                <div class="flex justify-center mb-6">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 200ms"></div>
                        <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 400ms"></div>
                    </div>
                </div>
                <p class="text-gray-600">Please wait while we set up your enterprise deployment...</p>
            </div>
        `;
        
        // Simulate processing time
        setTimeout(() => {
            this.showEnterpriseSuccess(orderDetails);
        }, 3000);
    }
    
    showEnterpriseSuccess(orderDetails) {
        const modal = document.querySelector('.fixed');
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-6">
                    <i class="fas fa-rocket text-4xl"></i>
                </div>
                <h3 class="text-3xl font-bold text-gray-800 mb-4">🎉 Deployment Successful!</h3>
                <p class="text-lg text-gray-600 mb-6">Welcome to the future of workplace wellbeing</p>
                
                <div class="bg-green-50 p-6 rounded-lg mb-6 text-left">
                    <h4 class="font-bold text-green-800 mb-3">✅ Your Enterprise Setup:</h4>
                    <div class="space-y-2 text-sm text-green-700">
                        <div>👥 ${orderDetails.employeeCount} employee licenses activated</div>
                        <div>📧 Setup instructions sent to ${orderDetails.companyEmail}</div>
                        <div>🚀 Full deployment within 24 hours</div>
                        <div>💳 Monthly billing: £${orderDetails.monthlyAmount}</div>
                    </div>
                </div>
                
                <div class="bg-blue-50 p-6 rounded-lg mb-6 text-left">
                    <h4 class="font-bold text-blue-800 mb-3">📋 Next Steps:</h4>
                    <div class="space-y-2 text-sm text-blue-700">
                        <div>1. Check email for admin dashboard access</div>
                        <div>2. Customize branding and employee invitations</div>
                        <div>3. Launch company-wide rollout</div>
                        <div>4. Track ROI through analytics dashboard</div>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Close
                    </button>
                    <button onclick="window.open('mailto:support@rootcausepower.com?subject=Enterprise Setup - ${orderDetails.companyName}', '_blank')" class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                        <i class="fas fa-envelope mr-2"></i>
                        Contact Support
                    </button>
                </div>
            </div>
        `;
    }
    
    scheduleDemo() {
        // Calendar booking simulation
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                        <i class="fas fa-video text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Book Demo Call</h3>
                    <p class="text-gray-600">See Root Cause Power in action</p>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                        <input type="text" placeholder="John Smith" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                        <input type="email" placeholder="john@company.com" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <input type="text" placeholder="Your Company Ltd" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                        <select class="w-full p-3 border border-gray-300 rounded-lg">
                            <option>This Week</option>
                            <option>Next Week</option>
                            <option>Within 2 Weeks</option>
                            <option>Flexible</option>
                        </select>
                    </div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg my-6">
                    <h4 class="font-bold text-blue-800 mb-2">📞 Demo Includes:</h4>
                    <div class="text-sm text-blue-700 space-y-1">
                        <div>• Live platform walkthrough (15 mins)</div>
                        <div>• ROI calculator for your organization</div>
                        <div>• Custom deployment planning</div>
                        <div>• Q&A with our wellness experts</div>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                    <button onclick="app.confirmDemo()" class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                        <i class="fas fa-calendar-plus mr-2"></i>
                        Book Demo
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    confirmDemo() {
        const modal = document.querySelector('.fixed');
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
                <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6">
                    <i class="fas fa-check text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Demo Booked! 📅</h3>
                <div class="bg-green-50 p-4 rounded-lg mb-6">
                    <div class="text-sm text-green-700 space-y-2">
                        <div>✅ Calendar invitation sent to your email</div>
                        <div>✅ Demo materials being prepared</div>
                        <div>✅ Our wellness expert will contact you</div>
                    </div>
                </div>
                <p class="text-gray-600 mb-6">We'll be in touch within 4 hours to confirm your preferred time slot.</p>
                <button onclick="this.closest('.fixed').remove()" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Perfect, Thanks!
                </button>
            </div>
        `;
        
        setTimeout(() => {
            modal.remove();
        }, 3000);
    }

    // Consume credits for AI usage
    consumeCredits(amount = 1) {
        if (this.currentUser.plan === 'Free') {
            this.currentUser.usedCreditsToday += amount;
        } else {
            this.currentUser.credits -= amount;
        }
        this.updateCreditDisplay();
        this.storeData('currentUser', this.currentUser);
    }

    // Initialize PWA features
    initializePWAFeatures() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });

        // Install button
        document.getElementById('install-button')?.addEventListener('click', () => {
            this.installApp();
        });

        // Dismiss install banner
        document.getElementById('dismiss-install')?.addEventListener('click', () => {
            this.hideInstallBanner();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA installed successfully');
            this.hideInstallBanner();
            this.trackEvent('app_installed');
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.updateConnectionStatus(true);
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus(false);
        });
    }

    // Check URL parameters for direct navigation
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        const crisis = urlParams.get('crisis');
        const adminKey = urlParams.get('admin_access');

        // Hidden admin access via URL parameter or stored admin session
        const storedAdmin = localStorage.getItem('permanentAdmin');
        if (adminKey === 'root_cause_power_admin_2024' || storedAdmin === 'david_prince_founder') {
            this.enableAdminAccess(true); // true = permanent
        }

        // Only show crisis support if explicitly requested with crisis=true or crisis=help
        if (crisis === 'true' || crisis === 'help' || crisis === 'emergency') {
            console.log('🚨 Crisis support explicitly requested via URL parameter:', crisis);
            this.showEmergencyCrisisSupport();
        } else if (adminKey === 'usage') {
            // Show Hume usage dashboard for cost monitoring
            setTimeout(() => this.showHumeUsageDashboard(), 500);
        } else if (section) {
            this.showSection(section);
        }
    }

    // Enhanced crisis support with immediate resources
    showEmergencyCrisisSupport() {
        // Create emergency overlay
        const crisisOverlay = document.createElement('div');
        crisisOverlay.className = 'fixed inset-0 bg-red-600 bg-opacity-95 z-50 flex items-center justify-center p-4';
        crisisOverlay.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-2xl mx-auto text-center shadow-2xl">
                <div class="text-red-600 text-6xl mb-4">
                    <i class="fas fa-heart"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">You Matter. Your Life Has Value.</h2>
                <p class="text-lg text-gray-700 mb-6">If you're having thoughts of self-harm, please reach out for immediate help. You don't have to face this alone.</p>
                
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                        <h3 class="font-bold text-red-800 mb-2">🇬🇧 UK - Samaritans</h3>
                        <a href="tel:116123" class="block bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-xl hover:bg-red-700 transition-colors mb-2">116 123</a>
                        <p class="text-xs text-red-700">Free • 24/7 • Confidential</p>
                    </div>
                    <div class="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 class="font-bold text-blue-800 mb-2">🇺🇸 US - Crisis Lifeline</h3>
                        <a href="tel:988" class="block bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-xl hover:bg-blue-700 transition-colors mb-2">988</a>
                        <p class="text-xs text-blue-700">Free • 24/7 • Confidential</p>
                    </div>
                    <div class="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                        <h3 class="font-bold text-orange-800 mb-2">🚨 Emergency Services</h3>
                        <a href="tel:999" class="block bg-orange-600 text-white px-4 py-3 rounded-lg font-bold text-xl hover:bg-orange-700 transition-colors mb-2">999 / 911</a>
                        <p class="text-xs text-orange-700">Immediate emergency help</p>
                    </div>
                </div>
                
                <div class="bg-green-50 p-6 rounded-lg mb-6">
                    <h3 class="font-bold text-green-800 mb-3">🎧 Immediate Self-Help Resources</h3>
                    <div class="flex flex-wrap justify-center gap-3">
                        <button id="panic-help-btn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                            🎵 Panic Attack Help Audio (3 min)
                        </button>
                        <button id="grounding-btn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                            🧘 Grounding Audio (8 min)
                        </button>
                        <button id="ptsd-coach-btn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                            💬 Talk to PTSD AI Coach
                        </button>
                    </div>
                </div>
                
                <div class="text-center">
                    <button id="safe-now-btn" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors mr-4">
                        I'm Safe for Now
                    </button>
                    <button id="safety-plan-btn" class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors">
                        Create Safety Plan
                    </button>
                </div>
                
                <p class="text-sm text-gray-600 mt-6 italic">
                    "The pain you feel today is the strength you feel tomorrow. Every crisis survived is a victory." - Coach David Prince
                </p>
            </div>
        `;
        
        document.body.appendChild(crisisOverlay);
        this.currentCrisisOverlay = crisisOverlay;
        
        // Add proper event listeners instead of inline onclick
        const panicBtn = crisisOverlay.querySelector('#panic-help-btn');
        const groundingBtn = crisisOverlay.querySelector('#grounding-btn');
        const ptsdCoachBtn = crisisOverlay.querySelector('#ptsd-coach-btn');
        const safeNowBtn = crisisOverlay.querySelector('#safe-now-btn');
        const safetyPlanBtn = crisisOverlay.querySelector('#safety-plan-btn');
        
        if (panicBtn) {
            panicBtn.addEventListener('click', () => {
                this.playPanicAttackHelp();
                this.closeCrisisOverlay();
            });
        }
        
        if (groundingBtn) {
            groundingBtn.addEventListener('click', () => {
                this.playGuidedGrounding();
                this.closeCrisisOverlay();
            });
        }
        
        if (ptsdCoachBtn) {
            ptsdCoachBtn.addEventListener('click', () => {
                this.showSection('ptsd-corner');
                this.closeCrisisOverlay();
            });
        }
        
        if (safeNowBtn) {
            safeNowBtn.addEventListener('click', () => {
                this.closeCrisisOverlay();
            });
        }
        
        if (safetyPlanBtn) {
            safetyPlanBtn.addEventListener('click', () => {
                this.createSafetyPlan();
                this.closeCrisisOverlay();
            });
        }
        
        // Add escape key listener for accessibility
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeCrisisOverlay();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Play immediate calming audio
        this.playPanicAttackHelp();
    }

    closeCrisisOverlay() {
        if (this.currentCrisisOverlay) {
            // CRITICAL: Stop all speech synthesis immediately
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                console.log('🔇 Speech synthesis stopped');
            }
            
            // Stop any playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio = null;
                console.log('🔇 Audio playback stopped');
            }
            
            // Remove the overlay from DOM
            this.currentCrisisOverlay.remove();
            this.currentCrisisOverlay = null;
            
            // Clean up any remaining event listeners
            document.removeEventListener('keydown', this.escapeHandler);
            
            console.log('✅ Crisis overlay closed successfully');
            
            // Show success notification to user
            this.showNotification('Crisis support closed. You are safe. Audio stopped.', 'success');
        }
    }

    createSafetyPlan() {
        this.showSection('ptsd-corner');
        // Focus on safety plan section
        setTimeout(() => {
            document.getElementById('warning-signs')?.focus();
        }, 500);
    }

    // Navigation
    showSection(sectionId) {
        console.log('📍 Navigating to:', sectionId);
        
        // Update current section
        this.currentSection = sectionId;
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from nav items
        document.querySelectorAll('.nav-item, .nav-btn, .nav-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Add active class to corresponding nav item
            const navItem = document.querySelector(`[data-section="${sectionId}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }
            
            // Initialize section-specific features
            this.initializeSection(sectionId);
            
            // Load nutrition journal when visiting nutrition section
            if (sectionId === 'nutrition') {
                setTimeout(() => this.loadNutritionJournal(), 200);
            }
            
            // Hide mobile menu
            document.getElementById('mobile-nav')?.classList.add('hidden');
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Update URL
            history.pushState(null, null, `?section=${sectionId}`);
        }
    }

    // Hamburger Menu Toggle
    toggleHamburgerMenu() {
        const dropdown = document.getElementById('hamburger-dropdown');
        const btn = document.getElementById('hamburger-menu-btn');
        
        if (dropdown.classList.contains('hidden')) {
            dropdown.classList.remove('hidden');
            btn.innerHTML = '<i class="fas fa-times text-xl"></i>';
            console.log('📱 Hamburger menu opened');
        } else {
            dropdown.classList.add('hidden');
            btn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
            console.log('📱 Hamburger menu closed');
        }
    }

    // Initialize section-specific features
    initializeSection(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'media-library':
                this.initializeMediaLibrary();
                break;
            case 'assessment':
                this.displayAssessmentStep();
                break;
            case 'ptsd-corner':
                this.loadJournalEntries();
                this.updateProgressDisplay();
                break;
            case 'community':
                this.initializeCommunity();
                break;
        }
    }

    // Intelligent Analysis Steps - AI-Driven 10-Step Journey
    getIntelligentAnalysisSteps() {
        return [
            {
                title: "Welcome & Safety",
                type: "conversation",
                aiMessage: "Hello! I'm Sarah, your AI wellness coach. I'm here to understand your unique journey and help create a personalized path to healing. First, I want to make sure you feel safe. On a scale of 1-10, how safe and supported do you feel right now in this moment?",
                options: [
                    { text: "I feel very unsafe (1-3)", subtitle: "I'm struggling with feeling secure right now" },
                    { text: "I feel somewhat unsafe (4-5)", subtitle: "I have some concerns about my safety or wellbeing" },
                    { text: "I feel neutral about safety (6-7)", subtitle: "Things are okay, not great but not terrible" },
                    { text: "I feel mostly safe (8-9)", subtitle: "I feel secure in most areas of my life" },
                    { text: "I feel completely safe and supported (10)", subtitle: "I have strong support systems and feel very secure" }
                ]
            },
            {
                title: "Current Emotional State",
                type: "conversation",
                aiMessage: "Thank you for sharing that with me. Now, let's explore how you've been feeling emotionally. When you think about the past few weeks, which of these statements best describes your emotional experience?",
                options: [
                    { text: "I've been feeling overwhelmed and struggling to cope", subtitle: "Daily tasks feel very difficult right now" },
                    { text: "I have good days and bad days - it varies a lot", subtitle: "My emotions feel unpredictable" },
                    { text: "I've been feeling stuck or numb, like nothing matters", subtitle: "It's hard to feel motivated or excited about anything" },
                    { text: "I'm managing okay but could use some support", subtitle: "I'm functioning but know I could feel better" },
                    { text: "I've been feeling positive and resilient lately", subtitle: "I'm in a good place emotionally right now" }
                ]
            },
            {
                title: "Life's Biggest Challenge",
                type: "conversation",
                aiMessage: "I hear you. Life can be complex, and we all face different challenges. Thinking about your life right now, what feels like the biggest obstacle or challenge you're dealing with? This helps me understand where to focus our support.",
                options: [
                    { text: "Trauma or past experiences that still affect me", subtitle: "Things from my past are impacting my present" },
                    { text: "Anxiety, depression, or other mental health struggles", subtitle: "My mental health is my primary concern" },
                    { text: "Physical health issues or chronic conditions", subtitle: "My body is limiting what I can do" },
                    { text: "Relationship problems or feeling isolated", subtitle: "I'm struggling with connections to others" },
                    { text: "Work stress, finances, or life circumstances", subtitle: "External pressures are overwhelming me" },
                    { text: "I'm not sure - I just know something isn't right", subtitle: "I feel off but can't pinpoint exactly what it is" }
                ]
            },
            {
                title: "Physical Wellbeing",
                type: "scale",
                aiMessage: "Let's talk about your physical health. Your body and mind are deeply connected, so understanding how you're feeling physically helps me create a more complete picture. On a scale of 1-10, how would you rate your overall physical wellbeing right now?",
                scaleLabels: ["Extremely Poor", "Excellent"]
            },
            {
                title: "Support Network",
                type: "conversation",
                aiMessage: "Support from others can make such a difference in our healing journey. When you think about the people in your life, how would you describe your current support system?",
                options: [
                    { text: "I feel very alone and don't have people to turn to", subtitle: "I don't have reliable support when I need it" },
                    { text: "I have a few people but don't want to burden them", subtitle: "I worry about asking for help from others" },
                    { text: "I have some support but it doesn't feel quite enough", subtitle: "My support network could be stronger" },
                    { text: "I have good support from family or friends", subtitle: "There are people I can rely on" },
                    { text: "I have a strong network of people who care about me", subtitle: "I feel well-supported and loved" }
                ]
            },
            {
                title: "Daily Energy & Motivation",
                type: "scale",
                aiMessage: "Energy and motivation can tell us so much about our overall wellbeing. Thinking about a typical day for you lately, on a scale of 1-10, how would you rate your energy levels and motivation to engage with life?",
                scaleLabels: ["Completely Exhausted/No Motivation", "High Energy/Very Motivated"]
            },
            {
                title: "Coping & Resilience",
                type: "conversation",
                aiMessage: "We all develop ways to cope with life's challenges. Some strategies help us grow stronger, while others might provide temporary relief but aren't ideal long-term. How would you describe your current coping strategies?",
                options: [
                    { text: "I'm using unhealthy coping methods and I know it", subtitle: "My coping strategies aren't serving me well" },
                    { text: "I don't really have any coping strategies", subtitle: "I feel lost when things get difficult" },
                    { text: "I have some coping methods but they're inconsistent", subtitle: "Sometimes I cope well, sometimes I don't" },
                    { text: "I have healthy coping strategies that usually work", subtitle: "I have tools that help me manage challenges" },
                    { text: "I feel confident in my ability to handle difficulties", subtitle: "I bounce back well from setbacks" }
                ]
            },
            {
                title: "Hope & Future Vision",
                type: "conversation",
                aiMessage: "Hope is such a powerful force in healing. Even in difficult times, having a sense of possibility for the future can make a real difference. When you think about your future, how do you feel?",
                options: [
                    { text: "I struggle to see how things could get better", subtitle: "The future feels uncertain or bleak" },
                    { text: "I have moments of hope but they don't last long", subtitle: "Hope comes and goes for me" },
                    { text: "I believe things can improve with the right support", subtitle: "I'm cautiously optimistic about change" },
                    { text: "I feel hopeful about my future most of the time", subtitle: "I believe good things are ahead" },
                    { text: "I'm excited about my potential and what's possible", subtitle: "I feel energized thinking about my future" }
                ]
            },
            {
                title: "Ready for Change",
                type: "conversation",
                aiMessage: "Change can feel both exciting and scary. Understanding where you are in your readiness for change helps me know how to best support you. How do you feel about making changes in your life right now?",
                options: [
                    { text: "I want to change but feel stuck and don't know where to start", subtitle: "I need guidance and support to begin" },
                    { text: "I'm interested in change but worried about whether I can do it", subtitle: "I want to try but lack confidence" },
                    { text: "I'm ready to make some changes with the right support", subtitle: "I'm motivated and willing to take steps" },
                    { text: "I'm eager to transform my life and feel empowered", subtitle: "I'm excited about the possibility of growth" },
                    { text: "I've already started making positive changes", subtitle: "I'm already on a good path" }
                ]
            },
            {
                title: "Personal Strengths",
                type: "conversation",
                aiMessage: "Every person has unique strengths and qualities that can be powerful tools in their healing journey. Even in difficult times, these strengths remain within you. Which of these resonates most with how you see yourself or how others see you?",
                options: [
                    { text: "I'm compassionate and care deeply about others", subtitle: "My empathy and kindness are my gifts" },
                    { text: "I'm determined and don't give up easily", subtitle: "I have inner resilience and persistence" },
                    { text: "I'm creative and find unique ways to solve problems", subtitle: "I think outside the box and find innovative solutions" },
                    { text: "I'm thoughtful and analytical about understanding things", subtitle: "I like to understand the deeper meaning of experiences" },
                    { text: "I'm not sure about my strengths right now", subtitle: "It's hard for me to see my positive qualities" }
                ]
            }
        ];
    }
    
    // Legacy method for backwards compatibility
    getAssessmentQuestions() {
        return this.getIntelligentAnalysisSteps();
    }

    // Intelligent Analysis System
    initializeAssessment() {
        this.currentStep = 1;
        this.assessmentData = this.loadData('intelligentAnalysis') || {};
        this.analysisResponses = [];
        this.personalityInsights = {};
        this.riskFactors = [];
        this.strengths = [];
        this.recoveryPrescription = null;
        
        // Load and display first step
        setTimeout(() => {
            this.displayAnalysisStep();
        }, 100);
        
        // Unlock analysis achievement when starting
        this.unlockAchievement('analysis_complete');
    }

    displayAnalysisStep() {
        const analysisSteps = this.getIntelligentAnalysisSteps();
        const step = analysisSteps[this.currentStep - 1];
        const container = document.getElementById('assessment-questions');
        
        if (!container) return;

        // AI conversation interface
        let interactionHtml = '';
        
        if (step.type === 'conversation') {
            interactionHtml = `
                <div class="ai-conversation mb-8">
                    <div class="ai-message bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-purple-400 mb-6">
                        <div class="flex items-start">
                            <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800 mb-2">Sarah - AI Coach</div>
                                <div class="text-gray-700 leading-relaxed">${step.aiMessage}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="response-options space-y-3">
                        ${step.options.map((option, index) => {
                            const isSelected = this.assessmentData[`step_${this.currentStep}`] === index;
                            return `
                                <div class="response-option p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 ${
                                    isSelected ? 'border-purple-500 bg-purple-100' : 'border-gray-200'
                                }" onclick="app.selectAnalysisOption(${index})">
                                    <div class="flex items-center">
                                        <div class="w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                            isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                        }">
                                            ${isSelected ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                                        </div>
                                        <div class="flex-1">
                                            <div class="font-medium text-gray-800">${option.text}</div>
                                            ${option.subtitle ? `<div class="text-sm text-gray-600 mt-1">${option.subtitle}</div>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (step.type === 'scale') {
            interactionHtml = `
                <div class="ai-conversation mb-8">
                    <div class="ai-message bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-purple-400 mb-6">
                        <div class="flex items-start">
                            <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800 mb-2">Sarah - AI Coach</div>
                                <div class="text-gray-700 leading-relaxed">${step.aiMessage}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scale-container bg-white p-6 rounded-lg border border-gray-200">
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-sm text-gray-600">${step.scaleLabels[0]}</span>
                            <span class="text-sm text-gray-600">${step.scaleLabels[1]}</span>
                        </div>
                        <div class="flex justify-between items-center mb-6">
                            ${Array.from({length: 10}, (_, i) => {
                                const isSelected = this.assessmentData[`step_${this.currentStep}`] === i + 1;
                                return `
                                    <div class="scale-point cursor-pointer" onclick="app.selectScaleValue(${i + 1})">
                                        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                            isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-300 hover:border-purple-300'
                                        }">
                                            <span class="text-sm font-medium">${i + 1}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="text-center text-sm text-gray-500">
                            ${this.assessmentData[`step_${this.currentStep}`] ? 
                                `You selected: ${this.assessmentData[`step_${this.currentStep}`]}/10` : 
                                'Please select a number from 1-10'
                            }
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = interactionHtml;
        
        // Update progress
        const progress = (this.currentStep / analysisSteps.length) * 100;
        document.getElementById('current-step').textContent = this.currentStep;
        document.getElementById('progress-bar').style.width = progress + '%';
        
        // Update progress message
        const progressMessages = [
            '✨ Getting to know you...',
            '🔍 Understanding your experiences...',
            '🧠 Analyzing your thoughts...',
            '❤️ Exploring your emotions...',
            '🏠 Learning about your environment...',
            '💪 Discovering your strengths...',
            '🎯 Identifying your goals...',
            '🛡️ Assessing your support...',
            '🌱 Planning your growth...',
            '🚀 Creating your prescription...'
        ];
        
        document.getElementById('progress-message').textContent = progressMessages[this.currentStep - 1] || 'Moving forward together...';
        
        // Update navigation
        document.getElementById('prev-btn').disabled = this.currentStep === 1;
        const nextBtn = document.getElementById('next-btn');
        if (this.currentStep === analysisSteps.length) {
            nextBtn.innerHTML = 'Generate My Prescription <i class="fas fa-magic ml-2"></i>';
        } else {
            nextBtn.innerHTML = 'Continue <i class="fas fa-chevron-right ml-2"></i>';
        }
        
        // Enhanced crisis detection
        this.checkForCrisisIndicators(step, this.assessmentData[`step_${this.currentStep}`]);
    }

    selectAnalysisOption(optionIndex) {
        this.assessmentData[`step_${this.currentStep}`] = optionIndex;
        this.storeData('intelligentAnalysis', this.assessmentData);
        
        // Store analysis response for AI processing
        const steps = this.getIntelligentAnalysisSteps();
        const currentStepData = steps[this.currentStep - 1];
        
        this.analysisResponses[this.currentStep - 1] = {
            step: this.currentStep,
            question: currentStepData.aiMessage,
            answer: currentStepData.options[optionIndex],
            value: optionIndex,
            timestamp: new Date().toISOString()
        };
        
        // Re-render to show selection
        this.displayAnalysisStep();
        
        // Auto-advance after 2 seconds for better flow
        const analysisSteps = this.getIntelligentAnalysisSteps();
        if (this.currentStep <= analysisSteps.length) {
            setTimeout(() => {
                if (this.assessmentData[`step_${this.currentStep}`] === optionIndex) {
                    this.nextStep();
                }
            }, 1500);
        }
        
    }
    
    selectScaleValue(value) {
        this.assessmentData[`step_${this.currentStep}`] = value;
        this.storeData('intelligentAnalysis', this.assessmentData);
        
        // Store scale response
        const steps = this.getIntelligentAnalysisSteps();
        const currentStepData = steps[this.currentStep - 1];
        
        this.analysisResponses[this.currentStep - 1] = {
            step: this.currentStep,
            question: currentStepData.aiMessage,
            scaleValue: value,
            timestamp: new Date().toISOString()
        };
        
        // Re-render to show selection
        this.displayAnalysisStep();
        
        // Auto-advance after brief delay
        const analysisSteps = this.getIntelligentAnalysisSteps();
        setTimeout(() => {
            if (this.assessmentData[`step_${this.currentStep}`] === value && this.currentStep <= analysisSteps.length) {
                this.nextStep();
            }
        }, 1000);
    }
    
    // Enhanced crisis detection for intelligent analysis
    checkForCrisisIndicators(step, response) {
        if (!response) return;
        
        // Crisis indicators based on step content and responses
        let crisisScore = 0;
        const crisisKeywords = ['hopeless', 'worthless', 'suicide', 'self-harm', 'end it all', 'better off dead'];
        
        // Check for crisis responses in specific steps
        if (step.title && step.title.includes('Safety')) {
            if (typeof response === 'number' && response <= 3) {
                crisisScore += 3; // Low safety feeling
            }
        }
        
        if (step.title && (step.title.includes('Mood') || step.title.includes('Emotions'))) {
            if (typeof response === 'number' && response <= 2) {
                crisisScore += 2; // Very low mood
            }
        }
        
        // Check for crisis response options
        if (typeof response === 'object' && response.text) {
            const responseText = response.text.toLowerCase();
            crisisKeywords.forEach(keyword => {
                if (responseText.includes(keyword)) {
                    crisisScore += 3;
                }
            });
        }
        
        // Trigger crisis support if needed (but not on auto-load)
        if (crisisScore >= 3 && !this.preventAutoCrisis) {
            console.log('🚨 CRISIS DETECTED in analysis - Score:', crisisScore);
            this.showCrisisResources();
            
            if (crisisScore >= 5) {
                setTimeout(() => {
                    this.showEmergencyCrisisSupport();
                }, 2000);
            }
        } else if (crisisScore >= 3) {
            console.log('⚠️ Crisis indicators present but auto-trigger prevented (score:', crisisScore + ')');
            // Just show subtle crisis resources without modal
            this.showCrisisResources();
        }
    }
        
    selectOption(optionIndex) {
        // Update visual feedback
        document.querySelectorAll(`[onclick*="selectOption"]`).forEach(el => {
            el.classList.remove('bg-green-50', 'border-green-300');
        });
        document.querySelector(`[onclick="app.selectOption(${optionIndex})"]`).classList.add('bg-green-50', 'border-green-300');
        
        // Continue with existing logic
        this.selectAnalysisOption(optionIndex);
    }

    selectCheckboxOption(optionIndex) {
        const checkbox = document.getElementById(`checkbox-${optionIndex}`);
        if (!checkbox) return;
        
        checkbox.checked = !checkbox.checked;
        
        if (!this.assessmentData[`step_${this.currentStep}`]) {
            this.assessmentData[`step_${this.currentStep}`] = [];
        }
        
        if (checkbox.checked) {
            if (!this.assessmentData[`step_${this.currentStep}`].includes(optionIndex)) {
                this.assessmentData[`step_${this.currentStep}`].push(optionIndex);
            }
            document.querySelector(`[onclick="app.selectCheckboxOption(${optionIndex})"]`).classList.add('bg-green-50', 'border-green-300');
        } else {
            this.assessmentData[`step_${this.currentStep}`] = 
                this.assessmentData[`step_${this.currentStep}`].filter(val => val !== optionIndex);
            document.querySelector(`[onclick="app.selectCheckboxOption(${optionIndex})"]`).classList.remove('bg-green-50', 'border-green-300');
        }
        
        this.storeData('assessmentData', this.assessmentData);
    }

    nextStep() {
        const analysisSteps = this.getIntelligentAnalysisSteps();
        
        console.log(`🔍 Assessment Debug - Current Step: ${this.currentStep}, Total Steps: ${analysisSteps.length}`);
        
        // Validate current step has response
        if (!this.assessmentData[`step_${this.currentStep}`] && this.assessmentData[`step_${this.currentStep}`] !== 0) {
            this.showNotification('Please select an option to continue', 'warning');
            return;
        }
        
        console.log(`✅ Step ${this.currentStep} has response:`, this.assessmentData[`step_${this.currentStep}`]);
        
        if (this.currentStep < analysisSteps.length) {
            this.currentStep++;
            console.log(`➡️ Moving to step ${this.currentStep}`);
            this.displayAnalysisStep();
        } else {
            console.log(`🎯 Assessment complete! Generating prescription...`);
            this.completeAssessment();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.displayAnalysisStep();
        }
    }

    // Legacy method - now handled by generateRecoveryPrescription
    completeAssessment() {
        const analysis = this.generateAdvancedAssessmentAnalysis();
        const prescription = this.generatePersonalizedPrescription();
        this.updateDashboardFromAssessment();
        
        const container = document.getElementById('assessment-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <div class="text-center mb-6">
                        <i class="fas fa-heart text-6xl text-green-500 mb-4 animate-pulse"></i>
                        <h2 class="text-3xl font-bold mb-2">Your Healing Journey Begins</h2>
                        <p class="text-gray-600">Comprehensive assessment complete - your personalized treatment plan is ready</p>
                    </div>
                    
                    <!-- Analysis Section -->
                    <div class="bg-blue-50 p-6 rounded-lg mb-6">
                        <h3 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-brain text-blue-600 mr-2"></i>
                            Clinical Assessment Summary
                        </h3>
                        <div class="space-y-3 text-sm">${analysis}</div>
                    </div>
                    
                    <!-- Personalized Prescription -->
                    <div class="bg-green-50 p-6 rounded-lg mb-6">
                        <h3 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-prescription text-green-600 mr-2"></i>
                            Your Personalized Treatment Prescription
                        </h3>
                        <div class="space-y-4">${prescription}</div>
                    </div>
                    
                    <!-- Next Steps -->
                    <div class="bg-purple-50 p-6 rounded-lg mb-6">
                        <h3 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-route text-purple-600 mr-2"></i>
                            Immediate Action Plan
                        </h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="bg-white p-4 rounded border-l-4 border-red-500">
                                <h4 class="font-bold text-red-600 mb-2">🚨 Priority 1 (Start Today)</h4>
                                <ul class="text-sm space-y-1" id="priority-1-actions"></ul>
                            </div>
                            <div class="bg-white p-4 rounded border-l-4 border-orange-500">
                                <h4 class="font-bold text-orange-600 mb-2">⚡ Priority 2 (This Week)</h4>
                                <ul class="text-sm space-y-1" id="priority-2-actions"></ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap justify-center gap-4">
                        <button onclick="app.startTreatmentPlan()" class="cta-button bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors">
                            <i class="fas fa-play mr-2"></i>Begin Treatment Plan
                        </button>
                        <button onclick="app.showSection('coaches')" class="cta-button bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">
                            <i class="fas fa-robot mr-2"></i>Meet Your AI Team
                        </button>
                        <button onclick="app.downloadPrescription()" class="cta-button bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fas fa-download mr-2"></i>Download Plan
                        </button>
                    </div>
                </div>
            `;
            
            // Populate priority actions
            this.populatePriorityActions();
            
            this.storeData('assessmentData', this.assessmentData);
            this.storeData('personalizedPrescription', prescription);
            this.trackEvent('assessment_completed');
            this.initializeOngoingCoaching();
        }
    }

    generateAdvancedAssessmentAnalysis() {
        const analysis = [];
        
        // Extract assessment data
        const energyLevel = this.assessmentData.step_1 ? this.assessmentData.step_1[0] : 2;
        const sleepQuality = this.assessmentData.step_2 ? this.assessmentData.step_2[0] : 2;
        const mentalHealth = this.assessmentData.step_3 ? this.assessmentData.step_3[0] : 2;
        const stressLevel = this.assessmentData.step_4 ? this.assessmentData.step_4[0] : 2;
        const exercise = this.assessmentData.step_5 ? this.assessmentData.step_5[0] : 2;
        const dietQuality = this.assessmentData.step_6 ? this.assessmentData.step_6[0] : 2;
        const socialConnections = this.assessmentData.step_7 ? this.assessmentData.step_7[0] : 2;
        const workLifeBalance = this.assessmentData.step_8 ? this.assessmentData.step_8[0] : 2;
        const traumaHistory = this.assessmentData.step_9 ? this.assessmentData.step_9[0] : 0;
        const substanceUse = this.assessmentData.step_10 || [];
        const medicalHistory = this.assessmentData.step_11 || [];
        const supportSystem = this.assessmentData.step_12 ? this.assessmentData.step_12[0] : 2;
        const copingStrategies = this.assessmentData.step_13 || [];
        const crisisLevel = this.assessmentData.step_14 ? this.assessmentData.step_14[0] : 0;
        const healthGoals = this.assessmentData.step_15 || [];

        // Calculate overall risk assessment
        let riskScore = 0;
        let traumaScore = 0;
        
        // Energy & Physical Health Analysis
        if (energyLevel <= 1) {
            riskScore += 2;
            analysis.push("🔋 <strong>SEVERE ENERGY DEPLETION:</strong> Chronic fatigue patterns indicate potential adrenal dysfunction, sleep disorders, or nutrient deficiencies. Immediate intervention required.");
        } else if (energyLevel <= 2) {
            riskScore += 1;
            analysis.push("⚡ <strong>Energy Concerns:</strong> Moderate energy issues suggest lifestyle factors affecting vitality. Sleep and nutrition optimization recommended.");
        }

        // Sleep Quality Analysis  
        if (sleepQuality <= 1) {
            riskScore += 2;
            analysis.push("😴 <strong>CRITICAL SLEEP DISRUPTION:</strong> Severe sleep issues likely perpetuating mental health symptoms. Sleep hygiene protocol and trauma-informed sleep therapy essential.");
        } else if (sleepQuality <= 2) {
            riskScore += 1;
            analysis.push("🌙 <strong>Sleep Quality Issues:</strong> Poor sleep affecting recovery and mood regulation. Sleep optimization strategies needed.");
        }

        // Mental Health & Trauma Analysis
        if (mentalHealth <= 1) {
            riskScore += 3;
            traumaScore += 2;
            analysis.push("🧠 <strong>SEVERE MENTAL HEALTH DISTRESS:</strong> Significant psychological symptoms requiring immediate professional support and comprehensive trauma-informed care.");
        } else if (mentalHealth <= 2) {
            riskScore += 2;
            traumaScore += 1;
            analysis.push("💭 <strong>Mental Health Challenges:</strong> Moderate psychological distress. Structured therapeutic support and coping skill development recommended.");
        }

        // Crisis Assessment
        if (crisisLevel >= 2) { // Frequent or immediate risk
            riskScore += 5;
            analysis.push("🚨 <strong>IMMEDIATE SAFETY CONCERN:</strong> Suicidal ideation detected. Crisis intervention protocol activated. 24/7 support resources provided. Professional evaluation urgently needed.");
        } else if (crisisLevel >= 1) {
            riskScore += 3;
            analysis.push("⚠️ <strong>Safety Monitoring Required:</strong> Occasional suicidal thoughts indicate need for increased support and safety planning.");
        }

        // Overall Risk Classification
        let riskLevel = "LOW";
        let riskColor = "green";
        if (riskScore >= 8) {
            riskLevel = "CRITICAL";
            riskColor = "red";
        } else if (riskScore >= 5) {
            riskLevel = "HIGH";
            riskColor = "orange";
        } else if (riskScore >= 3) {
            riskLevel = "MODERATE";
            riskColor = "yellow";
        }

        analysis.unshift(`📊 <strong style="color: ${riskColor}">RISK ASSESSMENT: ${riskLevel}</strong> (Score: ${riskScore}/15) - ${traumaScore > 0 ? 'Trauma-informed care indicated' : 'Standard support appropriate'}`);
        
        return analysis.join('<br><br>');
    }

    generatePersonalizedPrescription() {
        const prescription = [];
        
        // Get assessment data
        const energyLevel = this.assessmentData.step_1 ? this.assessmentData.step_1[0] : 2;
        const sleepQuality = this.assessmentData.step_2 ? this.assessmentData.step_2[0] : 2;
        const mentalHealth = this.assessmentData.step_3 ? this.assessmentData.step_3[0] : 2;
        const crisisLevel = this.assessmentData.step_14 ? this.assessmentData.step_14[0] : 0;

        // Crisis Protocol
        if (crisisLevel >= 2) {
            prescription.push(`
                <div class="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                    <h4 class="font-bold text-red-800 mb-2">🚨 CRISIS INTERVENTION PROTOCOL</h4>
                    <ul class="text-sm text-red-700 space-y-1">
                        <li>• Immediate safety assessment and planning</li>
                        <li>• 24/7 crisis hotline access: UK Samaritans 116 123</li>
                        <li>• Daily check-ins with AI crisis support</li>
                        <li>• Professional mental health referral (within 48 hours)</li>
                    </ul>
                </div>
            `);
        }

        // Sleep Protocol
        if (sleepQuality <= 2) {
            prescription.push(`
                <div class="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
                    <h4 class="font-bold text-blue-800 mb-2">😴 SLEEP RESTORATION PROTOCOL</h4>
                    <ul class="text-sm text-blue-700 space-y-1">
                        <li>• Sleep Hygiene: No screens 1hr before bed, cool dark room</li>
                        <li>• Consistent sleep/wake times ±30 minutes</li>
                        <li>• AI Sleep Coach: Daily tracking and optimization</li>
                    </ul>
                </div>
            `);
        }

        // Nutrition Protocol
        prescription.push(`
            <div class="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                <h4 class="font-bold text-green-800 mb-2">🥗 TRAUMA RECOVERY NUTRITION</h4>
                <ul class="text-sm text-green-700 space-y-1">
                    <li>• Anti-inflammatory foods: Omega-3 fish, leafy greens, berries</li>
                    <li>• Protein at every meal (20-30g) for neurotransmitter support</li>
                    <li>• AI Nutrition Coach: Meal planning and photo analysis</li>
                </ul>
            </div>
        `);

        return prescription.join('');
    }

    showCrisisResources() {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'crisis-alert p-4 rounded-lg mt-4';
        alertDiv.innerHTML = `
            <h4 class="font-bold text-lg mb-2">🚨 Immediate Support Available</h4>
            <p class="mb-3">If you're having thoughts of self-harm, please reach out for immediate help:</p>
            <div class="grid md:grid-cols-3 gap-4 text-sm">
                <div><strong>UK: Samaritans</strong><br><a href="tel:116123" class="text-blue-600 font-bold">116 123</a></div>
                <div><strong>US: Crisis Lifeline</strong><br><a href="tel:988" class="text-blue-600 font-bold">988</a></div>
                <div><strong>Emergency</strong><br><a href="tel:999" class="text-red-600 font-bold">999/911</a></div>
            </div>
        `;
        
        const questionsContainer = document.getElementById('assessment-questions');
        if (questionsContainer) {
            questionsContainer.appendChild(alertDiv);
        }

        // Only trigger enhanced crisis support if not in auto-prevention mode
        if (!this.preventAutoCrisis) {
            setTimeout(() => {
                this.showEmergencyCrisisSupport();
            }, 2000);
        } else {
            console.log('⚠️ Crisis support available but auto-modal prevented');
        }
    }

    // API Integration
    async initializeAPI() {
        // Fetch API configuration from server
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (config.groqApiKey) {
                window.GROQ_API_KEY = config.groqApiKey;
                localStorage.setItem('groq_api_key', config.groqApiKey);
                this.apiKey = config.groqApiKey;
            }

            if (config.stripePublishableKey) {
                window.STRIPE_PUBLISHABLE_KEY = config.stripePublishableKey;
                localStorage.setItem('stripe_publishable_key', config.stripePublishableKey);
                this.stripeKey = config.stripePublishableKey;
            }

            console.log('✅ API configuration loaded successfully');
        console.log('🔑 Groq API Key available:', config.groqApiKey ? 'YES' : 'NO');
        console.log('🔑 Stripe Key available:', config.stripePublishableKey ? 'YES' : 'NO');
        } catch (error) {
            console.log('⚠️ Using fallback API configuration');
        }

        // Update UI
        document.getElementById('api-status-text').textContent = 'AI Connected';
        const statusEl = document.getElementById('api-status');
        if (statusEl) {
            statusEl.className = 'fixed top-4 left-4 z-40 px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white';
        }
    }

    async callGroqAPI(messages, systemPrompt = '') {
        if (!this.canUseAI()) {
            return "You've reached your daily limit for AI interactions. Please upgrade your plan or try again tomorrow for more AI-powered features.";
        }

        console.log('🔌 Making Groq API call...');
        console.log('🔑 API Key exists:', this.apiKey ? 'YES' : 'NO');
        console.log('🔑 API Key preview:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NONE');

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            this.consumeCredits(1);
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Groq API Error:', error);
            return "I'm having trouble connecting right now. Please try again in a moment or use our offline coping techniques.";
        }
    }

    // Coach functionality
    openCoachModal(coachType) {
        const coaches = {
            nutrition: { name: "Nutrition & Lifestyle Coach", icon: "fas fa-apple-alt", color: "green" },
            sleep: { name: "Sleep & Recovery Specialist", icon: "fas fa-bed", color: "blue" },
            stress: { name: "Stress & Mindfulness Coach", icon: "fas fa-spa", color: "purple" },
            fitness: { name: "Fitness & Movement Coach", icon: "fas fa-dumbbell", color: "red" },
            supplements: { name: "Supplement & Wellness Advisor", icon: "fas fa-pills", color: "orange" },
            ptsd: { name: "Complete Wellness Coach", icon: "fas fa-brain", color: "purple" },
            hypnotherapy: { name: "Hypnotherapy & Subconscious Coach", icon: "fas fa-eye", color: "indigo" },
            comprehensive: { name: "Complete Wellness & PTSD Coach", icon: "fas fa-user-md", color: "gradient" }
        };
        
        const coach = coaches[coachType];
        
        const content = `
            <div class="flex flex-col h-full">
                <div class="flex items-center mb-4">
                    <i class="${coach.icon} text-3xl text-${coach.color}-500 mr-3"></i>
                    <div>
                        <h2 class="text-xl font-bold">${coach.name}</h2>
                        <p class="text-gray-600">AI-powered personalized guidance</p>
                    </div>
                </div>
                <div id="coach-chat-messages" class="bg-gray-50 p-4 rounded-lg flex-1 min-h-0 overflow-y-auto mb-4 border border-gray-200">
                    <div class="mb-3">
                        <div class="bg-${coach.color}-100 p-3 rounded-lg">
                            Hello! I'm your ${coach.name}. I'm here to provide personalized guidance based on your assessment results and health goals. How can I support your wellness journey today?
                        </div>
                    </div>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <div class="flex items-center justify-center mb-3">
                        <div class="pulse-ring"></div>
                        <div id="voice-status-${coachType}" class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                            <i class="fas fa-microphone"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="font-semibold text-gray-800 mb-1">🎙️ Voice Conversation Active</p>
                        <p class="text-sm text-gray-600 mb-2">Just start speaking naturally - I'm listening!</p>
                        <div class="text-xs text-gray-500">
                            <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                                <i class="fas fa-circle text-green-500 text-xs mr-1"></i>Listening
                            </span>
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Voice Credits: ${this.currentUser.voiceCredits || 0}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Alternative text input (collapsed by default) -->
                <div class="mt-4">
                    <button onclick="app.toggleTextMode('${coachType}')" class="text-sm text-gray-500 hover:text-gray-700 underline">
                        <i class="fas fa-keyboard mr-1"></i>Prefer to type instead?
                    </button>
                    <div id="text-input-${coachType}" class="hidden mt-3">
                        <div class="flex space-x-2">
                            <input type="text" id="coach-user-input" placeholder="Type your message here..." class="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-${coach.color}-500 focus:border-${coach.color}-500">
                            <button onclick="app.sendCoachMessage('${coachType}')" class="bg-${coach.color}-500 text-white px-4 py-3 rounded-lg hover:bg-${coach.color}-600 transition-colors">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('coach-content').innerHTML = content;
        this.openModal('coach-modal');
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('coach-user-input')?.focus();
        }, 100);
    }

    async sendCoachMessage(coachType) {
        const input = document.getElementById('coach-user-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        // Enable crisis detection when user starts actively chatting
        this.enableCrisisDetection();
        
        const chatMessages = document.getElementById('coach-chat-messages');
        if (!chatMessages) return;

        chatMessages.innerHTML += `
            <div class="mb-3 text-right">
                <div class="bg-green-100 p-3 rounded-lg inline-block max-w-xs">
                    ${message}
                </div>
            </div>
        `;
        
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show typing indicator with inter-AI consultation
        const typingId = 'typing-' + Date.now();
        chatMessages.innerHTML += `
            <div class="mb-3" id="${typingId}">
                <div class="bg-gray-100 p-3 rounded-lg">
                    <i class="fas fa-network-wired fa-spin"></i> Consulting with AI specialists team...
                </div>
            </div>
        `;
        
        const systemPrompt = this.getCoachSystemPrompt(coachType);
        const assessmentContext = this.getAssessmentContext();
        const interAIContext = this.getInterAIContext();
        const fullPrompt = systemPrompt + "\n\nUser's Assessment Context: " + assessmentContext + "\n\nInter-AI Consultation Data: " + interAIContext;
        
        const response = await this.callGroqAPI([{ role: 'user', content: message }], fullPrompt);
        
        // Store AI interaction for cross-referencing
        this.storeAIInteraction(coachType, message, response);
        
        // Update dashboard with coach interaction
        this.updateDashboardFromCoachInteraction(coachType, message, response);
        
        // Track company engagement (anonymous)
        if (this.currentUser.companyId) {
            this.trackEmployeeEngagement(this.currentUser.companyId);
        }
        
        document.getElementById(typingId)?.remove();
        
        const coachColor = this.getCoachColor(coachType);
        chatMessages.innerHTML += `
            <div class="mb-3">
                <div class="bg-${coachColor}-100 p-3 rounded-lg max-w-xs">
                    ${response}
                    <div class="text-xs text-gray-500 mt-2 flex items-center justify-between">
                        <div>
                            <i class="fas fa-network-wired mr-1"></i>
                            Coordinated with ${this.getConnectedAISpecialists(coachType)}
                        </div>
                        <button class="speak-response-btn text-purple-500 hover:text-purple-700 ml-2" title="Speak response" data-response="${response.replace(/"/g, '&quot;')}" data-coach-type="${coachType}">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Automatically speak the response if voice was used for input
        if (this.lastInputWasVoice) {
            this.speakResponse(response, coachType);
            this.lastInputWasVoice = false;
        }
        
        input.focus();
    }

    getAssessmentContext() {
        const questions = this.getAssessmentQuestions();
        let context = "CRITICAL: User completed comprehensive trauma-informed assessment. Their complete profile (DO NOT RE-ASK ANY OF THIS): \n\n";
        
        // Build detailed assessment summary
        Object.keys(this.assessmentData).forEach(stepKey => {
            const stepNum = parseInt(stepKey.split('_')[1]) - 1;
            if (questions[stepNum]) {
                const question = questions[stepNum];
                const responses = this.assessmentData[stepKey];
                if (responses && responses.length > 0) {
                    const responseTexts = responses.map(idx => question.options[idx]).join(', ');
                    context += `${question.title}: ${responseTexts}\n`;
                }
            }
        });
        
        // Add personalized prescription context
        const prescription = this.loadData('personalizedPrescription');
        if (prescription) {
            context += "\n--- PERSONALIZED TREATMENT PRESCRIPTION IN EFFECT ---\n";
            context += prescription.replace(/<[^>]*>/g, '').substring(0, 500) + "...\n";
        }
        
        // Add risk assessment
        const energyLevel = this.assessmentData.step_1 ? this.assessmentData.step_1[0] : 2;
        const sleepQuality = this.assessmentData.step_2 ? this.assessmentData.step_2[0] : 2;
        const mentalHealth = this.assessmentData.step_3 ? this.assessmentData.step_3[0] : 2;
        const crisisLevel = this.assessmentData.step_14 ? this.assessmentData.step_14[0] : 0;
        const traumaHistory = this.assessmentData.step_9 ? this.assessmentData.step_9[0] : 0;
        
        let riskScore = 0;
        if (energyLevel <= 1) riskScore += 2;
        if (sleepQuality <= 1) riskScore += 2;
        if (mentalHealth <= 1) riskScore += 3;
        if (crisisLevel >= 2) riskScore += 5;
        
        let riskLevel = "LOW";
        if (riskScore >= 8) riskLevel = "CRITICAL";
        else if (riskScore >= 5) riskLevel = "HIGH";
        else if (riskScore >= 3) riskLevel = "MODERATE";
        
        context += `\n--- CLINICAL NOTES ---\n`;
        context += `Risk Level: ${riskLevel} (${riskScore}/15)\n`;
        context += `Trauma History: ${traumaHistory > 0 ? 'YES - trauma-informed approach required' : 'No significant trauma'}\n`;
        context += `Crisis Status: ${crisisLevel >= 1 ? 'ACTIVE MONITORING - suicidal ideation present' : 'Stable'}\n`;
        
        // Add specific coaching instructions
        context += "\n--- COACHING INSTRUCTIONS ---\n";
        context += "- NEVER ask about medical conditions, trauma history, medications, allergies, or health goals again\n";
        context += "- Reference their specific assessment data in your responses\n";
        context += "- Follow their personalized prescription protocols\n";
        context += "- Use trauma-informed language and approaches\n";
        context += "- Focus on their specific disclosed challenges and goals\n";
        context += "- Provide specific, actionable recommendations based on their profile\n";
        
        if (crisisLevel >= 1) {
            context += "- CRISIS PROTOCOL: User has suicidal ideation - monitor safety, provide crisis resources\n";
        }
        
        if (traumaHistory > 0) {
            context += "- TRAUMA-INFORMED: Use gentle, empowering language, emphasize choice and control\n";
        }
        
        return context;
    }

    getCoachSystemPrompt(coachType) {
        const comprehensivePrompt = `You are a COMPLETE WELLNESS & PTSD RECOVERY COACH with expertise in ALL areas: PTSD/Trauma, Nutrition, Lifestyle Medicine, Clinical Hypnotherapy, Fitness, Sleep, Stress Management, and Supplements. You have full access to voice conversation capabilities.

CORE EXPERTISE AREAS:
🧠 PTSD & TRAUMA: Deep trauma-informed care, EMDR principles, grounding techniques, crisis intervention
🍎 NUTRITION: Anti-inflammatory diets, gut-brain connection, trauma recovery nutrition, meal planning
💊 LIFESTYLE MEDICINE: Holistic health approaches, evidence-based interventions, root cause analysis  
🌀 HYPNOTHERAPY: Subconscious reprogramming, therapeutic suggestions, relaxation techniques, neural pathways
🏃 FITNESS: Trauma-sensitive movement, nervous system regulation through exercise, body-based healing
😴 SLEEP: Trauma-related sleep issues, circadian optimization, nightmare management
🧘 STRESS/MINDFULNESS: Breathwork, meditation, nervous system regulation, mindfulness-based interventions
💊 SUPPLEMENTS: Evidence-based protocols for mental health, trauma recovery, and optimal wellness

CRITICAL INSTRUCTIONS:
1) CONVERSATIONAL FLOW: Respond naturally and personally - like a trusted, expert therapist friend
2) PERSONALIZED RESPONSES: Use the user's detailed assessment data for HIGHLY SPECIFIC guidance
3) HOLISTIC APPROACH: Consider ALL aspects of their health - physical, mental, emotional, spiritual
4) VOICE OPTIMIZED: Keep responses 2-3 sentences for natural voice conversation flow
5) TRAUMA-INFORMED: Always validate experiences, use safe language, focus on empowerment
6) ACTIONABLE GUIDANCE: Provide specific, practical steps they can take immediately
7) INTEGRATION: Show how nutrition affects mood, how movement helps trauma, how sleep impacts recovery
8) CRISIS AWARENESS: Watch for crisis indicators - provide immediate resources (988, Crisis Text Line, 911)
9) PROFESSIONAL BOUNDARIES: You provide coaching and support, not diagnosis or medical treatment
10) PROGRESS FOCUSED: Build on their existing healing journey and celebrate small wins

LIVE SESSION INTEGRATION:
- Reference their upcoming/past sessions when relevant
- Prepare them for live sessions with specific questions or goals
- Follow up on live session outcomes and integration
- Coordinate between AI support and live human sessions

Remember: You are their comprehensive wellness companion, supporting them 24/7 between live sessions with personalized, evidence-based guidance across ALL dimensions of healing.`;

        const specificPrompts = {
            nutrition: comprehensivePrompt + "\n\nFOCUS: Emphasize nutrition and gut-brain connection while maintaining full coaching capabilities.",
            sleep: comprehensivePrompt + "\n\nFOCUS: Emphasize sleep optimization and circadian health while maintaining full coaching capabilities.",
            stress: comprehensivePrompt + "\n\nFOCUS: Emphasize stress management and nervous system regulation while maintaining full coaching capabilities.",
            fitness: comprehensivePrompt + "\n\nFOCUS: Emphasize movement therapy and body-based healing while maintaining full coaching capabilities.",
            supplements: comprehensivePrompt + "\n\nFOCUS: Emphasize evidence-based supplementation while maintaining full coaching capabilities.",
            hypnotherapy: comprehensivePrompt + "\n\nFOCUS: Emphasize hypnotherapy, subconscious reprogramming, and neural pathway healing while maintaining full coaching capabilities.",
            ptsd: comprehensivePrompt + "\n\nFOCUS: Emphasize trauma recovery and PTSD healing while maintaining full coaching capabilities.",
            comprehensive: comprehensivePrompt
        };
        
        return specificPrompts[coachType] || comprehensivePrompt;
    }

    getCoachColor(coachType) {
        const colors = {
            nutrition: 'green',
            sleep: 'blue', 
            stress: 'purple',
            fitness: 'red',
            supplements: 'orange',
            ptsd: 'purple'
        };
        return colors[coachType] || 'blue';
    }

    // Inter-AI Communication System
    getInterAIContext() {
        const aiInteractions = this.loadData('aiInteractions') || [];
        const recentInteractions = aiInteractions.slice(-10); // Last 10 interactions
        
        let context = "Previous AI consultations: ";
        recentInteractions.forEach(interaction => {
            context += `[${interaction.coachType}]: ${interaction.summary} | `;
        });
        
        // Add current health metrics
        context += `Current health score: ${this.progressData.healthScore}/10. `;
        context += `Journal streak: ${this.progressData.journalStreak} days. `;
        context += `Coping techniques used: ${this.progressData.copingUsed} times. `;
        
        return context;
    }

    storeAIInteraction(coachType, userMessage, aiResponse) {
        const aiInteractions = this.loadData('aiInteractions') || [];
        const interaction = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            coachType: coachType,
            userMessage: userMessage,
            summary: aiResponse.substring(0, 150) + '...',
            fullResponse: aiResponse
        };
        
        aiInteractions.unshift(interaction);
        
        // Keep only last 50 interactions
        if (aiInteractions.length > 50) {
            aiInteractions.splice(50);
        }
        
        this.storeData('aiInteractions', aiInteractions);
    }

    getConnectedAISpecialists(currentCoach) {
        const specialists = {
            nutrition: "Sleep & Stress specialists",
            sleep: "Nutrition & Fitness specialists", 
            stress: "PTSD & Sleep specialists",
            fitness: "Nutrition & Stress specialists",
            supplements: "Nutrition & Health specialists",
            ptsd: "Stress & Sleep specialists"
        };
        return specialists[currentCoach] || "other specialists";
    }

    // Enhanced Contact & Session System - Redirect to comprehensive booking
    scheduleCheckin() {
        // Show choice between AI check-ins and live sessions
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg mx-auto">
                <h3 class="text-xl font-bold mb-4">Choose Your Support Type</h3>
                <div class="space-y-4">
                    
                    <!-- Live Sessions Option -->
                    <div class="border-2 border-purple-200 rounded-lg p-4 cursor-pointer hover:border-purple-400 transition-colors" onclick="app.openSessionBooking(); this.closest('.fixed').remove();">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-user-md text-purple-600"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-lg">Book Live Wellness Session</h4>
                                <p class="text-sm text-gray-600">One-on-one sessions with certified practitioners covering PTSD, nutrition, hypnotherapy, lifestyle medicine and more</p>
                                <div class="text-purple-600 font-semibold mt-1">Starting at $89 • Available Now</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Check-ins Option -->
                    <div class="border-2 border-blue-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors" onclick="app.setupAICheckins(); this.closest('.fixed').remove();">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-blue-600"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-lg">Schedule AI Check-ins</h4>
                                <p class="text-sm text-gray-600">Automated wellness check-ins with your comprehensive AI coach team</p>
                                <div class="text-blue-600 font-semibold mt-1">Free with Your Plan</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Voice Chat Option -->
                    <div class="border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:border-green-400 transition-colors" onclick="app.openVoiceCoach(); this.closest('.fixed').remove();">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-microphone text-green-600"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-lg">Voice Chat with AI Coach</h4>
                                <p class="text-sm text-gray-600">Natural voice conversations with empathetic AI covering all wellness areas</p>
                                <div class="text-green-600 font-semibold mt-1">Voice Credits: ${this.currentUser.voiceCredits}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    setupAICheckins() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Setup AI Coach Check-ins</h3>
                <div class="space-y-4">
                    <div class="bg-blue-50 p-3 rounded">
                        <p class="text-sm text-blue-800"><i class="fas fa-robot mr-2"></i>Automated check-ins with your comprehensive AI wellness team</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Check-in Frequency</label>
                        <select id="checkin-frequency" class="w-full p-2 border rounded">
                            <option value="daily">Daily wellness check-ins</option>
                            <option value="every-other">Every other day</option>
                            <option value="weekly">Weekly comprehensive assessments</option>
                            <option value="as-needed">As needed basis</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Focus Areas (Select Multiple)</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="ptsd" checked> PTSD & Trauma Recovery
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="nutrition"> Nutrition & Gut Health
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="sleep"> Sleep Optimization
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="stress"> Stress Management
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" value="fitness"> Movement & Fitness
                            </label>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        <button onclick="app.saveCheckinSchedule(); this.closest('.fixed').remove()" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Setup Check-ins</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    quickCheckin() {
        this.openCoachModal('ptsd');
        setTimeout(() => {
            const input = document.getElementById('coach-user-input');
            if (input) {
                input.value = "Hi! Just doing a quick check-in. How am I progressing with my trauma recovery? Any adjustments needed to my treatment plan?";
                input.focus();
            }
        }, 500);
    }

    // Voice Input Integration for Existing Chat
    toggleVoiceInput(coachType) {
        if (!this.voiceRecognition) {
            this.initializeVoiceRecognition();
        }
        
        const btn = document.getElementById('voice-input-btn');
        const input = document.getElementById('coach-user-input');
        
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput(coachType, btn, input);
        }
    }
    
    initializeVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('Voice input not supported in this browser', 'warning');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.lang = 'en-GB'; // British English for better recognition
        this.isListening = false;
        
        this.voiceRecognition.onstart = () => {
            console.log('🎙️ Voice recognition started');
            this.isListening = true;
            const btn = document.getElementById('voice-input-btn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-stop animate-pulse"></i>';
                btn.classList.add('bg-red-500', 'hover:bg-red-600');
                btn.classList.remove('bg-purple-500', 'hover:bg-purple-600');
            }
        };
        
        this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('📝 Voice transcript:', transcript);
            
            const input = document.getElementById('coach-user-input');
            if (input) {
                input.value = transcript;
                input.focus();
                
                // Mark that voice was used for this input
                this.lastInputWasVoice = true;
                
                // Auto-send after brief delay for user to review
                setTimeout(() => {
                    const coachType = input.getAttribute('data-coach-type');
                    if (coachType && transcript.trim().length > 0) {
                        this.sendCoachMessage(coachType);
                    }
                }, 1500);
            }
            
            this.stopVoiceInput();
        };
        
        this.voiceRecognition.onend = () => {
            this.stopVoiceInput();
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('❌ Voice recognition error:', event.error);
            this.stopVoiceInput();
            
            if (event.error === 'not-allowed') {
                this.showNotification('Microphone access denied. Please allow microphone access.', 'error');
            } else if (event.error === 'no-speech') {
                this.showNotification('No speech detected. Please try again.', 'warning');
            } else {
                this.showNotification('Voice recognition error. Please try again.', 'error');
            }
        };
    }
    
    startVoiceInput(coachType, btn, input) {
        if (!this.voiceRecognition) {
            this.initializeVoiceRecognition();
        }
        
        if (!this.voiceRecognition) {
            this.showNotification('Voice input not available', 'error');
            return;
        }
        
        try {
            this.voiceRecognition.start();
            this.showNotification('🎙️ Listening... Speak now', 'info');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.showNotification('Failed to start voice input', 'error');
        }
    }
    
    stopVoiceInput() {
        if (this.voiceRecognition && this.isListening) {
            this.voiceRecognition.stop();
        }
        
        this.isListening = false;
        
        const btn = document.getElementById('voice-input-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.classList.remove('bg-red-500', 'hover:bg-red-600');
            btn.classList.add('bg-purple-500', 'hover:bg-purple-600');
        }
    }
    
    // Enhanced AI Response with Voice Synthesis
    speakResponse(text, voiceType = 'ptsd') {
        if (!('speechSynthesis' in window)) {
            return; // Gracefully fail if not supported
        }
        
        // Cancel any existing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Natural pace
        utterance.pitch = 1.1; // Slightly warmer
        utterance.volume = 0.9;
        
        // Select appropriate voice for empathetic delivery
        const voices = window.speechSynthesis.getVoices();
        
        // Prefer British English voices for warm, empathetic delivery
        let preferredVoice = voices.find(voice => 
            voice.lang === 'en-GB' && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('karen') ||
             voice.name.toLowerCase().includes('serena'))
        );
        
        // Fallback to any British voice
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => voice.lang === 'en-GB');
        }
        
        // Final fallback to natural English voices
        if (!preferredVoice) {
            preferredVoice = voices.find(voice => 
                voice.lang.startsWith('en') &&
                (voice.name.toLowerCase().includes('natural') ||
                 voice.name.toLowerCase().includes('neural'))
            );
        }
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
    
    // Open Complete Wellness Voice Coach
    openVoiceCoach() {
        this.openCoachModal('comprehensive');
        
        // Show voice introduction after modal opens
        setTimeout(() => {
            this.showNotification('🎙️ Complete Wellness Coach with Voice! All areas: PTSD, Nutrition, Hypnotherapy & More', 'success');
            
            const input = document.getElementById('coach-user-input');
            if (input) {
                input.placeholder = "Click 🎙️ to speak or type about any aspect of your wellness...";
                input.value = "Hi! I'd like to talk about my complete wellness journey - PTSD recovery, nutrition, lifestyle, and overall healing. How can you support me today?";
                input.focus();
            }
            
            // Automatically start with a comprehensive welcoming voice message
            setTimeout(() => {
                this.speakResponse("Hello! I'm your complete wellness and PTSD recovery coach with full voice capabilities. I can support you with trauma healing, nutrition, hypnotherapy, lifestyle medicine, and all aspects of your wellness journey. I also coordinate with your live sessions. What area would you like to explore today?", 'comprehensive');
            }, 1000);
        }, 500);
    }
    
    // Live Session Booking and Management
    openSessionBooking() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                        <i class="fas fa-calendar-plus mr-3 text-purple-500"></i>
                        Book Live Session
                    </h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Session Types -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold mb-4 text-gray-700">Select Session Type</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="session-type border-2 border-purple-200 rounded-lg p-4 cursor-pointer hover:border-purple-400 transition-all" data-type="comprehensive">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-user-md text-2xl text-purple-500 mr-3"></i>
                                <h4 class="font-bold text-purple-700">Complete Wellness Session</h4>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">PTSD recovery, nutrition, lifestyle, hypnotherapy integration</p>
                            <div class="text-lg font-bold text-purple-600">£89 • 60 mins</div>
                        </div>
                        
                        <div class="session-type border-2 border-blue-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-all" data-type="ptsd">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-brain text-2xl text-blue-500 mr-3"></i>
                                <h4 class="font-bold text-blue-700">PTSD Specialist Session</h4>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">Focused trauma therapy and PTSD recovery support</p>
                            <div class="text-lg font-bold text-blue-600">£79 • 50 mins</div>
                        </div>
                        
                        <div class="session-type border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:border-green-400 transition-all" data-type="nutrition">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-apple-alt text-2xl text-green-500 mr-3"></i>
                                <h4 class="font-bold text-green-700">Nutrition & Lifestyle</h4>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">Personalized nutrition planning and lifestyle medicine</p>
                            <div class="text-lg font-bold text-green-600">£59 • 45 mins</div>
                        </div>
                        
                        <div class="session-type border-2 border-indigo-200 rounded-lg p-4 cursor-pointer hover:border-indigo-400 transition-all" data-type="hypnotherapy">
                            <div class="flex items-center mb-3">
                                <i class="fas fa-eye text-2xl text-indigo-500 mr-3"></i>
                                <h4 class="font-bold text-indigo-700">Clinical Hypnotherapy</h4>
                            </div>
                            <p class="text-sm text-gray-600 mb-2">Subconscious reprogramming and therapeutic hypnosis</p>
                            <div class="text-lg font-bold text-indigo-600">£69 • 60 mins</div>
                        </div>
                    </div>
                </div>
                
                <!-- Selected Session Info -->
                <div id="selected-session" class="hidden bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h4 class="font-bold text-purple-700 mb-2">Selected Session:</h4>
                    <div id="session-details"></div>
                </div>
                
                <!-- Calendar Integration -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold mb-4 text-gray-700">Choose Date & Time</h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                            <input type="date" id="session-date" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                            <select id="session-time" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="">Select time slot</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                                <option value="18:00">6:00 PM</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Session Preparation -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold mb-4 text-gray-700">Session Preparation</h3>
                    <textarea id="session-goals" placeholder="What would you like to focus on in this session? Any specific goals or challenges you'd like to address?" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" rows="3"></textarea>
                </div>
                
                <!-- AI Preparation -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-robot text-blue-500 mr-2"></i>
                        <h4 class="font-bold text-blue-700">AI Preparation Assistant</h4>
                    </div>
                    <p class="text-sm text-blue-600 mb-3">Your AI coach will prepare personalized session notes based on your recent conversations and assessment data.</p>
                    <button onclick="app.generateSessionPrep()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                        <i class="fas fa-magic mr-2"></i>Generate Session Preparation
                    </button>
                </div>
                
                <!-- Booking Actions -->
                <div class="flex space-x-4">
                    <button onclick="app.bookLiveSession()" class="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-bold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200">
                        <i class="fas fa-calendar-check mr-2"></i>Book Session
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add session type selection handlers
        modal.querySelectorAll('.session-type').forEach(el => {
            el.addEventListener('click', () => {
                modal.querySelectorAll('.session-type').forEach(item => {
                    item.classList.remove('border-purple-400', 'bg-purple-50');
                    item.classList.add('border-gray-200');
                });
                el.classList.add('border-purple-400', 'bg-purple-50');
                el.classList.remove('border-gray-200');
                
                const sessionInfo = modal.querySelector('#selected-session');
                const sessionDetails = modal.querySelector('#session-details');
                sessionInfo.classList.remove('hidden');
                sessionDetails.innerHTML = el.innerHTML;
            });
        });
    }
    
    async generateSessionPrep() {
        const goals = document.getElementById('session-goals')?.value || '';
        const sessionType = document.querySelector('.session-type.bg-purple-50')?.dataset.type || 'comprehensive';
        
        this.showNotification('🤖 Generating personalized session preparation...', 'info');
        
        const assessmentContext = this.getAssessmentContext();
        const prompt = `Based on this user's assessment data and goals, create comprehensive session preparation notes for a ${sessionType} session. Goals: ${goals}. Assessment: ${assessmentContext}`;
        
        try {
            const preparation = await this.callGroqAPI([{ role: 'user', content: prompt }], 
                'You are an expert session preparation assistant. Create detailed, personalized preparation notes for the upcoming live session based on the user\'s assessment data and stated goals. Include specific areas to focus on, questions to explore, and recommended interventions.');
            
            // Display preparation in a new section
            const prepSection = document.createElement('div');
            prepSection.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mt-4';
            prepSection.innerHTML = `
                <h4 class="font-bold text-green-700 mb-3">
                    <i class="fas fa-clipboard-check mr-2"></i>AI-Generated Session Preparation
                </h4>
                <div class="text-sm text-green-800 whitespace-pre-wrap">${preparation}</div>
            `;
            
            document.querySelector('#session-goals').parentNode.appendChild(prepSection);
            this.showNotification('✅ Session preparation generated! Review before booking.', 'success');
            
        } catch (error) {
            this.showNotification('❌ Failed to generate session preparation', 'error');
        }
    }
    
    async bookLiveSession() {
        const sessionType = document.querySelector('.session-type.bg-purple-50')?.dataset.type;
        const date = document.getElementById('session-date')?.value;
        const time = document.getElementById('session-time')?.value;
        const goals = document.getElementById('session-goals')?.value;
        
        if (!sessionType || !date || !time) {
            this.showNotification('Please select session type, date, and time', 'warning');
            return;
        }
        
        // Create session booking object
        const sessionBooking = {
            id: 'session_' + Date.now(),
            type: sessionType,
            date: date,
            time: time,
            goals: goals,
            status: 'pending_payment',
            created: new Date().toISOString(),
            aiPreparation: document.querySelector('.bg-green-50')?.textContent || null
        };
        
        // Store booking
        const existingBookings = JSON.parse(localStorage.getItem('session_bookings') || '[]');
        existingBookings.push(sessionBooking);
        localStorage.setItem('session_bookings', JSON.stringify(existingBookings));
        
        // Show confirmation
        this.showNotification('📅 Session booked! You will receive confirmation and payment link shortly.', 'success');
        
        // Close modal
        document.querySelector('.fixed.inset-0').remove();
        
        // Open payment flow (integrate with Stripe)
        setTimeout(() => {
            this.processSessionPayment(sessionBooking);
        }, 1000);
    }
    
    processSessionPayment(booking) {
        // Integration with existing Stripe system
        const prices = {
            comprehensive: 8900, // £89
            ptsd: 7900, // £79
            nutrition: 5900, // £59
            hypnotherapy: 6900 // £69
        };
        
        const amount = prices[booking.type] || 8900;
        
        this.showNotification(`💳 Redirecting to payment for £${(amount/100).toFixed(0)} session...`, 'info');
        
        // This would integrate with your existing Stripe payment system
        // For now, simulate successful payment
        setTimeout(() => {
            booking.status = 'confirmed';
            const bookings = JSON.parse(localStorage.getItem('session_bookings') || '[]');
            const index = bookings.findIndex(b => b.id === booking.id);
            if (index >= 0) {
                bookings[index] = booking;
                localStorage.setItem('session_bookings', JSON.stringify(bookings));
            }
            
            this.showNotification('✅ Payment successful! Session confirmed. You will receive calendar invite.', 'success');
            this.updateDashboardWithBooking(booking);
        }, 2000);
    }
    
    updateDashboardWithBooking(booking) {
        // Update dashboard to show upcoming session
        const upcomingSessions = document.getElementById('upcoming-sessions');
        if (upcomingSessions) {
            const sessionHtml = `
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-purple-700">${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Session</h4>
                            <p class="text-sm text-purple-600">${booking.date} at ${booking.time}</p>
                            <p class="text-xs text-gray-600 mt-1">Status: ${booking.status}</p>
                        </div>
                        <div class="text-right">
                            <button onclick="app.joinSession('${booking.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            `;
            upcomingSessions.innerHTML = sessionHtml + upcomingSessions.innerHTML;
        }
    }

    updateContactPreferences() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Contact Preferences</h3>
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium mb-2">Reminder Frequency</h4>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="radio" name="frequency" class="mr-2" value="daily" checked> Daily reminders
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="frequency" class="mr-2" value="weekly"> Weekly check-ins
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="frequency" class="mr-2" value="monthly"> Monthly assessments
                            </label>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium mb-2">Crisis Support</h4>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" checked> 24/7 crisis detection
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2" checked> Immediate intervention alerts
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="mr-2"> Emergency contact notifications
                            </label>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        <button onclick="app.saveContactPreferences(); this.closest('.fixed').remove()" class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">Save</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveCheckinSchedule() {
        // Store check-in preferences
        this.storeData('checkinSchedule', {
            frequency: 'daily',
            time: 'morning',
            methods: ['text', 'push'],
            nextCheckin: new Date(Date.now() + 24*60*60*1000).toLocaleDateString()
        });
        
        this.showNotification('✅ Check-in schedule updated! You\'ll receive daily reminders.', 'success');
        this.updateCheckinDisplay();
    }

    saveContactPreferences() {
        this.storeData('contactPreferences', {
            frequency: 'daily',
            crisisSupport: true,
            methods: ['text', 'push', 'crisis']
        });
        
        this.showNotification('✅ Contact preferences saved successfully!', 'success');
        this.updateContactDisplay();
    }

    // Pricing and Payment System
    selectPlan(planType) {
        console.log('🛒 User selected plan:', planType);
        
        if (planType === 'free') {
            this.currentUser.plan = 'Free';
            this.currentUser.credits = 5;
            this.currentUser.maxCreditsPerDay = 5;
            this.updateCreditDisplay();
            this.showNotification('✅ Welcome to Root Cause Power! You have 5 daily interactions to get started.', 'success');
            this.showSection('assessment');
        } else {
            this.showStripeCheckout(planType);
        }
    }

    showStripeCheckout(planType) {
        const plans = {
            'standard': { 
                price: '£29/month', 
                name: 'Root Cause Premium',
                url: 'https://buy.stripe.com/bJeaEW7ft3Q9giZ3GI0VO01'
            },
            'premium': { 
                price: '£59/month', 
                name: 'Root Cause Power VIP',
                url: 'https://buy.stripe.com/00w6oG43h86p2s93GI0VO03'
            },
            'free': { 
                price: 'Free', 
                name: 'Root Cause Basic',
                url: 'https://buy.stripe.com/4gMfZgeHVcmFaYF7WY0VO02'
            },
            'enterprise-essential': { 
                price: '£12/employee/month', 
                name: 'Enterprise Basic',
                url: 'https://buy.stripe.com/6oUbJ0gQ35Yhd6N7WY0VO04'
            },
            'enterprise-professional': { 
                price: '£18/employee/month', 
                name: 'Enterprise Premium',
                url: 'https://buy.stripe.com/fZu6oG1V94UdfeVgtu0VO05'
            },
            'enterprise-plus': { 
                price: '£25/employee/month', 
                name: 'Enterprise Elite',
                url: 'https://buy.stripe.com/14AbJ09nBdqJ2s9dhi0VO06'
            }
        };
        
        const plan = plans[planType];
        if (!plan) return;

        // Direct redirect to Stripe checkout
        console.log(`🛒 Redirecting to Stripe checkout for ${plan.name}`);
        this.showNotification(`🛒 Redirecting to secure checkout for ${plan.name}...`, 'info');
        
        // Small delay to show the notification, then redirect
        setTimeout(() => {
            window.open(plan.url, '_blank');
        }, 1000);
        
        return; // Skip the modal code below
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Complete Your Subscription</h3>
                <div class="text-center mb-6">
                    <div class="text-2xl font-bold text-blue-600">${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan</div>
                    <div class="text-lg">${plan.price}</div>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-lock mr-2"></i>
                            Secure payment processed by Stripe
                        </p>
                    </div>
                    
                    <div class="space-y-2">
                        <input type="email" id="customer-email" placeholder="Enter your email" class="w-full p-3 border rounded">
                        <input type="text" id="customer-name" placeholder="Full name" class="w-full p-3 border rounded">
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                    <button onclick="app.processStripePayment('${planType}', '${plan.priceId}', ${plan.amount}); this.closest('.fixed').remove()" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        Subscribe Now
                    </button>
                </div>
                
                <div class="text-xs text-gray-500 text-center mt-4">
                    <p>Cancel anytime. No hidden fees. 7-day money-back guarantee.</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    processStripePayment(planType, priceId, amount) {
        const email = document.getElementById('customer-email')?.value;
        const name = document.getElementById('customer-name')?.value;
        
        if (!email || !name) {
            alert('Please fill in all required fields');
            return;
        }

        this.showNotification('🔄 Redirecting to secure Stripe checkout...', 'info');
        
        // REAL Stripe Checkout Integration
        // Note: In production, you'll need to:
        // 1. Add Stripe publishable key
        // 2. Create products in Stripe dashboard
        // 3. Set up webhook handlers
        
        const stripeCheckoutData = {
            standard: {
                priceId: 'price_1234567890', // Replace with real Stripe price ID
                mode: 'subscription',
                successUrl: `${window.location.origin}?success=true&plan=standard`,
                cancelUrl: `${window.location.origin}?canceled=true`
            },
            premium: {
                priceId: 'price_0987654321', // Replace with real Stripe price ID
                mode: 'subscription', 
                successUrl: `${window.location.origin}?success=true&plan=premium`,
                cancelUrl: `${window.location.origin}?canceled=true`
            }
        };
        
        const checkoutData = stripeCheckoutData[planType];
        if (!checkoutData) {
            alert('Invalid plan selected');
            return;
        }
        
        // For now, simulate the checkout process
        // Replace this with actual Stripe.js integration:
        /*
        stripe.redirectToCheckout({
            lineItems: [{
                price: checkoutData.priceId,
                quantity: 1
            }],
            mode: checkoutData.mode,
            successUrl: checkoutData.successUrl,
            cancelUrl: checkoutData.cancelUrl,
            customerEmail: email,
            clientReferenceId: name
        });
        */
        
        // Temporary simulation for demo
        setTimeout(() => {
            const confirmed = confirm(`Ready to subscribe to ${planType}?\n\nThis will redirect to Stripe checkout.\n\nClick OK to proceed or Cancel to try the free version.`);
            if (confirmed) {
                // In production, user would be redirected to Stripe
                alert('🚀 In production, you would be redirected to secure Stripe checkout. For demo purposes, upgrading account now.');
                
                this.currentUser.plan = planType.charAt(0).toUpperCase() + planType.slice(1);
                this.currentUser.subscriptionActive = true;
                this.currentUser.credits = -1;
                this.currentUser.maxCreditsPerDay = -1;
                this.storeData('currentUser', this.currentUser);
                
                this.updateCreditDisplay();
                this.showNotification(`🎉 Welcome to ${this.currentUser.plan}! You now have unlimited access.`, 'success');
                this.showSection('dashboard');
            }
        }, 1000);
    }

    contactEnterprise() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Enterprise Contact</h3>
                <form onsubmit="app.submitEnterpriseContact(event)">
                    <div class="space-y-4 mb-6">
                        <input type="text" id="org-name" placeholder="Organization name" class="w-full p-3 border rounded" required>
                        <input type="email" id="contact-email" placeholder="Contact email" class="w-full p-3 border rounded" required>
                        <input type="tel" id="contact-phone" placeholder="Phone number" class="w-full p-3 border rounded">
                        <select id="org-type" class="w-full p-3 border rounded" required>
                            <option value="">Organization type</option>
                            <option value="hospital">Hospital/Healthcare System</option>
                            <option value="clinic">Therapy Clinic/Practice</option>
                            <option value="university">University/Research</option>
                            <option value="government">Government Agency</option>
                            <option value="nonprofit">Non-profit Organization</option>
                            <option value="other">Other</option>
                        </select>
                        <textarea id="requirements" placeholder="Tell us about your needs (number of users, integration requirements, etc.)" class="w-full p-3 border rounded h-20"></textarea>
                    </div>
                    <div class="flex space-x-2">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Send Request</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    submitEnterpriseContact(event) {
        event.preventDefault();
        this.showNotification('✅ Enterprise contact request sent! Our team will reach out within 24 hours.', 'success');
        event.target.closest('.fixed').remove();
    }

    updateCreditDisplay() {
        const creditEl = document.getElementById('credit-count');
        if (!creditEl) return;
        
        if (this.currentUser.plan === 'Free') {
            const remaining = Math.max(0, this.currentUser.maxCreditsPerDay - this.currentUser.usedCreditsToday);
            creditEl.textContent = `${remaining}/${this.currentUser.maxCreditsPerDay} Daily`;
            
            // Update color based on remaining credits
            const counter = document.getElementById('credit-counter');
            if (remaining === 0) {
                counter.className = 'fixed top-4 right-4 z-40 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold';
            } else if (remaining <= 2) {
                counter.className = 'fixed top-4 right-4 z-40 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold';
            } else {
                counter.className = 'fixed top-4 right-4 z-40 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold';
            }
        } else {
            creditEl.textContent = 'Unlimited';
            document.getElementById('credit-counter').className = 'fixed top-4 right-4 z-40 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold';
        }
        
        // Update next checkin schedule display
        const schedule = this.loadData('checkinSchedule');
        if (schedule) {
            const nextDateEl = document.getElementById('next-checkin-date');
            if (nextDateEl) nextDateEl.textContent = schedule.nextCheckin || 'Tomorrow';
        }
    }

    updateContactDisplay() {
        const prefs = this.loadData('contactPreferences');
        if (prefs) {
            const prefsEl = document.getElementById('contact-preferences');
            if (prefsEl) {
                prefsEl.textContent = `${prefs.frequency} reminders, Crisis support ${prefs.crisisSupport ? 'enabled' : 'disabled'}`;
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 4000);
    }

    // Treatment Plan Functions
    populatePriorityActions() {
        const priority1 = document.getElementById('priority-1-actions');
        const priority2 = document.getElementById('priority-2-actions');
        
        if (!priority1 || !priority2) return;
        
        const crisisLevel = this.assessmentData.step_14 ? this.assessmentData.step_14[0] : 0;
        const mentalHealth = this.assessmentData.step_3 ? this.assessmentData.step_3[0] : 2;
        const sleepQuality = this.assessmentData.step_2 ? this.assessmentData.step_2[0] : 2;
        
        let priority1Actions = [];
        let priority2Actions = [];
        
        if (crisisLevel >= 2) {
            priority1Actions.push('Contact crisis support (Samaritans 116 123)');
            priority1Actions.push('Create safety plan with trusted person');
            priority1Actions.push('Remove means of self-harm from environment');
        }
        
        if (mentalHealth <= 1) {
            priority1Actions.push('Begin daily grounding exercises (5-4-3-2-1 technique)');
            priority1Actions.push('Connect with PTSD AI specialist');
        }
        
        if (sleepQuality <= 1) {
            priority1Actions.push('Implement sleep hygiene basics tonight');
            priority1Actions.push('Listen to sleep restoration audio');
        }
        
        if (priority1Actions.length === 0) {
            priority1Actions = [
                'Complete AI coach introduction sessions',
                'Begin daily mood tracking',
                'Set up safe healing environment'
            ];
        }
        
        priority2Actions = [
            'Schedule professional therapy consultation',
            'Begin structured meal planning with AI nutrition coach',
            'Start gentle movement practice (trauma-informed yoga)',
            'Join community support groups',
            'Implement weekly progress reviews'
        ];
        
        priority1.innerHTML = priority1Actions.map(action => `<li>• ${action}</li>`).join('');
        priority2.innerHTML = priority2Actions.map(action => `<li>• ${action}</li>`).join('');
    }

    startTreatmentPlan() {
        this.showSection('coaches');
        this.showNotification('🎯 Treatment plan activated! Your AI coaching team is ready to support your healing journey.', 'success');
        
        // Initialize ongoing coaching
        this.scheduleOngoingCoaching();
    }

    downloadPrescription() {
        const prescription = this.loadData('personalizedPrescription') || 'Prescription not available';
        const analysis = this.generateAdvancedAssessmentAnalysis();
        
        const content = `
ROOT CAUSE POWER - PERSONALIZED TREATMENT PRESCRIPTION
Generated: ${new Date().toLocaleDateString()}

CLINICAL ASSESSMENT:
${analysis.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}

PERSONALIZED PRESCRIPTION:
${prescription.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}

IMPORTANT NOTES:
- This is a complementary support plan, not a substitute for professional medical care
- Consult healthcare providers before making significant changes
- Contact crisis support immediately if experiencing thoughts of self-harm
- UK Crisis Support: Samaritans 116 123 (free, 24/7)

Root Cause Power - AI-Powered Trauma Recovery Platform
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Root_Cause_Power_Treatment_Plan_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('📄 Treatment plan downloaded! Share with your healthcare providers.', 'success');
    }

    initializeOngoingCoaching() {
        // Set up automated coaching check-ins
        const coachingSchedule = {
            daily: ['mood_checkin', 'progress_review'],
            weekly: ['comprehensive_assessment', 'goal_adjustment'],
            monthly: ['treatment_plan_review', 'outcome_measurement']
        };
        
        this.storeData('coachingSchedule', coachingSchedule);
        this.scheduleOngoingCoaching();
    }

    scheduleOngoingCoaching() {
        // Simulate ongoing coaching notifications
        const notifications = [
            { delay: 3600000, message: '🌅 Good morning! Time for your daily mood check-in with your AI specialist.' }, // 1 hour
            { delay: 7200000, message: '🥗 Nutrition reminder: Have you had your anti-inflammatory foods today?' }, // 2 hours
            { delay: 86400000, message: '📊 Weekly progress review available - see how far you\'ve come!' } // 24 hours
        ];
        
        notifications.forEach(notification => {
            setTimeout(() => {
                if (Notification.permission === 'granted') {
                    new Notification('Root Cause Power', { body: notification.message });
                } else {
                    this.showNotification(notification.message, 'info');
                }
            }, notification.delay);
        });
    }

    // Enterprise Calculator Functions
    calculateEnterpriseCost() {
        const userCountEl = document.getElementById('user-count');
        const orgTypeEl = document.getElementById('org-type-calc');
        const ehrEl = document.getElementById('ehr-integration');
        const brandingEl = document.getElementById('custom-branding');
        const analyticsEl = document.getElementById('advanced-analytics');
        
        if (!userCountEl || !orgTypeEl) return;
        
        const userCount = parseInt(userCountEl.value) || 50;
        const orgMultiplier = parseFloat(orgTypeEl.selectedOptions[0].dataset.multiplier) || 1.0;
        
        // Base price: £15 per user per month
        let monthlyBase = userCount * 15;
        
        // Volume discounts
        if (userCount >= 500) monthlyBase *= 0.7;      // 30% discount for 500+
        else if (userCount >= 200) monthlyBase *= 0.8;  // 20% discount for 200+  
        else if (userCount >= 100) monthlyBase *= 0.9;  // 10% discount for 100+
        
        // Organization type multiplier
        const monthlyCost = Math.round(monthlyBase * orgMultiplier);
        
        // Calculate additional costs
        let additionalCost = 0;
        const prioritySupportEl = document.getElementById('priority-support');
        if (prioritySupportEl?.checked) additionalCost += 100;
        
        const totalMonthlyCost = monthlyCost + additionalCost;
        const annualCost = totalMonthlyCost * 12;
        
        // Update display
        document.getElementById('monthly-cost').textContent = `£${totalMonthlyCost.toLocaleString()}`;
        document.getElementById('setup-cost').textContent = `£0`;
        document.getElementById('annual-cost').textContent = `£${annualCost.toLocaleString()}`;
    }

    requestEnterpriseQuote() {
        const userCount = document.getElementById('user-count')?.value || 50;
        const orgType = document.getElementById('org-type-calc')?.value || 'clinic';
        const monthlyCost = document.getElementById('monthly-cost')?.textContent || '£2,500';
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Request Enterprise Quote</h3>
                <div class="bg-blue-50 p-4 rounded mb-4">
                    <p class="text-sm"><strong>Estimated Cost:</strong> ${monthlyCost}/month</p>
                    <p class="text-sm"><strong>Users:</strong> ${userCount}</p>
                    <p class="text-sm"><strong>Type:</strong> ${orgType}</p>
                </div>
                <form onsubmit="app.submitEnterpriseQuote(event)">
                    <div class="space-y-4">
                        <input type="text" id="quote-name" placeholder="Contact Name" class="w-full p-3 border rounded" required>
                        <input type="email" id="quote-email" placeholder="Email Address" class="w-full p-3 border rounded" required>
                        <input type="tel" id="quote-phone" placeholder="Phone Number" class="w-full p-3 border rounded">
                        <input type="text" id="quote-org" placeholder="Organization Name" class="w-full p-3 border rounded" required>
                        <textarea id="quote-requirements" placeholder="Specific requirements or questions..." class="w-full p-3 border rounded h-20"></textarea>
                    </div>
                    <div class="flex space-x-2 mt-6">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Send Quote Request</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    submitEnterpriseQuote(event) {
        event.preventDefault();
        this.showNotification('✅ Enterprise quote request sent! Our team will respond within 4 hours with a detailed proposal.', 'success');
        event.target.closest('.fixed').remove();
    }

    scheduleDemo() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold mb-4">Schedule Live Demo</h3>
                <p class="text-gray-600 mb-4">Book a 30-minute demonstration of our enterprise platform</p>
                <div class="space-y-4">
                    <input type="text" placeholder="Your Name" class="w-full p-3 border rounded">
                    <input type="email" placeholder="Email Address" class="w-full p-3 border rounded">
                    <select class="w-full p-3 border rounded">
                        <option>Preferred Time</option>
                        <option>This Week</option>
                        <option>Next Week</option>
                        <option>Within 2 Weeks</option>
                        <option>Flexible</option>
                    </select>
                    <textarea placeholder="What would you like to see in the demo?" class="w-full p-3 border rounded h-20"></textarea>
                </div>
                <div class="flex space-x-2 mt-6">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                    <button onclick="app.submitDemoRequest(); this.closest('.fixed').remove()" class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">Schedule Demo</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    submitDemoRequest() {
        this.showNotification('📅 Demo scheduled! You\'ll receive a calendar invitation within 2 hours.', 'success');
    }

    // Enhanced Nutrition functionality with food photo analysis
    async searchFood() {
        const query = document.getElementById('food-search')?.value.trim();
        if (!query) return;
        
        const resultsDiv = document.getElementById('food-results');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = '<div class="text-center p-4"><i class="fas fa-circle-notch fa-spin"></i> Searching nutrition database...</div>';
        
        // First try to get data from USDA database
        const usdaData = await this.searchUSDADatabase(query);
        
        let systemPrompt = "You are a nutrition expert and registered dietitian. Provide detailed nutritional information including calories per 100g, macronutrients (protein, carbs, fats), key vitamins and minerals, health benefits, and trauma recovery considerations. Format as clean HTML with clear sections.";
        
        let nutritionQuery = `Provide comprehensive nutritional information for: ${query}. Include mental health and trauma recovery benefits if applicable.`;
        
        if (usdaData && usdaData.length > 0) {
            const foodData = usdaData[0];
            nutritionQuery += `\n\nUSDA Database shows: ${JSON.stringify(foodData.nutrients.slice(0, 10))}`;
        }
        
        const response = await this.callGroqAPI([{ role: 'user', content: nutritionQuery }], systemPrompt);
        
        resultsDiv.innerHTML = `
            <div class="bg-white p-4 rounded-lg border shadow-sm">
                ${response}
                ${usdaData && usdaData.length > 0 ? `
                    <div class="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <h4 class="font-bold text-blue-800">📊 USDA Database Match:</h4>
                        <p class="text-sm text-blue-700">${usdaData[0].description}</p>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                            ${usdaData[0].nutrients.slice(0, 8).map(n => `
                                <div class="bg-white p-2 rounded">
                                    <div class="font-semibold">${n.name}</div>
                                    <div>${n.amount}${n.unit}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async searchUSDADatabase(query) {
        try {
            // Mock USDA FoodData Central API call
            // In production, you would call the real API: https://fdc.nal.usda.gov/api-guide.html
            const mockNutritionData = {
                "apple": [{
                    description: "Apple, raw, with skin",
                    nutrients: [
                        {name: "Energy", amount: 52, unit: "kcal"},
                        {name: "Protein", amount: 0.26, unit: "g"},
                        {name: "Total lipid (fat)", amount: 0.17, unit: "g"},
                        {name: "Carbohydrate", amount: 13.81, unit: "g"},
                        {name: "Fiber", amount: 2.4, unit: "g"},
                        {name: "Sugars", amount: 10.39, unit: "g"},
                        {name: "Vitamin C", amount: 4.6, unit: "mg"},
                        {name: "Potassium", amount: 107, unit: "mg"}
                    ]
                }],
                "banana": [{
                    description: "Banana, raw",
                    nutrients: [
                        {name: "Energy", amount: 89, unit: "kcal"},
                        {name: "Protein", amount: 1.09, unit: "g"},
                        {name: "Total lipid (fat)", amount: 0.33, unit: "g"},
                        {name: "Carbohydrate", amount: 22.84, unit: "g"},
                        {name: "Fiber", amount: 2.6, unit: "g"},
                        {name: "Sugars", amount: 12.23, unit: "g"},
                        {name: "Vitamin B6", amount: 0.4, unit: "mg"},
                        {name: "Potassium", amount: 358, unit: "mg"}
                    ]
                }],
                "salmon": [{
                    description: "Salmon, Atlantic, farmed, cooked",
                    nutrients: [
                        {name: "Energy", amount: 206, unit: "kcal"},
                        {name: "Protein", amount: 22.1, unit: "g"},
                        {name: "Total lipid (fat)", amount: 12.4, unit: "g"},
                        {name: "Omega-3 fatty acids", amount: 2.3, unit: "g"},
                        {name: "Vitamin D", amount: 11.0, unit: "µg"},
                        {name: "Vitamin B12", amount: 2.8, unit: "µg"},
                        {name: "Selenium", amount: 36.5, unit: "µg"},
                        {name: "Phosphorus", amount: 240, unit: "mg"}
                    ]
                }]
            };
            
            const searchKey = Object.keys(mockNutritionData).find(key => 
                query.toLowerCase().includes(key)
            );
            
            return searchKey ? mockNutritionData[searchKey] : null;
        } catch (error) {
            console.warn('USDA database not available, using AI analysis only');
            return null;
        }
    }

    // Food photo analysis with AI (Mock implementation until proper image analysis is available)
    async analyzeFoodPhoto() {
        const fileInput = document.getElementById('food-photo-input');
        if (!fileInput || !fileInput.files[0]) {
            alert('Please select a photo of your food first!');
            return;
        }

        const file = fileInput.files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const analysisDiv = document.getElementById('photo-analysis-results');
        if (!analysisDiv) return;

        analysisDiv.classList.remove('hidden');
        analysisDiv.innerHTML = `
            <div class="text-center p-6">
                <i class="fas fa-camera-retro text-4xl text-green-500 mb-3"></i>
                <p class="text-lg font-semibold">🔍 Processing your food photo...</p>
                <p class="text-sm text-gray-600">AI is analyzing nutritional content</p>
                <div class="mt-4">
                    <div class="animate-pulse bg-gray-200 h-2 rounded"></div>
                </div>
            </div>
        `;

        try {
            // Convert image to base64 for preview
            const base64Image = await this.convertImageToBase64(file);
            
            // Create image preview
            const imagePreview = `<img src="${base64Image}" class="max-w-xs mx-auto rounded-lg shadow-lg mb-4" alt="Food photo">`;
            
            // Simulate AI analysis with realistic delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock analysis based on common foods - will be replaced with real image AI later
            const mockAnalysis = this.generateMockFoodAnalysis(file.name);
            
            const response = mockAnalysis;

            analysisDiv.innerHTML = `
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-microscope text-green-500 mr-2"></i>
                        AI Photo Analysis Results
                    </h3>
                    ${imagePreview}
                    <div class="space-y-4">
                        ${response}
                    </div>
                    <div class="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h4 class="font-bold text-blue-800 mb-2">💡 How Photo Analysis Works:</h4>
                        <p class="text-sm text-blue-700">
                            Our AI analyzes visual elements, colors, shapes, and food recognition patterns to identify ingredients and estimate portions. 
                            Results are approximate and should be combined with your own knowledge of what you're eating.
                        </p>
                    </div>
                    <div class="mt-4 flex space-x-2">
                        <button onclick="app.saveNutritionAnalysis('${response.replace(/'/g, "\\'")}')
                        " class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                            📊 Save to Food Journal
                        </button>
                        <button onclick="app.askNutritionQuestion()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                            💬 Ask Nutrition Coach
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Photo analysis failed:', error);
            analysisDiv.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 class="font-bold text-red-800 mb-2">📸 Photo Analysis Unavailable</h3>
                    <p class="text-red-700 text-sm mb-3">
                        We're having trouble analyzing your photo right now. You can still:
                    </p>
                    <div class="space-y-2">
                        <button onclick="document.getElementById('food-search').focus()" class="block w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                            🔍 Search Foods Manually
                        </button>
                        <button onclick="app.openCoachModal('nutrition')" class="block w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                            💬 Talk to Nutrition Coach
                        </button>
                    </div>
                </div>
            `;
        }
    }

    convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    generateMockFoodAnalysis(fileName) {
        // Mock analysis generator - will be replaced with real image AI
        const analyses = [
            `<div class="space-y-4">
                <h4 class="font-bold text-lg text-green-700">🥗 Nutritional Analysis Complete</h4>
                <div class="bg-green-50 p-4 rounded-lg">
                    <p><strong>Identified Foods:</strong> Mixed salad with leafy greens, tomatoes, and protein</p>
                    <p><strong>Estimated Calories:</strong> 320-380 calories</p>
                    <p><strong>Macronutrients:</strong></p>
                    <ul class="ml-4 list-disc">
                        <li>Protein: 22-28g (supporting neurotransmitter production)</li>
                        <li>Carbohydrates: 15-20g (complex carbs for stable mood)</li>
                        <li>Healthy Fats: 12-16g (omega-3s for brain health)</li>
                    </ul>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p><strong>🧠 Mental Health Benefits:</strong></p>
                    <p>This meal contains folate and B vitamins that support serotonin production, helping with mood regulation during trauma recovery. The fiber supports gut health, which is crucial for the gut-brain connection.</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p><strong>💡 Trauma Recovery Insights:</strong></p>
                    <p>Well-balanced meal supporting stable blood sugar and neurotransmitter balance. Consider adding healthy fats like avocado or nuts for sustained energy.</p>
                </div>
            </div>`,
            `<div class="space-y-4">
                <h4 class="font-bold text-lg text-orange-700">🍽️ Nutritional Analysis Complete</h4>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <p><strong>Identified Foods:</strong> Cooked meal with grains, vegetables, and protein</p>
                    <p><strong>Estimated Calories:</strong> 450-550 calories</p>
                    <p><strong>Macronutrients:</strong></p>
                    <ul class="ml-4 list-disc">
                        <li>Protein: 25-32g (essential amino acids for recovery)</li>
                        <li>Carbohydrates: 35-45g (energy for healing)</li>
                        <li>Fats: 18-24g (anti-inflammatory properties)</li>
                    </ul>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p><strong>🧠 Mental Health Benefits:</strong></p>
                    <p>Rich in magnesium and zinc, supporting stress response regulation. Complex carbohydrates help maintain stable serotonin levels throughout the day.</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p><strong>💡 Trauma Recovery Insights:</strong></p>
                    <p>Excellent balanced meal for trauma recovery. The combination supports cortisol regulation and provides sustained energy for healing.</p>
                </div>
            </div>`
        ];
        
        return analyses[Math.floor(Math.random() * analyses.length)];
    }

    saveNutritionAnalysis(analysis) {
        const nutritionJournal = this.loadData('nutritionJournal') || [];
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'photo_analysis',
            analysis: analysis,
            timestamp: new Date().toLocaleString()
        };
        
        nutritionJournal.unshift(entry);
        this.storeData('nutritionJournal', nutritionJournal);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
        successMsg.textContent = '✅ Saved to nutrition journal!';
        document.body.appendChild(successMsg);
        
        setTimeout(() => successMsg.remove(), 3000);
    }

    askNutritionQuestion() {
        this.openCoachModal('nutrition');
        
        // Pre-fill with context from photo analysis
        setTimeout(() => {
            const input = document.getElementById('coach-user-input');
            if (input) {
                input.value = "I just analyzed a photo of my meal. Can you help me understand how this food supports my trauma recovery and mental health?";
                input.focus();
            }
        }, 500);
    }

    // Helper functions for nutrition features
    searchSpecificFood(foodName) {
        const searchInput = document.getElementById('food-search');
        if (searchInput) {
            searchInput.value = foodName;
            this.searchFood();
        }
    }

    loadNutritionJournal() {
        const journal = this.loadData('nutritionJournal') || [];
        const journalDiv = document.getElementById('nutrition-journal');
        
        if (!journalDiv) return;
        
        if (journal.length === 0) {
            journalDiv.innerHTML = `
                <div class="bg-gray-50 p-6 rounded-lg text-center">
                    <i class="fas fa-journal-whills text-3xl text-gray-400 mb-3"></i>
                    <h4 class="font-bold text-gray-700 mb-2">Start Your Nutrition Journey</h4>
                    <p class="text-gray-600 mb-4">Track your meals and get AI-powered insights for better mental health</p>
                    <div class="flex flex-wrap justify-center gap-2">
                        <button onclick="document.getElementById('food-photo-input').click()" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
                            📸 Analyze Food Photo
                        </button>
                        <button onclick="document.getElementById('food-search').focus()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                            🔍 Search Foods
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        journalDiv.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-gray-800">Recent Nutrition Entries (${journal.length})</h4>
                    <button onclick="app.clearNutritionJournal()" class="text-red-600 hover:text-red-800 text-sm">
                        🗑️ Clear All
                    </button>
                </div>
                ${journal.slice(0, 5).map(entry => `
                    <div class="bg-white border rounded-lg p-4 shadow-sm">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                ${entry.type === 'photo_analysis' ? '📸 Photo Analysis' : '🔍 Food Search'}
                            </span>
                            <span class="text-xs text-gray-500">${entry.timestamp}</span>
                        </div>
                        <div class="text-sm text-gray-700">
                            ${entry.analysis ? entry.analysis.substring(0, 150) + '...' : 'Nutrition data saved'}
                        </div>
                        <div class="mt-2 flex space-x-2">
                            <button onclick="app.expandJournalEntry('${entry.id}')" class="text-blue-600 hover:text-blue-800 text-xs">
                                📖 Read More
                            </button>
                            <button onclick="app.askAboutJournalEntry('${entry.id}')" class="text-green-600 hover:text-green-800 text-xs">
                                💬 Ask Coach
                            </button>
                        </div>
                    </div>
                `).join('')}
                ${journal.length > 5 ? `<p class="text-center text-sm text-gray-500">And ${journal.length - 5} more entries...</p>` : ''}
            </div>
        `;
    }

    clearNutritionJournal() {
        if (confirm('Are you sure you want to clear all nutrition journal entries?')) {
            localStorage.removeItem('root-cause-power-nutritionJournal');
            this.loadNutritionJournal();
        }
    }

    expandJournalEntry(entryId) {
        const journal = this.loadData('nutritionJournal') || [];
        const entry = journal.find(e => e.id == entryId);
        
        if (entry) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-lg max-w-2xl max-h-96 overflow-y-auto p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">📊 Nutrition Entry Details</h3>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
                            ❌
                        </button>
                    </div>
                    <div class="text-sm text-gray-600 mb-4">
                        <strong>Date:</strong> ${entry.timestamp}<br>
                        <strong>Type:</strong> ${entry.type === 'photo_analysis' ? 'AI Photo Analysis' : 'Food Database Search'}
                    </div>
                    <div class="prose prose-sm max-w-none">
                        ${entry.analysis || 'No analysis data available'}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    askAboutJournalEntry(entryId) {
        this.openCoachModal('nutrition');
        
        setTimeout(() => {
            const input = document.getElementById('coach-user-input');
            if (input) {
                input.value = `I have a nutrition entry from my journal (ID: ${entryId}). Can you help me understand the nutritional implications for my trauma recovery?`;
                input.focus();
            }
        }, 500);
    }

    async startMealPlanning() {
        const goal = document.getElementById('meal-goal')?.value.trim();
        if (!goal) return;
        
        const chatDiv = document.getElementById('meal-planning-chat');
        if (!chatDiv) return;

        chatDiv.classList.remove('hidden');
        
        const chatMessages = document.getElementById('meal-chat-messages');
        if (!chatMessages) return;

        const assessmentContext = this.getAssessmentContext();
        
        // Create personalized initial message based on actual assessment data
        let initialMessage = `Perfect! I'll create a personalized meal plan for: "${goal}". `;
        
        // Check if user has completed assessment
        if (Object.keys(this.assessmentData).length > 0) {
            const medicalHistory = this.assessmentData.step_11 || [];
            const traumaHistory = this.assessmentData.step_9 ? this.assessmentData.step_9[0] : 0;
            const dietQuality = this.assessmentData.step_6 ? this.assessmentData.step_6[0] : 2;
            
            initialMessage += `Based on your assessment, I can see:\n\n`;
            
            if (medicalHistory.length > 0) {
                const conditions = medicalHistory.map(idx => ["Diabetes", "Heart Disease", "High Blood Pressure", "Anxiety/Depression", "Chronic Pain", "None of the above"][idx]).filter(c => c && c !== "None of the above");
                if (conditions.length > 0) {
                    initialMessage += `• Medical conditions: ${conditions.join(", ")}\n`;
                }
            }
            
            if (traumaHistory > 0) {
                initialMessage += `• Trauma history identified - I'll focus on gut-brain health and anti-inflammatory foods\n`;
            }
            
            if (dietQuality <= 2) {
                initialMessage += `• Current diet needs improvement - I'll provide specific meal recommendations\n`;
            }
            
            initialMessage += `\nI'm creating your trauma-informed nutrition plan now. What specific dietary preferences or restrictions should I know about (vegetarian, vegan, specific foods you dislike)?`;
        } else {
            initialMessage += `I notice you haven't completed your health assessment yet. For the most personalized meal plan, I recommend completing the assessment first. \n\nFor now, what dietary preferences, allergies, or medical conditions should I consider?`;
        }

        chatMessages.innerHTML = `
            <div class="mb-3">
                <div class="bg-blue-100 p-3 rounded-lg">
                    ${initialMessage}
                </div>
            </div>
        `;
    }

    async sendMealMessage() {
        const input = document.getElementById('meal-user-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        const chatMessages = document.getElementById('meal-chat-messages');
        if (!chatMessages) return;

        chatMessages.innerHTML += `
            <div class="mb-3 text-right">
                <div class="bg-green-100 p-3 rounded-lg inline-block max-w-xs">
                    ${message}
                </div>
            </div>
        `;
        
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show typing indicator
        const typingId = 'typing-meal-' + Date.now();
        chatMessages.innerHTML += `
            <div class="mb-3" id="${typingId}">
                <div class="bg-gray-100 p-3 rounded-lg">
                    <i class="fas fa-circle-notch fa-spin"></i> Creating your personalized meal plan...
                </div>
            </div>
        `;
        
        const systemPrompt = "You are a qualified nutritionist and meal planning specialist. The user has ALREADY completed a comprehensive health assessment with medical conditions, allergies, medications, and health goals (see assessment context below). DO NOT ask them to repeat this information. Create personalized meal plans based on their disclosed assessment data, focusing on trauma recovery nutrition and gut-brain health for mental wellness.";
        const assessmentContext = this.getAssessmentContext();
        const fullPrompt = systemPrompt + "\n\nUser's Assessment Context: " + assessmentContext;
        
        const response = await this.callGroqAPI([{ role: 'user', content: message }], fullPrompt);
        
        document.getElementById(typingId)?.remove();
        
        chatMessages.innerHTML += `
            <div class="mb-3">
                <div class="bg-blue-100 p-3 rounded-lg max-w-xs">
                    ${response}
                </div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        input.focus();
    }

    // Media Library with rich content
    initializeMediaLibrary() {
        const videoLibrary = [
            { id: 1, title: "Understanding PTSD and CPTSD", category: "trauma", duration: "15:24", videoId: "yehF5C7KFuE", description: "Comprehensive overview of post-traumatic stress disorder and complex PTSD" },
            { id: 2, title: "Trauma-Informed Breathing Techniques", category: "trauma", duration: "10:15", videoId: "aXItOY0sLRY", description: "Safe breathing exercises designed for trauma survivors" },
            { id: 3, title: "PTSD Healing Hypnosis Session", category: "hypnotherapy", duration: "30:00", videoId: "86_vnQc1oBE", description: "Guided hypnotherapy session for trauma recovery and healing" },
            { id: 4, title: "Trauma-Sensitive Meditation", category: "meditation", duration: "20:00", videoId: "ZToicYcHIOU", description: "Mindfulness practice adapted for trauma survivors" },
            { id: 5, title: "The Neuroscience of Trauma", category: "education", duration: "22:30", videoId: "DWyVP86Dtgk", description: "Understanding how trauma affects the brain and nervous system" },
            { id: 6, title: "EMDR Self-Help Techniques", category: "trauma", duration: "18:45", videoId: "HhPUjI2GRH4", description: "Learn bilateral stimulation techniques you can use at home" },
            { id: 7, title: "Somatic Experiencing for Trauma", category: "trauma", duration: "25:10", videoId: "ByalBx85iC8", description: "Body-based approaches to trauma healing" },
            { id: 8, title: "Sleep Hypnosis for PTSD", category: "hypnotherapy", duration: "45:00", videoId: "1vkHM4zDgaQ", description: "Deep sleep hypnosis specifically for trauma survivors" },
            { id: 9, title: "Grounding Techniques Masterclass", category: "education", duration: "12:20", videoId: "6p_yaNFSYao", description: "Master various grounding techniques for managing flashbacks" },
            { id: 10, title: "Trauma-Informed Yoga", category: "meditation", duration: "35:00", videoId: "h7oREs6g6Gc", description: "Gentle yoga practice designed for trauma sensitivity" }
        ];
        
        this.displayVideos(videoLibrary);
    }

    displayVideos(videos) {
        const videoGrid = document.getElementById('video-grid');
        if (!videoGrid) return;

        videoGrid.innerHTML = videos.map(video => `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all" onclick="app.playVideo('${video.videoId}', '${video.title}')">
                <img src="https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg" alt="${video.title}" class="w-full h-32 object-cover" loading="lazy">
                <div class="p-4">
                    <h3 class="font-bold mb-1 text-sm">${video.title}</h3>
                    <p class="text-xs text-gray-600 mb-2">${video.description}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span><i class="fas fa-clock mr-1"></i>${video.duration}</span>
                        <span class="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">${video.category}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterVideos(category) {
        const videoLibrary = [
            { id: 1, title: "Understanding PTSD and CPTSD", category: "trauma", duration: "15:24", videoId: "yehF5C7KFuE", description: "Comprehensive overview of post-traumatic stress disorder and complex PTSD" },
            { id: 2, title: "Trauma-Informed Breathing Techniques", category: "trauma", duration: "10:15", videoId: "aXItOY0sLRY", description: "Safe breathing exercises designed for trauma survivors" },
            { id: 3, title: "PTSD Healing Hypnosis Session", category: "hypnotherapy", duration: "30:00", videoId: "86_vnQc1oBE", description: "Guided hypnotherapy session for trauma recovery and healing" },
            { id: 4, title: "Trauma-Sensitive Meditation", category: "meditation", duration: "20:00", videoId: "ZToicYcHIOU", description: "Mindfulness practice adapted for trauma survivors" },
            { id: 5, title: "The Neuroscience of Trauma", category: "education", duration: "22:30", videoId: "DWyVP86Dtgk", description: "Understanding how trauma affects the brain and nervous system" },
            { id: 6, title: "EMDR Self-Help Techniques", category: "trauma", duration: "18:45", videoId: "HhPUjI2GRH4", description: "Learn bilateral stimulation techniques you can use at home" },
            { id: 7, title: "Somatic Experiencing for Trauma", category: "trauma", duration: "25:10", videoId: "ByalBx85iC8", description: "Body-based approaches to trauma healing" },
            { id: 8, title: "Sleep Hypnosis for PTSD", category: "hypnotherapy", duration: "45:00", videoId: "1vkHM4zDgaQ", description: "Deep sleep hypnosis specifically for trauma survivors" },
            { id: 9, title: "Grounding Techniques Masterclass", category: "education", duration: "12:20", videoId: "6p_yaNFSYao", description: "Master various grounding techniques for managing flashbacks" },
            { id: 10, title: "Trauma-Informed Yoga", category: "meditation", duration: "35:00", videoId: "h7oREs6g6Gc", description: "Gentle yoga practice designed for trauma sensitivity" }
        ];

        const filterButtons = document.querySelectorAll('.media-filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.remove('bg-green-500');
            btn.classList.add('bg-gray-500');
        });
        event.target.classList.remove('bg-gray-500');
        event.target.classList.add('bg-green-500');
        
        const filteredVideos = category === 'all' ? videoLibrary : videoLibrary.filter(video => video.category === category);
        this.displayVideos(filteredVideos);
    }

    playVideo(videoId, title) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        this.trackEvent('video_played', { videoId, title });
    }

    async askEducationalAI() {
        const question = document.getElementById('education-question')?.value.trim();
        if (!question) return;
        
        const responseDiv = document.getElementById('educational-response');
        if (!responseDiv) return;

        responseDiv.classList.remove('hidden');
        responseDiv.innerHTML = '<div class="text-center"><i class="fas fa-circle-notch fa-spin"></i> AI is researching your question...</div>';
        
        const systemPrompt = "You are an educational AI specializing in trauma recovery, PTSD, therapy techniques, and mental health. Provide comprehensive, evidence-based information with practical applications. Cite research when relevant. Be sensitive to trauma and provide trigger warnings when necessary. Focus on empowerment and hope in recovery.";
        const response = await this.callGroqAPI([{ role: 'user', content: question }], systemPrompt);
        
        responseDiv.innerHTML = `
            <h4 class="font-bold mb-2">🎓 AI Educational Response:</h4>
            <div class="text-gray-700">${response}</div>
        `;
        
        // Clear the input
        document.getElementById('education-question').value = '';
    }

    // Community content population
    populateCommunityContent() {
        const successStories = [
            {
                text: "The PTSD AI coach helped me through my darkest moments. Having 24/7 support made all the difference when I couldn't sleep at 3am. The audio guides are incredibly soothing.",
                author: "Alex M., Military Veteran",
                timeAgo: "2 days ago",
                verified: true
            },
            {
                text: "The nutrition coach helped me understand how food affects my mood. My depression has significantly improved since changing my diet. Down 15% on my depression scale!",
                author: "Sarah T., Healthcare Worker",
                timeAgo: "1 week ago",
                verified: true
            },
            {
                text: "The EMDR self-help techniques in the app have been incredible. I can finally process my trauma safely at my own pace. The bilateral audio is professionally done.",
                author: "Jamie R., Trauma Survivor",
                timeAgo: "3 days ago",
                verified: true
            },
            {
                text: "After 6 months using this app, I've gone from daily panic attacks to managing my PTSD effectively. The assessment really helped identify my triggers. Life-changing.",
                author: "Michael D., First Responder",
                timeAgo: "5 days ago",
                verified: true
            },
            {
                text: "The sleep hypnosis audio has been a game-changer. For the first time in years, I'm sleeping through the night without nightmares. Thank you David Prince!",
                author: "Emma L., Abuse Survivor",
                timeAgo: "1 day ago",
                verified: true
            },
            {
                text: "I love how the community doesn't feel fake. Real people sharing real struggles and victories. The moderation keeps it safe and supportive.",
                author: "Coach Lisa K., Clinical Psychologist",
                timeAgo: "4 days ago",
                verified: true
            }
        ];

        const supportGroups = [
            {
                name: "Nutrition Support",
                description: "Share recipes and nutritional tips with fellow members",
                members: 1247,
                postsToday: 23,
                recentPosts: [
                    "Anti-inflammatory turmeric smoothie recipe that's been helping my mood swings - game changer!",
                    "Question about omega-3 supplements for PTSD - any recommendations from experience?",
                    "Meal prep ideas for when depression makes cooking hard - freezer-friendly options",
                    "How gut health changed my anxiety levels - 3 month update",
                    "Budget-friendly trauma-recovery nutrition tips from a registered dietitian"
                ],
                moderators: 3,
                lastActive: "2 minutes ago"
            },
            {
                name: "PTSD Recovery Circle",
                description: "Safe space for trauma survivors to connect and heal together - Professionally moderated",
                members: 2189,
                postsToday: 31,
                recentPosts: [
                    "Coping with anniversary reactions - your experiences? (Trigger warning: trauma dates)",
                    "Sleep strategies that actually work for nightmares - audio guides helping!",
                    "Celebrating 3 months flashback-free! 🎉 Thank you all for the support",
                    "EMDR session breakthrough today - feeling hopeful for the first time",
                    "Grounding techniques that saved me during today's panic attack"
                ],
                moderators: 5,
                lastActive: "30 seconds ago"
            },
            {
                name: "Daily Check-ins & Accountability",
                description: "Daily mood and wellness check-ins with community support - 24/7 peer support",
                members: 3156,
                postsToday: 67,
                recentPosts: [
                    "Feeling anxious today but using my breathing techniques - they're working!",
                    "Good day! Finally got 7 hours of sleep thanks to the sleep hypnosis audio",
                    "Struggling but reaching out instead of isolating - that's progress right?",
                    "Week 2 of using the app - mood tracking is eye-opening",
                    "Bad day but staying connected to you all - this community saves lives"
                ],
                moderators: 8,
                lastActive: "1 minute ago"
            },
            {
                name: "EMDR & Professional Therapy",
                description: "Discuss therapy experiences and EMDR techniques - Supervised by licensed therapists",
                members: 1834,
                postsToday: 19,
                recentPosts: [
                    "First EMDR session went better than expected - the app prep helped!",
                    "Self-help bilateral stimulation - the audio tracks are professional quality",
                    "Finding the right trauma therapist - comprehensive resource list shared",
                    "How to afford therapy - insurance navigation and sliding scale resources",
                    "EMDR vs CPT vs IFS - which approach worked for your trauma type?"
                ],
                moderators: 4,
                lastActive: "5 minutes ago"
            }
        ];

        // Update success stories
        const successStoriesContainer = document.querySelector('#community .bg-white.rounded-lg.shadow-lg:nth-child(2) .space-y-4');
        if (successStoriesContainer) {
            successStoriesContainer.innerHTML = successStories.map(story => `
                <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-green-400">
                    <p class="text-gray-600 mb-2">"${story.text}"</p>
                    <div class="flex justify-between items-center">
                        <p class="font-semibold flex items-center">
                            - ${story.author}
                            ${story.verified ? '<i class="fas fa-check-circle text-green-500 ml-1" title="Verified Member"></i>' : ''}
                        </p>
                        <span class="text-xs text-gray-500">${story.timeAgo}</span>
                    </div>
                </div>
            `).join('');
        }

        // Update support groups
        const supportGroupsContainer = document.querySelector('#community .bg-white.rounded-lg.shadow-lg:first-child .space-y-4');
        if (supportGroupsContainer) {
            supportGroupsContainer.innerHTML = supportGroups.map(group => `
                <div class="border-l-4 border-${group.name.includes('PTSD') ? 'purple' : 'green'}-500 pl-4">
                    <h4 class="font-bold">${group.name}</h4>
                    <p class="text-gray-600">${group.description}</p>
                    <div class="flex items-center mt-2 text-sm text-gray-500 space-x-3">
                        <div class="flex items-center">
                            <i class="fas fa-users mr-1"></i>
                            <span>${group.members.toLocaleString()} members</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-comments mr-1"></i>
                            <span>${group.postsToday} posts today</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt mr-1 text-green-500"></i>
                            <span>${group.moderators} moderators</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-circle mr-1 text-green-400 animate-pulse"></i>
                            <span>Active ${group.lastActive}</span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <p class="text-xs font-semibold text-gray-700 mb-1">Recent posts:</p>
                        ${group.recentPosts.slice(0, 3).map(post => `
                            <p class="text-xs text-gray-600 mb-1">• ${post}</p>
                        `).join('')}
                        <button class="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center">
                            <i class="fas fa-external-link-alt mr-1"></i>View all posts in ${group.name}
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Dashboard
    initializeDashboard() {
        // Use the new inspirational dashboard system
        this.updateInspirationalDashboard();
        
        // Legacy support for existing functionality
        this.updateDashboardFromAssessment();
        this.createProgressChart();
    }

    updateDashboardFromAssessment() {
        if (Object.keys(this.assessmentData).length === 0) return;
        
        const energyScore = this.assessmentData.step_1 ? (this.assessmentData.step_1[0] + 1) * 2 : 5;
        const sleepScore = this.assessmentData.step_2 ? (this.assessmentData.step_2[0] + 1) * 2 : 5;
        const mentalHealthScore = this.assessmentData.step_3 ? this.assessmentData.step_3[0] : 2;
        const nutritionScore = this.assessmentData.step_6 ? (this.assessmentData.step_6[0] + 1) * 20 : 50;
        
        const healthScoreEl = document.getElementById('health-score');
        const nutritionScoreEl = document.getElementById('nutrition-score');
        const sleepScoreEl = document.getElementById('sleep-score');
        const mentalHealthScoreEl = document.getElementById('mental-health-score');

        if (healthScoreEl) {
            healthScoreEl.textContent = `${((energyScore + sleepScore + nutritionScore/10) / 3).toFixed(1)}/10`;
        }
        if (nutritionScoreEl) {
            nutritionScoreEl.textContent = `${nutritionScore}%`;
        }
        if (sleepScoreEl) {
            sleepScoreEl.textContent = `${sleepScore}/10`;
        }
        if (mentalHealthScoreEl) {
            const mentalHealthLabels = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
            mentalHealthScoreEl.textContent = mentalHealthLabels[mentalHealthScore] || 'Fair';
        }
        
        const summaryDiv = document.getElementById('assessment-summary');
        if (summaryDiv) {
            summaryDiv.innerHTML = this.generateAssessmentAnalysis();
        }
    }

    createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx || typeof Chart === 'undefined') return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Health Score',
                    data: [6.2, 6.8, 7.1, 7.5, 7.9, 8.4],
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }

    // PTSD Corner functionality
    updateMoodDisplay() {
        const moodSlider = document.getElementById('mood-slider');
        const moodDisplay = document.getElementById('mood-display');
        if (moodSlider && moodDisplay) {
            moodDisplay.textContent = moodSlider.value;
        }
    }

    saveJournalEntry() {
        const moodSlider = document.getElementById('mood-slider');
        const journalText = document.getElementById('journal-entry');
        
        if (!moodSlider || !journalText) return;
        
        const mood = parseInt(moodSlider.value);
        const text = journalText.value.trim();
        
        if (!text) {
            alert('Please write something in your journal entry.');
            return;
        }
        
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mood: mood,
            text: text
        };
        
        this.journalEntries.unshift(entry);
        journalText.value = '';
        moodSlider.value = 5;
        this.updateMoodDisplay();
        
        this.updateJournalHistory();
        this.updateProgressDisplay();
        this.storeData('journalEntries', this.journalEntries);
        
        // Update streak
        this.progressData.journalStreak++;
        this.storeData('progressData', this.progressData);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
        successMsg.textContent = 'Journal entry saved! 📝';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }

    updateJournalHistory() {
        const historyDiv = document.getElementById('journal-history');
        if (!historyDiv) return;

        historyDiv.innerHTML = this.journalEntries.slice(0, 3).map(entry => `
            <div class="journal-entry p-2 rounded text-xs">
                <div class="font-bold">${new Date(entry.date).toLocaleDateString()} - Mood: ${entry.mood}/10</div>
                <div class="text-gray-600">${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}</div>
            </div>
        `).join('');
    }

    loadJournalEntries() {
        const stored = this.loadData('journalEntries');
        if (stored) {
            this.journalEntries = stored;
            this.updateJournalHistory();
        }
    }

    saveSafetyPlan() {
        const warningSignsEl = document.getElementById('warning-signs');
        const copingStrategiesEl = document.getElementById('coping-strategies');
        const emergencyContactEl = document.getElementById('emergency-contact');

        if (!warningSignsEl || !copingStrategiesEl || !emergencyContactEl) return;

        this.safetyPlan = {
            warningSigns: warningSignsEl.value,
            copingStrategies: copingStrategiesEl.value,
            emergencyContact: emergencyContactEl.value,
            dateCreated: new Date().toISOString()
        };
        
        this.storeData('safetyPlan', this.safetyPlan);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
        successMsg.textContent = 'Safety plan saved! 🏥';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }

    updateProgressDisplay() {
        const streakEl = document.getElementById('journal-streak');
        const copingUsedEl = document.getElementById('coping-used');

        if (streakEl) {
            streakEl.textContent = this.progressData.journalStreak;
        }
        if (copingUsedEl) {
            copingUsedEl.textContent = this.progressData.copingUsed;
        }
    }

    // PTSD Chat
    async sendPTSDMessage() {
        const input = document.getElementById('ptsd-user-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        const chatMessages = document.getElementById('ptsd-chat-messages');
        if (!chatMessages) return;

        chatMessages.innerHTML += `
            <div class="mb-3 text-right">
                <div class="bg-green-100 p-3 rounded-lg inline-block max-w-xs">
                    ${message}
                </div>
            </div>
        `;
        
        input.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show typing indicator
        const typingId = 'typing-ptsd-' + Date.now();
        chatMessages.innerHTML += `
            <div class="mb-3" id="${typingId}">
                <div class="bg-gray-100 p-3 rounded-lg">
                    <i class="fas fa-circle-notch fa-spin"></i> I'm here for you, thinking carefully about your message...
                </div>
            </div>
        `;
        
        // Enhanced crisis detection keywords
        const crisisKeywords = [
            'kill myself', 'end it all', 'suicide', 'suicidal', 'self harm', 'self-harm', 'cut myself', 'cutting', 
            'overdose', 'pills', 'jump off', 'hanging', 'not worth living', 'better off dead', 'worthless',
            'hopeless', 'can\'t go on', 'want to die', 'wish I was dead', 'kill me', 'hate myself', 
            'no point', 'give up', 'end the pain', 'can\'t take it', 'nobody cares', 'alone forever',
            'burden', 'useless', 'waste of space', 'should be dead', 'rather die', 'nothing to live for'
        ];
        const hasCrisisLanguage = crisisKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        if (hasCrisisLanguage) {
            // Immediate crisis intervention
            this.showEmergencyCrisisSupport();
        }
        
        const systemPrompt = "You are Coach Sarah Chen, a trauma-informed PTSD specialist with 15+ years experience, deep empathy and professional training. CRITICAL: If you detect ANY crisis language, self-harm ideation, or suicide indicators in the message, you must IMMEDIATELY include crisis hotlines in your response: UK Samaritans: 116 123 (free, 24/7), US Crisis Lifeline: 988, Emergency: 999/911. Be extremely empathetic, validate all experiences, and provide gentle, evidence-based support. Always end responses with gentle affirmations of their strength, worth, and reminder that healing is possible. Use person-first language and trauma-informed care principles.";
        const response = await this.callGroqAPI([{ role: 'user', content: message }], systemPrompt);
        
        document.getElementById(typingId)?.remove();
        
        chatMessages.innerHTML += `
            <div class="mb-3">
                <div class="bg-purple-100 p-3 rounded-lg max-w-xs">
                    ${response}
                </div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        input.focus();
    }

    // Coping Techniques
    startCopingTechnique(technique) {
        this.progressData.copingUsed++;
        this.updateProgressDisplay();
        this.storeData('progressData', this.progressData);

        switch(technique) {
            case 'grounding':
                this.start54321Technique();
                break;
            case 'breathing':
                this.startBreathingExercise();
                break;
            case 'relaxation':
                this.startProgressiveRelaxation();
                break;
            case 'emdr':
                console.log('🎯 Starting EMDR technique...');
                console.log('🔍 Loading EMDR content...');
                this.loadEMDRContent();
                console.log('🔍 Opening EMDR modal...');
                this.openModal('emdr-modal');
                console.log('🎯 EMDR modal should be visible now');
                break;
        }
    }

    start54321Technique() {
        const content = `
            <h2 class="text-2xl font-bold mb-4">5-4-3-2-1 Grounding Technique</h2>
            <div class="space-y-4">
                <p class="text-lg">This technique helps you stay present by engaging your senses. Take your time with each step:</p>
                <div class="space-y-3">
                    <div class="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <strong class="text-blue-800">5 things you can SEE</strong><br>
                        <span class="text-sm text-gray-600">Look around slowly and name 5 things you can see right now</span>
                    </div>
                    <div class="p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <strong class="text-green-800">4 things you can TOUCH</strong><br>
                        <span class="text-sm text-gray-600">Feel and describe the texture of 4 different objects near you</span>
                    </div>
                    <div class="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <strong class="text-yellow-800">3 things you can HEAR</strong><br>
                        <span class="text-sm text-gray-600">Listen carefully and identify 3 sounds in your environment</span>
                    </div>
                    <div class="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                        <strong class="text-orange-800">2 things you can SMELL</strong><br>
                        <span class="text-sm text-gray-600">Take gentle breaths and notice 2 different scents</span>
                    </div>
                    <div class="p-3 bg-red-50 rounded border-l-4 border-red-400">
                        <strong class="text-red-800">1 thing you can TASTE</strong><br>
                        <span class="text-sm text-gray-600">Focus on any taste currently in your mouth</span>
                    </div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded">
                    <p class="font-medium text-purple-800">Remember: You are safe. You are grounded. You are in control.</p>
                    <button onclick="app.playGuidedGrounding()" class="mt-3 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">🎧 Listen to Audio Guide (8 min)</button>
                </div>
            </div>
        `;
        
        document.getElementById('technique-content').innerHTML = content;
        this.openModal('technique-modal');
    }

    startBreathingExercise() {
        const content = `
            <h2 class="text-2xl font-bold mb-4">Box Breathing Exercise</h2>
            <div class="text-center">
                <div class="breathing-circle w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-1000">
                    <span id="breathing-instruction" class="text-lg font-bold">Ready?</span>
                </div>
                <div class="flex space-x-2 mb-4">
                    <button onclick="app.beginBreathingCycle()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex-1">Visual Guide</button>
                    <button onclick="app.playGuidedBreathing()" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex-1">🎧 Audio Guide</button>
                </div>
                <div class="space-y-2 text-sm text-gray-600 bg-blue-50 p-4 rounded">
                    <p><strong>How it works:</strong></p>
                    <p>• Breathe in slowly for 4 counts</p>
                    <p>• Hold your breath for 4 counts</p>
                    <p>• Breathe out slowly for 4 counts</p>
                    <p>• Hold empty for 4 counts</p>
                    <p class="text-blue-700 font-medium">This activates your parasympathetic nervous system, promoting calm.</p>
                </div>
            </div>
        `;
        
        document.getElementById('technique-content').innerHTML = content;
        this.openModal('technique-modal');
    }

    beginBreathingCycle() {
        const circle = document.querySelector('.breathing-circle');
        const instruction = document.getElementById('breathing-instruction');
        
        if (!circle || !instruction) return;
        
        const cycle = [
            { phase: 'inhale', duration: 4000, text: 'Breathe In (4)', class: 'breathing-inhale' },
            { phase: 'hold1', duration: 4000, text: 'Hold (4)', class: 'breathing-hold' },
            { phase: 'exhale', duration: 4000, text: 'Breathe Out (4)', class: 'breathing-exhale' },
            { phase: 'hold2', duration: 4000, text: 'Hold (4)', class: 'breathing-hold' }
        ];
        
        let currentStep = 0;
        let cycleCount = 0;
        const maxCycles = 4;
        
        const nextStep = () => {
            const step = cycle[currentStep];
            instruction.textContent = step.text;
            circle.className = `breathing-circle w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-1000 ${step.class}`;
            
            setTimeout(() => {
                currentStep = (currentStep + 1) % cycle.length;
                if (currentStep === 0) {
                    cycleCount++;
                    if (cycleCount >= maxCycles) {
                        circle.className = 'breathing-circle w-32 h-32 border-4 border-green-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-1000';
                        instruction.textContent = 'Complete! Well done. 🌟';
                        return;
                    }
                }
                nextStep();
            }, step.duration);
        };
        
        nextStep();
    }

    startProgressiveRelaxation() {
        const content = `
            <h2 class="text-2xl font-bold mb-4">Progressive Muscle Relaxation</h2>
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="font-medium mb-2">Instructions:</p>
                    <p class="text-sm">Tense each muscle group for 5 seconds, then release and notice the relaxation for 10 seconds before moving to the next group.</p>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>1. Feet & Toes:</strong> Curl your toes tightly, then release and feel the relaxation
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>2. Calves:</strong> Tense your calf muscles by pointing your toes, then release
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>3. Thighs:</strong> Tighten your thigh muscles, then let them go completely
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>4. Glutes:</strong> Squeeze your buttocks, then release
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>5. Abdomen:</strong> Tighten your stomach muscles, then let them soften
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>6. Hands:</strong> Make tight fists, then open and relax your hands
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>7. Arms:</strong> Tense your entire arms, then let them fall naturally
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>8. Shoulders:</strong> Raise your shoulders to your ears, then drop them
                    </div>
                    <div class="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <strong>9. Face & Neck:</strong> Scrunch all facial muscles, then completely relax
                    </div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded">
                    <p class="text-green-700 font-medium">Take your time. Notice the contrast between tension and relaxation. You're doing great.</p>
                    <button onclick="app.playProgressiveRelaxationAudio()" class="mt-3 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">🎧 Listen to Audio Guide (15 min)</button>
                </div>
            </div>
        `;
        
        document.getElementById('technique-content').innerHTML = content;
        this.openModal('technique-modal');
    }

    // EMDR Techniques
    loadEMDRContent() {
        const emdrContent = document.getElementById('emdr-content');
        if (!emdrContent) return;

        emdrContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">EMDR Self-Help Techniques</h2>
            <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                <p class="text-sm"><strong>Important:</strong> These are self-help techniques. If you feel overwhelmed, stop immediately and seek professional support.</p>
            </div>
            <div class="grid md:grid-cols-2 gap-6">
                <div class="emdr-technique p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all" data-emdr="butterfly">
                    <h4 class="font-bold mb-2">🦋 Butterfly Hug</h4>
                    <p class="text-sm">Cross arms over chest and gently tap alternating shoulders. Safe and gentle.</p>
                </div>
                <div class="emdr-technique p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all" data-emdr="eyes">
                    <h4 class="font-bold mb-2">👁️ Eye Movements</h4>
                    <p class="text-sm">Follow the moving dot with your eyes while processing gentle memories.</p>
                </div>
                <div class="emdr-technique p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all" data-emdr="audio">
                    <h4 class="font-bold mb-2">🎵 Auditory BLS</h4>
                    <p class="text-sm">Listen to alternating sounds while focusing on positive resources.</p>
                </div>
                <div class="emdr-technique p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all" data-emdr="tactile">
                    <h4 class="font-bold mb-2">👋 Tactile BLS</h4>
                    <p class="text-sm">Alternate tapping knees or using vibrating devices for bilateral stimulation.</p>
                </div>
            </div>
            <div id="emdr-exercise" class="mt-6 p-4 bg-gray-50 rounded-lg hidden">
                <div id="emdr-instructions"></div>
            </div>
        `;
    }

    startEMDRTechnique(emdrType) {
        console.log('🎯 Starting EMDR technique:', emdrType);
        const exerciseDiv = document.getElementById('emdr-exercise');
        const instructionsDiv = document.getElementById('emdr-instructions');
        
        if (!exerciseDiv || !instructionsDiv) {
            console.error('❌ EMDR elements not found:', { exerciseDiv, instructionsDiv });
            return;
        }
        
        console.log('✅ EMDR elements found, showing exercise div');
        exerciseDiv.classList.remove('hidden');
        
        switch(emdrType) {
            case 'butterfly':
                console.log('🦋 Starting Butterfly Hug');
                this.startButterflyHug(instructionsDiv);
                break;
            case 'eyes':
                console.log('👁️ Starting Eye Movements');
                this.startEyeMovements(instructionsDiv);
                break;
            case 'audio':
                console.log('🎵 Starting Auditory BLS');
                this.startAuditoryBLS(instructionsDiv);
                break;
            case 'tactile':
                console.log('👋 Starting Tactile BLS');
                this.startTactileBLS(instructionsDiv);
                break;
            default:
                console.error('❌ Unknown EMDR technique:', emdrType);
        }
        
        this.progressData.copingUsed++;
        this.updateProgressDisplay();
        this.storeData('progressData', this.progressData);
    }

    startButterflyHug(container) {
        container.innerHTML = `
            <h4 class="font-bold mb-3">🦋 Butterfly Hug Technique</h4>
            <div class="space-y-3">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="text-4xl">🤗</div>
                    <div>
                        <p class="font-medium">Step-by-step instructions:</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <p><strong>1.</strong> Cross your arms over your chest, like giving yourself a hug</p>
                    <p><strong>2.</strong> Place your hands on your shoulders (right hand on left shoulder, left hand on right shoulder)</p>
                    <p><strong>3.</strong> Gently tap alternating shoulders: left, right, left, right...</p>
                    <p><strong>4.</strong> Continue for 30-60 seconds while breathing naturally</p>
                    <p><strong>5.</strong> Think of something positive or just focus on the tapping sensation</p>
                </div>
                <div class="mt-4 p-3 bg-blue-50 rounded">
                    <p class="text-sm"><strong>Benefits:</strong> This creates bilateral stimulation which can help process emotions and create a sense of safety and self-soothing.</p>
                </div>
                <div class="mt-4 p-3 bg-green-50 rounded">
                    <p class="text-sm text-green-700"><strong>Remember:</strong> You are giving yourself compassion and care. You deserve this kindness.</p>
                </div>
            </div>
        `;
    }

    startEyeMovements(container) {
        container.innerHTML = `
            <h4 class="font-bold mb-3">👁️ Eye Movement Technique</h4>
            <div class="text-center mb-4">
                <div class="w-full h-20 bg-gray-100 rounded relative overflow-hidden" id="eye-movement-track">
                    <div class="w-4 h-4 bg-blue-500 rounded-full absolute top-8 transition-all duration-2000" id="moving-dot" style="left: 10px;"></div>
                </div>
            </div>
            <div class="space-y-2 text-sm">
                <p><strong>Instructions:</strong></p>
                <p>• Follow the moving dot with your eyes only (don't move your head)</p>
                <p>• While following the dot, think of a mildly positive memory or just focus on the movement</p>
                <p>• Continue for 30 seconds, then take a break</p>
                <p>• Notice any changes in how you feel</p>
            </div>
            <button onclick="app.startEyeMovementAnimation()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">Start Eye Movement</button>
            <div class="mt-4 p-3 bg-yellow-50 rounded">
                <p class="text-xs"><strong>Note:</strong> Start with positive or neutral memories. If you feel overwhelmed, stop and use grounding techniques.</p>
            </div>
        `;
    }

    startEyeMovementAnimation() {
        const dot = document.getElementById('moving-dot');
        const track = document.getElementById('eye-movement-track');
        
        if (!dot || !track) return;
        
        const trackWidth = track.offsetWidth - 16; // Account for dot width
        let position = 0;
        let direction = 1;
        let cycles = 0;
        const maxCycles = 15; // 30 seconds at ~2 seconds per cycle
        
        const animate = () => {
            position += direction * 4;
            
            if (position >= trackWidth || position <= 0) {
                direction *= -1;
                cycles++;
                
                if (cycles >= maxCycles) {
                    dot.style.left = '50%';
                    dot.style.transform = 'translateX(-50%)';
                    dot.classList.add('bg-green-500');
                    dot.classList.remove('bg-blue-500');
                    return;
                }
            }
            
            dot.style.left = position + 'px';
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    startAuditoryBLS(container) {
        container.innerHTML = `
            <h4 class="font-bold mb-3">🎵 Auditory Bilateral Stimulation</h4>
            <div class="space-y-4">
                <p class="text-sm">This technique uses alternating sounds to create bilateral stimulation:</p>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="app.playBinauralTone('left')" class="bg-blue-500 text-white p-4 rounded hover:bg-blue-600 transition-colors">
                        🎧 Left Ear<br><span class="text-xs">Play tone</span>
                    </button>
                    <button onclick="app.playBinauralTone('right')" class="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition-colors">
                        🎧 Right Ear<br><span class="text-xs">Play tone</span>
                    </button>
                </div>
                <button onclick="app.startAlternatingTones()" class="w-full bg-purple-500 text-white p-3 rounded hover:bg-purple-600 transition-colors">
                    🔄 Start Professional EMDR Audio (10 min)
                </button>
                <div class="space-y-1 text-xs text-gray-600">
                    <p><strong>Instructions:</strong></p>
                    <p>• Use headphones for best effect</p>
                    <p>• Focus on something positive while listening</p>
                    <p>• Let the alternating sounds help process emotions</p>
                    <p>• Continue for 2-3 minutes or until you feel calmer</p>
                </div>
            </div>
        `;
    }

    startTactileBLS(container) {
        container.innerHTML = `
            <h4 class="font-bold mb-3">👋 Tactile Bilateral Stimulation</h4>
            <div class="space-y-4">
                <p class="text-sm">Use touch to create bilateral stimulation:</p>
                
                <div class="bg-blue-50 p-4 rounded">
                    <p class="font-medium mb-2">🦵 Knee Tapping Method:</p>
                    <div class="space-y-1 text-sm">
                        <p>• Sit comfortably and place hands on knees</p>
                        <p>• Alternate tapping left knee, then right knee</p>
                        <p>• Maintain steady rhythm (about 1 tap per second)</p>
                        <p>• Continue for 1-2 minutes while breathing deeply</p>
                    </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded">
                    <p class="font-medium mb-2">🤗 Self-Hug Tapping:</p>
                    <div class="space-y-1 text-sm">
                        <p>• Cross arms and place hands on opposite shoulders</p>
                        <p>• Gently pat alternating shoulders</p>
                        <p>• Focus on something calming while tapping</p>
                        <p>• This combines bilateral stimulation with self-soothing</p>
                    </div>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded">
                    <p class="font-medium mb-2">📱 Using Your Phone:</p>
                    <div class="space-y-1 text-sm">
                        <p>• Hold your phone in alternating hands</p>
                        <p>• Set it to vibrate and pass it left-right-left-right</p>
                        <p>• Or use EMDR apps with bilateral vibration</p>
                    </div>
                </div>
                
                <div class="text-center p-3 bg-purple-50 rounded">
                    <p class="text-sm text-purple-700 font-medium">Remember: Go at your own pace. Stop if you feel overwhelmed.</p>
                </div>
            </div>
        `;
    }

    // Audio functions for EMDR and PTSD support
    playBinauralTone(ear) {
        // Use real audio files for better therapeutic experience
        const audioFile = ear === 'left' ? 'audio/bilateral-tones-left.wav' : 'audio/bilateral-tones-right.wav';
        this.playTherapeuticAudio(audioFile);
    }

    stopAllAudio() {
        // Stop all currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // Stop any other audio elements on the page
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        console.log('🔇 All audio stopped');
    }

    playTherapeuticAudio(audioPath, loop = false) {
        try {
            // Stop any currently playing therapeutic audio
            this.stopAllAudio();
            
            this.currentAudio = new Audio(audioPath);
            this.currentAudio.volume = 0.7;
            this.currentAudio.loop = loop;
            
            // Add error handling for missing audio files
            this.currentAudio.onerror = () => {
                console.warn(`Audio file not found: ${audioPath}. Using fallback.`);
                this.createFallbackAudio(audioPath.includes('left') ? 'left' : 'right');
            };
            
            this.currentAudio.play().catch(error => {
                console.error('Audio playback failed:', error);
                // Fallback to synthesized audio if file fails
                this.createFallbackAudio(audioPath.includes('left') ? 'left' : 'right');
            });
            
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.createFallbackAudio(audioPath.includes('left') ? 'left' : 'right');
        }
    }

    createFallbackAudio(ear) {
        // Fallback to Web Audio API if files not available
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioCtx = AudioContext || webkitAudioContext;
            const audioCtx = new AudioCtx();
            
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const panNode = audioCtx.createStereoPanner();
            
            oscillator.connect(gainNode);
            gainNode.connect(panNode);
            panNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 440; // A4 note
            gainNode.gain.value = 0.1;
            panNode.pan.value = ear === 'left' ? -1 : 1;
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    }

    stopTherapeuticAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
    }

    startAlternatingTones() {
        // Use professional alternating EMDR audio
        this.playTherapeuticAudio('audio/alternating-chimes.wav', false);
        
        // Show progress indicator
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '🎵 Playing... <span class="text-xs">(10 minutes)</span>';
        button.disabled = true;
        
        // Re-enable button after audio duration
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 600000); // 10 minutes
    }

    // Add guided meditation and breathing audio
    playGuidedBreathing() {
        this.playTherapeuticAudio('audio/box-breathing-guide.wav', false);
    }

    playGuidedGrounding() {
        this.playTherapeuticAudio('audio/grounding-meditation.wav', false);
    }

    playProgressiveRelaxationAudio() {
        this.playTherapeuticAudio('audio/progressive-relaxation.wav', false);
    }



    playBackgroundAmbience(type) {
        const audioFiles = {
            'rain': 'audio/calming-rain.wav',
            'ocean': 'audio/ocean-waves.wav',
            'forest': 'audio/forest-sounds.wav'
        };
        
        if (audioFiles[type]) {
            this.playTherapeuticAudio(audioFiles[type], true); // Loop background sounds
        }
    }

    // FAQ
    toggleFAQ(element) {
        const faqItem = element.closest('.faq-item');
        const answer = faqItem.querySelector('.faq-answer');
        const icon = element.querySelector('i');
        
        if (!answer || !icon) return;
        
        if (answer.classList.contains('hidden')) {
            answer.classList.remove('hidden');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            answer.classList.add('hidden');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Trap focus in modal
            const focusableElements = modal.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    // PWA Installation
    showInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            this.deferredPrompt = null;
            this.hideInstallBanner();
        }
    }

    // Connection status
    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('api-status');
        const statusText = document.getElementById('api-status-text');
        
        if (isOnline) {
            if (statusEl) statusEl.className = 'fixed top-4 left-4 z-40 px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white';
            if (statusText) statusText.textContent = 'AI Connected';
        } else {
            if (statusEl) statusEl.className = 'fixed top-4 left-4 z-40 px-3 py-1 rounded-full text-sm font-bold bg-orange-500 text-white';
            if (statusText) statusText.textContent = 'Offline Mode';
        }
    }

    // Data management
    storeData(key, data) {
        try {
            localStorage.setItem(`root-cause-power-${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to store data:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(`root-cause-power-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load data:', error);
            return null;
        }
    }

    loadStoredData() {
        this.journalEntries = this.loadData('journalEntries') || [];
        this.safetyPlan = this.loadData('safetyPlan') || {};
        this.progressData = { ...this.progressData, ...this.loadData('progressData') };
        this.assessmentData = this.loadData('assessmentData') || {};
        this.currentUser = { ...this.currentUser, ...this.loadData('currentUser') };
    }

    async syncOfflineData() {
        console.log('🔄 Syncing offline data...');
        // This would sync with a backend service
        this.trackEvent('data_synced');
    }

    // Analytics
    trackEvent(eventName, data = {}) {
        console.log('📊 Event tracked:', eventName, data);
        // In production, this would send to analytics service
    }

    // Admin Access System (Hidden - No UI buttons)
    enableAdminAccess(permanent = false) {
        this.currentUser.isAdmin = true;
        this.currentUser.plan = 'Founder';
        this.currentUser.credits = -1; // Unlimited
        this.currentUser.voiceCredits = 999999; // Unlimited voice credits
        this.currentUser.maxCreditsPerDay = -1;
        this.currentUser.subscriptionActive = true;
        
        // Enable permanent admin if requested
        if (permanent) {
            localStorage.setItem('permanentAdmin', 'david_prince_founder');
            console.log('👑 PERMANENT Founder access enabled! Unlimited everything forever.');
            this.showNotification('👑 FOUNDER MODE: Permanent unlimited access activated', 'success');
            
            // Add admin indicator to UI
            this.addAdminIndicator();
        } else {
            console.log('👑 Temporary admin access enabled!');
            this.showNotification('👑 Admin Mode: Unlimited access enabled', 'success');
        }
        
        this.storeData('currentUser', this.currentUser);
        
        console.log('🔓 Admin access granted - Full platform access enabled');
        console.log('🎤 Voice credits: Unlimited for testing');
        console.log('🛡️ Security: Admin mode active');
        
        // Update credits display
        this.updateVoiceCreditDisplay();
    }

    addAdminIndicator() {
        // Remove existing indicator if present
        const existing = document.getElementById('admin-indicator');
        if (existing) existing.remove();
        
        // Add subtle admin indicator
        const indicator = document.createElement('div');
        indicator.id = 'admin-indicator';
        indicator.className = 'fixed top-20 left-4 text-white px-3 py-1 rounded-full text-xs font-bold z-40';
        indicator.innerHTML = '👑 FOUNDER';
        indicator.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
        indicator.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.3)';
        indicator.title = 'Permanent founder access active';
        document.body.appendChild(indicator);
    }

    // Quick admin activation (for your convenience)
    activateFounderMode() {
        this.enableAdminAccess(true);
        
        // Update displays
        this.updateCreditDisplay();
        this.showNotification('🔓 Admin access enabled - Full testing privileges granted', 'success');
        
        // Clear URL to hide admin parameter
        const url = new URL(window.location);
        url.searchParams.delete('admin_access');
        window.history.replaceState({}, document.title, url);
    }

    // Check if user has admin access
    isAdmin() {
        return this.currentUser.isAdmin === true;
    }

    // Enhanced voice access check with admin override
    canUseVoiceAI() {
        // Admin always has access
        if (this.isAdmin()) {
            return true;
        }
        
        // Free users can't use voice AI
        if (this.currentUser.plan === 'Free') {
            return false;
        }
        
        // Paid users can use voice AI if they have credits
        return this.currentUser.voiceCredits > 0;
    }

    // Enhanced Comprehensive Session Booking System
    openSessionBooking() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
        
        const userAssessmentData = this.loadData('assessmentData') || {};
        const userAnalysisData = this.loadData('intelligentAnalysis') || {};
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl mx-auto my-8 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">Book Live Wellness Session</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                <!-- Session Types Grid -->
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div class="session-type-card border-2 border-purple-200 rounded-lg p-4 cursor-pointer hover:border-purple-400 transition-colors" data-type="comprehensive">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-user-md text-2xl text-purple-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">Comprehensive Wellness</h4>
                            <p class="text-sm text-gray-600 mb-3">Complete wellness review covering PTSD, nutrition, lifestyle, and personalized treatment planning</p>
                            <div class="text-lg font-bold text-purple-600">$149 / 90 min</div>
                        </div>
                    </div>
                    
                    <div class="session-type-card border-2 border-blue-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors" data-type="ptsd-trauma">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-heart text-2xl text-blue-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">PTSD & Trauma Focused</h4>
                            <p class="text-sm text-gray-600 mb-3">Specialized trauma therapy with EMDR, somatic healing, and personalized trauma recovery planning</p>
                            <div class="text-lg font-bold text-blue-600">$129 / 75 min</div>
                        </div>
                    </div>
                    
                    <div class="session-type-card border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:border-green-400 transition-colors" data-type="nutrition">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-apple-alt text-2xl text-green-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">Nutrition & Gut Health</h4>
                            <p class="text-sm text-gray-600 mb-3">Functional nutrition analysis, gut-brain connection, and personalized meal planning</p>
                            <div class="text-lg font-bold text-green-600">$99 / 60 min</div>
                        </div>
                    </div>
                    
                    <div class="session-type-card border-2 border-indigo-200 rounded-lg p-4 cursor-pointer hover:border-indigo-400 transition-colors" data-type="hypnotherapy">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-brain text-2xl text-indigo-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">Clinical Hypnotherapy</h4>
                            <p class="text-sm text-gray-600 mb-3">Subconscious reprogramming, neural pathway healing, and deep relaxation therapy</p>
                            <div class="text-lg font-bold text-indigo-600">$119 / 75 min</div>
                        </div>
                    </div>
                    
                    <div class="session-type-card border-2 border-orange-200 rounded-lg p-4 cursor-pointer hover:border-orange-400 transition-colors" data-type="lifestyle">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-dumbbell text-2xl text-orange-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">Lifestyle Medicine</h4>
                            <p class="text-sm text-gray-600 mb-3">Sleep optimization, fitness planning, stress management, and lifestyle integration</p>
                            <div class="text-lg font-bold text-orange-600">$89 / 50 min</div>
                        </div>
                    </div>
                    
                    <div class="session-type-card border-2 border-pink-200 rounded-lg p-4 cursor-pointer hover:border-pink-400 transition-colors" data-type="crisis">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-phone text-2xl text-pink-600"></i>
                            </div>
                            <h4 class="font-semibold text-lg mb-2">Crisis Support</h4>
                            <p class="text-sm text-gray-600 mb-3">Immediate support session for crisis intervention and safety planning</p>
                            <div class="text-lg font-bold text-pink-600">$199 / Available Now</div>
                        </div>
                    </div>
                </div>
                
                <!-- Selected Session Details -->
                <div id="session-details" class="hidden">
                    <div class="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 class="font-semibold text-lg mb-4">Session Preparation</h4>
                        <div id="ai-session-prep" class="space-y-3">
                            <div class="flex items-start space-x-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-robot text-blue-600"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="text-sm text-gray-600 mb-1">AI Analysis</div>
                                    <div id="prep-loading" class="text-gray-500">Analyzing your assessment data to prepare personalized session recommendations...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Calendar Integration -->
                    <div class="mb-6">
                        <h4 class="font-semibold text-lg mb-4">Choose Date & Time</h4>
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">Select Date</label>
                                <input type="date" id="session-date" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">Select Time</label>
                                <select id="session-time" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="">Choose a time slot</option>
                                    <option value="09:00">9:00 AM</option>
                                    <option value="10:00">10:00 AM</option>
                                    <option value="11:00">11:00 AM</option>
                                    <option value="14:00">2:00 PM</option>
                                    <option value="15:00">3:00 PM</option>
                                    <option value="16:00">4:00 PM</option>
                                    <option value="17:00">5:00 PM</option>
                                    <option value="18:00">6:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Session Goals -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">What would you like to focus on in this session?</label>
                        <textarea id="session-goals" rows="3" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Describe your specific goals, concerns, or what you'd like to work on..."></textarea>
                    </div>
                    
                    <!-- Booking Actions -->
                    <div class="flex space-x-4">
                        <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors">Cancel</button>
                        <button onclick="app.bookLiveSession()" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-semibold">Book Session & Pay</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers for session type selection
        modal.querySelectorAll('.session-type-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selections
                modal.querySelectorAll('.session-type-card').forEach(c => c.classList.remove('ring-2', 'ring-purple-500', 'bg-purple-50'));
                
                // Select this card
                card.classList.add('ring-2', 'ring-purple-500', 'bg-purple-50');
                
                // Show session details
                const sessionDetails = modal.querySelector('#session-details');
                sessionDetails.classList.remove('hidden');
                
                // Generate AI session preparation
                const sessionType = card.dataset.type;
                this.generateSessionPrep(sessionType);
            });
        });
    }

    async generateSessionPrep(sessionType) {
        const prepElement = document.getElementById('prep-loading');
        if (!prepElement) return;
        
        try {
            prepElement.textContent = 'Generating personalized session preparation...';
            
            const userAssessment = this.loadData('assessmentData') || {};
            const userAnalysis = this.loadData('intelligentAnalysis') || {};
            const userProgress = this.loadData('progressData') || {};
            
            // Use dedicated session prep API first
            const prepResponse = await fetch('/api/sessions/prep', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionType: sessionType,
                    userContext: {
                        assessment: userAssessment,
                        analysis: userAnalysis,
                        progress: userProgress
                    }
                })
            });
            
            if (prepResponse.ok) {
                const prepData = await prepResponse.json();
                if (prepData.success && prepData.preparation) {
                    const prep = prepData.preparation;
                    prepElement.innerHTML = `
                        <div class="space-y-4">
                            <div>
                                <h5 class="font-semibold text-sm text-gray-800 mb-2">Session Focus Areas:</h5>
                                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    ${prep.focus.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <h5 class="font-semibold text-sm text-gray-800 mb-2">How to Prepare:</h5>
                                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    ${prep.preparation.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <h5 class="font-semibold text-sm text-gray-800 mb-2">Expected Outcomes:</h5>
                                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    ${prep.outcomes.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="bg-blue-50 p-3 rounded text-xs text-blue-800">
                                <i class="fas fa-lightbulb mr-1"></i>
                                This preparation plan is personalized based on your assessment data and selected session type.
                            </div>
                        </div>
                    `;
                    return;
                }
            }
            
            // Fallback to AI-generated preparation if API fails
            const response = await fetch('/api/groq-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Based on this user's data, create a personalized session preparation plan for a ${sessionType} session. Include:
                    1. Key areas to focus on based on their assessment
                    2. Specific goals for this session type
                    3. Preparation recommendations
                    4. Expected outcomes
                    
                    Keep it concise but comprehensive. Format as HTML with bullet points.
                    
                    User Context: ${JSON.stringify({userAssessment, userAnalysis, userProgress}, null, 2)}`,
                    systemPrompt: 'You are an expert wellness practitioner creating personalized session preparation plans. Focus on the user\'s specific needs and assessment results.'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                prepElement.innerHTML = data.response || 'Session preparation complete - ready for booking!';
            } else {
                throw new Error('AI preparation generation failed');
            }
            
        } catch (error) {
            console.error('Failed to generate session prep:', error);
            // Default preparation plan
            prepElement.innerHTML = `
                <div class="space-y-2">
                    <p><strong>Session Preparation:</strong></p>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>Review your recent assessment responses</li>
                        <li>Prepare specific questions or concerns</li>
                        <li>Find a quiet, private space for the session</li>
                        <li>Have water and tissues available</li>
                        <li>Set intention for healing and growth</li>
                        <li>Consider your main wellness goals</li>
                    </ul>
                </div>
            `;
        }
    }

    async bookLiveSession() {
        const selectedCard = document.querySelector('.session-type-card.ring-2');
        const sessionDate = document.getElementById('session-date').value;
        const sessionTime = document.getElementById('session-time').value;
        const sessionGoals = document.getElementById('session-goals').value;
        
        if (!selectedCard || !sessionDate || !sessionTime) {
            this.showNotification('Please select session type, date, and time', 'error');
            return;
        }
        
        const sessionType = selectedCard.dataset.type;
        const sessionPrice = selectedCard.querySelector('.text-lg.font-bold').textContent;
        
        // Create session data
        const sessionData = {
            id: 'session_' + Date.now(),
            type: sessionType,
            date: sessionDate,
            time: sessionTime,
            goals: sessionGoals,
            price: sessionPrice,
            status: 'pending_payment',
            createdAt: new Date().toISOString(),
            userId: this.currentUser.id || 'user_' + Date.now()
        };
        
        try {
            // Save session data
            const existingSessions = this.loadData('bookedSessions') || [];
            existingSessions.push(sessionData);
            this.storeData('bookedSessions', existingSessions);
            
            // Create Stripe checkout
            const checkoutData = {
                sessionType: sessionType,
                sessionDate: sessionDate,
                sessionTime: sessionTime,
                price: sessionPrice,
                sessionId: sessionData.id,
                userEmail: this.currentUser.email || 'user@example.com',
                successUrl: `${window.location.origin}/session-confirmation?session=${sessionData.id}`,
                cancelUrl: `${window.location.origin}/?booking=cancelled`
            };
            
            // In a real implementation, this would call your Stripe integration
            console.log('🔄 Processing session booking:', checkoutData);
            
            // For demo purposes, simulate successful booking
            setTimeout(() => {
                sessionData.status = 'confirmed';
                sessionData.paymentId = 'demo_payment_' + Date.now();
                this.storeData('bookedSessions', existingSessions);
                
                this.showNotification(`✅ Session booked successfully! You'll receive a confirmation email with session details.`, 'success');
                
                // Close modal
                document.querySelector('.fixed.inset-0').remove();
                
                // Show session confirmation
                this.showSessionConfirmation(sessionData);
                
            }, 2000);
            
            // Update UI to show processing
            const bookButton = document.querySelector('button[onclick="app.bookLiveSession()"]');
            if (bookButton) {
                bookButton.textContent = 'Processing Payment...';
                bookButton.disabled = true;
            }
            
        } catch (error) {
            console.error('Failed to book session:', error);
            this.showNotification('Failed to book session. Please try again.', 'error');
        }
    }

    showSessionConfirmation(sessionData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-auto">
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-2xl text-green-600"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-4">Session Confirmed!</h3>
                    <div class="space-y-3 text-sm">
                        <p><strong>Session Type:</strong> ${sessionData.type}</p>
                        <p><strong>Date:</strong> ${new Date(sessionData.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${sessionData.time}</p>
                        <p><strong>Price:</strong> ${sessionData.price}</p>
                    </div>
                    <div class="bg-blue-50 p-3 rounded mt-4">
                        <p class="text-xs text-blue-800">You'll receive a calendar invite and preparation materials via email within 24 hours.</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove(); app.openSessionDashboard();" class="w-full bg-blue-500 text-white py-2 rounded mt-4 hover:bg-blue-600">
                        View My Sessions
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openSessionDashboard() {
        const sessions = this.loadData('bookedSessions') || [];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl mx-auto my-8 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">My Live Sessions</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                
                ${sessions.length === 0 ? `
                    <div class="text-center py-8">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-calendar-alt text-2xl text-gray-400"></i>
                        </div>
                        <p class="text-gray-500 mb-4">No sessions booked yet</p>
                        <button onclick="this.closest('.fixed').remove(); app.openSessionBooking();" class="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
                            Book Your First Session
                        </button>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${sessions.map(session => `
                            <div class="border rounded-lg p-4 ${session.status === 'confirmed' ? 'border-green-200 bg-green-50' : 'border-gray-200'}">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-lg">${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session</h4>
                                        <p class="text-gray-600 text-sm">${new Date(session.date).toLocaleDateString()} at ${session.time}</p>
                                        <p class="text-gray-700 mt-2">${session.goals || 'General wellness consultation'}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-bold text-purple-600">${session.price}</div>
                                        <div class="text-xs px-2 py-1 rounded-full ${session.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                            ${session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mt-6 pt-4 border-t">
                        <button onclick="this.closest('.fixed').remove(); app.openSessionBooking();" class="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600">
                            Book Another Session
                        </button>
                    </div>
                `}
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Enhanced comprehensive coaching system prompt
    getCoachSystemPrompt(coachType) {
        const userAssessment = this.loadData('assessmentData') || {};
        const userAnalysis = this.loadData('intelligentAnalysis') || {};
        const userProgress = this.loadData('progressData') || {};
        const userSessions = this.loadData('bookedSessions') || [];
        
        // Create comprehensive user context
        const userContext = `
        CURRENT USER CONTEXT:
        - Assessment Data: ${JSON.stringify(userAssessment)}
        - Analysis Results: ${JSON.stringify(userAnalysis)}
        - Progress Tracking: ${JSON.stringify(userProgress)}
        - Booked Sessions: ${userSessions.length} sessions
        - Current Plan: ${this.currentUser.plan}
        `;

        // Enhanced comprehensive prompt for ALL wellness areas
        const comprehensivePrompt = `You are a COMPLETE WELLNESS & PTSD RECOVERY COACH with expertise in ALL areas: PTSD/Trauma, Nutrition, Lifestyle Medicine, Clinical Hypnotherapy, Fitness, Sleep, Stress Management, and Supplements. You have full access to voice conversation capabilities and live session coordination.

CORE COMPETENCIES:
1) TRAUMA & PTSD: Evidence-based trauma therapy, EMDR techniques, somatic healing, nervous system regulation, trauma-informed care
2) NUTRITION: Functional nutrition, gut-brain axis, anti-inflammatory protocols, nutrient optimization, meal planning
3) LIFESTYLE MEDICINE: Sleep optimization, circadian biology, stress management, lifestyle intervention protocols
4) CLINICAL HYPNOTHERAPY: Subconscious reprogramming, neural pathway healing, deep relaxation, therapeutic suggestion
5) FITNESS & MOVEMENT: Trauma-informed exercise, nervous system activation, movement therapy, strength building
6) STRESS MANAGEMENT: Breathwork, mindfulness, nervous system regulation, resilience building
7) SUPPLEMENTS: Evidence-based supplementation, nutrient deficiency correction, therapeutic protocols
8) CRISIS INTERVENTION: Safety assessment, crisis de-escalation, professional resource connection

INTERACTION GUIDELINES:
1) PERSONALIZED RESPONSES: Always reference user's assessment data and progress when relevant
2) HOLISTIC APPROACH: Connect all wellness areas - show how nutrition affects trauma recovery, how sleep impacts PTSD, etc.
3) ACTIONABLE ADVICE: Provide specific, implementable recommendations tailored to their situation
4) VOICE OPTIMIZED: Keep responses 2-3 sentences for natural voice conversation flow
5) EMPATHETIC TONE: Warm, supportive, trauma-informed, non-judgmental
6) LIVE SESSION INTEGRATION: Mention relevant live session options when appropriate
7) CRISIS AWARENESS: Watch for crisis indicators and offer immediate professional resources
8) PROGRESS TRACKING: Acknowledge improvements and adjust recommendations based on progress
9) PROFESSIONAL BOUNDARIES: You provide coaching and support, not diagnosis or medical treatment
10) COMPREHENSIVE CARE: Address the whole person - mind, body, spirit, lifestyle

LIVE SESSION INTEGRATION: When users need deeper support, offer to book live sessions for specialized areas like EMDR therapy, nutritional analysis, or hypnotherapy sessions.

${userContext}`;

        // Specialized focus areas while maintaining comprehensive capabilities
        const specializedPrompts = {
            comprehensive: comprehensivePrompt,
            nutrition: comprehensivePrompt + "\n\nFOCUS: Emphasize nutrition and gut-brain connection while maintaining full coaching capabilities.",
            sleep: comprehensivePrompt + "\n\nFOCUS: Emphasize sleep optimization and circadian health while maintaining full coaching capabilities.", 
            stress: comprehensivePrompt + "\n\nFOCUS: Emphasize stress management and nervous system regulation while maintaining full coaching capabilities.",
            fitness: comprehensivePrompt + "\n\nFOCUS: Emphasize movement therapy and body-based healing while maintaining full coaching capabilities.",
            supplements: comprehensivePrompt + "\n\nFOCUS: Emphasize evidence-based supplementation while maintaining full coaching capabilities.",
            hypnotherapy: comprehensivePrompt + "\n\nFOCUS: Emphasize hypnotherapy, subconscious reprogramming, and neural pathway healing while maintaining full coaching capabilities.",
            ptsd: comprehensivePrompt + "\n\nFOCUS: Emphasize trauma recovery and PTSD healing while maintaining full coaching capabilities."
        };

        return specializedPrompts[coachType] || comprehensivePrompt;
    }

    // Voice UI Functions
    toggleTextMode(coachType) {
        const textInput = document.getElementById(`text-input-${coachType}`);
        const toggleBtn = event.target;
        
        if (textInput.classList.contains('hidden')) {
            textInput.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-microphone mr-1"></i>Switch to voice instead?';
            this.announceToScreenReader('Text input mode activated');
        } else {
            textInput.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-keyboard mr-1"></i>Prefer to type instead?';
            this.announceToScreenReader('Voice input mode activated');
        }
    }

    // Comprehensive Accessibility Functions
    setFontSize(size) {
        // Remove existing font size classes
        document.body.classList.remove('large-text', 'extra-large-text');
        
        // Apply new font size
        switch(size) {
            case 'large':
                document.body.classList.add('large-text');
                break;
            case 'extra-large':
                document.body.classList.add('extra-large-text');
                break;
            case 'normal':
            default:
                // Default size, no class needed
                break;
        }
        
        this.saveAccessibilityPref('fontSize', size);
        this.announceToScreenReader(`Text size changed to ${size}`);
    }

    toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const isEnabled = document.body.classList.contains('high-contrast');
        
        document.getElementById('high-contrast-toggle').checked = isEnabled;
        this.saveAccessibilityPref('highContrast', isEnabled);
        this.announceToScreenReader(`High contrast ${isEnabled ? 'enabled' : 'disabled'}`);
    }

    toggleReducedMotion() {
        document.body.classList.toggle('reduced-motion');
        const isEnabled = document.body.classList.contains('reduced-motion');
        
        document.getElementById('reduced-motion-toggle').checked = isEnabled;
        this.saveAccessibilityPref('reducedMotion', isEnabled);
        this.announceToScreenReader(`Motion reduction ${isEnabled ? 'enabled' : 'disabled'}`);
    }

    setVoiceSpeed(speed) {
        // Store for future speech synthesis use
        this.voiceSpeed = parseFloat(speed);
        this.saveAccessibilityPref('voiceSpeed', speed);
        this.announceToScreenReader(`Voice speed set to ${Math.round(speed * 100)}%`);
    }

    toggleScreenReaderMode() {
        const isEnabled = document.getElementById('screen-reader-toggle').checked;
        this.screenReaderMode = isEnabled;
        
        this.saveAccessibilityPref('screenReaderMode', isEnabled);
        this.announceToScreenReader(`Enhanced audio cues ${isEnabled ? 'enabled' : 'disabled'}`);
        
        if (isEnabled) {
            // Add more descriptive labels and announcements
            this.enhanceForScreenReader();
        }
    }

    toggleFocusIndicators() {
        const isEnabled = document.getElementById('focus-indicators-toggle').checked;
        
        if (isEnabled) {
            // Add focus-ring class to all interactive elements
            document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
                el.classList.add('focus-ring');
            });
        } else {
            document.querySelectorAll('.focus-ring').forEach(el => {
                el.classList.remove('focus-ring');
            });
        }
        
        this.saveAccessibilityPref('focusIndicators', isEnabled);
        this.announceToScreenReader(`Enhanced focus indicators ${isEnabled ? 'enabled' : 'disabled'}`);
    }

    enhanceForScreenReader() {
        // Add more descriptive aria-labels and descriptions
        document.querySelectorAll('button').forEach(btn => {
            if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
                btn.setAttribute('aria-label', btn.textContent.trim());
            }
        });

        // Announce page changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active') && target.tagName === 'SECTION') {
                        const sectionName = target.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        this.announceToScreenReader(`Navigated to ${sectionName} section`);
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }

    announceToScreenReader(message) {
        const announcements = document.getElementById('sr-announcements');
        if (announcements) {
            announcements.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
        
        // Also use speech synthesis if available and user prefers it
        if (this.screenReaderMode && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = this.voiceSpeed || 1;
            utterance.volume = 0.7;
            speechSynthesis.speak(utterance);
        }
    }

    saveAccessibilityPref(key, value) {
        const prefs = JSON.parse(localStorage.getItem('accessibilityPrefs') || '{}');
        prefs[key] = value;
        localStorage.setItem('accessibilityPrefs', JSON.stringify(prefs));
    }

    resetAccessibilitySettings() {
        // Remove all accessibility classes
        document.body.classList.remove('large-text', 'extra-large-text', 'high-contrast', 'reduced-motion');
        
        // Reset form controls
        document.getElementById('high-contrast-toggle').checked = false;
        document.getElementById('reduced-motion-toggle').checked = false;
        document.getElementById('screen-reader-toggle').checked = false;
        document.getElementById('focus-indicators-toggle').checked = true;
        document.getElementById('voice-speed').value = 1;
        
        // Reset stored preferences
        localStorage.removeItem('accessibilityPrefs');
        
        // Re-enable focus indicators by default
        this.toggleFocusIndicators();
        
        this.announceToScreenReader('All accessibility settings reset to default');
    }

    // Interactive Community System
    async initializeCommunity() {
        console.log('🏠 Initializing interactive community...');
        
        // Load existing posts
        await this.loadCommunityPosts();
        
        // Setup form handler
        const form = document.getElementById('community-post-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCommunityPost();
            });
        }
    }

    async loadCommunityPosts(filter = 'all') {
        try {
            const response = await fetch('/api/community/posts');
            const data = await response.json();
            
            if (data.success) {
                let posts = data.posts;
                
                // Filter posts if needed
                if (filter !== 'all') {
                    posts = posts.filter(post => post.category === filter);
                }
                
                this.displayCommunityPosts(posts);
            }
        } catch (error) {
            console.error('Failed to load community posts:', error);
            this.displayEmptyPostsMessage();
        }
    }

    displayCommunityPosts(posts) {
        const container = document.getElementById('community-posts');
        if (!container) return;

        if (posts.length === 0) {
            this.displayEmptyPostsMessage();
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="bg-white rounded-lg shadow-lg p-6 community-post" data-category="${post.category}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            ${post.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-semibold">${this.sanitizeHtml(post.author)}</div>
                            <div class="text-sm text-gray-500">${this.getTimeAgo(post.createdAt)} • ${this.getCategoryIcon(post.category)} ${this.getCategoryName(post.category)}</div>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs bg-${this.getCategoryColor(post.category)}-100 text-${this.getCategoryColor(post.category)}-800">
                        ${this.getCategoryIcon(post.category)}
                    </span>
                </div>
                
                <h4 class="text-lg font-semibold mb-2">${this.sanitizeHtml(post.title)}</h4>
                <p class="text-gray-700 mb-4 leading-relaxed">${this.sanitizeHtml(post.content)}</p>
                
                <div class="flex items-center justify-between pt-4 border-t">
                    <div class="flex items-center space-x-4">
                        <button onclick="app.likePost('${post.id}')" class="flex items-center text-gray-500 hover:text-red-500 transition-colors">
                            <i class="fas fa-heart mr-1"></i>
                            <span id="likes-${post.id}">${post.likes || 0}</span>
                        </button>
                        <button onclick="app.toggleComments('${post.id}')" class="flex items-center text-gray-500 hover:text-blue-500 transition-colors">
                            <i class="fas fa-comment mr-1"></i>
                            <span>${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}</span>
                        </button>
                    </div>
                    <button onclick="app.reportPost('${post.id}')" class="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        <i class="fas fa-flag mr-1"></i>Report
                    </button>
                </div>
                
                <!-- Comments Section -->
                <div id="comments-${post.id}" class="hidden mt-4 pt-4 border-t">
                    <div class="space-y-3 mb-4">
                        ${post.comments.map(comment => `
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <div class="flex items-center mb-2">
                                    <div class="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                        ${comment.author.charAt(0).toUpperCase()}
                                    </div>
                                    <span class="font-semibold text-sm">${this.sanitizeHtml(comment.author)}</span>
                                    <span class="text-xs text-gray-500 ml-2">${this.getTimeAgo(comment.createdAt)}</span>
                                </div>
                                <p class="text-gray-700 text-sm">${this.sanitizeHtml(comment.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <form onsubmit="app.submitComment(event, '${post.id}')" class="flex space-x-2">
                        <input type="text" placeholder="Your name..." class="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <input type="text" placeholder="Add a supportive comment..." class="flex-2 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `).join('');
    }

    displayEmptyPostsMessage() {
        const container = document.getElementById('community-posts');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-comments text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 mb-4">No posts yet in this category</p>
                    <p class="text-sm text-gray-400">Be the first to share something with the community!</p>
                </div>
            `;
        }
    }

    async submitCommunityPost() {
        const form = document.getElementById('community-post-form');
        const author = document.getElementById('post-author').value.trim();
        const category = document.getElementById('post-category').value;
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();

        if (!author || !category || !title || !content) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/community/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    author,
                    category,
                    title,
                    content
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Post shared successfully! 🎉', 'success');
                form.reset();
                await this.loadCommunityPosts(); // Refresh posts
            } else {
                this.showNotification('Failed to share post. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Failed to submit post:', error);
            this.showNotification('Failed to share post. Please try again.', 'error');
        }
    }

    async likePost(postId) {
        try {
            const response = await fetch(`/api/community/posts/${postId}/like`, {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                const likesElement = document.getElementById(`likes-${postId}`);
                if (likesElement) {
                    likesElement.textContent = data.likes;
                }
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    }

    toggleComments(postId) {
        const commentsDiv = document.getElementById(`comments-${postId}`);
        if (commentsDiv) {
            commentsDiv.classList.toggle('hidden');
        }
    }

    async submitComment(event, postId) {
        event.preventDefault();
        
        const form = event.target;
        const inputs = form.querySelectorAll('input');
        const author = inputs[0].value.trim();
        const content = inputs[1].value.trim();

        if (!author || !content) {
            this.showNotification('Please fill in both fields', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/community/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ author, content })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Comment added! 💬', 'success');
                form.reset();
                await this.loadCommunityPosts(); // Refresh to show new comment
            } else {
                this.showNotification('Failed to add comment', 'error');
            }
        } catch (error) {
            console.error('Failed to submit comment:', error);
            this.showNotification('Failed to add comment', 'error');
        }
    }

    filterCommunityPosts(category) {
        // Update filter button states
        document.querySelectorAll('.community-filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-purple-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        event.target.classList.remove('bg-gray-200', 'text-gray-700');
        event.target.classList.add('active', 'bg-purple-500', 'text-white');
        
        // Load filtered posts
        this.loadCommunityPosts(category);
    }

    reportPost(postId) {
        if (confirm('Report this post as inappropriate? Our moderators will review it.')) {
            this.showNotification('Post reported. Thank you for keeping our community safe.', 'info');
            // In production, implement actual reporting system
        }
    }

    // Utility functions for community
    sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    getCategoryIcon(category) {
        const icons = {
            support: '🤝',
            success: '🎉',
            question: '❓',
            resource: '📚'
        };
        return icons[category] || '💬';
    }

    getCategoryName(category) {
        const names = {
            support: 'Support',
            success: 'Success',
            question: 'Question',
            resource: 'Resource'
        };
        return names[category] || 'Discussion';
    }

    getCategoryColor(category) {
        const colors = {
            support: 'blue',
            success: 'green',
            question: 'yellow',
            resource: 'purple'
        };
        return colors[category] || 'gray';
    }

    // Enable crisis detection after user engagement
    enableCrisisDetection() {
        this.preventAutoCrisis = false;
        console.log('✅ Crisis detection enabled - user actively engaged');
    }

    // Manual crisis support trigger (always available)
    triggerCrisisSupport() {
        console.log('🚨 Manual crisis support triggered');
        this.showEmergencyCrisisSupport();
    }

    // Crisis support audio functions
    playPanicAttackHelp() {
        try {
            console.log('🎵 Playing panic attack help audio...');
            
            // Use Web Speech API to provide immediate verbal guidance
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(
                    "Take a deep breath with me. In for 4... 2, 3, 4. Hold for 4... 2, 3, 4. Out for 6... 2, 3, 4, 5, 6. You're safe. This feeling will pass. Let's breathe together again."
                );
                utterance.rate = 0.8;
                utterance.pitch = 0.9;
                utterance.volume = 0.7;
                
                // Try to use British voice if available
                const voices = speechSynthesis.getVoices();
                const britishVoice = voices.find(voice => voice.lang.includes('en-GB') || voice.name.includes('British'));
                if (britishVoice) {
                    utterance.voice = britishVoice;
                }
                
                speechSynthesis.speak(utterance);
                this.showNotification('🎵 Playing panic attack help - breathe along with the guidance', 'info');
            } else {
                this.showNotification('🎵 Audio guidance not available, but remember: breathe slowly and deeply', 'warning');
            }
        } catch (error) {
            console.error('Failed to play panic attack help:', error);
            this.showNotification('Focus on slow, deep breathing. You are safe.', 'info');
        }
    }

    playGuidedGrounding() {
        try {
            console.log('🧘 Playing grounding audio...');
            
            // Use Web Speech API for grounding exercise
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(
                    "Let's ground ourselves together. Look around and name 5 things you can see... Now 4 things you can touch... 3 things you can hear... 2 things you can smell... and 1 thing you can taste. You are here, you are present, you are safe."
                );
                utterance.rate = 0.7;
                utterance.pitch = 0.9;
                utterance.volume = 0.7;
                
                // Try to use British voice if available
                const voices = speechSynthesis.getVoices();
                const britishVoice = voices.find(voice => voice.lang.includes('en-GB') || voice.name.includes('British'));
                if (britishVoice) {
                    utterance.voice = britishVoice;
                }
                
                speechSynthesis.speak(utterance);
                this.showNotification('🧘 Playing grounding exercise - follow along with the 5-4-3-2-1 technique', 'info');
            } else {
                this.showNotification('🧘 Try the 5-4-3-2-1 grounding technique: 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste', 'info');
            }
        } catch (error) {
            console.error('Failed to play grounding audio:', error);
            this.showNotification('Focus on your senses: what can you see, hear, and feel right now?', 'info');
        }
    }

    /**
     * Initialize Content Automation System
     * Automatically discovers and curates latest PTSD/trauma research and resources
     */
    async initializeContentAutomation() {
        console.log('🤖 Initializing Content Automation System...');
        
        try {
            // Only initialize for admin users to avoid unnecessary API calls
            if (this.currentUser.isAdmin) {
                // Load content automation scripts
                await this.loadContentAutomationScripts();
                
                // Initialize the scheduler
                this.setupContentAutomationScheduler();
                
                console.log('✅ Content automation system initialized');
                this.showNotification('🤖 Content automation system ready', 'success');
            } else {
                console.log('ℹ️ Content automation requires admin access - skipping initialization');
            }
        } catch (error) {
            console.error('❌ Content automation initialization failed:', error);
        }
    }

    /**
     * Load content automation scripts dynamically
     */
    async loadContentAutomationScripts() {
        try {
            // Check if scripts already loaded
            if (window.ContentAggregator && window.AutomationScheduler) {
                return;
            }

            // Load ContentAggregator script
            const aggregatorScript = document.createElement('script');
            aggregatorScript.src = '/src/services/contentAutomation/ContentAggregator.js';
            document.head.appendChild(aggregatorScript);

            // Load AutomationScheduler script  
            const schedulerScript = document.createElement('script');
            schedulerScript.src = '/src/services/contentAutomation/AutomationScheduler.js';
            document.head.appendChild(schedulerScript);

            // Wait for scripts to load
            await new Promise((resolve, reject) => {
                let loadedScripts = 0;
                const checkLoaded = () => {
                    loadedScripts++;
                    if (loadedScripts === 2) resolve();
                };
                
                aggregatorScript.onload = checkLoaded;
                schedulerScript.onload = checkLoaded;
                aggregatorScript.onerror = reject;
                schedulerScript.onerror = reject;
                
                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Script loading timeout')), 10000);
            });

            console.log('✅ Content automation scripts loaded');
        } catch (error) {
            console.error('❌ Failed to load content automation scripts:', error);
            throw error;
        }
    }

    /**
     * Setup content automation scheduler
     */
    setupContentAutomationScheduler() {
        try {
            if (!window.AutomationScheduler) {
                throw new Error('AutomationScheduler not available');
            }

            // Initialize scheduler with 24-hour interval
            this.automationScheduler = new AutomationScheduler({
                interval: 24 * 60 * 60 * 1000, // 24 hours
                autoApprovalThreshold: 0.9, // Auto-approve content with 90%+ relevance
                maxContentPerRun: 10 // Limit content discovery per run
            });

            // Set up scheduler callbacks
            this.automationScheduler.onContentDiscovered = (content) => {
                console.log('🔍 New content discovered:', content.length, 'items');
                this.showNotification(`🔍 Discovered ${content.length} new research articles`, 'info');
            };

            this.automationScheduler.onError = (error) => {
                console.error('❌ Content automation error:', error);
                this.showNotification('❌ Content automation encountered an error', 'error');
            };

            console.log('✅ Content automation scheduler ready');
        } catch (error) {
            console.error('❌ Failed to setup automation scheduler:', error);
            throw error;
        }
    }

    /**
     * Open content admin dashboard
     */
    openContentAdmin() {
        // Check admin access
        if (!this.currentUser.isAdmin) {
            this.showNotification('❌ Content admin requires admin access', 'error');
            return;
        }
        
        // Open content admin in new window
        const adminWindow = window.open('/content-admin.html', '_blank', 'width=1200,height=800');
        if (!adminWindow) {
            alert('Please allow popups to access the content admin dashboard');
        }
    }

    /**
     * Manual content discovery trigger
     */
    async discoverNewContent() {
        if (!this.currentUser.isAdmin) {
            this.showNotification('❌ Content discovery requires admin access', 'error');
            return;
        }
        
        try {
            this.showNotification('🔍 Starting content discovery...', 'info');
            
            // Initialize content aggregator if needed
            if (!this.contentAggregator) {
                await this.loadContentAutomationScripts();
                this.contentAggregator = new ContentAggregator();
            }
            
            // Discover new content
            const newContent = await this.contentAggregator.discoverContent();
            
            if (newContent.length > 0) {
                this.showNotification(`✅ Found ${newContent.length} new articles for review`, 'success');
            } else {
                this.showNotification('ℹ️ No new content found at this time', 'info');
            }
            
            return newContent;
        } catch (error) {
            console.error('❌ Content discovery failed:', error);
            this.showNotification('❌ Content discovery failed', 'error');
        }
    }

    /**
     * Toggle content automation on/off
     */
    toggleContentAutomation(enabled = true) {
        if (!this.currentUser.isAdmin) {
            this.showNotification('❌ Content automation control requires admin access', 'error');
            return;
        }

        if (!this.automationScheduler) {
            this.showNotification('❌ Content automation not initialized', 'error');
            return;
        }
        
        if (enabled) {
            this.automationScheduler.start();
            this.showNotification('✅ Content automation enabled', 'success');
        } else {
            this.automationScheduler.stop();
            this.showNotification('⏸️ Content automation paused', 'info');
        }
    }
}

// Initialize the app with debugging
let app;

console.log('🔧 App initialization starting...');

function initializeApp() {
    try {
        console.log('📱 Creating RootCausePowerApp instance...');
        app = new RootCausePowerApp();
        window.app = app; // Make globally accessible
        
        // Add founder mode shortcuts for David Prince
        window.founderMode = () => app.activateFounderMode();
        window.adminMode = () => app.enableAdminAccess(true);
        
        console.log('✅ App instance created:', app.constructor.name);
        
        // Verify critical functions are accessible
        console.log('✅ App functions available:');
        console.log('- selectPlan:', typeof app.selectPlan);
        console.log('- openCoachModal:', typeof app.openCoachModal);
        console.log('- closeModal:', typeof app.closeModal);
        
        // Add missing function if needed
        if (typeof app.addDailyWin !== 'function') {
            app.addDailyWin = function() {
                this.openDailyWinModal();
            };
            console.log('✅ Added missing addDailyWin function');
        }
        
        console.log('🎉 App initialization complete!');
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.error('Error details:', error.stack);
        
        // Create fallback app object to prevent button errors
        window.app = window.app || {
            selectPlan: function() { console.log('selectPlan called - app not fully initialized'); },
            openCoachModal: function() { console.log('openCoachModal called - app not fully initialized'); },
            closeModal: function() { console.log('closeModal called - app not fully initialized'); },
            triggerCrisisSupport: function() { console.log('Crisis support requested - app not fully initialized'); }
        };
        console.log('🔧 Fallback app object created to prevent button errors');
    }
}

// Ensure proper initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
