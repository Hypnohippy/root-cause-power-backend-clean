/**
 * Empathic Voice Interface Component for PTSD Coaching
 * Provides real-time emotional voice interaction with trauma-informed responses
 */

class EmpathicVoiceInterface {
    constructor(containerId, config = {}) {
        this.containerId = containerId;
        this.config = {
            apiKey: config.apiKey || window.app?.apiKey,
            voiceId: config.voiceId || 'empathic-therapist-voice',
            theme: config.theme || 'healing',
            crisisDetection: config.crisisDetection !== false,
            ...config
        };
        
        // State management
        this.isListening = false;
        this.isConnected = false;
        this.emotionalState = null;
        this.conversationHistory = [];
        this.crisisMode = false;
        
        // Audio components
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioStream = null;
        
        // EVI client
        this.eviClient = null;
        
        // UI elements
        this.container = null;
        this.voiceButton = null;
        this.emotionDisplay = null;
        this.chatHistory = null;
        this.crisisAlert = null;
        
        console.log('🎤 EmpathicVoiceInterface initialized');
    }
    
    /**
     * Initialize the voice interface
     */
    async init() {
        try {
            await this.createUI();
            await this.setupEviClient();
            await this.initializeAudio();
            
            console.log('✅ Empathic Voice Interface ready');
            this.updateStatus('Ready for empathic conversation', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize voice interface:', error);
            this.updateStatus('Failed to initialize voice coaching', 'error');
        }
    }
    
    /**
     * Create the user interface
     */
    async createUI() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`Container ${this.containerId} not found`);
        }
        
        this.container.innerHTML = `
            <div class="empathic-voice-interface bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-heart text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg text-gray-800">Coach Sarah - Voice AI</h3>
                            <p class="text-sm text-gray-600" id="voice-status">Connecting...</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div id="emotion-indicator" class="w-4 h-4 rounded-full bg-gray-300"></div>
                        <span id="emotion-text" class="text-sm text-gray-600">Neutral</span>
                    </div>
                </div>
                
                <!-- Crisis Alert -->
                <div id="crisis-alert" class="hidden bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-700">Crisis Support Available</h4>
                            <p class="text-red-600 text-sm">I'm here to help. Immediate support resources are available.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Emotional State Display -->
                <div id="emotional-state" class="bg-white rounded-lg p-4 mb-6 border border-purple-200">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-gray-700">Emotional State</h4>
                        <div class="text-sm text-gray-500" id="emotion-timestamp">--</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2" id="emotion-grid">
                        <div class="text-center p-2 bg-gray-50 rounded">
                            <div class="text-sm font-medium text-gray-600">Calm</div>
                            <div class="text-xs text-gray-500" id="calm-level">0%</div>
                        </div>
                        <div class="text-center p-2 bg-gray-50 rounded">
                            <div class="text-sm font-medium text-gray-600">Distress</div>
                            <div class="text-xs text-gray-500" id="distress-level">0%</div>
                        </div>
                        <div class="text-center p-2 bg-gray-50 rounded">
                            <div class="text-sm font-medium text-gray-600">Hope</div>
                            <div class="text-xs text-gray-500" id="hope-level">0%</div>
                        </div>
                    </div>
                </div>
                
                <!-- Chat History -->
                <div id="chat-history" class="bg-white rounded-lg border border-gray-200 mb-6 max-h-80 overflow-y-auto">
                    <div class="p-4 border-b border-gray-100">
                        <h4 class="font-semibold text-gray-700">Conversation</h4>
                    </div>
                    <div id="messages-container" class="p-4 space-y-4">
                        <div class="flex items-start assistant-message">
                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <i class="fas fa-heart text-purple-500 text-sm"></i>
                            </div>
                            <div class="bg-purple-50 rounded-lg p-3 max-w-md">
                                <p class="text-sm text-gray-700">Hello! I'm Coach Sarah, your empathic AI companion. I'm here to provide trauma-informed support. How are you feeling right now?</p>
                                <div class="text-xs text-gray-500 mt-1">Just now</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Voice Controls -->
                <div class="flex items-center justify-center space-x-4">
                    <button id="voice-button" class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 flex items-center justify-center">
                        <i class="fas fa-microphone text-xl"></i>
                    </button>
                    <div class="text-center">
                        <div class="text-sm font-medium text-gray-700">Tap to speak with Coach Sarah</div>
                        <div class="text-xs text-gray-500">Empathic voice AI • Crisis detection active</div>
                    </div>
                </div>
                
                <!-- Audio Visualizer -->
                <div id="audio-visualizer" class="hidden mt-6">
                    <div class="flex items-center justify-center space-x-1">
                        <div class="w-1 bg-purple-400 rounded-full audio-bar" style="height: 8px;"></div>
                        <div class="w-1 bg-purple-400 rounded-full audio-bar" style="height: 16px;"></div>
                        <div class="w-1 bg-purple-400 rounded-full audio-bar" style="height: 12px;"></div>
                        <div class="w-1 bg-purple-400 rounded-full audio-bar" style="height: 20px;"></div>
                        <div class="w-1 bg-purple-400 rounded-full audio-bar" style="height: 8px;"></div>
                    </div>
                </div>
                
                <!-- Therapeutic Tools -->
                <div id="therapeutic-tools" class="mt-6 grid grid-cols-2 gap-3">
                    <button id="grounding-btn" class="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-center transition-colors">
                        <i class="fas fa-leaf text-green-500 mb-1"></i>
                        <div class="text-sm font-medium text-green-700">Grounding</div>
                    </button>
                    <button id="breathing-btn" class="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center transition-colors">
                        <i class="fas fa-wind text-blue-500 mb-1"></i>
                        <div class="text-sm font-medium text-blue-700">Breathing</div>
                    </button>
                </div>
            </div>
        `;
        
        this.bindUIElements();
        this.attachEventListeners();
    }
    
    /**
     * Bind UI elements to properties
     */
    bindUIElements() {
        this.voiceButton = document.getElementById('voice-button');
        this.emotionDisplay = document.getElementById('emotional-state');
        this.chatHistory = document.getElementById('messages-container');
        this.crisisAlert = document.getElementById('crisis-alert');
        this.audioVisualizer = document.getElementById('audio-visualizer');
        this.statusElement = document.getElementById('voice-status');
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Voice button
        this.voiceButton.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
        
        // Therapeutic tools
        document.getElementById('grounding-btn').addEventListener('click', () => {
            this.triggerGroundingTechnique();
        });
        
        document.getElementById('breathing-btn').addEventListener('click', () => {
            this.triggerBreathingExercise();
        });
    }
    
    /**
     * Setup EVI client with event handlers
     */
    async setupEviClient() {
        this.eviClient = new HumeEviClient({
            apiKey: this.config.apiKey,
            voiceId: this.config.voiceId,
            configId: 'ptsd-coach-config',
            
            onEmotionDetected: (emotionalState, message) => {
                this.handleEmotionDetected(emotionalState, message);
            },
            
            onCrisisDetected: (crisisData) => {
                this.handleCrisisDetected(crisisData);
            },
            
            onMessage: (type, message) => {
                this.handleMessage(type, message);
            },
            
            onError: (error) => {
                this.handleError(error);
            }
        });
        
        await this.eviClient.connect();
        this.isConnected = true;
        this.updateStatus('Connected to empathic AI coach', 'success');
    }
    
    /**
     * Initialize audio components
     */
    async initializeAudio() {
        try {
            // Get user media for microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.eviClient) {
                    // Send audio data to EVI
                    this.eviClient.sendAudio(event.data);
                }
            };
            
            console.log('🎙️ Audio initialization successful');
            
        } catch (error) {
            console.error('❌ Audio initialization failed:', error);
            this.updateStatus('Microphone access required for voice chat', 'warning');
        }
    }
    
    /**
     * Start listening for voice input
     */
    async startListening() {
        if (!this.audioStream || !this.mediaRecorder) {
            await this.initializeAudio();
        }
        
        try {
            this.isListening = true;
            this.mediaRecorder.start(250); // Send chunks every 250ms
            
            // Update UI
            this.voiceButton.innerHTML = '<i class="fas fa-stop text-xl"></i>';
            this.voiceButton.classList.add('bg-red-500', 'hover:bg-red-600');
            this.voiceButton.classList.remove('bg-purple-500', 'hover:bg-purple-600');
            
            this.audioVisualizer.classList.remove('hidden');
            this.startAudioVisualization();
            
            this.updateStatus('Listening... speak naturally', 'listening');
            
            console.log('🎤 Started listening for voice input');
            
        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            this.updateStatus('Failed to start voice recording', 'error');
        }
    }
    
    /**
     * Stop listening for voice input
     */
    stopListening() {
        if (this.mediaRecorder && this.isListening) {
            this.mediaRecorder.stop();
        }
        
        this.isListening = false;
        
        // Update UI
        this.voiceButton.innerHTML = '<i class="fas fa-microphone text-xl"></i>';
        this.voiceButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        this.voiceButton.classList.add('bg-purple-500', 'hover:bg-purple-600');
        
        this.audioVisualizer.classList.add('hidden');
        this.stopAudioVisualization();
        
        this.updateStatus('Processing your message...', 'processing');
        
        console.log('🛑 Stopped listening');
    }
    
    /**
     * Handle emotion detection from EVI
     */
    handleEmotionDetected(emotionalState, message) {
        console.log('🎭 Emotion detected:', emotionalState);
        
        this.emotionalState = emotionalState;
        this.updateEmotionalDisplay(emotionalState);
        
        // Update emotion indicator
        const indicator = document.getElementById('emotion-indicator');
        const text = document.getElementById('emotion-text');
        
        if (emotionalState.dominant) {
            text.textContent = emotionalState.dominant.charAt(0).toUpperCase() + emotionalState.dominant.slice(1);
            
            // Color code based on emotion
            const emotionColors = {
                calm: 'bg-green-400',
                joy: 'bg-yellow-400',
                sadness: 'bg-blue-400',
                anger: 'bg-red-400',
                fear: 'bg-purple-400',
                anxiety: 'bg-orange-400',
                distress: 'bg-red-500'
            };
            
            indicator.className = `w-4 h-4 rounded-full ${emotionColors[emotionalState.dominant] || 'bg-gray-400'}`;
        }
    }
    
    /**
     * Handle crisis detection
     */
    handleCrisisDetected(crisisData) {
        console.log('🚨 Crisis detected:', crisisData);
        
        this.crisisMode = true;
        this.showCrisisAlert();
        
        // Trigger crisis intervention in main app
        if (window.app && window.app.triggerCrisisIntervention) {
            window.app.triggerCrisisIntervention(crisisData.risk_score, crisisData);
        }
        
        // Add crisis message to chat
        this.addMessageToChat('system', {
            text: '🚨 Crisis support activated. You are not alone. Immediate help is available.',
            type: 'crisis',
            timestamp: new Date()
        });
    }
    
    /**
     * Handle messages from EVI
     */
    handleMessage(type, message) {
        this.addMessageToChat(type, message);
        
        if (type === 'assistant') {
            this.updateStatus('Coach Sarah responded', 'success');
            
            // Play audio response if available
            if (message.audio_url) {
                this.playAudioResponse(message.audio_url);
            }
        }
    }
    
    /**
     * Add message to chat history
     */
    addMessageToChat(type, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `flex items-start ${type}-message mb-4`;
        
        const timestamp = new Date(message.timestamp || new Date()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (type === 'assistant' || type === 'system') {
            messageElement.innerHTML = `
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-heart text-purple-500 text-sm"></i>
                </div>
                <div class="bg-purple-50 rounded-lg p-3 max-w-md">
                    <p class="text-sm text-gray-700">${message.text}</p>
                    <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-user text-blue-500 text-sm"></i>
                </div>
                <div class="bg-blue-50 rounded-lg p-3 max-w-md">
                    <p class="text-sm text-gray-700">${message.text}</p>
                    <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
                </div>
            `;
        }
        
        this.chatHistory.appendChild(messageElement);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        
        // Store in conversation history
        this.conversationHistory.push({
            type: type,
            message: message.text,
            timestamp: new Date(),
            emotional_state: this.emotionalState
        });
    }
    
    /**
     * Update emotional state display
     */
    updateEmotionalDisplay(emotionalState) {
        // Update timestamp
        document.getElementById('emotion-timestamp').textContent = 
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Update emotion levels
        const emotions = emotionalState.all_emotions || {};
        
        document.getElementById('calm-level').textContent = 
            Math.round((emotions.calm || 0) * 100) + '%';
        document.getElementById('distress-level').textContent = 
            Math.round((emotions.distress || emotions.anxiety || 0) * 100) + '%';
        document.getElementById('hope-level').textContent = 
            Math.round((emotions.joy || emotions.contentment || 0) * 100) + '%';
    }
    
    /**
     * Show crisis alert
     */
    showCrisisAlert() {
        this.crisisAlert.classList.remove('hidden');
        
        // Auto-hide after 10 seconds unless in active crisis
        setTimeout(() => {
            if (!this.crisisMode) {
                this.crisisAlert.classList.add('hidden');
            }
        }, 10000);
    }
    
    /**
     * Trigger grounding technique
     */
    triggerGroundingTechnique() {
        console.log('🧘 Triggering grounding technique');
        
        if (window.app && window.app.startGroundingTechnique) {
            window.app.startGroundingTechnique('5-4-3-2-1', 'mild');
        }
        
        // Send to EVI for guided grounding
        if (this.eviClient) {
            this.eviClient.sendText('I would like to do a grounding exercise');
        }
    }
    
    /**
     * Trigger breathing exercise  
     */
    triggerBreathingExercise() {
        console.log('💨 Triggering breathing exercise');
        
        if (window.app && window.app.startBreathingExercise) {
            window.app.startBreathingExercise();
        }
        
        // Send to EVI for guided breathing
        if (this.eviClient) {
            this.eviClient.sendText('Can you guide me through a breathing exercise?');
        }
    }
    
    /**
     * Update status display
     */
    updateStatus(message, type = 'info') {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            
            const colors = {
                success: 'text-green-600',
                error: 'text-red-600', 
                warning: 'text-yellow-600',
                listening: 'text-purple-600',
                processing: 'text-blue-600',
                info: 'text-gray-600'
            };
            
            this.statusElement.className = `text-sm ${colors[type] || colors.info}`;
        }
    }
    
    /**
     * Start audio visualization
     */
    startAudioVisualization() {
        const bars = this.audioVisualizer.querySelectorAll('.audio-bar');
        
        this.visualizationInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 20 + 5;
                bar.style.height = `${height}px`;
            });
        }, 150);
    }
    
    /**
     * Stop audio visualization
     */
    stopAudioVisualization() {
        if (this.visualizationInterval) {
            clearInterval(this.visualizationInterval);
        }
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('❌ Voice interface error:', error);
        this.updateStatus('Voice coaching temporarily unavailable', 'error');
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.eviClient) {
            this.eviClient.disconnect();
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.stopAudioVisualization();
        
        console.log('🧹 Voice interface cleaned up');
    }
}

// Export for global use
window.EmpathicVoiceInterface = EmpathicVoiceInterface;
export default EmpathicVoiceInterface;