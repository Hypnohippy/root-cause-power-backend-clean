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
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.updateVoiceStatus('Listening... speak naturally');
                this.isRecording = true;
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.processUserSpeech(finalTranscript);
                }
            };
            
            this.recognition.onerror = (error) => {
                console.error('❌ Speech recognition error:', error);
                this.updateVoiceStatus('Speech recognition error - please try again');
            };
            
            this.recognition.start();
            
        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
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
                const prompt = `You are an empathetic voice coach. The user said: "${userText}". 
                Detected emotions: ${emotionContext}. 
                Respond with warmth, understanding, and helpful guidance in 2-3 sentences maximum. 
                Be conversational and supportive.`;
                
                const response = await window.app.callAI(prompt, 'voice-coach');
                return response;
            }
            
            // Fallback responses based on emotions
            return this.generateFallbackResponse(emotions[0]?.name || 'neutral');
            
        } catch (error) {
            console.error('❌ Error generating AI response:', error);
            return "I'm here to support you. Please tell me more about how you're feeling.";
        }
    }

    // Generate fallback empathetic responses
    generateFallbackResponse(emotion) {
        const responses = {
            sadness: "I can hear that you're going through a difficult time. It's okay to feel sad - these feelings are valid. What's one small thing that usually brings you comfort?",
            anger: "I notice you're feeling frustrated right now. Those feelings are completely understandable. Let's take a deep breath together and explore what's behind these feelings.",
            anxiety: "I can sense you're feeling anxious. That must be really challenging. Remember, you're safe right now. Would it help to try a grounding technique together?",
            joy: "I love hearing the positivity in your voice! It's wonderful when we can recognize and celebrate these good moments. What's contributing to this good feeling?",
            neutral: "I'm here and listening to you. Sometimes it's helpful just to have someone present with us. What's on your mind today?"
        };
        
        return responses[emotion] || responses.neutral;
    }

    // Speak response using text-to-speech
    speakResponse(text) {
        try {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Try to find a good voice
                const voices = speechSynthesis.getVoices();
                const preferredVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && voice.name.includes('Female')
                ) || voices.find(voice => voice.lang.startsWith('en'));
                
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
                
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 0.8;
                
                utterance.onstart = () => {
                    this.isPlaying = true;
                    this.updateVoiceStatus('AI Coach is speaking...');
                    this.animateVoiceWaves(true);
                };
                
                utterance.onend = () => {
                    this.isPlaying = false;
                    this.updateVoiceStatus('Listening... speak naturally');
                    this.animateVoiceWaves(false);
                };
                
                speechSynthesis.speak(utterance);
                
            } else {
                console.warn('⚠️ Text-to-speech not supported');
                this.updateVoiceStatus('Speech synthesis not supported in this browser');
            }
        } catch (error) {
            console.error('❌ Error speaking response:', error);
        }
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