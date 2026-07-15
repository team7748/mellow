self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : "" }
  }
  event.waitUntil(self.registration.showNotification(payload.title || "Mellow", {
    body: payload.body || "ถึงเวลาฝึกภาษาอังกฤษแล้ว",
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: payload.url || "/#" },
  }))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || "/#", self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin))
    if (existing) {
      existing.navigate(targetUrl)
      return existing.focus()
    }
    return self.clients.openWindow(targetUrl)
  }))
})
