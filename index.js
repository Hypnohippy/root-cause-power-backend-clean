// ES Module Entry Point - Fixes all 500 errors!
export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Handle favicon requests (major cause of 500 errors in your logs)
        if (req.url === '/favicon.ico' || req.url === '/favicon.png') {
            return res.status(204).end();
        }
        
        // Main route - serve your platform
        if (req.url === '/' || req.url === '/index.html') {
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Root Cause Power - Revolutionary AI Healthcare</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { margin:0; padding:0; font-family:system-ui; background:#0f172a; color:white; }
                    .container { text-align:center; padding:50px 20px; }
                    .loading { font-size:1.2em; margin:20px 0; }
                    .redirect { color:#10b981; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Root Cause Power</h1>
                    <p class="loading">Revolutionary AI Healthcare Platform</p>
                    <p class="redirect">Redirecting to main platform...</p>
                    <script>
                        // Redirect to your main HTML file in public folder
                        setTimeout(() => {
                            window.location.href = '/public/index.html';
                        }, 2000);
                    </script>
                </div>
            </body>
            </html>
            `);
        }
        
        // API health check
        if (req.url === '/api/health') {
            return res.status(200).json({ 
                status: 'OK', 
                message: 'API working with ES modules!',
                timestamp: new Date().toISOString()
            });
        }
        
        // 404 for other routes
        res.status(404).json({ error: 'Not found' });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
