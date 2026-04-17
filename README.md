# The Jealous Mistress — Setup Guide

---

## YOUR FILES
```
index.html               → Member app (what friends install)
manifest.json            → Makes it installable on phones
firebase-messaging-sw.js → Background notification handler
admin.html               → Admin panel (open/close alarms)
functions/
  index.js               → Cloud Function (sends push notifications)
  package.json           → Function dependencies
```

---

## STEP 1 — FIREBASE SETUP (~20 min)

### 1a. Create the project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it → disable Analytics → Create

### 1b. Get your app config
1. Project Settings (gear icon) → **General** tab
2. Scroll to **"Your apps"** → click **"</> Web"**
3. Register app name → click **Register**
4. Copy the `firebaseConfig` block — you'll paste it into 3 files

### 1c. Get your VAPID key
1. Project Settings → **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"**
3. Click **"Generate key pair"**
4. Copy that long string — goes in `index.html` only

### 1d. Enable Firestore
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **"Start in test mode"** → Next → pick any location → Enable

### 1e. Enable Authentication
1. Left sidebar → **Authentication** → **Get started**
2. Click **"Email/Password"** → toggle **Enable** → Save
3. Click **"Add user"** → add YOUR email + a strong password → Add user
4. Repeat for your co-admin's email + password
5. That's it — these are the only two people who can log into admin.html

---

## STEP 2 — PASTE YOUR CONFIG

### In `index.html` — find and replace both placeholder blocks:
```js
const firebaseConfig = {
  apiKey:            "← your value",
  authDomain:        "← your value",
  ...
};
const VAPID_KEY = "← your VAPID key";
```

### In `admin.html` — same firebaseConfig block:
```js
const firebaseConfig = {
  apiKey:            "← your value",
  ...
};
```

### In `firebase-messaging-sw.js` — same firebaseConfig block again.

---

## STEP 3 — SET UP CLOUD FUNCTIONS (~15 min)

The Cloud Function is what sends push notifications to all members.
You need Node.js installed on your computer for this step.

### 3a. Install Node.js (if you don't have it)
Download from https://nodejs.org → install the LTS version

### 3b. Install Firebase CLI
Open Terminal (Mac) or Command Prompt (Windows) and run:
```
npm install -g firebase-tools
```

### 3c. Log in to Firebase
```
firebase login
```
A browser window opens — sign in with your Google account.

### 3d. Set up the project folder
Navigate to your project folder in Terminal, then run:
```
firebase init functions
```
When prompted:
- "Use an existing project" → select your project
- Language: **JavaScript**
- ESLint: **No**
- Install dependencies: **Yes**

This creates a `functions` folder. Replace the contents of
`functions/index.js` with the `index.js` file provided.

### 3e. Deploy the function
```
firebase deploy --only functions
```
Takes about 2 minutes. When done you'll see a success message.

---

## STEP 4 — DEPLOY TO NETLIFY

### Option A — Drag and drop (easiest):
1. Go to https://app.netlify.com
2. Drag your folder (index.html, manifest.json,
   firebase-messaging-sw.js, admin.html) onto the deploy zone
3. You'll get a URL like: https://amazing-name-123.netlify.app

NOTE: Do NOT drag the `functions` folder to Netlify —
that only gets deployed to Firebase (Step 3).

### Option B — Via GitHub:
1. Push the 4 web files to a GitHub repo
2. Netlify → "Add new site" → "Import from Git" → connect repo
3. Auto-deploys on every update

---

## STEP 5 — UPDATE FIRESTORE RULES

In Firebase Console → Firestore → **Rules** tab, paste this and click Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone can read clubhouse status (members see open/closed)
    match /clubhouse/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Only logged-in admins can send notifications
    match /notifications/{doc} {
      allow read, write: if request.auth != null;
    }

    // Anyone can register their notification token
    match /members/{token} {
      allow read, write: if true;
    }
  }
}
```

---

## STEP 6 — FRIENDS INSTALL THE APP

Send your Netlify URL to all ~20 members. They:
1. Open URL in phone browser (Chrome on Android, Safari on iPhone)
2. Tap **"Enable Alarm Notifications"** → Allow
3. **Android**: Tap "Add to Home Screen" button
4. **iPhone**: Tap Share → "Add to Home Screen" → Add

---

## STEP 7 — USING THE ADMIN PANEL

Go to: `YOUR-NETLIFY-URL/admin.html`

Log in with the email + password you set up in Firebase Auth.

- **"Sound the Foghorn"** → Clubhouse OPEN
- **"Ring the Bell"**     → Clubhouse CLOSED

Every member's phone gets a push notification within seconds.

---

## NOTES

- Firebase free tier (Spark) covers everything here comfortably
- Cloud Functions free tier: 2 million calls/month — you'd need
  to send 100,000 alarms/day to exceed it
- If you forget your admin password: Firebase Console →
  Authentication → find the user → reset password
- iOS push notifications require iPhone users to add the app
  to their home screen first (iOS 16.4+)
