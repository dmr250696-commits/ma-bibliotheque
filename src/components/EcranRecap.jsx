import { useMemo, useState } from 'react'
import { recapMensuel, recapAnnuel, anneesDisponibles, NOMS_MOIS } from '../lib/recaps'
import Etoiles from './Etoiles.jsx'

export default function EcranRecap({ livres, onFermer, onOuvrirLivre }) {
  const [mode, setMode] = useState('mensuel') // 'mensuel' | 'annuel'
  const maintenant = new Date()
  const [annee, setAnnee] = useState(maintenant.getFullYear())
  const [mois, setMois] = useState(maintenant.getMonth() + 1)

  const annees = useMemo(() => anneesDisponibles(livres), [livres])

  const recap = useMemo(() => {
    return mode === 'mensuel' ? recapMensuel(livres, annee, mois) : recapAnnuel(livres, annee)
  }, [mode, livres, annee, mois])

  function changerMois(delta) {
    let m = mois + delta
    let a = annee
    if (m > 12) {
      m = 1
      a += 1
    } else if (m < 1) {
      m = 12
      a -= 1
    }
    setMois(m)
    setAnnee(a)
  }

  return (
    <div style={styles.overlay} onClick={onFermer}>
      <div style={styles.boite} onClick={(e) => e.stopPropagation()}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>📊 Récapitulatif de lecture</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={styles.bascule}>
          <button
            onClick={() => setMode('mensuel')}
            style={{ ...styles.basculeBouton, ...(mode === 'mensuel' ? styles.basculeBoutonActif : {}) }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setMode('annuel')}
            style={{ ...styles.basculeBouton, ...(mode === 'annuel' ? styles.basculeBoutonActif : {}) }}
          >
            Annuel
          </button>
        </div>

        {mode === 'mensuel' ? (
          <div style={styles.navPeriode}>
            <button onClick={() => changerMois(-1)} style={styles.navBouton} aria-label="Mois précédent">
              ‹
            </button>
            <span style={styles.periodeLabel}>
              {NOMS_MOIS[mois - 1]} {annee}
            </span>
            <button onClick={() => changerMois(1)} style={styles.navBouton} aria-label="Mois suivant">
              ›
            </button>
          </div>
        ) : (
          <div style={styles.navPeriode}>
            <select
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              style={styles.selectAnnee}
            >
              {annees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        {recap.nombreLivres === 0 ? (
          <div style={styles.vide}>
            <p style={styles.videIcone}>🗂️</p>
            <p>Aucun livre marqué "Lu" avec une date sur cette période.</p>
          </div>
        ) : (
          <>
            <div style={styles.statsGrille}>
              <StatCarte valeur={recap.nombreLivres} label={recap.nombreLivres > 1 ? 'livres lus' : 'livre lu'} />
              <StatCarte valeur={recap.totalPages.toLocaleString('fr-FR')} label="pages" />
              {recap.noteMoyenne !== null && (
                <StatCarte
                  valeur={recap.noteMoyenne.toFixed(1)}
                  label="note moyenne"
                  icone={<Etoiles note={recap.noteMoyenne} lectureSeule taille={14} />}
                />
              )}
              {mode === 'annuel' && recap.totalDepense > 0 && (
                <StatCarte valeur={`${recap.totalDepense.toFixed(0)} €`} label="dépensés" />
              )}
            </div>

            {recap.genresPreferes.length > 0 && (
              <Section titre="Genres du moment">
                <div style={styles.tagsLigne}>
                  {recap.genresPreferes.map(([genre, n]) => (
                    <span key={genre} style={styles.tag}>
                      {genre} <span style={styles.tagCompteur}>×{n}</span>
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {mode === 'annuel' && recap.auteursPreferes.length > 0 && (
              <Section titre="Auteurs les plus lus">
                <div style={styles.tagsLigne}>
                  {recap.auteursPreferes.map(([auteur, n]) => (
                    <span key={auteur} style={styles.tag}>
                      {auteur} <span style={styles.tagCompteur}>×{n}</span>
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {mode === 'annuel' && recap.meilleursLivres.length > 0 && (
              <Section titre="Coups de cœur de l'année">
                <div style={styles.listeLivres}>
                  {recap.meilleursLivres.map((l) => (
                    <LigneLivre key={l.id} livre={l} onClick={() => onOuvrirLivre?.(l)} />
                  ))}
                </div>
              </Section>
            )}

            <Section titre={mode === 'mensuel' ? 'Livres du mois' : 'Tous les livres lus'}>
              <div style={styles.listeLivres}>
                {recap.livres.map((l) => (
                  <LigneLivre key={l.id} livre={l} onClick={() => onOuvrirLivre?.(l)} />
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function StatCarte({ valeur, label, icone }) {
  return (
    <div style={styles.statCarte}>
      <p style={styles.statValeur}>{valeur}</p>
      <p className="label-mono" style={styles.statLabel}>
        {label}
      </p>
      {icone}
    </div>
  )
}

function Section({ titre, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitre}>{titre}</h3>
      {children}
    </div>
  )
}

function LigneLivre({ livre, onClick }) {
  return (
    <button onClick={onClick} style={styles.ligneLivre}>
      {livre.couverture ? (
        <img src={livre.couverture} alt="" style={styles.ligneCouverture} />
      ) : (
        <div style={styles.ligneCouverturePlaceholder}>📖</div>
      )}
      <div style={styles.ligneInfos}>
        <p style={styles.ligneTitre}>{livre.titre}</p>
        <p style={styles.ligneAuteur}>{livre.auteur}</p>
        {livre.note > 0 && <Etoiles note={livre.note} lectureSeule taille={12} />}
      </div>
    </button>
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
    maxWidth: '480px',
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
  bascule: {
    display: 'flex',
    background: 'var(--paper-dim)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '16px'
  },
  basculeBouton: {
    flex: 1,
    padding: '9px',
    border: 'none',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontWeight: 600,
    fontSize: '0.9rem',
    borderRadius: '8px'
  },
  basculeBoutonActif: {
    background: 'var(--leather)',
    color: 'var(--paper)'
  },
  navPeriode: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  navBouton: {
    background: 'var(--paper-dim)',
    border: 'none',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    fontSize: '1.2rem',
    color: 'var(--ink)',
    lineHeight: 1
  },
  periodeLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    minWidth: '140px',
    textAlign: 'center'
  },
  selectAnnee: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1.5px solid rgba(60,42,30,0.2)',
    background: '#FBF6EC',
    fontSize: '1rem',
    fontFamily: 'var(--font-display)'
  },
  vide: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--ink-soft)',
    lineHeight: 1.5
  },
  videIcone: {
    fontSize: '2.2rem',
    marginBottom: '10px'
  },
  statsGrille: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
    marginBottom: '20px'
  },
  statCarte: {
    background: '#FBF6EC',
    border: '1px solid rgba(60,42,30,0.12)',
    borderRadius: '10px',
    padding: '14px 10px',
    textAlign: 'center'
  },
  statValeur: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--leather)',
    marginBottom: '2px'
  },
  statLabel: {
    color: 'var(--ink-soft)',
    fontSize: '0.65rem'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitre: {
    fontSize: '0.95rem',
    marginBottom: '10px',
    color: 'var(--ink-soft)',
    fontFamily: 'var(--font-body)',
    fontWeight: 700
  },
  tagsLigne: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    background: 'var(--sage-bg)',
    color: 'var(--sage)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.82rem',
    fontWeight: 600
  },
  tagCompteur: {
    opacity: 0.7
  },
  listeLivres: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  ligneLivre: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: '#FBF6EC',
    border: '1px solid rgba(60,42,30,0.1)',
    borderRadius: '8px',
    padding: '8px',
    textAlign: 'left'
  },
  ligneCouverture: {
    width: '36px',
    height: '52px',
    objectFit: 'cover',
    borderRadius: '3px',
    flexShrink: 0
  },
  ligneCouverturePlaceholder: {
    width: '36px',
    height: '52px',
    background: 'var(--paper-dim)',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  ligneInfos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  ligneTitre: {
    fontSize: '0.88rem',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  ligneAuteur: {
    fontSize: '0.78rem',
    color: 'var(--ink-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
}
