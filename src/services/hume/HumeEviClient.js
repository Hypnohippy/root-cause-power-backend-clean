/**
 * Hume AI EVI WebSocket Client for PTSD Platform
 * Handles real-time empathic voice interactions with trauma-informed responses
 */

class HumeEviClient {
    constructor(config = {}) {
        this.apiKey = config.apiKey || 'zYPlodq03zJLORX8IvOiFtzy5Es4fsaRtjo29UzTN8ckVibB';
        this.configId = config.configId || config.humeConfigId || '06f12c85-3975-4774-b078-8611e826dd85';
        this.voiceId = config.voiceId || 'empathic-therapist-voice';
        this.baseUrl = config.baseUrl || 'wss://api.hume.ai/v0/evi/chat';
        
        this.ws = null;
        this.isConnected = false;
        this.emotionalState = null;
        this.sessionId = null;
        this.crisisMode = false;
        
        // Event handlers
        this.onEmotionDetected = config.onEmotionDetected || this._defaultEmotionHandler;
        this.onCrisisDetected = config.onCrisisDetected || this._defaultCrisisHandler;
        this.onMessage = config.onMessage || this._defaultMessageHandler;
        this.onError = config.onError || this._defaultErrorHandler;
        
        // Crisis detection patterns
        this.crisisPatterns = {
            textual: [
                /want to die/i, /kill myself/i, /end it all/i, /suicide/i, /no point/i,
                /hopeless/i, /worthless/i, /better off dead/i, /can't go on/i
            ],
            emotional: ['despair', 'hopelessness', 'overwhelming_sadness', 'panic', 'terror'],
            vocal: ['trembling', 'breaking_voice', 'hyperventilation', 'prolonged_silence']
        };
        
        console.log('🧠 HumeEviClient initialized for PTSD coaching');
    }
    
