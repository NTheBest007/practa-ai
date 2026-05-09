# 🐛 Debug Mode Guide

## Overview
Debug mode provides real-time visibility into all API calls, errors, and system status. It helps identify what's not working and why.

---

## 🎯 What's Visible

### 1. **DEV MODE ENABLED** Indicator
- **Location:** Top center of screen
- **Purpose:** Shows debug mode is active
- **How to close:** Click the X to hide (debug panel remains accessible)

### 2. **Debug Panel** (Top Right)
A floating panel with 5 tabs:

#### **APIs Tab** - Real-time API Status
Shows status for all integrated APIs:

| API | Status Indicators |
|-----|------------------|
| **Gemini** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **OpenRouter** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **Groq** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **ElevenLabs** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **Smallest.ai** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **CAMB.ai** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **OpenAI** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **AssemblyAI** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |
| **Deepgram** | ✅ WORKING / ❌ FAILED / ⏳ CHECKING / ❓ UNKNOWN |

**Status Updates:**
- `UNKNOWN` - Not tested yet
- `CHECKING` - API call in progress
- `WORKING` - Last call succeeded
- `FAILED` - Last call failed (hover for error)

#### **Logs Tab** - Error & Event History
Shows chronological log of all system events:

```
🟢 [TTS] Success with ElevenLabs • 14:32:15
🔴 [STT] Transcription failed • 14:31:42
   Details: Network error: Failed to fetch
🟡 [Coach] Coaching triggered • 14:31:38
🟢 [AI Chat] Success with Gemini • 14:31:35
```

**Log Types:**
- 🟢 **Success** - Operation completed
- 🔵 **Info** - General information
- 🟡 **Warning** - Non-critical issue
- 🔴 **Error** - Failed operation with details

**Features:**
- Shows last 100 logs
- Timestamps for each event
- Detailed error messages
- Clear all button

#### **Voice Tab** - TTS Debugging
Shows real-time voice synthesis status:

```
Last Attempt: "Hello, I'm interested in your pro..."
Provider Used: ElevenLabs
✅ SUCCESS: Voice synthesis completed successfully
```

**Or on failure:**
```
Last Attempt: "Hello, I'm interested in your pro..."
❌ ERROR: ElevenLabs error: 401 unauthorized
Provider: Browser (fallback)
```

#### **Coach Tab** - Real-time Coach Debugging
Shows coaching system activity:

```
Status: Running
Last Trigger: 14:32:15
✅ RESPONSE RECEIVED
{
  "suggestion": "Ask about their budget",
  "category": "discovery",
  "priority": "high"
}
```

**Or on failure:**
```
Status: Idle
Last Trigger: 14:32:15
❌ COACH FAILED
All AI providers failed - empty response
```

#### **Actions Tab** - Last AI Activity
Shows detailed request/response data:

```
Last API Used: Gemini

Last AI Request:
{
  "messages": [
    {"role": "system", "content": "You are a..."},
    {"role": "user", "content": "Hello"}
  ]
}

Last AI Response:
{
  "reply": "Hi there! How can I help you today?"
}
```

---

## 🚀 How to Use

### Enable Debug Mode
Debug mode is **ON by default** in development. You'll see:
1. "DEV MODE ENABLED" banner at top
2. Debug panel in top-right corner

### Toggle Debug Mode
- Click **X** on the banner to hide it
- Click **X** on debug panel to close it
- Both will stay off until page refresh

### Read Error Messages
When something fails:

1. **Check the Logs tab** - Look for red error entries
2. **Read the details** - Error messages show exactly what failed
3. **Check API status** - See which API is marked FAILED
4. **Check specific tabs** - Voice/Coach tabs show feature-specific errors

### Example Error Scenarios

#### **"Voice synthesis failed"**
**Check Voice Tab:**
```
❌ ERROR: ElevenLabs error: 401 unauthorized
```
**Solution:** Check `ELEVENLABS_API` in `.env.local`

#### **"Coach not responding"**
**Check Coach Tab:**
```
❌ COACH FAILED: Gemini error: 429 rate limit
```
**Solution:** API rate limit hit - wait a moment

#### **"AI not responding"**
**Check Logs Tab:**
```
🔴 [AI Chat] All providers failed
```
**Solution:** Check all AI API keys in `.env.local`

---

## 🔧 Files Created

### Core Debug System
```
lib/
├── debug-context.tsx          # Debug state management
├── ai-service-with-debug.ts   # AI service wrapped with debug logging

components/
├── debug-panel.tsx            # Main debug panel UI
├── dev-mode-indicator.tsx     # "DEV MODE ENABLED" banner
```

### Modified Files
```
app/
├── layout.tsx                 # Added DebugProvider and DebugPanel
├── practice/[id]/page.tsx     # Uses debug-enabled components

components/
├── unified-voice-player.tsx   # Logs voice attempts/errors
├── unified-voice-recorder.tsx # Logs transcription attempts
├── realtime-coach-new.tsx     # Logs coaching activity
```

---

## 📊 Debug Data Flow

```
User Action → Component → AI Service → Debug Context → Debug Panel
     ↓              ↓              ↓               ↓
  Click Mic   VoiceRecorder  transcribeAudio  addLog()
                                          ↓
                                    Logs Tab Updated
```

---

## 🎨 UI Features

### Collapsible Panel
- Click **−/↓** to collapse/expand
- Panel remembers state

### Tab Navigation
- 5 tabs: APIs | Logs | Voice | Coach | Actions
- Each tab shows specific debug info
- Click tab to switch

### Real-time Updates
- Status changes instantly
- New logs appear at top
- Timestamps show exact time

### Error Highlighting
- Red badges for FAILED status
- Red background for error logs
- Amber for warnings
- Green for success

---

## ✅ Testing Checklist

With debug mode enabled, verify:

- [ ] **Start conversation** → Logs show AI request/response
- [ ] **Voice plays** → Voice tab shows provider used
- [ ] **Voice fails** → Voice tab shows error reason
- [ ] **Mic clicked** → Logs show STT attempt
- [ ] **Transcription works** → Logs show provider success
- [ ] **Coach triggers** → Coach tab shows trigger time
- [ ] **Coach responds** → Coach tab shows tip received
- [ ] **Coach fails** → Coach tab shows error
- [ ] **API fails** → APIs tab shows FAILED status

---

## 🔍 Common Issues & Debug Messages

| Issue | Where to Look | Expected Error |
|-------|--------------|----------------|
| No voice | Voice Tab | "All TTS providers failed" |
| Bad voice quality | Voice Tab | "ElevenLabs failed, using Browser" |
| No transcription | Logs Tab | "Transcription failed: no audio" |
| AI not responding | Actions Tab | "All providers failed" |
| Coach silent | Coach Tab | "Coaching failed: empty response" |
| Slow responses | Logs Tab | Multiple "Switched to provider" messages |

---

## 🚫 Disabling Debug Mode

For production, set:
```typescript
// In debug-context.tsx
const [isDebugMode, setIsDebugMode] = useState(false); // Default OFF
```

Or add environment-based toggle:
```typescript
const [isDebugMode, setIsDebugMode] = useState(
  process.env.NODE_ENV === 'development'
);
```

---

## 📝 Summary

Debug mode provides:
- ✅ **Real-time API status** for all 9 APIs
- ✅ **Detailed error messages** with full context
- ✅ **Voice debugging** showing attempts, providers, errors
- ✅ **Coach debugging** showing trigger, response, failures
- ✅ **Action history** with requests and responses
- ✅ **Chronological logs** with timestamps
- ✅ **Visual indicators** for working/failed states

**Everything that fails is shown with WHY it failed.**
