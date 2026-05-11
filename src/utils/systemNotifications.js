const DEFAULT_ICON = '/favicon.png'

export function getNotificationEnvironment() {
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

  if (!('Notification' in window)) {
    return { supported: false, secure: window.isSecureContext, permission: 'unsupported' }
  }

  if (!window.isSecureContext && !isLocalHost) {
    return { supported: true, secure: false, permission: Notification.permission }
  }

  return { supported: true, secure: true, permission: Notification.permission }
}

export async function requestSystemNotificationPermission() {
  const env = getNotificationEnvironment()

  if (!env.supported) {
    return { ...env }
  }

  if (!env.secure) {
    return { ...env, permission: 'insecure' }
  }

  if (Notification.permission === 'granted') {
    return { ...env, permission: 'granted' }
  }

  const permission = await Notification.requestPermission()
  return { ...env, permission }
}

export async function showSystemNotification({ title, body, tag, data } = {}) {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const options = {
    body: body ?? '',
    tag: tag ?? undefined,
    data: data ?? undefined,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
  }

  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await registration.showNotification(title ?? 'Notificación', options)
    return true
  }

  // Fallback para navegadores sin SW disponible.
  new Notification(title ?? 'Notificación', options)
  return true
}

export async function sendTestSystemNotification() {
  return showSystemNotification({
    title: 'BachesITO',
    body: 'Notificaciones activadas correctamente.',
    tag: 'bachesito-notification-test',
    data: { type: 'test' },
  })
}
