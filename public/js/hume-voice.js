/**
 * Hume AI Voice Integration for Root Cause Power Platform
 * Provides emotionally intelligent conversational AI voice coaching
 */

class HumeVoiceCoach {
    constructor() {
        this.isInitialized = false;
        this.isRecording = false;
        this.isPlaying = false;
        this.accessToken = null;
        this.configId = null;
        this.socket = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.stream = null;
        this.sessionStartTime = null;
        this.sessionDuration = 0;
        this.manualStop = false; // Track if user manually stopped session
        
        // Voice session settings
        this.settings = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            voiceId: 'kora', // Default Hume AI voice
            minCreditsRequired: 2 // Minimum voice credits to start
        };
        
        this.init();
    }

    // Initialize Hume AI connection
    async init() {
        try {
            console.log('🎤 Initializing Hume AI Voice Coach...');
            
            // Get Hume AI credentials from server
            await this.getHumeCredentials();
            
            if (this.accessToken) {
                this.isInitialized = true;
                console.log('✅ Hume AI Voice Coach ready!');
            } else {
                console.warn('⚠️ Hume AI not fully configured - using fallback mode');
                this.isInitialized = false;
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Hume AI:', error);
            this.isInitialized = false;
        }
    }

    // Get Hume AI credentials from server
    async getHumeCredentials() {
        try {
            // For now, use fallback mode to ensure voice functionality works
            console.log('🔄 Using fallback voice mode for immediate functionality');
            this.accessToken = null;
            this.configId = null;
            
            // Note: Full Hume AI integration will be activated once API keys are configured
            // const response = await fetch('/api/hume/config');
            // const config = await response.json();
            // if (config.apiKey && config.configId) {
            //     this.accessToken = config.apiKey;
            //     this.configId = config.configId;
            //     console.log('🔑 Hume AI credentials loaded');
            // }
        } catch (error) {
            console.error('❌ Failed to get Hume credentials, using fallback:', error);
            this.accessToken = null;
            this.configId = null;
        }
    }

    // Start voice coaching session
    async startVoiceSession() {
        try {
            console.log('🎯 Starting Hume AI voice session...');
            
            // Reset manual stop flag
            this.manualStop = false;
            
            // Temporarily skip credit check for testing
            // TODO: Re-enable once credit system is fully integrated
            // if (!window.creditSystem || !window.creditSystem.canAfford('voice', this.settings.minCreditsRequired)) {
            //     window.creditSystem.showCreditWarning('voice');
            //     return false;
            // }

            // Check browser support
            if (!this.checkBrowserSupport()) {
                this.showUnsupportedBrowserMessage();
                return false;
            }

            // Request microphone permission
            if (!await this.requestMicrophonePermission()) {
                this.showMicrophonePermissionMessage();
                return false;
            }

            // Initialize audio context and WebSocket
            await this.setupAudioContext();
            await this.connectToHume();
            
            // Update UI
            this.updateVoiceUI('connected');
            this.sessionStartTime = Date.now();
            
            // Start recording
            this.startRecording();
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start voice session:', error);
            this.showErrorMessage('Failed to start voice session. Please try again.');
            return false;
        }
    }

    // Stop voice session
    async stopVoiceSession() {
        try {
            console.log('⏹️ Stopping Hume AI voice session...');
            
            // Set manual stop flag to prevent auto-restart
            this.manualStop = true;
            
            // Skip credit charging for now - TODO: Re-enable once credit system is integrated
            // if (this.sessionStartTime) {
            //     const duration = Date.now() - this.sessionStartTime;
            //     const minutes = Math.ceil(duration / (1000 * 60)); // Round up to nearest minute
            //     
            //     if (minutes > 0 && window.creditSystem && window.creditSystem.canAfford('voice', minutes)) {
            //         window.creditSystem.useVoiceCredits(minutes, 'Hume AI Voice Session');
            //     }
            // }
            
            // Stop recording
            this.stopRecording();
            
            // Close WebSocket connection
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            
            // Clean up audio resources
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.audioContext) {
                await this.audioContext.close();
                this.audioContext = null;
            }
            
            // Update UI
            this.updateVoiceUI('disconnected');
            this.sessionStartTime = null;
            
            // Close modal
            this.closeVoiceModal();
            
        } catch (error) {
            console.error('❌ Error stopping voice session:', error);
        }
    }

    // Check browser support for audio features
    checkBrowserSupport() {
        const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasWebSocket = !!window.WebSocket;
        const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
        
        return hasWebRTC && hasWebSocket && hasAudioContext;
    }

    // Request microphone permission
    async requestMicrophonePermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.settings.sampleRate,
                    channelCount: this.settings.channels,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            return true;
        } catch (error) {
            console.error('❌ Microphone permission denied:', error);
            return false;
        }
    }

    // Setup audio context and processing
    async setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.settings.sampleRate
            });
            
            // Resume audio context if suspended (Chrome autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log('🔊 Audio context initialized');
        } catch (error) {
            console.error('❌ Failed to setup audio context:', error);
            throw error;
        }
    }

    // Connect to Hume AI WebSocket
    async connectToHume() {
        return new Promise((resolve, reject) => {
            try {
                if (!this.accessToken || !this.configId) {
                    console.warn('⚠️ Using fallback voice system - Hume AI not configured');
                    this.startFallbackVoiceSystem();
                    resolve();
                    return;
                }

                const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${this.accessToken}&config_id=${this.configId}`;
                
                this.socket = new WebSocket(wsUrl);
                
                this.socket.onopen = () => {
                    console.log('✅ Connected to Hume AI');
                    this.sendInitialConfig();
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleHumeMessage(JSON.parse(event.data));
                };
                
                this.socket.onerror = (error) => {
                    console.error('❌ Hume AI WebSocket error:', error);
                    this.startFallbackVoiceSystem();
                    resolve(); // Still resolve to continue with fallback
                };
                
                this.socket.onclose = () => {
                    console.log('🔌 Hume AI connection closed');
                };
                
                // Timeout fallback
                setTimeout(() => {
                    if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
                        console.warn('⏰ Hume AI connection timeout - using fallback');
                        this.startFallbackVoiceSystem();
                        resolve();
                    }
                }, 5000);
                
            } catch (error) {
                console.error('❌ Failed to connect to Hume AI:', error);
                this.startFallbackVoiceSystem();
                resolve();
            }
        });
    }

    // Send initial configuration to Hume AI
    sendInitialConfig() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const config = {
                type: 'session_settings',
                audio_settings: {
                    sample_rate: this.settings.sampleRate,
                    channels: this.settings.channels,
                    encoding: 'linear16'
                },
                prosody_config: {
                    identify_speakers: false,
                    granularity: 'word',
                    window_ms: 2000
                }
            };
            
            this.socket.send(JSON.stringify(config));
        }
    }

    // Handle messages from Hume AI
    handleHumeMessage(data) {
        try {
            if (data.type === 'prosody_inference') {
                this.processProsodyData(data);
            } else if (data.type === 'audio_output') {
                this.playAIResponse(data.audio);
            } else if (data.type === 'error') {
                console.error('❌ Hume AI error:', data.message);
                this.showErrorMessage(data.message);
            }
        } catch (error) {
            console.error('❌ Error handling Hume message:', error);
        }
    }

    // Process emotion and prosody data from Hume AI
    processProsodyData(data) {
        if (data.prosody && data.prosody.predictions) {
            const emotions = data.prosody.predictions[0]?.emotions || [];
            
            // Find top emotions
            const topEmotions = emotions
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
            
            console.log('🧠 Detected emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(2)}`));
            
            // Update UI with emotional feedback
            this.updateEmotionalFeedback(topEmotions);
            
            // Generate contextual response based on emotions
            this.generateEmotionalResponse(topEmotions, data.text);
        }
    }

    // Start fallback voice system (browser speech APIs)
    startFallbackVoiceSystem() {
        console.log('🔄 Starting fallback voice system...');
        
        this.updateVoiceStatus('Using browser voice system - still emotionally aware!');
        
        // Use Web Speech API for recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.startSpeechRecognition();
        } else {
            this.showErrorMessage('Voice recognition not supported in this browser');
        }
    }

    // Start speech recognition (fallback)
    startSpeechRecognition() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                this.updateVoiceStatus('Speech recognition not supported in this browser');
                return;
            }
            
            this.recognition = new SpeechRecognition();
            
            // Better speech recognition settings
            this.recognition.continuous = false; // Process one phrase at a time for better conversation
            this.recognition.interimResults = false; // Only use final results
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Speech recognition started');
                this.updateVoiceStatus('I\'m listening... speak now');
                this.isRecording = true;
                this.animateVoiceWaves(true);
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[0];
                if (result.isFinal) {
                    const transcript = result[0].transcript.trim();
                    console.log('🗣️ User said:', transcript);
                    
                    if (transcript.length > 0) {
                        this.processUserSpeech(transcript);
                    } else {
                        this.updateVoiceStatus('I didn\'t catch that. Please try again.');
                        this.restartListening();
                    }
                }
            };
            
            this.recognition.onend = () => {
                console.log('🎤 Speech recognition ended');
                this.isRecording = false;
                this.animateVoiceWaves(false);
                
                // Auto-restart listening after AI responds (unless manually stopped)
                if (!this.manualStop) {
                    setTimeout(() => {
                        if (this.socket || this.recognition) {
                            this.restartListening();
                        }
                    }, 2000);
                }
            };
            
            this.recognition.onerror = (error) => {
                console.error('❌ Speech recognition error:', error.error);
                this.isRecording = false;
                this.animateVoiceWaves(false);
                
                if (error.error === 'no-speech') {
                    this.updateVoiceStatus('No speech detected. Click microphone to try again.');
                } else if (error.error === 'not-allowed') {
                    this.updateVoiceStatus('Microphone access denied. Please allow microphone access.');
                } else {
                    this.updateVoiceStatus('Speech error - click microphone to try again');
                }
            };
            
            this.recognition.start();
            
        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
            this.updateVoiceStatus('Speech recognition failed - please try again');
        }
    }
    
    // Restart listening for continuous conversation
    restartListening() {
        if (this.recognition && !this.manualStop && !this.isRecording) {
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.log('Recognition restart failed (normal if already running)');
                }
            }, 500);
        }
    }

    // Process user speech and generate AI response
    async processUserSpeech(text) {
        try {
            console.log('💬 User said:', text);
            this.updateVoiceStatus('Processing your message...');
            
            // Simple emotional analysis based on keywords
            const emotions = this.analyzeEmotionsSimple(text);
            
            // Generate empathetic response
            const response = await this.generateAIResponse(text, emotions);
            
            // Speak the response
            this.speakResponse(response);
            
        } catch (error) {
            console.error('❌ Error processing speech:', error);
        }
    }

    // Simple emotion analysis (fallback)
    analyzeEmotionsSimple(text) {
        const emotions = [];
        const lowerText = text.toLowerCase();
        
        // Basic emotion detection
        if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) {
            emotions.push({ name: 'sadness', score: 0.8 });
        }
        if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('mad')) {
            emotions.push({ name: 'anger', score: 0.8 });
        }
        if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous')) {
            emotions.push({ name: 'anxiety', score: 0.8 });
        }
        if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('great')) {
            emotions.push({ name: 'joy', score: 0.7 });
        }
        
        return emotions.length > 0 ? emotions : [{ name: 'neutral', score: 0.5 }];
    }

    // Generate AI response using existing AI system
    async generateAIResponse(userText, emotions) {
        try {
            // Use the main app's AI system if available
            if (window.app && window.app.callAI) {
                const emotionContext = emotions.map(e => `${e.name} (${e.score.toFixed(2)})`).join(', ');
                const prompt = `You are a warm, empathetic voice coach speaking directly to someone. The user just said: "${userText}". 

Detected emotions: ${emotionContext}.

Respond naturally as if you're having a real conversation. Guidelines:
- Keep it to 1-2 sentences maximum for natural conversation flow
- Be warm and supportive, not clinical
- Ask a gentle follow-up question to keep the conversation going
- Use "I" statements and direct address ("you")
- Match their emotional tone appropriately
- If they seem distressed, offer gentle comfort and coping suggestions
- If they seem positive, celebrate with them
- Make it feel like talking to a caring friend who happens to be a mental health expert

Response:`;
                
                const response = await window.app.callAI(prompt, 'voice-coach');
                return response;
            }
            
            // Enhanced fallback responses
            return this.generateFallbackResponse(emotions[0]?.name || 'neutral', userText);
            
        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return "I'm really glad you're sharing with me. What's been on your mind today?";
        }
    }

    // Generate fallback empathetic responses
    generateFallbackResponse(emotion, userText = '') {
        const responses = {
            sadness: [
                "I hear you, and I want you to know that what you're feeling is completely valid. What's been weighing on you most?",
                "It sounds like you're carrying something heavy right now. I'm here with you. Can you tell me more about what's going on?",
                "Your feelings matter, and it's okay to not be okay sometimes. What would feel most helpful right now?"
            ],
            anger: [
                "I can feel the intensity in what you're sharing. Those feelings make total sense. What triggered this for you?",
                "It sounds like something really got to you. I'm listening. What happened?",
                "That frustration is so real. Sometimes we need to feel it before we can work through it. What's going on?"
            ],
            anxiety: [
                "I can sense that anxious energy. You're not alone in this. What's making you feel most worried right now?",
                "Anxiety can feel so overwhelming. You're brave for talking about it. What's been on your mind?",
                "I hear that worry in your voice. Let's take this one step at a time. What's concerning you most?"
            ],
            joy: [
                "I love hearing that brightness in your voice! It's beautiful when good things happen. What's brought this happiness?",
                "You sound so positive right now - that's wonderful! Tell me what's going well for you.",
                "That joy is contagious! I'm so glad you're experiencing this. What's been lifting your spirits?"
            ],
            neutral: [
                "I'm really glad you're here talking with me. Whatever's on your mind, I'm listening. How are you doing today?",
                "Thanks for sharing your thoughts with me. I'm here to support you. What would be most helpful to talk about?",
                "I appreciate you opening up. Sometimes just talking helps. What's been going through your mind lately?"
            ]
        };
        
        const responseList = responses[emotion] || responses.neutral;
        const randomResponse = responseList[Math.floor(Math.random() * responseList.length)];
        
        return randomResponse;
    }

    // Speak response using text-to-speech
    speakResponse(text) {
        try {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                // Wait for voices to load if they haven't yet
                let voices = speechSynthesis.getVoices();
                if (voices.length === 0) {
                    speechSynthesis.onvoiceschanged = () => {
                        voices = speechSynthesis.getVoices();
                        this.createAndSpeakUtterance(text, voices);
                    };
                } else {
                    this.createAndSpeakUtterance(text, voices);
                }
                
            } else {
                console.warn('⚠️ Text-to-speech not supported');
                this.updateVoiceStatus('Speech synthesis not supported in this browser');
            }
        } catch (error) {
            console.error('❌ Error speaking response:', error);
        }
    }
    
    // Create and speak utterance with consistent voice
    createAndSpeakUtterance(text, voices) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find the best voice and stick with it
        let selectedVoice = null;
        
        // Prefer specific good voices
        const preferredVoices = [
            'Microsoft Zira - English (United States)',
            'Google US English',
            'Alex',
            'Samantha'
        ];
        
        for (const voiceName of preferredVoices) {
            selectedVoice = voices.find(voice => voice.name === voiceName);
            if (selectedVoice) break;
        }
        
        // Fallback to any English female voice
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
                voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
            );
        }
        
        // Fallback to any English voice
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        // Use the selected voice consistently
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('🗣️ Using voice:', selectedVoice.name);
        }
        
        // Consistent speech settings
        utterance.rate = 0.85; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        
        utterance.onstart = () => {
            this.isPlaying = true;
            this.updateVoiceStatus('AI Coach is speaking...');
            this.animateVoiceWaves(true);
        };
        
        utterance.onend = () => {
            this.isPlaying = false;
            this.updateVoiceStatus('Your turn - speak naturally');
            this.animateVoiceWaves(false);
            
            // Resume listening for continued conversation
            if (!this.manualStop) {
                setTimeout(() => {
                    this.restartListening();
                }, 1000);
            }
        };
        
        utterance.onerror = (error) => {
            console.error('❌ Speech synthesis error:', error);
            this.isPlaying = false;
            this.animateVoiceWaves(false);
            this.updateVoiceStatus('Speech error - please continue talking');
        };
        
        speechSynthesis.speak(utterance);
    }

    // Start recording audio
    startRecording() {
        try {
            if (!this.stream) return;
            
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
                    // Send audio data to Hume AI
                    this.socket.send(event.data);
                }
            };
            
            this.mediaRecorder.start(1000); // Send chunks every second
            this.isRecording = true;
            
            console.log('🎙️ Recording started');
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
        }
    }

    // Stop recording
    stopRecording() {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
            
            if (this.recognition && this.isRecording) {
                this.recognition.stop();
            }
            
            this.isRecording = false;
            console.log('⏹️ Recording stopped');
            
        } catch (error) {
            console.error('❌ Error stopping recording:', error);
        }
    }

    // Update voice UI elements
    updateVoiceUI(state) {
        const startBtn = document.getElementById('voice-start-btn');
        const stopBtn = document.getElementById('voice-stop-btn');
        const status = document.getElementById('voice-status');
        
        if (state === 'connected') {
            if (startBtn) startBtn.classList.add('hidden');
            if (stopBtn) stopBtn.classList.remove('hidden');
            this.updateVoiceStatus('Connected! Start speaking...');
            this.animateVoiceWaves(true);
        } else {
            if (startBtn) startBtn.classList.remove('hidden');
            if (stopBtn) stopBtn.classList.add('hidden');
            this.updateVoiceStatus('Ready to Listen');
            this.animateVoiceWaves(false);
        }
    }

    // Update voice status text
    updateVoiceStatus(message) {
        const statusEl = document.querySelector('#voice-status .text-xl');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    // Animate voice waves
    animateVoiceWaves(active) {
        const waves = document.querySelectorAll('.voice-wave');
        waves.forEach((wave, index) => {
            if (active) {
                wave.style.animationPlayState = 'running';
            } else {
                wave.style.animationPlayState = 'paused';
                wave.style.height = '20px';
            }
        });
    }

    // Update emotional feedback in UI
    updateEmotionalFeedback(emotions) {
        const statusDiv = document.querySelector('#voice-status .text-purple-200');
        if (statusDiv && emotions.length > 0) {
            const topEmotion = emotions[0];
            statusDiv.textContent = `I sense ${topEmotion.name} - I'm here with you`;
        }
    }

    // Show error messages
    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // Show unsupported browser message
    showUnsupportedBrowserMessage() {
        this.showErrorMessage('Voice features require a modern browser with microphone support. Please update your browser or try Chrome/Firefox.');
    }

    // Show microphone permission message
    showMicrophonePermissionMessage() {
        this.showErrorMessage('Microphone access is required for voice coaching. Please allow microphone access and try again.');
    }

    // Close voice modal
    closeVoiceModal() {
        const modal = document.getElementById('hume-voice-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Get session stats
    getSessionStats() {
        const duration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
        return {
            duration: Math.floor(duration / 1000), // in seconds
            isActive: this.isRecording || this.isPlaying,
            creditsUsed: Math.ceil(duration / (1000 * 60)) // in minutes
        };
    }
}

// Initialize Hume Voice Coach
window.humeVoice = new HumeVoiceCoach();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HumeVoiceCoach;
}

console.log('🎤 Hume AI Voice Coach initialized!');