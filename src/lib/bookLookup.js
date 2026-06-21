// Recherche les infos d'un livre (titre, auteur, couverture) à partir d'un ISBN.
// Essaie Open Library (API books), puis Google Books, puis l'index de
// recherche Open Library (qui couvre parfois des éditions absentes de
// l'API books) — utile notamment pour des éditions françaises moins
// répandues internationalement.

async function fetchFromOpenLibrary(isbn) {
  const diag = { source: 'Open Library (books)' }
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
    diag.statutHttp = res.status
    if (!res.ok) {
      diag.erreur = `HTTP ${res.status}`
      return { resultat: null, diag }
    }
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) {
      diag.erreur = 'ISBN absent de la réponse (livre non répertorié)'
      return { resultat: null, diag }
    }

    const sujets = (book.subjects || []).slice(0, 3).map((s) => s.name).join(', ')

    return {
      resultat: {
        isbn,
        titre: book.title || '',
        auteur: (book.authors || []).map((a) => a.name).join(', ') || '',
        couverture: book.cover?.large || book.cover?.medium || null,
        editeur: (book.publishers || []).map((p) => p.name).join(', ') || '',
        annee: book.publish_date || '',
        nb_pages: book.number_of_pages || null,
        categories_api: sujets || ''
      },
      diag
    }
  } catch (e) {
    diag.erreur = `Exception réseau : ${e?.message || e}`
    return { resultat: null, diag }
  }
}

async function fetchFromGoogleBooks(isbn) {
  const diag = { source: 'Google Books' }
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    diag.statutHttp = res.status
    if (!res.ok) {
      diag.erreur = `HTTP ${res.status}`
      return { resultat: null, diag }
    }
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) {
      diag.erreur = 'Aucun résultat (livre non répertorié)'
      return { resultat: null, diag }
    }

    const info = item.volumeInfo || {}
    return {
      resultat: {
        isbn,
        titre: info.title || '',
        auteur: (info.authors || []).join(', ') || '',
        couverture: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        editeur: info.publisher || '',
        annee: info.publishedDate || '',
        nb_pages: info.pageCount || null,
        categories_api: (info.categories || []).join(', ') || ''
      },
      diag
    }
  } catch (e) {
    diag.erreur = `Exception réseau : ${e?.message || e}`
    return { resultat: null, diag }
  }
}

async function fetchFromOpenLibrarySearch(isbn) {
  const diag = { source: 'Open Library (search)' }
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?isbn=${isbn}&fields=title,author_name,cover_i,publisher,first_publish_year,number_of_pages_median,subject`
    )
    diag.statutHttp = res.status
    if (!res.ok) {
      diag.erreur = `HTTP ${res.status}`
      return { resultat: null, diag }
    }
    const data = await res.json()
    const doc = data.docs?.[0]
    if (!doc) {
      diag.erreur = 'Aucun résultat (livre non répertorié)'
      return { resultat: null, diag }
    }

    return {
      resultat: {
        isbn,
        titre: doc.title || '',
        auteur: (doc.author_name || []).join(', ') || '',
        couverture: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
        editeur: (doc.publisher || [])[0] || '',
        annee: doc.first_publish_year ? String(doc.first_publish_year) : '',
        nb_pages: doc.number_of_pages_median || null,
        categories_api: (doc.subject || []).slice(0, 3).join(', ') || ''
      },
      diag
    }
  } catch (e) {
    diag.erreur = `Exception réseau : ${e?.message || e}`
    return { resultat: null, diag }
  }
}

// Retourne { livre, diagnostics } où diagnostics est toujours rempli (utile
// en cas d'échec pour comprendre la cause exacte), même si livre est null.
export async function lookupBookByIsbn(isbn) {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '')
  const diagnostics = []

  const { resultat: resultatOpenLibrary, diag: diagOpenLibrary } = await fetchFromOpenLibrary(cleanIsbn)
  diagnostics.push(diagOpenLibrary)

  const { resultat: resultatGoogle, diag: diagGoogle } = await fetchFromGoogleBooks(cleanIsbn)
  diagnostics.push(diagGoogle)

  // On n'interroge l'index de recherche que si les deux premières sources
  // n'ont rien donné de complet, pour limiter le nombre de requêtes.
  const openLibraryOk = resultatOpenLibrary?.titre?.trim()
  const googleOk = resultatGoogle?.titre?.trim()
  let resultatOpenLibrarySearch = null
  if (!openLibraryOk && !googleOk) {
    const { resultat, diag } = await fetchFromOpenLibrarySearch(cleanIsbn)
    resultatOpenLibrarySearch = resultat
    diagnostics.push(diag)
  }

  // Diagnostic visible dans la console du navigateur, utile en cas de souci.
  console.info('Résultat ISBN', cleanIsbn, diagnostics)

  const sourcesValides = [resultatOpenLibrary, resultatGoogle, resultatOpenLibrarySearch].filter(
    (r) => r?.titre?.trim()
  )

  if (sourcesValides.length === 0) {
    return { livre: null, diagnostics }
  }

  // On part de la première source valide, on comble les trous avec les autres.
  const [base, ...autres] = sourcesValides
  const fusionne = { ...base }
  for (const appoint of autres) {
    for (const cle of ['couverture', 'editeur', 'annee', 'nb_pages', 'categories_api', 'auteur']) {
      if (!fusionne[cle] && appoint[cle]) fusionne[cle] = appoint[cle]
    }
  }
  return { livre: fusionne, diagnostics }
}
