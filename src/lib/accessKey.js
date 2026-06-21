// Gère l'accès privé à l'appli via une clé secrète personnelle.
// La clé est demandée une fois, vérifiée contre Supabase, puis stockée
// sur l'appareil (localStorage) pour ne plus être redemandée.

const STORAGE_KEY = 'biblio_access_key'

export function getStoredAccessKey() {
  return localStorage.getItem(STORAGE_KEY)
}

export function storeAccessKey(key) {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearAccessKey() {
  localStorage.removeItem(STORAGE_KEY)
}
