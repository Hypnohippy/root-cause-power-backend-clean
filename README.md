# Root Cause Power - PTSD Support Platform

## 🧠 AI-Powered Mental Health Platform

Complete PTSD support platform combining:
- **Hume AI Voice Coaching** - Empathic voice interface with emotional intelligence
- **Groq AI Text Chat** - Fast, affordable text-based coaching
- **Interactive Community** - Peer support with moderation
- **Crisis Detection** - 24/7 safety monitoring and intervention
- **Comprehensive Accessibility** - WCAG 2.1 AA compliant

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. **Vercel Account**: [vercel.com](https://vercel.com)
2. **Hume AI Account**: [console.hume.ai](https://console.hume.ai) (Creator plan recommended)
3. **Groq API Key**: [console.groq.com](https://console.groq.com)

### Environment Variables (Add in Vercel Dashboard)
```
GROQ_API_KEY=your_groq_api_key_here
HUME_API_KEY=your_hume_api_key_here
HUME_CONFIG_ID=your_hume_config_id_here
STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
NODE_ENV=production
```

### Deploy Steps
1. **Connect GitHub**: Link this repository to Vercel
2. **Set Environment Variables**: Add all keys in Vercel dashboard
3. **Deploy**: Click deploy - Vercel handles everything automatically
4. **Custom Domain**: Add your domain in Vercel settings

## 🔧 Features

### Voice AI (Hume)
- Emotional intelligence detection
- Crisis intervention
- British accent voice synthesis
- Real-time emotion analysis

### Text AI (Groq) 
- Fast, cost-effective chat
- Multiple specialized coaches (nutrition, sleep, PTSD, etc.)
- Assessment analysis
- 24/7 availability

### Community
- User-generated posts
- Like and comment system
- Category filtering
- Moderation tools

### Accessibility
- Screen reader support
- High contrast mode
- Keyboard navigation
- Voice speed controls
- Motion reduction options

## 👑 Admin Access

### Permanent Founder Mode
Access via browser console:
```javascript
founderMode() // Permanent unlimited access
```

Or URL parameter:
```
?admin_access=root_cause_power_admin_2024
```

### Usage Monitoring
```
?admin=usage // View Hume API costs and usage
```

## 📊 Cost Structure

### Hume (Voice): Creator Plan
- **Base**: $14/month (200 minutes included)
- **Overage**: $0.07/minute
- **Features**: Commercial license, voice cloning

### Groq (Text): Pay-as-you-go
- **Cost**: ~$0.001/minute (nearly free)
- **Features**: Fast inference, multiple models

## 🛡️ Security Features

- Content Security Policy (CSP)
- Rate limiting on all endpoints
- Input validation and sanitization
- Helmet.js security headers
- Crisis detection and intervention

## 📱 PWA Features

- Offline functionality
- Push notifications
- Install prompt
- Service worker caching
- Mobile-first responsive design

---

**Built with ❤️ for trauma survivors by David Prince**

*This platform combines cutting-edge AI with trauma-informed care to provide 24/7 support for PTSD recovery.*