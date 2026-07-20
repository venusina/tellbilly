# TellBilly Testing Checklist

## Pre-Test Setup

### 1. Get Team ID from Your Mate
Ask for:
- [ ] Apple Team ID (from developer.apple.com → Membership)
- [ ] Confirm they have active Apple Developer account

### 2. Setup Locally
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo/EAS
eas login
# (Create free account if needed at expo.dev)

# Navigate to your project
cd /path/to/tellbilly

# Install dependencies
npm install
```

### 3. Update EAS Config
Edit `eas.json` and add your Team ID:
```json
{
  "build": {
    "development": {
      "ios": {
        "enterpriseAccountTeamId": "PASTE_TEAM_ID_HERE"
      }
    }
  }
}
```

---

## Phase 1: Web Testing (Quick)

### Test on Web First
```bash
npm run web
```

Open: `http://localhost:8081`

**Auth Flow - Web:**
- [ ] Welcome screen loads (TellBilly logo + "Continue with email")
- [ ] Click "Continue with email" → goes to signup
- [ ] Email input: enter test email
- [ ] Click "Create account" → goes to verify-email
- [ ] **STOP HERE** (email verification won't work in mock, but screen should load)

**Current App - Web:**
- [ ] Refresh and check if logged-out redirect works
- [ ] Jobs tab loads (should show "Create Job" button)

**Issues to Report:**
- Crashes or errors in console
- Styling/layout issues
- Missing buttons or text

---

## Phase 2: Build for Device (15-20 mins)

### Build Command
```bash
eas build --platform ios --profile development
```

**What happens:**
1. EAS builds your app in the cloud (~10 mins)
2. Sends you a link via email to install on iPhone

**While waiting:**
- You'll see progress in terminal
- Don't close terminal
- EAS will output install link when done

---

## Phase 3: Test on iPhone (Physical Device)

### Install Dev Client
1. Check email for EAS install link
2. Open link on your **iPhone** (must be on same Apple account)
3. Tap "Install TellBilly"
4. Go to Settings → General → VPN & Device Management
5. Trust the developer certificate
6. Open app

### Auth Flow - iPhone Testing

**Test 1: Complete Signup (Real Email)**
- [ ] Welcome screen appears
- [ ] Tap "Continue with email"
- [ ] Email screen: enter **your real email** (you need to receive verification code)
- [ ] Tap "Create account"
- [ ] Verify Email screen appears
- [ ] Check your email inbox for verification code
- [ ] Enter code (should be 6 digits)
- [ ] Tap "Verify email"
- [ ] Password screen appears
- [ ] Enter password (8+ chars)
- [ ] Enter confirm password (must match)
- [ ] See strength indicator change
- [ ] Tap "Complete setup"
- [ ] **Expected:** App takes you to Jobs tab (authenticated)

**Test 2: Sign Out & Sign In**
- [ ] Go to Settings tab
- [ ] Tap "Sign out" (if visible)
- [ ] Should return to Welcome screen
- [ ] Tap "Sign in"
- [ ] Enter email + password
- [ ] Tap "Sign in"
- [ ] **Expected:** Takes you back to Jobs tab

**Test 3: Create Job (Mock Flow)**
- [ ] Tap Jobs tab
- [ ] Tap "+ Create Job" button
- [ ] See Record button + Waveform
- [ ] Tap Record button
- [ ] Waveform should animate
- [ ] See transcript appear word-by-word
- [ ] See "Confirm new job" card
- [ ] Verify fields: Client, Amount, Job notes
- [ ] Tap "Confirm"
- [ ] **Expected:** Job saves, screen resets

---

## What Can Go Wrong (Troubleshooting)

### Build Fails
**Error: "No provisioning profiles"**
→ Run: `eas credentials` and setup new credentials

**Error: "Bundle ID already exists"**
→ Your mate may need to create App ID first

**Error: "Timed out"**
→ Try again: `eas build --platform ios --profile development`

### App Crashes on Launch
**Check logs:**
```bash
npx expo start --devClient
# Select 'w' to open web dev view
# Check console for errors
```

### Auth Issues
**"Verification failed" when entering code**
→ Check email spam folder
→ Code expires after 10 mins, request new one

**"Sign in failed" with correct email/password**
→ Check if account was created successfully
→ Verify email wasn't already used

**App force-closes on password screen**
→ Check terminal/console for error messages

---

## What to Report Back

When you've tested, please tell me:

```
✅ COMPLETED TESTS:
- [ ] Web signup flow
- [ ] Web jobs page
- [ ] iPhone app installed
- [ ] iPhone signup (full flow)
- [ ] iPhone sign in/out
- [ ] iPhone job creation

🐛 ISSUES FOUND:
1. [Description of issue]
   - Where: [screen name]
   - Error: [copy-paste error message]
2. [Next issue...]

❓ QUESTIONS:
- [Any questions that came up]
```

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Setup & web test | 10 mins | Start here |
| Build for device | 15 mins | Waiting for EAS |
| Install on iPhone | 5 mins | After build |
| Full auth flow test | 10 mins | Main test |
| Job creation test | 5 mins | Bonus |
| **Total** | ~45 mins | **Expected** |

---

## Go!

1. Get Team ID from mate
2. Run `eas build --platform ios --profile development`
3. Install on iPhone via email link
4. Test using checklist above
5. Come back with results

Questions? Ask now before starting. 🚀
