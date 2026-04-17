// netlify/functions/send-notification.js

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging }                 = require("firebase-admin/messaging");
const { getAuth }                      = require("firebase-admin/auth");

const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY  = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId: PROJECT_ID, clientEmail: CLIENT_EMAIL, privateKey: PRIVATE_KEY })
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const authHeader = event.headers.authorization || "";
  const idToken    = authHeader.replace("Bearer ", "");

  if (!idToken) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    await getAuth().verifyIdToken(idToken);
  } catch (err) {
    return { statusCode: 401, body: "Invalid token" };
  }

  const { token, title, body, type } = JSON.parse(event.body || "{}");

  if (!token || !title || !body) {
    return { statusCode: 400, body: "Missing fields" };
  }

  try {
    // Send ONLY via APNs (Apple) — no webpush section
    // This prevents FCM from delivering through two channels on iOS
    await getMessaging().send({
      token,
      notification: { title, body },
      data: { type: type || "open" },
      apns: {
        headers: {
          "apns-priority":     "10",
          "apns-collapse-id":  "clubhouse-status"
        },
        payload: {
          aps: {
            sound:   "default",
            badge:   1,
            alert: { title, body }
          }
        }
      },
      android: {
        priority:    "high",
        collapseKey: "clubhouse-status",
        notification: {
          sound: "default",
          tag:   "clubhouse-status"
        }
      }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("FCM send error:", err.message);
    return { statusCode: 200, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
