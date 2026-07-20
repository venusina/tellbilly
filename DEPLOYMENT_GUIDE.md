# TellBilly Deployment Guide

## Phase 1: Development Build (Testing on Device)

### Prerequisites
- Apple Developer Account (your mate has this)
- Team ID from Apple Developer
- Expo Account (free)
- EAS CLI installed: `npm install -g eas-cli`

### Step 1: Setup EAS
```bash
# Login to EAS
eas login

# Link project to EAS
eas project:configure
```

### Step 2: Get Team ID from Your Mate
Ask your mate for:
- Apple Team ID (from Apple Developer > Membership)
- Update `eas.json`:
```json
{
  "build": {
    "development": {
      "ios": {
        "enterpriseAccountTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Step 3: Build Development App
```bash
# Build for iOS (development)
eas build --platform ios --profile development

# This creates a dev client you can test on your phone
# EAS will provide an install link via email
```

### Step 4: Test on Physical Device
- Open the install link on your iPhone
- Install the dev client
- Test all auth flows:
  - ✅ Welcome → Email → Verify → Password → Success
  - ✅ Sign in with existing account
  - ✅ Job creation (mock voice flow)

---

## Phase 2: TestFlight (Beta Testing)

### Step 1: Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "+ New App"
3. Fill in:
   - Name: TellBilly
   - Bundle ID: `com.yourcompany.tellbilly` (or your preference)
   - Platform: iOS
   - Sku: unique identifier (e.g., `tellbilly-001`)

### Step 2: Update App ID
Update `app.json`:
```json
{
  "expo": {
    "bundleIdentifier": "com.yourcompany.tellbilly"
  }
}
```

### Step 3: Create App ID in Apple Developer
1. Go to [developer.apple.com](https://developer.apple.com)
2. Certificates, IDs & Profiles → Identifiers
3. Register new App ID:
   - Identifier: `com.yourcompany.tellbilly`
   - Select all required capabilities

### Step 4: Build for TestFlight
```bash
# Update eas.json with your App ID
# Then build preview

eas build --platform ios --profile preview

# Wait for build to complete (usually 10-15 mins)
```

### Step 5: Submit to TestFlight
```bash
eas submit --platform ios --latest
# Follow prompts to submit to TestFlight
```

### Step 6: Add Testers
- Open App Store Connect
- Go to your app → TestFlight
- Add beta testers (emails)
- They'll receive invite link

---

## Phase 3: App Store Submission

### Before Submission Checklist
- [ ] All screens tested on device
- [ ] Auth flow complete (signup, login, logout)
- [ ] No console errors or crashes
- [ ] Voice feature wired (or MVP placeholder)
- [ ] App icon set (replace emoji in welcome)
- [ ] Privacy policy created
- [ ] Screenshots for App Store

### Step 1: Prepare App Store Info
Update in App Store Connect:
- Description
- Keywords (5)
- Support email
- Privacy policy URL
- Screenshots (5-6 per orientation)

### Step 2: Build for Production
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### Step 3: Review & Publish
- Apple reviews (usually 24-48 hours)
- Once approved, click "Release This Version"

---

## Quick Command Reference

```bash
# Development build
eas build --platform ios --profile development

# Preview build (TestFlight)
eas build --platform ios --profile preview
eas submit --platform ios --latest

# Production build
eas build --platform ios --profile production
eas submit --platform ios --latest

# Check build status
eas build:list

# Install dev client on local simulator
eas build --platform ios --profile development --local
```

---

## Troubleshooting

### Build fails: "No credentials"
→ Run `eas credentials` and set up iOS provisioning

### Build fails: "Bundle ID mismatch"
→ Verify bundle ID in `app.json` matches App Store Connect

### TestFlight: Tester doesn't see app
→ Check build has completed in App Store Connect
→ Confirm tester email is added
→ Wait 15-30 mins for notification

### App crashes on device
→ Check console: `npx expo start --devClient`
→ Deploy dev build and check logs

---

## Timeline

| Phase | Est. Time | Status |
|-------|-----------|--------|
| Dev Build Setup | 30 mins | Ready |
| Physical Device Testing | 1-2 days | Next |
| TestFlight Setup | 1 hour | After device ✅ |
| App Store Submission | 1-2 days | After beta ✅ |
| App Review | 24-48 hrs | Apple's side |
| **Live on App Store** | — | 🎉 |

---

## Next Steps

1. **Ask your mate for Team ID** (Apple Developer)
2. **Run:** `eas build --platform ios --profile development`
3. **Test on your phone** (install via EAS link)
4. **Report any issues**

Once device testing is green, we'll submit to TestFlight → App Store.

Good luck! 🚀
