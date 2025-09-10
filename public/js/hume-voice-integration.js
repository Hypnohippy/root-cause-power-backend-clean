// ===========================================
// 🎤 HUME AI VOICE INTEGRATION
// Revolutionary Empathic Voice Interface for PTSD Support
// ===========================================

class HumeVoiceIntegration {
    constructor() {
        console.log('🎤 Initializing Hume Voice Integration...');
        
        this.isConnected = false;
        this.isRecording = false;
        this.websocket = null;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioContext = null;
        
        // Configuration
        this.config = {
            apiKey: null,
            configId: null,
            wsUrl: null
        };
        
        // Session state
        this.sessionId = null;
        this.emotionalState = {};
        this.transcripts = [];
        
        // Crisis detection
        this.crisisDetected = false;
        this.crisisThreshold = 0.8; // Adjust based on testing
    }

    // ===========================================
    // 🔧 INITIALIZATION
    // ===========================================
    
    async initialize() {
        try {
            console.log('🔧 Loading Hume configuration...');
            
            // Get configuration from server
            const response = await fetch('/api/hume/config');
            const config = await response.json();
            
            if (config.apiKey && config.configId) {
                this.config = config;
                console.log('✅ Hume configuration loaded successfully');
                return true;
            } else {
                console.warn('⚠️ Hume API keys not configured');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Hume initialization failed:', error);
            return false;
        }
    }

    // ===========================================
    // 🔗 CONNECTION MANAGEMENT  
    // ===========================================
    
    async connect() {
        if (this.isConnected) {
            console.log('ℹ️ Already connected to Hume');
            return true;
        }

        try {
            console.log('🔗 Connecting to Hume EVI...');
            
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Get microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Create WebSocket connection
            if (this.config.wsUrl) {
                this.websocket = new WebSocket(this.config.wsUrl);
                this.setupWebSocketHandlers();
                
                // Wait for connection
                await new Promise((resolve, reject) => {
                    this.websocket.onopen = () => {
                        this.isConnected = true;
                        console.log('✅ Connected to Hume EVI');
                        resolve();
                    };
                    this.websocket.onerror = reject;
                    setTimeout(reject, 10000); // 10 second timeout
                });
                
                return true;
            } else {
                // Fallback mode for demo
                console.log('🎭 Running in demo mode (no WebSocket)');
                this.isConnected = true;
                return true;
            }
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    disconnect() {
        console.log('🔌 Disconnecting from Hume EVI...');
        
        this.isConnected = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('✅ Disconnected from Hume EVI');
    }

    // ===========================================
    // 🎙️ AUDIO RECORDING
    // ===========================================
    
    async startRecording() {
        if (!this.isConnected) {
            throw new Error('Not connected to Hume EVI');
        }

        try {
            console.log('🎙️ Starting audio recording...');
            
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            this.isRecording = true;
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.sendAudioData(event.data);
                }
            };
            
            this.mediaRecorder.start(100); // Send data every 100ms
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('❌ Recording failed:', error);
            throw error;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            console.log('🛑 Stopping audio recording...');
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('✅ Recording stopped');
        }
    }

    // ===========================================
    // 📡 WEBSOCKET COMMUNICATION
    // ===========================================
    
    setupWebSocketHandlers() {
        if (!this.websocket) return;

        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleHumeResponse(data);
            } catch (error) {
                console.error('❌ Error parsing Hume response:', error);
            }
        };

        this.websocket.onclose = () => {
            console.log('🔌 WebSocket connection closed');
            this.isConnected = false;
        };

