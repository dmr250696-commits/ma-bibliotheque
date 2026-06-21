import { useState } from 'react'

// Affiche 5 étoiles. En mode lecture seule : affiche la note (avec demis).
// En mode interactif : clic sur la moitié gauche/droite d'une étoile = 0.5 ou 1 point.
export default function Etoiles({ note = 0, onChange, taille = 22, lectureSeule = false }) {
  const [survol, setSurvol] = useState(null)
  const valeurAffichee = survol !== null ? survol : note || 0

  function gererClic(e, indexEtoile) {
    if (lectureSeule || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clicSurMoitieGauche = e.clientX - rect.left < rect.width / 2
    const nouvelleValeur = indexEtoile + (clicSurMoitieGauche ? 0.5 : 1)
    onChange(nouvelleValeur === note ? 0 : nouvelleValeur)
  }

  function gererSurvol(e, indexEtoile) {
    if (lectureSeule) return
    const rect = e.currentTarget.getBoundingClientRect()
    const surMoitieGauche = e.clientX - rect.left < rect.width / 2
    setSurvol(indexEtoile + (surMoitieGauche ? 0.5 : 1))
  }

  return (
    <div
      style={{ display: 'inline-flex', gap: '2px', cursor: lectureSeule ? 'default' : 'pointer' }}
      onMouseLeave={() => setSurvol(null)}
      role={lectureSeule ? 'img' : 'slider'}
      aria-label={`Note : ${note || 0} sur 5 étoiles`}
      aria-valuenow={lectureSeule ? undefined : note || 0}
      aria-valuemin={lectureSeule ? undefined : 0}
      aria-valuemax={lectureSeule ? undefined : 5}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const remplissage = Math.max(0, Math.min(1, valeurAffichee - i)) * 100
        return (
          <span
            key={i}
            onMouseMove={(e) => gererSurvol(e, i)}
            onClick={(e) => gererClic(e, i)}
            style={{ position: 'relative', width: taille, height: taille, display: 'inline-block' }}
          >
            <EtoileSvg taille={taille} couleur="#D9CBB0" />
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${remplissage}%`,
                overflow: 'hidden',
                height: '100%'
              }}
            >
              <EtoileSvg taille={taille} couleur="#C9A35C" />
            </span>
          </span>
        )
      })}
    </div>
  )
}

function EtoileSvg({ taille, couleur }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill={couleur} aria-hidden="true">
      <path d="M12 2.5l2.95 6.46 6.97.77-5.2 4.85 1.45 6.92L12 17.97l-6.17 3.53 1.45-6.92-5.2-4.85 6.97-.77z" />
    </svg>
  )
}
