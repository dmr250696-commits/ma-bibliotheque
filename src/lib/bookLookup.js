// Recherche les infos d'un livre (titre, auteur, couverture) à partir d'un ISBN.
// Essaie Open Library en premier, puis Google Books en secours.

async function fetchFromOpenLibrary(isbn) {
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
  if (!res.ok) return null
  const data = await res.json()
  const book = data[`ISBN:${isbn}`]
  if (!book) return null

  const sujets = (book.subjects || []).slice(0, 3).map((s) => s.name).join(', ')

  return {
    isbn,
    titre: book.title || '',
    auteur: (book.authors || []).map((a) => a.name).join(', ') || '',
    couverture: book.cover?.large || book.cover?.medium || null,
    editeur: (book.publishers || []).map((p) => p.name).join(', ') || '',
    annee: book.publish_date || '',
    nb_pages: book.number_of_pages || null,
    categories_api: sujets || ''
  }
}

async function fetchFromGoogleBooks(isbn) {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
  if (!res.ok) return null
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  const info = item.volumeInfo || {}
  return {
    isbn,
    titre: info.title || '',
    auteur: (info.authors || []).join(', ') || '',
    couverture: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    editeur: info.publisher || '',
    annee: info.publishedDate || '',
    nb_pages: info.pageCount || null,
    categories_api: (info.categories || []).join(', ') || ''
  }
}

export async function lookupBookByIsbn(isbn) {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '')

  let resultatOpenLibrary = null
  let resultatGoogle = null

  try {
    resultatOpenLibrary = await fetchFromOpenLibrary(cleanIsbn)
  } catch (e) {
    console.warn('Open Library indisponible', e)
  }

  try {
    resultatGoogle = await fetchFromGoogleBooks(cleanIsbn)
  } catch (e) {
    console.warn('Google Books indisponible', e)
  }

  if (!resultatOpenLibrary && !resultatGoogle) return null

  // Fusion : on part de la source qui a un titre, on comble les trous avec l'autre
  const base = resultatOpenLibrary?.titre ? resultatOpenLibrary : resultatGoogle
  const appoint = base === resultatOpenLibrary ? resultatGoogle : resultatOpenLibrary

  if (!base) return null
  if (!appoint) return base

  const fusionne = { ...base }
  for (const cle of ['couverture', 'editeur', 'annee', 'nb_pages', 'categories_api', 'auteur']) {
    if (!fusionne[cle] && appoint[cle]) fusionne[cle] = appoint[cle]
  }
  return fusionne
}