        this.websocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.isConnected = false;
        };
    }

    sendAudioData(audioBlob) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            // Convert blob to base64 and send
            const reader = new FileReader();
            reader.onload = () => {
                const audioData = reader.result.split(',')[1]; // Remove data: prefix
                this.websocket.send(JSON.stringify({
                    type: 'audio_input',
                    data: audioData,
                    timestamp: Date.now()
                }));
            };
            reader.readAsDataURL(audioBlob);
        }
    }

    // ===========================================
    // 🧠 RESPONSE HANDLING & EMOTION ANALYSIS
    // ===========================================
    
    handleHumeResponse(data) {
        console.log('📨 Received Hume response:', data.type || 'unknown');
        
        switch (data.type) {
            case 'user_message':
                this.handleUserMessage(data);
                break;
                
            case 'assistant_message':
                this.handleAssistantMessage(data);
                break;
                
            case 'user_interruption':
                this.handleUserInterruption(data);
                break;
                
            case 'error':
                this.handleError(data);
                break;
                
            default:
                console.log('🤖 Hume data:', data);
        }
        
        // Always check for emotional state and crisis indicators
        if (data.models && data.models.prosody) {
            this.analyzeEmotionalState(data.models.prosody);
        }
    }

    handleUserMessage(data) {
        console.log('👤 User said:', data.message?.content);
        
        // Store transcript
        this.transcripts.push({
            type: 'user',
            content: data.message?.content,
            timestamp: Date.now(),
            emotions: data.models?.prosody?.scores || {}
        });
        
        // Update UI
        this.updateTranscriptDisplay();
    }

    handleAssistantMessage(data) {
        console.log('🤖 Assistant response:', data.message?.content);
        
        // Store transcript
        this.transcripts.push({
            type: 'assistant',
            content: data.message?.content,
            timestamp: Date.now()
        });
        
        // Play audio response if available
        if (data.message?.audio) {
            this.playAudioResponse(data.message.audio);
        }
        
        // Update UI
        this.updateTranscriptDisplay();
    }

    handleUserInterruption(data) {
        console.log('✋ User interrupted');
        // Stop current audio playback
        this.stopAudioPlayback();
    }

    handleError(data) {
        console.error('❌ Hume error:', data.error);
        this.showError(data.error.message || 'Voice system error');
    }

    // ===========================================
    // 😊 EMOTIONAL INTELLIGENCE & CRISIS DETECTION
    // ===========================================
    
    analyzeEmotionalState(prosodyData) {
        if (!prosodyData || !prosodyData.scores) return;
        
        const emotions = prosodyData.scores;
        console.log('😊 Emotional state detected:', emotions);
        
        // Update current emotional state
        this.emotionalState = {
            ...emotions,
            timestamp: Date.now()
        };
        
        // Check for crisis indicators
        this.checkForCrisis(emotions);
        
        // Update UI with emotional feedback
        this.updateEmotionalDisplay(emotions);
    }

    checkForCrisis(emotions) {
        // Crisis indicators in emotional state
        const crisisEmotions = [
            'Anxiety', 'Distress', 'Fear', 'Sadness', 
            'Anger', 'Disgust', 'Contempt'
        ];
        
        let crisisScore = 0;
        let highestEmotion = { name: '', score: 0 };
        
        for (const [emotion, score] of Object.entries(emotions)) {
            if (score > highestEmotion.score) {
                highestEmotion = { name: emotion, score };
            }
            
            if (crisisEmotions.includes(emotion) && score > 0.7) {
                crisisScore += score;
            }
        }
        
        // Crisis detection threshold
        if (crisisScore > this.crisisThreshold && !this.crisisDetected) {
            this.triggerCrisisSupport(highestEmotion, crisisScore);
        }
        
        // Reset crisis flag if emotions stabilize
        if (crisisScore < 0.3 && this.crisisDetected) {
            this.crisisDetected = false;
            console.log('💚 Emotional state stabilized');
        }
    }

    async triggerCrisisSupport(dominantEmotion, crisisScore) {
        console.log('🚨 CRISIS DETECTED:', dominantEmotion.name, crisisScore);
        this.crisisDetected = true;
        
        try {
            // Alert the server
            const response = await fetch('/api/crisis/alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emotionalState: dominantEmotion,
                    transcript: this.transcripts.slice(-5), // Last 5 messages
                    severity: crisisScore,
                    userId: this.userId || 'anonymous',
                    timestamp: new Date().toISOString()
                })
            });
            
            const crisisData = await response.json();
            console.log('🚨 Crisis support activated:', crisisData.crisisId);
            
            // Show crisis support modal
            this.showCrisisSupport(crisisData);
            
        } catch (error) {
            console.error('❌ Crisis alert failed:', error);
            // Fallback to local crisis support
            this.showCrisisSupport();
        }
    }

    // ===========================================
    // 🔊 AUDIO PLAYBACK
    // ===========================================
    
    playAudioResponse(audioData) {
        try {
            // Decode base64 audio data
            const audioBlob = this.base64ToBlob(audioData, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.play().then(() => {
                console.log('🔊 Playing AI response');
            }).catch(error => {
                console.error('❌ Audio playback failed:', error);
            });
            
            // Cleanup URL after playing
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
            });
            
        } catch (error) {
            console.error('❌ Audio processing failed:', error);
        }
    }

    stopAudioPlayback() {
        // Stop all audio elements
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    // ===========================================
    // 🎨 UI UPDATES
    // ===========================================
    
    updateTranscriptDisplay() {
        const transcriptContainer = document.getElementById('voice-transcript');
        if (!transcriptContainer) return;
        
        const recentTranscripts = this.transcripts.slice(-10); // Show last 10 messages
        
        transcriptContainer.innerHTML = recentTranscripts.map(transcript => `
            <div class="transcript-message ${transcript.type} mb-2">
                <div class="text-xs text-gray-500 mb-1">
                    ${transcript.type === 'user' ? '👤 You' : '🤖 AI Coach'} 
                    • ${new Date(transcript.timestamp).toLocaleTimeString()}
                </div>
                <div class="p-3 rounded-lg ${
                    transcript.type === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }">
                    ${transcript.content || 'Audio message'}
                </div>
            </div>
        `).join('');
        
        // Auto-scroll to bottom
        transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
    }

    updateEmotionalDisplay(emotions) {
        const emotionalContainer = document.getElementById('emotional-state');
        if (!emotionalContainer) return;
        
        // Find top 3 emotions
        const sortedEmotions = Object.entries(emotions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        emotionalContainer.innerHTML = `
            <div class="emotional-feedback p-4 bg-purple-50 rounded-lg">
                <h4 class="font-semibold text-purple-800 mb-2">🧠 Emotional Intelligence</h4>
                <div class="space-y-1">
                    ${sortedEmotions.map(([emotion, score]) => `
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-700">${emotion}</span>
                            <span class="font-semibold text-purple-600">${Math.round(score * 100)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showCrisisSupport(crisisData = null) {
        // Use main app crisis support or create modal
        if (window.app && window.app.triggerCrisisSupport) {
            window.app.triggerCrisisSupport();
        } else {
            alert('Crisis support activated. Please call emergency services: 999 (UK) / 911 (US) or Samaritans: 116 123');
        }
    }

    showError(message) {
        if (window.app && window.app.showError) {
            window.app.showError(message);
        } else {
            console.error('Voice System Error:', message);
        }
    }

    // ===========================================
    // 🛠️ UTILITY FUNCTIONS
    // ===========================================
    
    base64ToBlob(base64Data, contentType) {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }

    // ===========================================
    // 📊 SESSION MANAGEMENT
    // ===========================================
    
    startSession(userId = null) {
        this.sessionId = 'session_' + Date.now();
        this.userId = userId;
        this.transcripts = [];
        this.emotionalState = {};
        this.crisisDetected = false;
        
        console.log('▶️ Voice session started:', this.sessionId);
        
        // Track session start
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/voice/session/start', JSON.stringify({
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString()
            }));
        }
    }

    endSession() {
        if (!this.sessionId) return;
        
        console.log('⏹️ Ending voice session:', this.sessionId);
        
        const sessionData = {
            sessionId: this.sessionId,
            userId: this.userId,
            duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
            transcripts: this.transcripts.length,
            emotionalJourney: this.transcripts.filter(t => t.emotions),
            crisisDetected: this.crisisDetected,
            timestamp: new Date().toISOString()
        };
        
        // Track session end
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/voice/session/end', JSON.stringify(sessionData));
        }
        
        this.disconnect();
        this.sessionId = null;
    }
}

// ===========================================
// 🚀 GLOBAL INTEGRATION
// ===========================================

// Make Hume integration available globally
window.HumeVoiceIntegration = HumeVoiceIntegration;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.humeVoice = new HumeVoiceIntegration();
    console.log('✅ Hume Voice Integration ready');
});

console.log('📜 Hume Voice Integration script loaded');