import { useState } from 'react'
import { STATUT_CONFIG, STATUT_LISTE, STATUTS } from '../lib/statuts'
import { GENRES_SUGGERES } from '../lib/genres'
import Etoiles from './Etoiles.jsx'

function dateDuJour() {
  return new Date().toISOString().slice(0, 10)
}

export default function ModaleLivre({ livreInitial, onEnregistrer, onSupprimer, onFermer }) {
  const [livre, setLivre] = useState(
    livreInitial || {
      titre: '',
      auteur: '',
      isbn: '',
      couverture: '',
      editeur: '',
      annee: '',
      genre: '',
      categories_api: '',
      prix: '',
      nb_pages: '',
      note: 0,
      date_lecture: '',
      statut: 'non_lu',
      prete_a: '',
      notes: ''
    }
  )
  const [enregistrement, setEnregistrement] = useState(false)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)
  const [genreLibre, setGenreLibre] = useState(
    livre.genre && !GENRES_SUGGERES.includes(livre.genre)
  )

  function majChamp(champ, valeur) {
    setLivre((prev) => ({ ...prev, [champ]: valeur }))
  }

  function changerStatut(nouveauStatut) {
    setLivre((prev) => {
      const maj = { ...prev, statut: nouveauStatut }
      // Quand on passe le livre en "Lu" et qu'aucune date n'est encore renseignée,
      // on pré-remplit avec la date du jour (modifiable ensuite).
      if (nouveauStatut === STATUTS.LU && !prev.date_lecture) {
        maj.date_lecture = dateDuJour()
      }
      return maj
    })
  }

  async function handleEnregistrer(e) {
    e.preventDefault()
    if (!livre.titre.trim()) return
    setEnregistrement(true)
    try {
      const aEnvoyer = {
        ...livre,
        prix: livre.prix === '' ? null : Number(livre.prix),
        nb_pages: livre.nb_pages === '' ? null : parseInt(livre.nb_pages, 10),
        note: livre.note || null,
        date_lecture: livre.date_lecture || null
      }
      await onEnregistrer(aEnvoyer)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
        <div style={styles.entete}>
          <h2 style={styles.titreModale}>{livreInitial ? 'Modifier la fiche' : 'Nouveau livre'}</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer">
            ✕
          </button>
        </div>

        <form onSubmit={handleEnregistrer} style={styles.form}>
          <div style={styles.ligne}>
            {livre.couverture ? (
              <img src={livre.couverture} alt="" style={styles.couvertureApercu} />
            ) : (
              <div style={styles.couverturePlaceholder}>📖</div>
            )}
            <div style={{ flex: 1 }}>
              <label className="label-mono" style={styles.label} htmlFor="titre">
                Titre *
              </label>
              <input
                id="titre"
                style={styles.input}
                value={livre.titre}
                onChange={(e) => majChamp('titre', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-mono" style={styles.label} htmlFor="auteur">
              Auteur
            </label>
            <input
              id="auteur"
              style={styles.input}
              value={livre.auteur}
              onChange={(e) => majChamp('auteur', e.target.value)}
            />
          </div>

          <div style={styles.deuxColonnes}>
            <div>
              <label className="label-mono" style={styles.label} htmlFor="isbn">
                ISBN
              </label>
              <input
                id="isbn"
                style={styles.input}
                value={livre.isbn || ''}
                onChange={(e) => majChamp('isbn', e.target.value)}
              />
            </div>
            <div>
              <label className="label-mono" style={styles.label} htmlFor="annee">
                Année
              </label>
              <input
                id="annee"
                style={styles.input}
                value={livre.annee || ''}
                onChange={(e) => majChamp('annee', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.deuxColonnes}>
            <div>
              <label className="label-mono" style={styles.label} htmlFor="nb_pages">
                Pages
              </label>
              <input
                id="nb_pages"
                type="number"
                inputMode="numeric"
                min="0"
                style={styles.input}
                value={livre.nb_pages ?? ''}
                onChange={(e) => majChamp('nb_pages', e.target.value)}
              />
            </div>
            <div>
              <label className="label-mono" style={styles.label} htmlFor="prix">
                Prix (€)
              </label>
              <input
                id="prix"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                style={styles.input}
                value={livre.prix ?? ''}
                onChange={(e) => majChamp('prix', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="label-mono" style={styles.label} htmlFor="genre">
              Genre
            </label>
            {!genreLibre ? (
              <select
                id="genre"
                style={styles.input}
                value={GENRES_SUGGERES.includes(livre.genre) ? livre.genre : ''}
                onChange={(e) => {
                  if (e.target.value === '__autre__') {
                    setGenreLibre(true)
                    majChamp('genre', '')
                  } else {
                    majChamp('genre', e.target.value)
                  }
                }}
              >
                <option value="" disabled>
                  Choisir un genre…
                </option>
                {GENRES_SUGGERES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__autre__">Autre (préciser)…</option>
              </select>
            ) : (
              <div style={styles.genreLibreLigne}>
                <input
                  style={styles.input}
                  value={livre.genre || ''}
                  onChange={(e) => majChamp('genre', e.target.value)}
                  placeholder="Saisis le genre"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setGenreLibre(false)}
                  style={styles.boutonLienDiscret}
                >
                  Choisir dans la liste
                </button>
              </div>
            )}
            {livre.categories_api && livre.categories_api !== livre.genre && (
              <button
                type="button"
                onClick={() => {
                  majChamp('genre', livre.categories_api)
                  setGenreLibre(!GENRES_SUGGERES.includes(livre.categories_api))
                }}
                style={styles.suggestionGenre}
              >
                Suggestion : {livre.categories_api}
              </button>
            )}
          </div>

          <div>
            <label className="label-mono" style={styles.label}>
              Ma note
            </label>
            <div style={styles.etoilesLigne}>
              <Etoiles note={livre.note || 0} onChange={(n) => majChamp('note', n)} taille={28} />
              {livre.note > 0 && (
                <button
                  type="button"
                  onClick={() => majChamp('note', 0)}
                  style={styles.boutonLienDiscret}
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label-mono" style={styles.label}>
              Statut
            </label>
            <div style={styles.statutsGrille}>
              {STATUT_LISTE.map((s) => {
                const cfg = STATUT_CONFIG[s]
                const actif = livre.statut === s
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => changerStatut(s)}
                    style={{
                      ...styles.statutBouton,
                      background: actif ? cfg.couleur : cfg.fond,
                      color: actif ? '#fff' : cfg.couleur,
                      borderColor: cfg.couleur
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {livre.statut === STATUTS.PRETE && (
            <div>
              <label className="label-mono" style={styles.label} htmlFor="prete_a">
                Prêté à
              </label>
              <input
                id="prete_a"
                style={styles.input}
                value={livre.prete_a || ''}
                onChange={(e) => majChamp('prete_a', e.target.value)}
                placeholder="Nom de la personne"
              />
            </div>
          )}

          {livre.statut === STATUTS.LU && (
            <div>
              <label className="label-mono" style={styles.label} htmlFor="date_lecture">
                Date de lecture
              </label>
              <input
                id="date_lecture"
                type="date"
                style={styles.input}
                value={livre.date_lecture || ''}
                onChange={(e) => majChamp('date_lecture', e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="label-mono" style={styles.label} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
              value={livre.notes || ''}
              onChange={(e) => majChamp('notes', e.target.value)}
              placeholder="Dédicace, édition particulière, avis personnel…"
            />
          </div>

          <div style={styles.actions}>
            {livreInitial && (
              <>
                {!confirmerSuppression ? (
                  <button
                    type="button"
                    onClick={() => setConfirmerSuppression(true)}
                    style={styles.boutonSupprimer}
                  >
                    Retirer ce livre
                  </button>
                ) : (
                  <div style={styles.confirmBox}>
                    <span>Retirer définitivement ?</span>
                    <button
                      type="button"
                      onClick={() => onSupprimer(livre.id)}
                      style={styles.boutonConfirmerSuppression}
                    >
                      Oui, retirer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmerSuppression(false)}
                      style={styles.boutonAnnuler}
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </>
            )}
            <button type="submit" style={styles.boutonEnregistrer} disabled={enregistrement}>
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
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
  titreModale: {
    fontSize: '1.3rem'
  },
  fermer: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    color: 'var(--ink-soft)',
    padding: '4px 8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  ligne: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  couvertureApercu: {
    width: '56px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '4px',
    flexShrink: 0
  },
  couverturePlaceholder: {
    width: '56px',
    height: '80px',
    background: 'var(--paper-dim)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    flexShrink: 0
  },
  deuxColonnes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
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
  genreLibreLigne: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  etoilesLigne: {
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
    padding: '4px 0',
    textAlign: 'left',
    textDecoration: 'underline'
  },
  suggestionGenre: {
    marginTop: '6px',
    background: 'var(--sage-bg)',
    border: 'none',
    color: 'var(--sage)',
    fontSize: '0.78rem',
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: '6px',
    textAlign: 'left',
    alignSelf: 'flex-start'
  },
  statutsGrille: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  statutBouton: {
    padding: '8px 14px',
    borderRadius: '20px',
    border: '1.5px solid',
    fontSize: '0.85rem',
    fontWeight: 600
  },
  actions: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  boutonEnregistrer: {
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--leather)',
    color: 'var(--paper)',
    fontWeight: 700,
    fontSize: '1rem'
  },
  boutonSupprimer: {
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid var(--stamp-red)',
    background: 'transparent',
    color: 'var(--stamp-red)',
    fontWeight: 600,
    fontSize: '0.9rem'
  },
  confirmBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    fontSize: '0.88rem',
    background: 'var(--stamp-red-bg)',
    padding: '10px',
    borderRadius: '8px'
  },
  boutonConfirmerSuppression: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--stamp-red)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.82rem'
  },
  boutonAnnuler: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--ink-soft)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontSize: '0.82rem'
  }
}