    /**
     * Connect to Hume EVI with trauma-informed configuration
     */
    async connect() {
        try {
            const params = new URLSearchParams({
                api_key: this.apiKey,
                config_id: this.configId,
                voice_id: this.voiceId,
                verbose_transcription: 'true'
            });
            
            const wsUrl = `${this.baseUrl}?${params.toString()}`;
            console.log('🔌 Connecting to Hume EVI...');
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.sessionId = `session_${Date.now()}`;
                console.log('✅ Connected to Hume EVI successfully');
                console.log('🎭 Empathic voice coaching active');
                
                // Send initial trauma-informed system message
                this._sendInitialConfiguration();
            };
            
            this.ws.onmessage = (event) => {
                this._handleMessage(event);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ EVI WebSocket error:', error);
                this.onError(error);
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                console.log('🔌 EVI connection closed');
            };
            
        } catch (error) {
            console.error('❌ Failed to connect to Hume EVI:', error);
            this.onError(error);
        }
    }
    
    /**
     * Send initial configuration for trauma-informed coaching
     */
    _sendInitialConfiguration() {
        const config = {
            type: 'session_settings',
            trauma_informed: true,
            crisis_detection: true,
            empathy_level: 'high',
            response_style: 'validating',
            safety_protocols: {
                crisis_escalation: true,
                grounding_techniques: true,
                pacing_control: true
            }
        };
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(config));
            console.log('🛡️ Trauma-informed protocols activated');
        }
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    _handleMessage(event) {
        try {
            let message;
            
            if (typeof event.data === 'string') {
                message = JSON.parse(event.data);
                this._processTextMessage(message);
            } else {
                // Handle binary audio data
                this._processAudioMessage(event.data);
            }
            
        } catch (error) {
            console.error('❌ Error processing EVI message:', error);
        }
    }
    
    /**
     * Process text-based EVI messages
     */
    _processTextMessage(message) {
        console.log('📨 EVI Message:', message.type);
        
        switch (message.type) {
            case 'user_message':
                this._handleUserMessage(message);
                break;
                
            case 'assistant_message':
                this._handleAssistantMessage(message);
                break;
                
            case 'function_call':
                this._handleFunctionCall(message);
                break;
                
            case 'emotion_analysis':
                this._handleEmotionAnalysis(message);
                break;
                
            case 'chat_metadata':
                this._handleChatMetadata(message);
                break;
                
            default:
                console.log('🔍 Unknown message type:', message.type);
        }
    }
    
    /**
     * Handle user message with emotion analysis
     */
    _handleUserMessage(message) {
        console.log('👤 User said:', message.text);
        
        // Extract vocal expressions (emotions from voice)
        if (message.vocal_expressions) {
            this.emotionalState = this._analyzeEmotionalState(message.vocal_expressions);
            console.log('🎭 Emotional state detected:', this.emotionalState);
            
            // Trigger emotion event
            this.onEmotionDetected(this.emotionalState, message);
        }
        
        // Check for crisis indicators
        const crisisRisk = this._assessCrisisRisk(message.text, this.emotionalState);
        if (crisisRisk > 0.7) {
            this._triggerCrisisProtocol(crisisRisk, message);
        }
        
        // Pass to general message handler
        this.onMessage('user', message);
    }
    
    /**
     * Handle assistant response
     */
    _handleAssistantMessage(message) {
        console.log('🤖 Coach Sarah:', message.text);
        
        // Display empathic response
        this.onMessage('assistant', message);
        
        // Check if response includes therapeutic guidance
        if (message.therapeutic_intent) {
            console.log('💚 Therapeutic intervention suggested:', message.therapeutic_intent);
        }
    }
    
    /**
     * Handle EVI function calls for therapeutic interventions
     */
    _handleFunctionCall(message) {
        const { name, arguments: args } = message.function_call;
        console.log('🔧 Function called:', name, args);
        
        switch (name) {
            case 'trigger_grounding_technique':
                this._executeGroundingTechnique(args);
                break;
                
            case 'escalate_to_crisis_support':
                this._executeCrisisEscalation(args);
                break;
                
            case 'adjust_session_pace':
                this._adjustSessionPacing(args);
                break;
                
            case 'recommend_professional_help':
                this._recommendProfessionalHelp(args);
                break;
                
            default:
                console.warn('⚠️ Unknown function call:', name);
        }
    }
    
    /**
     * Analyze emotional state from vocal expressions
     */
    _analyzeEmotionalState(vocalExpressions) {
        const emotions = {};
        let dominantEmotion = null;
        let maxIntensity = 0;
        
        for (const [emotion, intensity] of Object.entries(vocalExpressions)) {
            emotions[emotion] = intensity;
            
            if (intensity > maxIntensity) {
                maxIntensity = intensity;
                dominantEmotion = emotion;
            }
        }
        
        return {
            dominant: dominantEmotion,
            intensity: maxIntensity,
            all_emotions: emotions,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
    }
    
    /**
     * Assess crisis risk from text and emotions
     */
    _assessCrisisRisk(text, emotionalState) {
        let riskScore = 0;
        
        // Text-based indicators
        for (const pattern of this.crisisPatterns.textual) {
            if (pattern.test(text)) {
                riskScore += 0.3;
                console.log('🚨 Crisis text pattern detected:', pattern);
            }
        }
        
        // Emotional indicators
        if (emotionalState) {
            for (const crisisEmotion of this.crisisPatterns.emotional) {
                if (emotionalState.all_emotions[crisisEmotion] > 0.6) {
                    riskScore += 0.4;
                    console.log('🚨 Crisis emotion detected:', crisisEmotion);
                }
            }
        }
        
        return Math.min(riskScore, 1.0);
    }
    
    /**
     * Trigger crisis intervention protocol
     */
    _triggerCrisisProtocol(riskScore, message) {
        console.log('🚨 CRISIS DETECTED - Risk Score:', riskScore);
        
        this.crisisMode = true;
        
        const crisisData = {
            risk_score: riskScore,
            message: message.text,
            emotional_state: this.emotionalState,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        // Trigger crisis event handler
        this.onCrisisDetected(crisisData);
        
        // Send immediate empathic crisis response
        this._sendCrisisResponse(riskScore);
    }
    
    /**
     * Send crisis-appropriate response
     */
    _sendCrisisResponse(riskScore) {
        let response;
        
        if (riskScore > 0.8) {
            response = {
                type: 'immediate_intervention',
                message: "I hear that you're in tremendous pain right now, and I'm deeply concerned about you. You are not alone. Let's get you immediate support.",
                actions: ['show_crisis_resources', 'call_emergency_services', 'notify_emergency_contacts']
            };
        } else {
            response = {
                type: 'intensive_support',  
                message: "I can hear the distress in your voice, and I want you to know that what you're feeling is valid. Let's work through this together. Can you tell me if you're in a safe place right now?",
                actions: ['trigger_grounding_technique', 'provide_crisis_resources']
            };
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(response));
        }
    }
    
    /**
     * Execute grounding technique function
     */
    _executeGroundingTechnique(args) {
        const { technique, intensity } = args;
        
        console.log('🧘 Executing grounding technique:', technique, 'Intensity:', intensity);
        
        // Trigger grounding technique in the main app
        if (window.app && window.app.startGroundingTechnique) {
            window.app.startGroundingTechnique(technique, intensity);
        }
        
        // Send confirmation back to EVI
        this._sendFunctionResult('trigger_grounding_technique', {
            status: 'initiated',
            technique: technique,
            message: `Grounding technique "${technique}" has been started.`
        });
    }
    
    /**
     * Execute crisis escalation
     */
    _executeCrisisEscalation(args) {
        const { urgency, indicators } = args;
        
        console.log('🚨 Escalating to crisis support:', urgency);
        
        // Trigger crisis intervention in main app
        if (window.app && window.app.triggerCrisisIntervention) {
            window.app.triggerCrisisIntervention(urgency, indicators);
        }
        
        this._sendFunctionResult('escalate_to_crisis_support', {
            status: 'escalated',
            urgency: urgency,
            message: 'Crisis support protocols have been activated.'
        });
    }
    
    /**
     * Send function execution result back to EVI
     */
    _sendFunctionResult(functionName, result) {
        const response = {
            type: 'function_result',
            function_name: functionName,
            result: result,
            timestamp: new Date().toISOString()
        };
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(response));
        }
    }
    
    /**
     * Send audio input to EVI
     */
    sendAudio(audioBuffer) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Send audio as binary data
            this.ws.send(audioBuffer);
        }
    }
    
    /**
     * Send text message to EVI
     */
    sendText(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const textMessage = {
                type: 'user_input',
                text: message,
                timestamp: new Date().toISOString(),
                session_id: this.sessionId
            };
            
            this.ws.send(JSON.stringify(textMessage));
            console.log('📤 Sent to EVI:', message);
        }
    }
    
    /**
     * Disconnect from EVI
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
            this.crisisMode = false;
            console.log('👋 Disconnected from Hume EVI');
        }
    }
    
    /**
     * Default event handlers
     */
    _defaultEmotionHandler(emotionalState, message) {
        console.log('🎭 Emotion detected:', emotionalState);
    }
    
    _defaultCrisisHandler(crisisData) {
        console.log('🚨 Crisis detected:', crisisData);
    }
    
    _defaultMessageHandler(type, message) {
        console.log('💬 Message:', type, message);
    }
    
    _defaultErrorHandler(error) {
        console.error('❌ EVI Error:', error);
    }
    
    /**
     * Get current emotional state
     */
    getCurrentEmotionalState() {
        return this.emotionalState;
    }
    
    /**
     * Check if in crisis mode
     */
    isInCrisisMode() {
        return this.crisisMode;
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            crisis_mode: this.crisisMode,
            session_id: this.sessionId,
            emotional_state: this.emotionalState
        };
    }
}

// Export for use in the main application
window.HumeEviClient = HumeEviClient;
export default HumeEviClient;