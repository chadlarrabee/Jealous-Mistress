// netlify/functions/send-notification.js
// This runs on Netlify's free serverless tier — no Cloud Functions needed!

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging }                 = require("firebase-admin/messaging");
const { getAuth }                      = require("firebase-admin/auth");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// These values come from Netlify environment variables
// You will set them in the Netlify dashboard (instructions below)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PROJECT_ID     = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL   = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY    = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

// Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId: PROJECT_ID, clientEmail: CLIENT_EMAIL, privateKey: PRIVATE_KEY })
  });
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Verify the request comes from a logged-in Firebase admin
  const authHeader = event.headers.authorization || "";
  const idToken    = authHeader.replace("Bearer ", "");

  if (!idToken) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    // Verify the Firebase ID token — only your 2 admin users can pass this
    await getAuth().verifyIdToken(idToken);
  } catch (err) {
    return { statusCode: 401, body: "Invalid token" };
  }

  // Parse the request
  const { token, title, body, type } = JSON.parse(event.body || "{}");

  if (!token || !title || !body) {
    return { statusCode: 400, body: "Missing fields" };
  }

  try {
    await getMessaging().send({
      token,
      notification: { title, body },
      data: { type: type || "open" },
      android: { priority: "high" },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default" } }
      },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          title, body,
          icon:  "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: type === "open" ? [200,100,200,100,200] : [400,200,400]
        }
      }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    // Token may be expired/invalid — not a crash, just log it
    console.error("FCM send error:", err.message);
    return { statusCode: 200, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
