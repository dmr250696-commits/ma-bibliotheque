// Recherche les infos d'un livre (titre, auteur, couverture) à partir d'un ISBN.
// Sources interrogées dans l'ordre de pertinence :
//   1. BnF (catalogue officiel français — le plus complet pour les éditions françaises)
//   2. Google Books (bonne couverture internationale)
//   3. Open Library books (catalogue contributif international)
//   4. Open Library search (index de recherche plus large qu'OL books)
//   5. OCLC Classify (fallback international, XML gratuit sans clé)

// ─── BnF (Bibliothèque nationale de France) ────────────────────────────────
// API SRU officielle, sans clé, sans limite. Réponse en XML Dublin Core.
// Couvre exhaustivement tous les livres publiés en France (dépôt légal).
async function fetchFromBnf(isbn) {
  const diag = { source: 'BnF (catalogue français)' }
  try {
    const url = `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve&query=bib.isbn%20adj%20%22${isbn}%22&recordSchema=dublincore&maximumRecords=1`
    const res = await fetch(url)
    diag.statutHttp = res.status
    if (!res.ok) {
      diag.erreur = `HTTP ${res.status}`
      return { resultat: null, diag }
    }
    const texte = await res.text()
    const xml = new DOMParser().parseFromString(texte, 'application/xml')

    const nbResultats = xml.querySelector('numberOfRecords')?.textContent?.trim()
    if (!nbResultats || nbResultats === '0') {
      diag.erreur = 'ISBN absent du catalogue BnF'
      return { resultat: null, diag }
    }

    const dc = (tag) => xml.querySelector(`*|${tag}`)?.textContent?.trim() || ''

    // La BnF met souvent auteur et titre dans dc:title et dc:creator.
    // Format typique dc:title : "Le titre / Prénom Nom"
    const titreRaw = dc('title')
    const titre = titreRaw.split(' / ')[0].trim()
    const auteurDcTitle = titreRaw.includes(' / ') ? titreRaw.split(' / ')[1]?.trim() : ''
    const auteur = dc('creator') || auteurDcTitle

    // dc:date peut contenir "2004" ou "2004-01-01"
    const annee = dc('date').substring(0, 4)

    // Récupère le numéro ARK pour construire l'URL de couverture BnF
    const identifier = dc('identifier')
    const arkMatch = identifier.match(/ark:\/12148\/(cb\w+)/)
    const couverture = arkMatch
      ? `https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/${arkMatch[1]}&couverture=1`
      : null

    // dc:description peut contenir le nb de pages : "337 p."
    const description = dc('description')
    const pagesMatch = description.match(/(\d+)\s*p/)
    const nb_pages = pagesMatch ? parseInt(pagesMatch[1], 10) : null

    const editeur = dc('publisher')
    const sujet = dc('subject')

    return {
      resultat: {
        isbn,
        titre,
        auteur,
        couverture,
        editeur,
        annee,
        nb_pages,
        categories_api: sujet
      },
      diag
    }
  } catch (e) {
    diag.erreur = `Exception réseau : ${e?.message || e}`
    return { resultat: null, diag }
  }
}

