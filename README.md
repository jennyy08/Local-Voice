# LocalVoice

LocalVoice is a civic-tech web app for Ottawa residents to report local issues, explore municipal resources, and better understand how city government works. Reports are shared in a real-time community feed with map pins, voting, and photo uploads.

## Features
- Real-time community report feed (synced via Firestore)
- Interactive map with location pins for each report
- Photo upload support (with HEIC-to-JPEG conversion for iPhones)
- Content moderation (text + image) via OpenAI's moderation API
- Voting and flagging system for community prioritization
- Municipal contact directory with 311 integration
- Dark mode support
- Rate limiting (3 reports/day per user)
- Anonymous authentication (no sign-up friction)

## Tech Stack
- **Frontend:** React + TypeScript, Vite, Tailwind CSS
- **Backend:** Firebase (Firestore, Storage, Auth, Cloud Functions)
- **Moderation:** OpenAI omni-moderation-latest (via Firebase Cloud Function)
- **Map:** Leaflet + OpenStreetMap
- **Icons:** lucide-react

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` or create a `.env` file with your Firebase config:
   ```
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   VITE_MODERATION_FUNCTION_URL="..."
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploying Cloud Functions

The moderation function lives in `functions/` and requires Node 20.

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

Set the OpenAI API key as a Firebase secret (never stored in code):
```bash
firebase functions:secrets:set OPENAI_MOD_KEY
```

## Security
- OpenAI API key stored server-side via Firebase Secrets
- Cloud Function verifies Firebase ID tokens before processing
- Firestore rules enforce authentication for all writes
- Storage rules restrict uploads to image files only (max 10MB)
- Rate limiting prevents spam (3 reports/day per user)

## Deploying Rules

```bash
firebase deploy --only firestore:rules,storage
```

## Inspiration
This project was shaped around the idea of making civic participation feel approachable, useful, and local.
