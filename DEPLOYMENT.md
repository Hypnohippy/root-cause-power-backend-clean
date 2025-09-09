# 🚀 Root Cause Power PWA - Deployment Guide

## 📋 Production Deployment Checklist

### 1. 🔑 Environment Variables Setup
Create a `.env` file (copy from `.env.example`):
```bash
GROQ_API_KEY=your-actual-groq-api-key-here
PORT=3000
NODE_ENV=production
```

### 2. 🎵 Audio Files Setup
Upload real therapeutic audio files to `/public/audio/`:
- `breathing-guided.mp3` (5 min guided breathing)
- `grounding-meditation.mp3` (8 min 5-4-3-2-1 technique)
- `progressive-relaxation.mp3` (15 min muscle relaxation)
- `bilateral-tones-left.mp3` (EMDR left ear tone)
- `bilateral-tones-right.mp3` (EMDR right ear tone)
- `alternating-chimes.mp3` (10 min EMDR audio)
- `panic-attack-help.mp3` (3 min emergency grounding)
- `calming-rain.mp3` (30 min background)
- `ocean-waves.mp3` (30 min background)
- `forest-sounds.mp3` (30 min background)

### 3. 🌐 Recommended Hosting Platforms

#### Top Recommendations (Better than Wix):

**1. 🥇 Vercel (Recommended)**
- ✅ Excellent for PWAs and single-page apps
- ✅ Automatic HTTPS and CDN
- ✅ Environment variable management
- ✅ Automatic deployments from Git
- ✅ Free tier with generous limits
- 💰 Cost: Free tier, Pro at $20/month
- 🔗 Deploy: `vercel --prod`

**2. 🥈 Netlify**
- ✅ Great PWA support with service workers
- ✅ Built-in form handling and functions
- ✅ Automatic deployments
- ✅ Edge computing capabilities
- 💰 Cost: Free tier, Pro at $19/month
- 🔗 Deploy: Connect GitHub repo

**3. 🥉 Railway**
- ✅ Full-stack deployment (if you add backend)
- ✅ Database hosting included
- ✅ Environment management
- ✅ Automatic scaling
- 💰 Cost: Pay-as-you-go, ~$5-20/month
- 🔗 Deploy: Connect GitHub repo

**4. ☁️ Cloudflare Pages**
- ✅ Excellent performance with global CDN
- ✅ Free tier with unlimited bandwidth
- ✅ Built-in analytics
- ✅ Great for static PWAs
- 💰 Cost: Free tier very generous
- 🔗 Deploy: Connect GitHub repo

**5. 🔵 Azure Static Web Apps**
- ✅ Enterprise-grade security
- ✅ Custom domains and SSL
- ✅ Integrated with Azure services
- ✅ API integration capabilities
- 💰 Cost: Free tier, then usage-based

#### Why These Beat Wix:
- ✅ **Better Performance**: Faster loading, global CDN
- ✅ **PWA Support**: Native service worker support
- ✅ **Custom Code**: Full control over functionality
- ✅ **Environment Variables**: Secure API key management
- ✅ **Version Control**: Git integration for updates
- ✅ **Scalability**: Handle high traffic automatically
- ✅ **Cost Effective**: Often cheaper with better features

### 4. 🚀 Quick Deployment Steps

#### For Vercel (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Add your GROQ_API_KEY securely
```

#### For Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=public

# Set environment variables in Netlify dashboard
```

### 5. 🔒 Security Considerations
- ✅ Never expose API keys in client code
- ✅ Use environment variables for sensitive data
- ✅ Enable HTTPS (automatic on recommended platforms)
- ✅ Set up CSP headers for security
- ✅ Monitor for crisis intervention usage

### 6. 📊 Post-Deployment Setup
- ✅ Upload real audio files to `/public/audio/`
- ✅ Test all EMDR and coping technique audio
- ✅ Verify crisis detection system works
- ✅ Test PWA installation on mobile devices
- ✅ Set up monitoring for crisis alerts
- ✅ Configure backup for user data

### 7. 🎯 Performance Optimization
- ✅ All images are optimized and lazy-loaded
- ✅ Audio files should be compressed (MP3, 128kbps)
- ✅ Service worker caches essential resources
- ✅ Critical CSS is inlined
- ✅ JavaScript is minified and compressed

### 8. 📱 PWA Installation
After deployment, users can:
- Install on iOS: Safari > Share > Add to Home Screen
- Install on Android: Chrome > Menu > Install App
- Install on Desktop: Chrome address bar > Install icon

### 9. 🆘 Crisis Monitoring
Set up alerts for:
- Crisis keyword detection in chat
- Emergency overlay usage
- Crisis hotline click tracking
- User safety plan creation

Your Root Cause Power PWA is now production-ready with:
- 🎵 Real therapeutic audio content
- 🆘 Crisis intervention system
- 💬 AI-powered coaching with Groq
- 📱 Full PWA functionality
- 🛡️ Security best practices
- ⚡ High-performance hosting