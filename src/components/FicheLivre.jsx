import { STATUT_CONFIG } from '../lib/statuts'
import Etoiles from './Etoiles.jsx'

export default function FicheLivre({ livre, onOuvrir, rotation }) {
  const statut = STATUT_CONFIG[livre.statut] || STATUT_CONFIG.non_lu

  return (
    <button
      onClick={() => onOuvrir(livre)}
      style={{ ...styles.fiche, transform: `rotate(${rotation}deg)` }}
      className="fiche-livre"
    >
      <div style={styles.trou} aria-hidden="true" />

      <div style={styles.contenu}>
        <div style={styles.couvertureWrap}>
          {livre.couverture ? (
            <img src={livre.couverture} alt="" style={styles.couverture} />
          ) : (
            <div style={styles.couverturePlaceholder} aria-hidden="true">
              📖
            </div>
          )}
        </div>

        <div style={styles.infos}>
          <h3 style={styles.titreLivre}>{livre.titre}</h3>
          <p style={styles.auteur}>{livre.auteur}</p>

          <span
            className="label-mono"
            style={{ ...styles.badge, color: statut.couleur, background: statut.fond }}
          >
            {statut.label}
          </span>

          {livre.genre && <p style={styles.genre}>{livre.genre}</p>}

          {livre.note > 0 && (
            <div style={styles.noteLigne}>
              <Etoiles note={livre.note} lectureSeule taille={13} />
            </div>
          )}

          {livre.statut === 'prete' && livre.prete_a && (
            <p style={styles.preteA}>à {livre.prete_a}</p>
          )}
        </div>
      </div>

      <style>{`
        .fiche-livre {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .fiche-livre:hover {
          transform: rotate(0deg) translateY(-3px) !important;
          box-shadow: var(--shadow-card-hover);
        }
      `}</style>
    </button>
  )
}

const styles = {
  fiche: {
    position: 'relative',
    textAlign: 'left',
    background: '#FBF6EC',
    border: '1px solid rgba(60,42,30,0.14)',
    borderRadius: '6px',
    padding: '18px 14px 14px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-card)',
    width: '100%',
    fontFamily: 'var(--font-body)'
  },
  trou: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--paper)',
    boxShadow: 'inset 0 1px 3px rgba(60,42,30,0.3)'
  },
  contenu: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  couvertureWrap: {
    flexShrink: 0,
    width: '64px',
    height: '92px',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(60,42,30,0.25)'
  },
  couverture: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  couverturePlaceholder: {
    width: '100%',
    height: '100%',
    background: 'var(--paper-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem'
  },
  infos: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  titreLivre: {
    fontSize: '1rem',
    lineHeight: 1.25,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  auteur: {
    fontSize: '0.82rem',
    color: 'var(--ink-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  badge: {
    alignSelf: 'flex-start',
    padding: '3px 8px',
    borderRadius: '4px',
    marginTop: '4px'
  },
  preteA: {
    fontSize: '0.78rem',
    color: 'var(--stamp-red)',
    fontStyle: 'italic'
  },
  genre: {
    fontSize: '0.76rem',
    color: 'var(--ink-soft)'
  },
  noteLigne: {
    marginTop: '2px'
  }
}
