# 🎤 **HUME AI SETUP GUIDE - Get Your API Keys**

## 🚀 **Step 1: Create Hume AI Account**

1. **Visit**: https://platform.hume.ai/sign-up
2. **Sign up** with your email
3. **Verify your email** (check spam folder if needed)

## 🔑 **Step 2: Get Your API Keys**

1. **Login** to https://platform.hume.ai/
2. **Navigate to**: Settings → API Keys
3. **Create new API key** for "Root Cause Power PTSD Platform"
4. **Copy the API key** - it starts with something like `hume_api_...`

## 🎭 **Step 3: Create PTSD-Specific EVI Configuration**

1. **Go to**: EVI → Configurations
2. **Create New Configuration**
3. **Configuration Name**: "PTSD Coach Sarah"
4. **System Prompt**: 
```
You are Coach Sarah, a trauma-informed PTSD specialist with deep empathy and professional training. 

CRITICAL SAFETY PROTOCOLS:
- If you detect ANY crisis language, self-harm ideation, or suicide indicators in voice or text, immediately trigger crisis support
- Always validate trauma experiences with person-first language
- Use gentle, measured responses for high emotional distress
- Offer grounding techniques when dissociation or flashbacks detected

Your voice should be:
- Warm and professionally caring
- Calm and measured pace for anxious users  
- Encouraging but never dismissive of pain
- Trauma-informed in all interactions

Available functions:
- trigger_grounding_exercise: Use when detecting anxiety, panic, dissociation
- escalate_crisis_support: Use for any self-harm or suicide indicators
- start_breathing_exercise: Use for anxiety or hyperarousal
- provide_validation_response: Use for shame, guilt, or self-blame

Remember: You are supporting healing, not replacing professional therapy.
```

5. **Voice Selection**: Choose a warm, professional female voice
6. **Save Configuration** and copy the **Configuration ID**

## 🔧 **Step 4: Add Keys to Your Platform**

Once you have your keys, we'll add them to your `.env` file:

```
HUME_API_KEY=your_hume_api_key_here
HUME_CONFIG_ID=your_ptsd_coach_config_id_here
```

## 🎯 **Step 5: Test Connection**

Once configured, we'll test the connection with a simple voice interaction to ensure everything works!

## 💰 **Pricing Information**

- **Free Tier**: Usually includes some test credits
- **Paid Plans**: Pay-per-use or monthly subscriptions
- **Enterprise**: Custom pricing for high-volume usage

For production, you'll likely want the **Business or Enterprise** plan to handle multiple users.

## 📞 **Need Help?**

If you run into any issues:
1. Check Hume AI documentation: https://dev.hume.ai/docs/
2. Contact Hume AI support for account issues
3. We can troubleshoot integration issues together

---

## ⚡ **Quick Start Checklist**

- [ ] Create Hume AI account
- [ ] Generate API key  
- [ ] Create PTSD Coach configuration
- [ ] Copy Configuration ID
- [ ] Share keys with me to integrate
- [ ] Test voice coaching functionality
- [ ] Launch revolutionary PTSD support! 🚀

**Ready to make history with the world's first emotionally intelligent PTSD voice coach?** 🧠💜