module.exports = {
  apps: [{
    name: 'root-cause-power-ptsd-platform',
    script: 'server.js',
    cwd: '/home/user/webapp',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Add your API keys here or use environment variables
      STRIPE_SECRET_KEY: 'sk_test_...',  // Replace with your actual secret key
      STRIPE_PUBLISHABLE_KEY: 'pk_test_...', // Replace with your actual publishable key
      GROQ_API_KEY: 'gsk_...', // Replace with your actual Groq API key
      HUME_API_KEY: 'your_hume_api_key_here', // Replace with your actual Hume API key
      HUME_CONFIG_ID: 'your_hume_config_id_here' // Replace with your actual config ID
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/user/webapp/logs/error.log',
    out_file: '/home/user/webapp/logs/out.log',
    log_file: '/home/user/webapp/logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
};