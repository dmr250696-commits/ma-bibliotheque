import Etoiles from './Etoiles.jsx'

export default function FiltresAvances({
  ouvert,
  onFermer,
  genres,
  auteurs,
  filtreGenre,
  setFiltreGenre,
  filtreAuteur,
  setFiltreAuteur,
  noteMin,
  setNoteMin,
  tri,
  setTri,
  onReinitialiser
}) {
  if (!ouvert) return null

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>Filtrer & trier</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={styles.champ}>
          <label className="label-mono" style={styles.label} htmlFor="filtre-genre">
            Genre
          </label>
          <select
            id="filtre-genre"
            style={styles.input}
            value={filtreGenre || ''}
            onChange={(e) => setFiltreGenre(e.target.value || null)}
          >
            <option value="">Tous les genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.champ}>
          <label className="label-mono" style={styles.label} htmlFor="filtre-auteur">
            Auteur
          </label>
          <select
            id="filtre-auteur"
            style={styles.input}
            value={filtreAuteur || ''}
            onChange={(e) => setFiltreAuteur(e.target.value || null)}
          >
            <option value="">Tous les auteurs</option>
            {auteurs.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.champ}>
          <label className="label-mono" style={styles.label}>
            Note minimale
          </label>
          <div style={styles.noteLigne}>
            <Etoiles note={noteMin} onChange={setNoteMin} taille={24} />
            {noteMin > 0 && (
              <button onClick={() => setNoteMin(0)} style={styles.boutonLienDiscret}>
                Effacer
              </button>
            )}
          </div>
        </div>

        <div style={styles.champ}>
          <label className="label-mono" style={styles.label} htmlFor="tri">
            Trier par
          </label>
          <select id="tri" style={styles.input} value={tri} onChange={(e) => setTri(e.target.value)}>
            <option value="recent">Ajout récent</option>
            <option value="titre">Titre (A → Z)</option>
            <option value="auteur">Auteur (A → Z)</option>
            <option value="note">Meilleure note</option>
            <option value="date_lecture">Date de lecture récente</option>
          </select>
        </div>

        <div style={styles.actions}>
          <button onClick={onReinitialiser} style={styles.boutonReinit}>
            Réinitialiser
          </button>
          <button onClick={onFermer} style={styles.boutonAppliquer}>
            Voir les résultats
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60,42,30,0.6)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 100
  },
  boite: {
    background: 'var(--paper)',
    borderRadius: '16px 16px 0 0',
    padding: '20px',
    maxWidth: '460px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'env(safe-area-inset-bottom)',
    boxShadow: 'var(--shadow-card-hover)'
  },
  entete: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  titre: {
    fontSize: '1.25rem'
  },
  fermer: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    color: 'var(--ink-soft)',
    padding: '4px 8px'
  },
  champ: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: 'var(--ink-soft)'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid rgba(60,42,30,0.2)',
    background: '#FBF6EC',
    fontSize: '1rem',
    color: 'var(--ink)'
  },
  noteLigne: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  boutonLienDiscret: {
    background: 'none',
    border: 'none',
    color: 'var(--leather)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textDecoration: 'underline'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px'
  },
  boutonReinit: {
    flex: 1,
    padding: '13px',
    borderRadius: '8px',
    border: '1.5px solid rgba(60,42,30,0.25)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontWeight: 600
  },
  boutonAppliquer: {
    flex: 2,
    padding: '13px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--leather)',
    color: 'var(--paper)',
    fontWeight: 700
  }
}
