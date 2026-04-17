// firebase-messaging-sw.js
// This file MUST be at the root of your site (same level as index.html)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD1i_hWah1vZOUPugh-3AoaGu78aokn_PU",
  authDomain: "the-jealous-mistress-31e8a.firebaseapp.com",
  projectId: "the-jealous-mistress-31e8a",
  storageBucket: "the-jealous-mistress-31e8a.firebasestorage.app",
  messagingSenderId: "327568458075",
  appId: "1:327568458075:web:14d292c7c7d46536f7da7e"
});

const messaging = firebase.messaging();

// NOTE: We do NOT call messaging.onBackgroundMessage() here.
// FCM delivers the notification automatically from the push payload.
// Adding onBackgroundMessage() would cause a duplicate notification.

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
