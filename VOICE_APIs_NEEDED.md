# Voice APIs Needed for Better Quality

## **1. OpenAI TTS (Recommended - Best Quality)**
**Get key from:** https://platform.openai.com/api-keys
- Natural, expressive voices
- Voices: alloy (neutral), echo (male), fable (male), onyx (male), nova (female), shimmer (female)
- Cost: $0.015 per 1,000 characters (~$0.02 per message)
- **Add to .env.local:**
```
OPENAI_API_KEY=sk-...
```

## **2. Google Cloud Text-to-Speech (Premium Voices)**
**Get key from:** https://console.cloud.google.com/apis/credentials
- WaveNet voices (very natural)
- Standard voices (cheaper)
- 90-day free trial with $300 credit
- **Add to .env.local:**
```
GOOGLE_TTS_API_KEY=...
```

## **3. ElevenLabs (Currently Working - "Weird" Voice)**
You already have this, but the free tier has limited voice quality.
**Upgrade or accept:** The voices sound robotic on free tier.

## **Current Status:**
- ✅ ElevenLabs (working but "weird" sounding on free tier)
- ❌ OpenAI TTS (no API key - FALLBACK to browser)
- ❌ Google TTS (no API key - FALLBACK to browser)
- ✅ Browser Free TTS (always works, but sounds synthetic)

## **Recommendation:**
Get an **OpenAI API key** - it's the best quality and affordable.

**Once you add the API key, restart the app and voices will be much better!**
