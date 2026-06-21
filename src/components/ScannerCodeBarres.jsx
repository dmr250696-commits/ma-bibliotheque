import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const SCANNER_ID = 'lecteur-code-barres'

export default function ScannerCodeBarres({ onResultat, onFermer }) {
  const scannerRef = useRef(null)
  const [erreur, setErreur] = useState(null)
  const [demarre, setDemarre] = useState(false)

  useEffect(() => {
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

    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 140 },
          formatsToSupport: [
            // formats courants pour les codes-barres de livres (ISBN)
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        },
        (texteDecode) => {
          onResultat(texteDecode)
        },
        () => {
          // erreurs de frame ignorées, c'est normal en continu
        }
      )
      .then(() => setDemarre(true))
      .catch((err) => {
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
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {})
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

        <p style={styles.consigne}>Vise le code-barres au dos du livre (zone ISBN).</p>

        <div id={SCANNER_ID} style={styles.zoneCamera} />

        {!demarre && !erreur && <p style={styles.statut}>Démarrage de la caméra…</p>}

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
  zoneCamera: {
    borderRadius: '10px',
    overflow: 'hidden',
    minHeight: '240px',
    background: '#000'
  },
  statut: {
    textAlign: 'center',
    marginTop: '12px',
    color: 'var(--ink-soft)',
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
  }
}
