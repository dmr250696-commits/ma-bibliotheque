import { useState } from 'react'

export default function EcranAcces({ onValider }) {
  const [valeur, setValeur] = useState('')
  const [enCours, setEnCours] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!valeur.trim()) return
    setEnCours(true)
    onValider(valeur.trim())
  }

  return (
    <div style={styles.page}>
      <div style={styles.carte}>
        <div style={styles.tampon} aria-hidden="true">📚</div>
        <h1 style={styles.titre}>Ma Bibliothèque</h1>
        <p style={styles.sousTitre}>Entre ta clé d'accès personnelle pour ouvrir ton catalogue.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="cle" className="label-mono" style={styles.label}>
            Clé d'accès
          </label>
          <input
            id="cle"
            type="password"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            autoFocus
            autoComplete="off"
          />
          <button type="submit" style={styles.bouton} disabled={enCours}>
            {enCours ? 'Ouverture…' : 'Ouvrir ma bibliothèque'}
          </button>
        </form>

        <p style={styles.aide}>
          Première visite ? Choisis n'importe quelle clé mémorisable — elle servira à retrouver
          tes livres à chaque fois, sur tous tes appareils.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  carte: {
    background: 'var(--paper-dim)',
    border: '1px solid rgba(60,42,30,0.12)',
    borderRadius: '12px',
    padding: '40px 32px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: 'var(--shadow-card)',
    textAlign: 'center'
  },
  tampon: {
    fontSize: '2.5rem',
    marginBottom: '12px'
  },
  titre: {
    fontSize: '1.8rem',
    marginBottom: '8px'
  },
  sousTitre: {
    color: 'var(--ink-soft)',
    fontSize: '0.95rem',
    marginBottom: '28px',
    lineHeight: 1.5
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left'
  },
  label: {
    color: 'var(--ink-soft)'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1.5px solid rgba(60,42,30,0.2)',
    background: 'var(--paper)',
    fontSize: '1rem',
    color: 'var(--ink)'
  },
  bouton: {
    marginTop: '12px',
    padding: '13px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--leather)',
    color: 'var(--paper)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'background 0.15s ease'
  },
  aide: {
    marginTop: '24px',
    fontSize: '0.8rem',
    color: 'var(--ink-soft)',
    lineHeight: 1.5
  }
}
