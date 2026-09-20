/* Service Worker for CS Portal Web Push Notifications */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "CS Organization Portal",
    message: "You have a new officer notification.",
    linkUrl: "/notifications",
  };

  try {
    payload = event.data.json();
  } catch (err) {
    payload.message = event.data.text();
  }

  const options = {
    body: payload.message,
    icon: "/logo.png",
    badge: "/logo.png",
    data: { linkUrl: payload.linkUrl || "/notifications" },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.linkUrl || "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
