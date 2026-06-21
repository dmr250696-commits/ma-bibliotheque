import { useMemo, useState } from 'react'
import EcranAcces from './components/EcranAcces.jsx'
import ScannerCodeBarres from './components/ScannerCodeBarres.jsx'
import FicheLivre from './components/FicheLivre.jsx'
import ModaleLivre from './components/ModaleLivre.jsx'
import EcranRecap from './components/EcranRecap.jsx'
import FiltresAvances from './components/FiltresAvances.jsx'
import { useLivres } from './hooks/useLivres.js'
import { getStoredAccessKey, storeAccessKey, clearAccessKey } from './lib/accessKey.js'
import { lookupBookByIsbn } from './lib/bookLookup.js'
import { STATUT_CONFIG, STATUT_LISTE } from './lib/statuts.js'

export default function App() {
  const [accessKey, setAccessKey] = useState(getStoredAccessKey())
  const [scannerOuvert, setScannerOuvert] = useState(false)
  const [livreEnEdition, setLivreEnEdition] = useState(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [rechercheIsbnEnCours, setRechercheIsbnEnCours] = useState(false)
  const [messageScan, setMessageScan] = useState(null)
  const [diagnosticScan, setDiagnosticScan] = useState(null)
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [recapOuvert, setRecapOuvert] = useState(false)
  const [filtreGenre, setFiltreGenre] = useState(null)
  const [filtreAuteur, setFiltreAuteur] = useState(null)
  const [noteMin, setNoteMin] = useState(0)
  const [tri, setTri] = useState('recent')

  const { livres, chargement, erreur, ajouterLivre, modifierLivre, supprimerLivre } = useLivres(accessKey)

  function handleValiderCle(cle) {
    storeAccessKey(cle)
    setAccessKey(cle)
  }

  function handleDeconnexion() {
    clearAccessKey()
    setAccessKey(null)
  }

  async function handleCodeScanne(isbn) {
    setScannerOuvert(false)
    setRechercheIsbnEnCours(true)
    setMessageScan(null)
    setDiagnosticScan(null)

    const { livre: infos, diagnostics } = await lookupBookByIsbn(isbn)
    setRechercheIsbnEnCours(false)

    if (infos) {
      setLivreEnEdition({
        titre: infos.titre,
        auteur: infos.auteur,
        isbn: infos.isbn,
        couverture: infos.couverture || '',
        editeur: infos.editeur,
        annee: infos.annee,
        genre: '',
        categories_api: infos.categories_api || '',
        nb_pages: infos.nb_pages || '',
        prix: '',
        note: 0,
        date_lecture: '',
        statut: 'non_lu',
        prete_a: '',
        notes: ''
      })
      setModaleOuverte(true)
    } else {
      setDiagnosticScan({ isbn, diagnostics: diagnostics || [] })
      setLivreEnEdition({
        titre: '',
        auteur: '',
        isbn,
        couverture: '',
        genre: '',
        nb_pages: '',
        prix: '',
        note: 0,
        date_lecture: '',
        statut: 'non_lu',
        prete_a: '',
        notes: ''
      })
      setModaleOuverte(true)
    }
  }

  async function handleEnregistrerLivre(livre) {
    if (livre.id) {
      await modifierLivre(livre.id, livre)
    } else {
      await ajouterLivre(livre)
    }
    setModaleOuverte(false)
    setLivreEnEdition(null)
  }

  async function handleSupprimerLivre(id) {
    await supprimerLivre(id)
    setModaleOuverte(false)
    setLivreEnEdition(null)
  }

  const genresDisponibles = useMemo(() => {
    return Array.from(new Set(livres.map((l) => l.genre).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'fr')
    )
  }, [livres])

  const auteursDisponibles = useMemo(() => {
    return Array.from(new Set(livres.map((l) => l.auteur).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'fr')
    )
  }, [livres])

  const filtresActifsCount = [filtreGenre, filtreAuteur, noteMin > 0 ? noteMin : null].filter(
    Boolean
  ).length

  function reinitialiserFiltres() {
    setFiltreGenre(null)
    setFiltreAuteur(null)
    setNoteMin(0)
    setTri('recent')
  }

  const livresFiltres = useMemo(() => {
    let resultat = livres.filter((l) => {
      if (filtreStatut && l.statut !== filtreStatut) return false
      if (filtreGenre && l.genre !== filtreGenre) return false
      if (filtreAuteur && l.auteur !== filtreAuteur) return false
      if (noteMin > 0 && (!l.note || l.note < noteMin)) return false
      if (recherche.trim()) {
        const q = recherche.toLowerCase()
        const correspond =
          l.titre?.toLowerCase().includes(q) ||
          l.auteur?.toLowerCase().includes(q) ||
          l.genre?.toLowerCase().includes(q)
        if (!correspond) return false
      }
      return true
    })

    resultat = [...resultat].sort((a, b) => {
      switch (tri) {
        case 'titre':
          return (a.titre || '').localeCompare(b.titre || '', 'fr')
        case 'auteur':
          return (a.auteur || '').localeCompare(b.auteur || '', 'fr')
        case 'note':
          return (b.note || 0) - (a.note || 0)
        case 'date_lecture':
          return (b.date_lecture || '').localeCompare(a.date_lecture || '')
        case 'recent':
        default:
          return (b.cree_le || '').localeCompare(a.cree_le || '')
      }
    })

    return resultat
  }, [livres, filtreStatut, filtreGenre, filtreAuteur, noteMin, recherche, tri])

  // rotation pseudo-aléatoire stable par livre, pour l'effet "pile de fiches"
  const rotations = useMemo(() => {
    const map = {}
    livres.forEach((l, i) => {
      const seed = (l.id?.toString().charCodeAt(0) || i) + i
      map[l.id] = ((seed % 5) - 2) * 0.6
    })
    return map
  }, [livres])

  if (!accessKey) {
    return <EcranAcces onValider={handleValiderCle} />
  }

  return (
    <div style={styles.page}>
      <header style={styles.entete}>
        <div>
          <h1 style={styles.titrePage}>Ma Bibliothèque</h1>
          <p className="label-mono" style={styles.compteur}>
            {livres.length} livre{livres.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={handleDeconnexion} style={styles.boutonDeconnexion}>
          Verrouiller
        </button>
      </header>

      <div style={styles.barreRecherche}>
        <input
          type="search"
          placeholder="Rechercher un titre, un auteur, un genre…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={styles.inputRecherche}
        />
        <button
          onClick={() => setFiltresOuverts(true)}
          style={styles.boutonIcone}
          aria-label="Filtres et tri"
        >
          ⚙️
          {filtresActifsCount > 0 && <span style={styles.pastille}>{filtresActifsCount}</span>}
        </button>
        <button onClick={() => setRecapOuvert(true)} style={styles.boutonIcone} aria-label="Récapitulatif de lecture">
          📊
        </button>
      </div>

      <div style={styles.filtres}>
        <button
          onClick={() => setFiltreStatut(null)}
          style={{
            ...styles.filtreBouton,
            ...(filtreStatut === null ? styles.filtreBoutonActif : {})
          }}
        >
          Tous
        </button>
        {STATUT_LISTE.map((s) => {
          const cfg = STATUT_CONFIG[s]
          const actif = filtreStatut === s
          return (
            <button
              key={s}
              onClick={() => setFiltreStatut(actif ? null : s)}
              style={{
                ...styles.filtreBouton,
                color: actif ? '#fff' : cfg.couleur,
                background: actif ? cfg.couleur : cfg.fond
              }}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      <main style={styles.main}>
        {chargement && <p style={styles.messageEtat}>Chargement de ta bibliothèque…</p>}

        {erreur && (
          <p style={{ ...styles.messageEtat, color: 'var(--stamp-red)' }}>
            Erreur de connexion : {erreur}
          </p>
        )}

        {!chargement && !erreur && livresFiltres.length === 0 && (
          <div style={styles.vide}>
            <p style={styles.videIcone}>🗄️</p>
            <p style={styles.videTexte}>
              {livres.length === 0
                ? 'Ta bibliothèque est vide. Scanne ton premier livre pour commencer.'
                : 'Aucun livre ne correspond à ce filtre.'}
            </p>
          </div>
        )}

        <div style={styles.grille}>
          {livresFiltres.map((livre) => (
            <FicheLivre
              key={livre.id}
              livre={livre}
              rotation={rotations[livre.id] || 0}
              onOuvrir={(l) => {
                setLivreEnEdition(l)
                setModaleOuverte(true)
              }}
            />
          ))}
        </div>
      </main>

      {rechercheIsbnEnCours && (
        <div style={styles.toast}>Recherche du livre en cours…</div>
      )}
      {messageScan && (
        <div style={styles.toast} onClick={() => setMessageScan(null)}>
          {messageScan}
        </div>
      )}

      {diagnosticScan && (
        <div style={styles.diagOverlay} onClick={() => setDiagnosticScan(null)}>
          <div style={styles.diagBoite} onClick={(e) => e.stopPropagation()}>
            <div style={styles.diagEntete}>
              <h3 style={styles.diagTitre}>Livre non trouvé</h3>
              <button
                onClick={() => setDiagnosticScan(null)}
                style={styles.diagFermer}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <p style={styles.diagTexte}>
              Aucune des sources gratuites n'a trouvé d'informations pour l'ISBN{' '}
              <strong>{diagnosticScan.isbn}</strong>. Tu peux compléter la fiche manuellement.
            </p>
            <p style={styles.diagSousTitre}>Détail technique :</p>
            <div style={styles.diagListe}>
              {diagnosticScan.diagnostics.map((d, i) => (
                <div key={i} style={styles.diagLigne}>
                  <span style={styles.diagSource}>{d.source}</span>
                  <span style={styles.diagDetail}>
                    {d.erreur || 'OK'}
                    {d.statutHttp ? ` (HTTP ${d.statutHttp})` : ''}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setDiagnosticScan(null)} style={styles.diagBoutonFermer}>
              Compris, fermer
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setScannerOuvert(true)}
        style={styles.boutonTampon}
        aria-label="Scanner un livre"
      >
        <span style={styles.boutonTamponIcone}>📷</span>
        <span className="label-mono">Scanner</span>
      </button>

      <button
        onClick={() => {
          setLivreEnEdition(null)
          setModaleOuverte(true)
        }}
        style={styles.boutonAjoutManuel}
        aria-label="Ajouter un livre manuellement"
      >
        +
      </button>

      {scannerOuvert && (
        <ScannerCodeBarres onResultat={handleCodeScanne} onFermer={() => setScannerOuvert(false)} />
      )}

      {modaleOuverte && (
        <ModaleLivre
          livreInitial={livreEnEdition}
          onEnregistrer={handleEnregistrerLivre}
          onSupprimer={handleSupprimerLivre}
          onFermer={() => {
            setModaleOuverte(false)
            setLivreEnEdition(null)
          }}
        />
      )}

      <FiltresAvances
        ouvert={filtresOuverts}
        onFermer={() => setFiltresOuverts(false)}
        genres={genresDisponibles}
        auteurs={auteursDisponibles}
        filtreGenre={filtreGenre}
        setFiltreGenre={setFiltreGenre}
        filtreAuteur={filtreAuteur}
        setFiltreAuteur={setFiltreAuteur}
        noteMin={noteMin}
        setNoteMin={setNoteMin}
        tri={tri}
        setTri={setTri}
        onReinitialiser={reinitialiserFiltres}
      />

      {recapOuvert && (
        <EcranRecap
          livres={livres}
          onFermer={() => setRecapOuvert(false)}
          onOuvrirLivre={(l) => {
            setRecapOuvert(false)
            setLivreEnEdition(l)
            setModaleOuverte(true)
          }}
        />
      )}
    </div>
  )
}

const styles = {
  page: {
    maxWidth: '720px',
    margin: '0 auto',
    width: '100%',
    padding: '24px 16px calc(120px + env(safe-area-inset-bottom))',
    flex: 1
  },
  entete: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  titrePage: {
    fontSize: '1.7rem'
  },
  compteur: {
    color: 'var(--ink-soft)',
    marginTop: '4px'
  },
  boutonDeconnexion: {
    background: 'none',
    border: '1px solid rgba(60,42,30,0.25)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.82rem',
    color: 'var(--ink-soft)'
  },
  barreRecherche: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px'
  },
  inputRecherche: {
    flex: 1,
    minWidth: 0,
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1.5px solid rgba(60,42,30,0.18)',
    background: '#FBF6EC',
    fontSize: '1rem',
    color: 'var(--ink)'
  },
  boutonIcone: {
    position: 'relative',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '1.5px solid rgba(60,42,30,0.18)',
    background: '#FBF6EC',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pastille: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: 'var(--stamp-red)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    width: '17px',
    height: '17px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filtres: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '24px'
  },
  filtreBouton: {
    padding: '7px 13px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '0.82rem',
    fontWeight: 600,
    background: 'var(--paper-dim)',
    color: 'var(--ink-soft)'
  },
  filtreBoutonActif: {
    background: 'var(--ink)',
    color: 'var(--paper)'
  },
  main: {
    minHeight: '200px'
  },
  messageEtat: {
    textAlign: 'center',
    color: 'var(--ink-soft)',
    padding: '40px 0'
  },
  vide: {
    textAlign: 'center',
    padding: '50px 20px',
    color: 'var(--ink-soft)'
  },
  videIcone: {
    fontSize: '2.5rem',
    marginBottom: '12px'
  },
  videTexte: {
    fontSize: '0.95rem',
    lineHeight: 1.5,
    maxWidth: '280px',
    margin: '0 auto'
  },
  grille: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px 16px'
  },
  toast: {
    position: 'fixed',
    bottom: 'calc(100px + env(safe-area-inset-bottom))',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--ink)',
    color: 'var(--paper)',
    padding: '12px 18px',
    borderRadius: '10px',
    fontSize: '0.88rem',
    maxWidth: '85%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-card-hover)',
    zIndex: 90,
    cursor: 'pointer'
  },
  diagOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60,42,30,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
    padding: '16px'
  },
  diagBoite: {
    background: 'var(--paper)',
    borderRadius: '14px',
    padding: '20px',
    maxWidth: '420px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-card-hover)'
  },
  diagEntete: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  diagTitre: {
    fontSize: '1.15rem'
  },
  diagFermer: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    color: 'var(--ink-soft)',
    padding: '4px 8px'
  },
  diagTexte: {
    fontSize: '0.9rem',
    color: 'var(--ink)',
    lineHeight: 1.5,
    marginBottom: '14px'
  },
  diagSousTitre: {
    fontSize: '0.78rem',
    color: 'var(--ink-soft)',
    fontWeight: 700,
    marginBottom: '8px'
  },
  diagListe: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px'
  },
  diagLigne: {
    display: 'flex',
    flexDirection: 'column',
    background: '#FBF6EC',
    border: '1px solid rgba(60,42,30,0.12)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '0.8rem'
  },
  diagSource: {
    fontWeight: 700,
    color: 'var(--ink)'
  },
  diagDetail: {
    color: 'var(--ink-soft)'
  },
  diagBoutonFermer: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--leather)',
    color: 'var(--paper)',
    fontWeight: 700
  },
  boutonTampon: {
    position: 'fixed',
    bottom: 'calc(24px + env(safe-area-inset-bottom))',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--leather)',
    color: 'var(--paper)',
    border: 'none',
    borderRadius: '50px',
    padding: '16px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: 'var(--shadow-card-hover)',
    fontSize: '0.95rem',
    fontWeight: 700
  },
  boutonTamponIcone: {
    fontSize: '1.2rem'
  },
  boutonAjoutManuel: {
    position: 'fixed',
    bottom: 'calc(30px + env(safe-area-inset-bottom))',
    right: '20px',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    border: '1.5px solid var(--leather)',
    background: 'var(--paper)',
    color: 'var(--leather)',
    fontSize: '1.5rem',
    lineHeight: 1,
    boxShadow: 'var(--shadow-card)'
  }
}
