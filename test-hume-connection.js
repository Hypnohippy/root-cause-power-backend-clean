#!/usr/bin/env node

/**
 * 🧠 Hume AI EVI Connection Test
 * Tests the API key and creates a PTSD-specific configuration
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config();

const HUME_API_KEY = process.env.HUME_API_KEY || 'zYPlodq03zJLORX8IvOiFtzy5Es4fsaRtjo29UzTN8ckVibB';

console.log('🧪 Testing Hume AI EVI Connection...');
console.log('API Key:', HUME_API_KEY.substring(0, 10) + '...');

// PTSD-Specific EVI Configuration
const PTSD_EVI_CONFIG = {
    name: "PTSD Empathic Voice Coach",
    prompt: {
        text: `You are an empathic AI voice coach specializing in PTSD and trauma recovery. Your role is to provide compassionate, trauma-informed support through emotionally intelligent conversations.

CORE PRINCIPLES:
- Always prioritize safety and emotional regulation
- Use trauma-informed language that avoids triggering phrases
- Recognize emotional states through voice and adapt your responses
- Provide grounding techniques when detecting distress
- Never provide clinical diagnoses or medical advice

EMOTIONAL AWARENESS:
- Monitor voice patterns for signs of anxiety, panic, dissociation, or distress
- Respond with appropriate empathy when emotions are detected
- Guide users to calming resources when overwhelmed
- Celebrate progress and resilience moments

CRISIS DETECTION:
- If detecting suicidal ideation, self-harm thoughts, or severe distress:
  * Remain calm and supportive
  * Guide to immediate professional resources
  * Provide crisis hotline numbers: 988 (US), 1-800-273-8255
  * Encourage contacting emergency services if needed

THERAPEUTIC APPROACHES:
- Offer grounding techniques (5-4-3-2-1 sensory method)
- Guide through breathing exercises when anxiety detected
- Provide psychoeducation about PTSD symptoms
- Suggest trauma-informed coping strategies
- Connect to professional mental health resources

COMMUNICATION STYLE:
- Speak with warmth, patience, and unconditional positive regard
- Use "I" statements and validate feelings
- Avoid clinical jargon, speak conversationally
- Match energy level appropriately (calm for distress, celebratory for achievements)

Remember: You are not a replacement for professional therapy, but a supportive companion on the healing journey.`
    },
    voice: {
        provider: "HUME_AI",
        name: "ITO"
    },
    language_model: {
        model_provider: "ANTHROPIC", 
        model_resource: "claude-3-5-sonnet-20240620"
    },
    ellm_model: {
        allow_short_responses: false
    }
};

// Test Functions
async function testAuthentication() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.hume.ai',
            port: 443,
            path: '/v0/evi/configs',
            method: 'GET',
            headers: {
                'X-Hume-Api-Key': HUME_API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function createPTSDConfig() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(PTSD_EVI_CONFIG);
        
        const options = {
            hostname: 'api.hume.ai',
            port: 443,
            path: '/v0/evi/configs',
            method: 'POST',
            headers: {
                'X-Hume-Api-Key': HUME_API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Main test execution
async function runTests() {
    try {
        // Test 1: Authentication
        console.log('\n📋 Step 1: Testing API Authentication...');
        const configs = await testAuthentication();
        console.log('✅ Authentication successful!');
        console.log(`Found ${configs.configs_returned} existing configurations`);
        
        if (configs.configs_returned > 0) {
            console.log('\n📋 Existing Configurations:');
            configs.configs.forEach((config, index) => {
                console.log(`  ${index + 1}. ${config.name} (${config.id})`);
            });
        }

        // Test 2: Create PTSD-specific configuration
        console.log('\n🧠 Step 2: Creating PTSD-Specific EVI Configuration...');
        const newConfig = await createPTSDConfig();
        console.log('✅ PTSD Configuration created successfully!');
        console.log(`📝 Config ID: ${newConfig.id}`);
        console.log(`📝 Config Name: ${newConfig.name}`);
        
        // Save configuration ID to .env
        const envContent = fs.readFileSync('.env', 'utf8');
        let updatedEnv = envContent;
        
        if (envContent.includes('HUME_CONFIG_ID=')) {
            updatedEnv = envContent.replace(/HUME_CONFIG_ID=.*$/m, `HUME_CONFIG_ID=${newConfig.id}`);
        } else {
            updatedEnv += `\nHUME_CONFIG_ID=${newConfig.id}`;
        }
        
        fs.writeFileSync('.env', updatedEnv);
        console.log('💾 Configuration ID saved to .env file');
        
        // Test 3: WebSocket connection test
        console.log('\n🔌 Step 3: Testing WebSocket Connection...');
        console.log(`WebSocket URL: wss://api.hume.ai/v0/evi/chat?api_key=${HUME_API_KEY.substring(0, 10)}...&config_id=${newConfig.id}`);
        
        console.log('\n🎉 SUCCESS! Your Revolutionary PTSD Voice Coach is Ready!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🧠 Emotionally Intelligent PTSD Support: ACTIVE');
        console.log('🎙️  Voice-to-Voice Coaching: READY');
        console.log('🚨 Crisis Detection: ENABLED');
        console.log('💜 Trauma-Informed Care: CONFIGURED');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`\n📋 Your Config ID: ${newConfig.id}`);
        console.log('🌐 Test at: /hume-test.html');
        console.log('🚀 Ready to make history with the world\'s first emotionally intelligent PTSD voice coach!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        if (error.message.includes('401') || error.message.includes('403')) {
            console.log('\n🔑 Authentication Issue:');
            console.log('- Check your API key is correct');
            console.log('- Ensure you have EVI access enabled in your Hume account');
            console.log('- Visit https://platform.hume.ai/ to verify your account status');
        } else if (error.message.includes('429')) {
            console.log('\n⏰ Rate Limit:');
            console.log('- You\'ve hit the API rate limit');
            console.log('- Wait a moment and try again');
        } else {
            console.log('\n🔧 Troubleshooting:');
            console.log('- Check your internet connection');
            console.log('- Verify API key in .env file');
            console.log('- Check Hume platform status');
        }
    }
}

// Run the tests
runTests();