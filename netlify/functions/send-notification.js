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

  // Now accepts an array of tokens in one call
  const { tokens, title, body, type } = JSON.parse(event.body || "{}");

  if (!tokens || !tokens.length || !title || !body) {
    return { statusCode: 400, body: "Missing fields" };
  }

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { type: type || "open" },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-collapse-id": "clubhouse-status"
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      },
      android: {
        priority: "high",
        collapseKey: "clubhouse-status",
        notification: {
          sound: "default",
          tag: "clubhouse-status"
        }
      }
    });

    const successCount = response.responses.filter(r => r.success).length;
    const failCount    = response.responses.filter(r => !r.success).length;

    console.log(`Sent to ${successCount} members, ${failCount} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, successCount, failCount })
    };

  } catch (err) {
    console.error("FCM send error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
