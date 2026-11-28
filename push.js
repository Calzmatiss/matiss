// Funzioni richiamate dall'app (Dart) per le notifiche push.
function matissPushSupportato() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function matissB64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function matissAttendiAttivo(reg) {
  return new Promise((ok) => {
    const sw = reg.installing || reg.waiting || reg.active;
    if (!sw || sw.state === 'activated') return ok(reg);
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') ok(reg);
    });
  });
}

async function matissPushStato() {
  if (!matissPushSupportato()) return 'non-supportato';
  if (Notification.permission === 'denied') return 'negato';
  const reg = await navigator.serviceWorker.getRegistration('./push-scope/');
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return Notification.permission === 'granted' && sub ? 'attivo' : 'inattivo';
}

async function matissPush(vapid) {
  if (!matissPushSupportato()) return JSON.stringify({ errore: 'non-supportato' });
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return JSON.stringify({ errore: 'negato' });
  let reg = await navigator.serviceWorker.register('push-sw.js', { scope: './push-scope/' });
  reg = await matissAttendiAttivo(reg);
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: matissB64ToBytes(vapid),
    });
  }
  return JSON.stringify(sub.toJSON());
}

async function matissPushDisattiva() {
  if (!matissPushSupportato()) return '';
  const reg = await navigator.serviceWorker.getRegistration('./push-scope/');
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (!sub) return '';
  const ep = sub.endpoint;
  await sub.unsubscribe();
  return ep;
}
