import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library'

export default function ScannerCodeBarres({ onResultat, onFermer }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const readerRef = useRef(null)
  const streamRef = useRef(null)
  const [erreur, setErreur] = useState(null)
  const [demarre, setDemarre] = useState(false)

  // iOS Safari ne permet pas de piloter le focus directement via l'API web.
  // Ce contournement, largement utilisé en pratique, force la piste vidéo à
  // se réinitialiser légèrement (changement mineur de résolution), ce qui
  // pousse le système caméra natif à refaire le point automatiquement.
  async function redeclencherFocus() {
    const track = streamRef.current?.getVideoTracks?.()[0]
    if (!track) return
    try {
      const reglages = track.getSettings?.() || {}
      const largeurActuelle = reglages.width || 1280
      await track.applyConstraints({ width: { ideal: largeurActuelle - 1 } })
      await track.applyConstraints({ width: { ideal: largeurActuelle } })
    } catch (e) {
      // Pas grave si ça échoue : c'est un simple coup de pouce, pas une fonctionnalité critique.
      console.warn('Re-déclenchement du focus impossible', e)
    }
  }

  useEffect(() => {
    let annule = false

    // Sur iOS Safari, getUserMedia exige un contexte sécurisé (HTTPS, ou
    // localhost en développement). GitHub Pages sert toujours en HTTPS,
    // donc ce cas ne devrait survenir qu'en test local via une IP locale.
    if (!window.isSecureContext) {
      setErreur(
        "La caméra nécessite une connexion sécurisée (HTTPS). Si tu testes en local, utilise localhost plutôt qu'une adresse IP, ou saisis l'ISBN manuellement."
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErreur(
        "Ton navigateur ne permet pas d'accéder à la caméra ici. Sur iPhone, utilise Safari plutôt qu'une appli tierce, ou saisis l'ISBN manuellement."
      )
      return
    }

    // On limite les formats aux codes-barres de livres pour de meilleures
    // performances et moins de faux positifs.
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)

    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    reader
      .decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        videoRef.current,
        (resultat, erreurDecodage) => {
          if (annule) return
          if (resultat) {
            onResultat(resultat.getText())
            return
          }
          // NotFoundException est normal à chaque frame sans code détecté :
          // on l'ignore silencieusement et on continue de scanner.
          if (erreurDecodage && !(erreurDecodage instanceof NotFoundException)) {
            console.warn('Erreur de décodage ignorée :', erreurDecodage)
          }
        }
      )
      .then((controls) => {
        if (annule) {
          try {
            controls.stop()
          } catch (e) {
            // déjà arrêté, rien à faire
          }
          return
        }
        controlsRef.current = controls
        streamRef.current = videoRef.current?.srcObject || null
        setDemarre(true)
      })
      .catch((err) => {
        if (annule) return
        const nom = err?.name || ''
        if (nom === 'NotAllowedError' || nom === 'PermissionDeniedError') {
          setErreur(
            "L'accès à la caméra a été refusé. Sur iPhone : Réglages → Safari → Caméra → Autoriser, puis recharge la page."
          )
        } else if (nom === 'NotFoundError' || nom === 'OverconstrainedError') {
          setErreur("Aucune caméra arrière détectée sur cet appareil. Saisis l'ISBN manuellement.")
        } else if (nom === 'NotReadableError') {
          setErreur(
            "La caméra est déjà utilisée par une autre appli. Ferme les autres apps utilisant la caméra et réessaie."
          )
        } else {
          setErreur(
            "Impossible d'accéder à la caméra. Vérifie que tu as autorisé l'accès, ou saisis l'ISBN manuellement."
          )
        }
        console.error(err)
      })

    return () => {
      annule = true
      if (controlsRef.current) {
        try {
          controlsRef.current.stop()
        } catch (e) {
          // déjà arrêté, rien à faire
        }
      }
      if (readerRef.current?.reset) {
        try {
          readerRef.current.reset()
        } catch (e) {
          // déjà réinitialisé, rien à faire
        }
      }
    }
  }, [onResultat])

  return (
    <div style={styles.overlay}>
      <div style={styles.boite}>
        <div style={styles.entete}>
          <h2 style={styles.titre}>Scanner un livre</h2>
          <button onClick={onFermer} style={styles.fermer} aria-label="Fermer le scanner">
            ✕
          </button>
        </div>

        <p style={styles.consigne}>Vise le code-barres au dos du livre (zone ISBN), à environ 10-15 cm.</p>

        <div style={styles.zoneCameraWrapper} onClick={redeclencherFocus}>
          <video ref={videoRef} style={styles.video} muted playsInline autoPlay />
          {demarre && (
            <div style={styles.guideOverlay} aria-hidden="true">
              <div style={styles.guideCadre} />
            </div>
          )}
          {!demarre && !erreur && (
            <div style={styles.statutOverlay}>
              <p style={styles.statut}>Démarrage de la caméra…</p>
            </div>
          )}
        </div>

        {demarre && (
          <button type="button" onClick={redeclencherFocus} style={styles.boutonFocus}>
            🔄 Image floue ? Touche ici pour refaire le point
          </button>
        )}

        {erreur && (
          <div style={styles.erreurBox}>
            <p>{erreur}</p>
            <button onClick={onFermer} style={styles.boutonSecondaire}>
              Saisir l'ISBN à la main
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(60,42,30,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px'
  },
  boite: {
    background: 'var(--paper)',
    borderRadius: '14px',
    padding: '20px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: 'var(--shadow-card-hover)'
  },
  entete: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  titre: {
    fontSize: '1.3rem'
  },
  fermer: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    color: 'var(--ink-soft)',
    lineHeight: 1,
    padding: '4px 8px'
  },
  consigne: {
    color: 'var(--ink-soft)',
    fontSize: '0.9rem',
    marginBottom: '14px'
  },
  zoneCameraWrapper: {
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    minHeight: '240px',
    background: '#000',
    cursor: 'pointer'
  },
  video: {
    width: '100%',
    height: '100%',
    minHeight: '240px',
    objectFit: 'cover',
    display: 'block'
  },
  guideOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  guideCadre: {
    width: '75%',
    height: '28%',
    border: '2.5px solid rgba(242, 233, 216, 0.85)',
    borderRadius: '8px',
    boxShadow: '0 0 0 999px rgba(0,0,0,0.25)'
  },
  statutOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statut: {
    color: 'var(--paper)',
    fontSize: '0.9rem'
  },
  erreurBox: {
    marginTop: '14px',
    padding: '14px',
    background: 'var(--stamp-red-bg)',
    borderRadius: '8px',
    color: 'var(--ink)',
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  boutonSecondaire: {
    marginTop: '10px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1.5px solid var(--leather)',
    background: 'transparent',
    color: 'var(--leather)',
    fontWeight: 600
  },
  boutonFocus: {
    width: '100%',
    marginTop: '10px',
    padding: '11px',
    borderRadius: '8px',
    border: '1px solid rgba(60,42,30,0.18)',
    background: 'var(--paper-dim)',
    color: 'var(--ink-soft)',
    fontSize: '0.85rem',
    fontWeight: 600
  }
}