// ─── OCLC Classify ─────────────────────────────────────────────────────────
// API publique OCLC (WorldCat), sans clé requise. Réponse en XML.
// Très large couverture internationale (500M+ notices).
async function fetchFromOclcClassify(isbn) {
  const diag = { source: 'OCLC Classify (WorldCat)' }
  try {
    const res = await fetch(
      `https://classify.oclc.org/classify2/Classify?isbn=${isbn}&summary=true`
    )
    diag.statutHttp = res.status
    if (!res.ok) {
      diag.erreur = `HTTP ${res.status}`
      return { resultat: null, diag }
    }
    const texte = await res.text()
    const xml = new DOMParser().parseFromString(texte, 'application/xml')

    // Code de réponse OCLC : 0 = trouvé exact, 2 = plusieurs éditions
    const code = xml.querySelector('response')?.getAttribute('code')
    if (code !== '0' && code !== '2') {
      diag.erreur = `ISBN non trouvé (code OCLC : ${code || 'inconnu'})`
      return { resultat: null, diag }
    }

    const work = xml.querySelector('work')
    const title = work?.getAttribute('title') || ''
    const author = work?.getAttribute('author') || ''

    if (!title) {
      diag.erreur = 'Titre absent dans la réponse OCLC'
      return { resultat: null, diag }
    }

    return {
      resultat: {
        isbn,
        titre: title,
        auteur: author,
        couverture: null, // OCLC Classify ne fournit pas de couvertures
        editeur: '',
        annee: '',
        nb_pages: null,
        categories_api: ''
      },
      diag
    }
  } catch (e) {
    diag.erreur = `Exception réseau : ${e?.message || e}`
    return { resultat: null, diag }
  }
}

// ─── Open Library (API books) ───────────────────────────────────────────────
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

// ─── Google Books ───────────────────────────────────────────────────────────
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

// ─── Open Library (index de recherche) ─────────────────────────────────────
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

// ─── Orchestration ──────────────────────────────────────────────────────────
// Retourne { livre, diagnostics } où diagnostics est toujours rempli (utile
// en cas d'échec pour comprendre la cause exacte), même si livre est null.
// Stratégie : on interroge BnF et Google Books en parallèle (les plus fiables),
// puis en cascade Open Library et OCLC seulement si rien n'a été trouvé,
// pour limiter le nombre de requêtes inutiles.
export async function lookupBookByIsbn(isbn) {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '')
  const diagnostics = []

  // Étape 1 — Sources principales en parallèle (BnF + Google Books)
  const [{ resultat: resBnf, diag: diagBnf }, { resultat: resGoogle, diag: diagGoogle }] =
    await Promise.all([fetchFromBnf(cleanIsbn), fetchFromGoogleBooks(cleanIsbn)])
  diagnostics.push(diagBnf, diagGoogle)

  const sourcesEtape1 = [resBnf, resGoogle].filter((r) => r?.titre?.trim())

  if (sourcesEtape1.length > 0) {
    // Au moins une source principale a trouvé le livre — on fusionne et on retourne.
    return { livre: fusionner(sourcesEtape1), diagnostics }
  }

  // Étape 2 — Fallbacks en parallèle (Open Library books + search)
  const [
    { resultat: resOL, diag: diagOL },
    { resultat: resOLSearch, diag: diagOLSearch }
  ] = await Promise.all([
    fetchFromOpenLibrary(cleanIsbn),
    fetchFromOpenLibrarySearch(cleanIsbn)
  ])
  diagnostics.push(diagOL, diagOLSearch)

  const sourcesEtape2 = [resOL, resOLSearch].filter((r) => r?.titre?.trim())

  if (sourcesEtape2.length > 0) {
    return { livre: fusionner(sourcesEtape2), diagnostics }
  }

  // Étape 3 — Dernier recours : OCLC Classify (titre + auteur uniquement)
  const { resultat: resOclc, diag: diagOclc } = await fetchFromOclcClassify(cleanIsbn)
  diagnostics.push(diagOclc)

  console.info('Résultat ISBN', cleanIsbn, diagnostics)

  if (resOclc?.titre?.trim()) {
    return { livre: resOclc, diagnostics }
  }

  return { livre: null, diagnostics }
}

// Fusionne plusieurs résultats en privilégiant le premier (le plus complet),
// et comble les champs vides avec les suivants.
function fusionner(sources) {
  const [base, ...autres] = sources
  const fusionne = { ...base }
  for (const appoint of autres) {
    for (const cle of ['couverture', 'editeur', 'annee', 'nb_pages', 'categories_api', 'auteur', 'titre']) {
      if (!fusionne[cle] && appoint[cle]) fusionne[cle] = appoint[cle]
    }
  }
  return fusionne
}
