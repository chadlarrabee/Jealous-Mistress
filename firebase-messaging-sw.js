// firebase-messaging-sw.js
// This file MUST be at the root of your site (same level as index.html)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 PASTE THE SAME FIREBASE CONFIG HERE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
firebase.initializeApp({
  apiKey: "AIzaSyD1i_hWah1vZOUPugh-3AoaGu78aokn_PU",
  authDomain: "the-jealous-mistress-31e8a.firebaseapp.com",
  projectId: "the-jealous-mistress-31e8a",
  storageBucket: "the-jealous-mistress-31e8a.firebasestorage.app",
  messagingSenderId: "327568458075",
  appId: "1:327568458075:web:14d292c7c7d46536f7da7e"
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const { title, body } = payload.notification || {};
  const isOpen = payload.data?.type === "open";

  const notificationOptions = {
    body: body || (isOpen ? "The Jealous Mistress is now open!" : "The Jealous Mistress is now closed."),
    icon: isOpen ? "/icon-open.png" : "/icon-closed.png",
    badge: "/icon-192.png",
    tag: "clubhouse-status",        // Replaces previous notification (no stacking)
    renotify: true,
    requireInteraction: false,
    vibrate: isOpen
      ? [200, 100, 200, 100, 200]   // 3 short blasts (foghorn)
      : [400, 200, 400],             // 2 longer tolls (ship's bell)
    data: { url: "/" }
  };

  self.registration.showNotification(
    title || (isOpen ? "⚓ Clubhouse OPEN" : "🔔 Clubhouse CLOSED"),
    notificationOptions
  );
});

// Clicking the notification opens/focuses the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/");
    })
  );
});
