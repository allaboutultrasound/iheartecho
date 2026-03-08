# iHeartEcho — Mobile App Store Submission Guide

**App:** iHeartEcho — Echocardiography Clinical Companion  
**Bundle ID / Package:** `com.allaboutultrasound.iheartecho`  
**Version:** 1.0.0  
**Technology:** Capacitor 8 (wraps the existing web app in a native iOS/Android shell)

---

## Overview

The project is now fully configured for mobile deployment. The `ios/` and `android/` directories contain complete native projects that wrap the iHeartEcho web app. All app icons, splash screens, permissions, and metadata are pre-configured. What remains is the platform-specific build and submission steps, which require a Mac (iOS) and a Google Play Developer account (Android).

---

## Part 1: Android — Google Play Store

### Prerequisites

| Requirement | Status | Notes |
|---|---|---|
| Google Play Developer Account | Required | One-time $25 fee at [play.google.com/console](https://play.google.com/console) |
| Android Studio | Required | Download at [developer.android.com/studio](https://developer.android.com/studio) |
| Java 17+ | Required | Bundled with Android Studio |
| Keystore (signing key) | Required | Generated once, kept permanently |

### Step 1 — Open the Android project in Android Studio

After cloning or downloading the project, open Android Studio and select **Open an Existing Project**, then navigate to the `android/` folder inside the iHeartEcho project directory.

```
iheartecho/
└── android/   ← Open this folder in Android Studio
```

Allow Gradle to sync (this may take a few minutes on first open).

### Step 2 — Create a signing keystore

A keystore is a cryptographic certificate that signs your app. **You must keep this file permanently** — losing it means you can never update the app on the Play Store.

In Android Studio, go to **Build → Generate Signed Bundle / APK**, then select **Android App Bundle (AAB)** and click **Create new keystore**. Fill in:

| Field | Suggested Value |
|---|---|
| Key store path | `~/iheartecho-release.jks` (store outside the project) |
| Password | Strong password (store in a password manager) |
| Key alias | `iheartecho` |
| Validity | 25 years |
| First and Last Name | Your name or organization |
| Organization | All About Ultrasound |
| Country Code | US |

### Step 3 — Build the release AAB

Run the following commands to build the web assets and sync them to Android before building:

```bash
# In the iheartecho project root:
pnpm cap:build:android

# Then in Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle
# Select your keystore → Build
```

The output will be at:
```
android/app/release/app-release.aab
```

### Step 4 — Create the Play Store listing

Log in to [Google Play Console](https://play.google.com/console) and click **Create app**. Complete all required fields:

**App details:**
- App name: `iHeartEcho`
- Short description (80 chars): `Real-time echo interpretation for sonographers & cardiologists`
- Full description (4000 chars): See the [Store Listing Copy](#store-listing-copy) section below.
- Category: `Medical`
- Content rating: Complete the questionnaire (select Medical app)
- Target audience: Adults (18+)

**Required assets to upload:**

| Asset | Size | Notes |
|---|---|---|
| App icon | 512×512 PNG | Use `ios/App/App/Assets.xcassets/AppIcon.appiconset/Icon-1024.png` (resize to 512) |
| Feature graphic | 1024×500 PNG | Create a banner — teal gradient with logo and tagline |
| Phone screenshots | Min 2, max 8 | 16:9 or 9:16, min 320px on shortest side |
| Tablet screenshots | Optional but recommended | 7-inch and 10-inch |

### Step 5 — Upload and submit

In Play Console, go to **Production → Releases → Create new release**, upload the `.aab` file, add release notes, and click **Review release → Start rollout to Production**.

**Review time:** Google typically reviews new apps within 3–7 days.

---

## Part 2: iOS — Apple App Store

### Prerequisites

| Requirement | Status | Notes |
|---|---|---|
| Apple Developer Account | **Needs reactivation** | Renew at [developer.apple.com](https://developer.apple.com) — $99/year |
| Mac with Xcode 15+ | Required | Cannot build iOS apps on Linux or Windows |
| Xcode Command Line Tools | Required | `xcode-select --install` |
| CocoaPods | Required | `sudo gem install cocoapods` |

### Step 1 — Reactivate your Apple Developer Account

Visit [developer.apple.com/account](https://developer.apple.com/account) and renew your membership. Once active, your existing App ID `com.allaboutultrasound.iheartecho` can be registered under **Certificates, Identifiers & Profiles**.

### Step 2 — Open the iOS project in Xcode

On your Mac, open Xcode and select **Open a project or file**, then navigate to:

```
iheartecho/
└── ios/
    └── App/
        └── App.xcworkspace   ← Open this file (not .xcodeproj)
```

### Step 3 — Configure signing in Xcode

In Xcode, select the **App** target in the project navigator, then go to **Signing & Capabilities**:

- Check **Automatically manage signing**
- Select your **Team** (your Apple Developer account)
- Xcode will automatically create a provisioning profile

Verify the Bundle Identifier shows: `com.allaboutultrasound.iheartecho`

### Step 4 — Build and archive

Connect an iPhone or select **Any iOS Device (arm64)** as the build target, then:

```
Product → Archive
```

This creates an `.xcarchive` file. When the Organizer window opens, click **Distribute App → App Store Connect → Upload**.

### Step 5 — Create the App Store listing in App Store Connect

Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) and click **+ New App**:

| Field | Value |
|---|---|
| Platform | iOS |
| Name | iHeartEcho |
| Primary Language | English (U.S.) |
| Bundle ID | `com.allaboutultrasound.iheartecho` |
| SKU | `iheartecho-ios-001` |
| User Access | Full Access |

**Required assets:**

| Asset | Spec |
|---|---|
| App icon | 1024×1024 PNG, no alpha channel — use `Icon-1024.png` |
| iPhone 6.9" screenshots | 1320×2868 or 1290×2796 px, min 3 required |
| iPhone 6.5" screenshots | 1242×2688 or 1284×2778 px |
| iPad Pro 13" screenshots | 2064×2752 px (optional but recommended) |
| App Preview video | 15–30 sec, optional |

**App information to complete:**
- Subtitle (30 chars): `Echo Interpretation & Learning`
- Category: `Medical`
- Age Rating: 4+ (no objectionable content)
- Privacy Policy URL: Add a privacy policy page to `app.iheartecho.com/privacy`
- Support URL: `https://www.iheartecho.com`

### Step 6 — Submit for review

In App Store Connect, go to your app version, complete all required fields, then click **Submit for Review**.

**Review time:** Apple typically reviews new apps within 1–3 days. Medical apps may receive additional scrutiny — ensure the app description accurately describes its educational/clinical decision support purpose and does not make diagnostic claims.

---

## Store Listing Copy

### Short Description (80 characters)
```
Real-time echo interpretation for sonographers & cardiologists
```

### Full Description
```
iHeartEcho is a real-time echocardiography clinical companion built for 
sonographers, cardiologists, and ACS professionals.

CLINICAL TOOLS
• EchoNavigator™ — Structured TTE, TEE, stress echo, pediatric, fetal, 
  and ACHD protocols with view-by-view checklists and ASE reference values
• Echo Severity Calculator — Guideline-based interpretation for AS, MR, TR, 
  AR, and diastology with LARS, LV GLS, and RV strain
• EchoAssist™ — Enter measurements, get instant severity classification 
  with clinical narrative
• Hemodynamics Lab — Interactive PV loop simulator
• ScanCoach™ — Visual probe guidance with anatomy overlays

LEARNING & CERTIFICATION
• Daily Challenge — One clinical echo question per day with streak tracking 
  and a global leaderboard of 13,000+ echo professionals
• Echo Case Library — 500+ real-world cases with expert explanations
• ACS Mastery Course — Comprehensive adult congenital sonography preparation
• CME Hub — Continuing medical education resources

BUILT FOR CLINICAL USE
• ASE 2025 guideline-aligned thresholds
• Offline-capable core tools
• Optimized for both phone and tablet

Developed by All About Ultrasound — trusted by echo professionals worldwide.
```

### Keywords (Apple — 100 chars max)
```
echo,echocardiography,cardiology,sonographer,ultrasound,ACS,cardiac,TEE,TTE,ASE
```

### Keywords (Google Play — comma separated)
```
echocardiography, echo, cardiology, sonographer, cardiac ultrasound, ACS, TEE, TTE, ASE guidelines, RDCS
```

---

## Build Commands Reference

```bash
# 1. Build web assets and sync to both platforms
pnpm cap:build:android    # builds web + syncs Android
pnpm cap:build:ios        # builds web + syncs iOS

# 2. Sync only (after web build already done)
pnpm cap:sync

# 3. Open in native IDE
pnpm cap:open:android     # opens Android Studio
pnpm cap:open:ios         # opens Xcode (Mac only)

# 4. Regenerate icons/splash screens
python3 scripts/generate-icons.py
```

---

## Post-Submission Checklist

- [ ] Privacy Policy page live at `app.iheartecho.com/privacy`
- [ ] Support email or URL configured in both store listings
- [ ] App Store screenshots captured from real device or simulator
- [ ] Feature graphic created for Google Play (1024×500 px)
- [ ] Release notes written for v1.0.0
- [ ] Apple Developer account renewed and active
- [ ] Google Play Developer account created ($25)
- [ ] Keystore file backed up securely (critical — never lose this)
- [ ] TestFlight beta testing completed before App Store submission (iOS)
- [ ] Internal testing track used before production rollout (Android)

---

## Important Notes

**Medical app classification:** Both stores classify apps providing clinical information as medical apps. The app should be described as a **clinical decision support and education tool**, not a diagnostic device. Avoid language suggesting the app replaces clinical judgment.

**Authentication:** The app uses Manus OAuth for login. When running as a native app, the OAuth redirect will open in an in-app browser (SFSafariViewController on iOS, Chrome Custom Tabs on Android) — this is handled automatically by Capacitor.

**Updates:** After any code change, run `pnpm cap:build:android` or `pnpm cap:build:ios`, then rebuild in the native IDE and submit a new version. Increment `versionCode` (Android) and `CFBundleVersion` (iOS) with each release.
