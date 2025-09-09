/**
 * Hume AI EVI Connection Test
 * Test the revolutionary emotional voice integration
 */

async function testHumeConnection(apiKey, configId = null) {
    console.log('🧪 Testing Hume AI EVI Connection...');
    
    try {
        // Test 1: Basic API authentication
        const authTest = await fetch('https://api.hume.ai/v0/evi/configs', {
            method: 'GET',
            headers: {
                'X-Hume-Api-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!authTest.ok) {
            throw new Error(`Authentication failed: ${authTest.status} ${authTest.statusText}`);
        }
        
        console.log('✅ API Key authentication successful!');
        
        // Test 2: List available configurations
        const configs = await authTest.json();
        console.log('📋 Available EVI Configurations:', configs);
        
        // Test 3: WebSocket connection test (if configId provided)
        if (configId && configId !== 'waiting-for-config-id') {
            console.log('🔌 Testing WebSocket connection...');
            
            const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`;
            const ws = new WebSocket(wsUrl);
            
            return new Promise((resolve, reject) => {
                ws.onopen = () => {
                    console.log('✅ WebSocket connection successful!');
                    ws.close();
                    resolve({
                        success: true,
                        message: 'Hume EVI fully operational! 🎉',
                        configs: configs
                    });
                };
                
                ws.onerror = (error) => {
                    console.error('❌ WebSocket connection failed:', error);
                    reject({
                        success: false,
                        message: 'WebSocket connection failed',
                        error: error
                    });
                };
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                        reject({
                            success: false,
                            message: 'Connection timeout - check config ID',
                            error: 'Timeout'
                        });
                    }
                }, 10000);
            });
        } else {
            console.log('⚠️ Config ID needed for full WebSocket test');
            return {
                success: true,
                message: 'API authentication successful! Need config ID for full test.',
                configs: configs
            };
        }
        
    } catch (error) {
        console.error('❌ Hume connection test failed:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
}

// Make available globally for testing
window.testHumeConnection = testHumeConnection;

export default testHumeConnection;