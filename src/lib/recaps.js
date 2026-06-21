// Calculs des récapitulatifs de lecture à partir de la liste de livres.
// Un livre compte dans un récap s'il a le statut "lu" ET une date_lecture
// qui tombe dans la période concernée.

import { STATUTS } from './statuts'

function livresLusAvecDate(livres) {
  return livres.filter((l) => l.statut === STATUTS.LU && l.date_lecture)
}

function moyenne(nombres) {
  const valides = nombres.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (valides.length === 0) return null
  return valides.reduce((a, b) => a + b, 0) / valides.length
}

function compterParCle(livres, cle) {
  const compteur = {}
  for (const l of livres) {
    const valeur = l[cle]
    if (!valeur) continue
    compteur[valeur] = (compteur[valeur] || 0) + 1
  }
  return Object.entries(compteur).sort((a, b) => b[1] - a[1])
}

export function recapMensuel(livres, annee, mois) {
  // mois : 1-12
  const lus = livresLusAvecDate(livres).filter((l) => {
    const d = new Date(l.date_lecture)
    return d.getFullYear() === annee && d.getMonth() + 1 === mois
  })

  return {
    annee,
    mois,
    livres: lus,
    nombreLivres: lus.length,
    totalPages: lus.reduce((acc, l) => acc + (l.nb_pages || 0), 0),
    noteMoyenne: moyenne(lus.map((l) => l.note)),
    genresPreferes: compterParCle(lus, 'genre').slice(0, 3)
  }
}

export function recapAnnuel(livres, annee) {
  const lus = livresLusAvecDate(livres).filter((l) => new Date(l.date_lecture).getFullYear() === annee)

  const parMois = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const livresDuMois = lus.filter((l) => new Date(l.date_lecture).getMonth() + 1 === m)
    return { mois: m, nombreLivres: livresDuMois.length }
  })

  const meilleursLivres = [...lus]
    .filter((l) => l.note > 0)
    .sort((a, b) => b.note - a.note)
    .slice(0, 5)

  return {
    annee,
    livres: lus,
    nombreLivres: lus.length,
    totalPages: lus.reduce((acc, l) => acc + (l.nb_pages || 0), 0),
    totalDepense: lus.reduce((acc, l) => acc + (Number(l.prix) || 0), 0),
    noteMoyenne: moyenne(lus.map((l) => l.note)),
    genresPreferes: compterParCle(lus, 'genre'),
    auteursPreferes: compterParCle(lus, 'auteur').slice(0, 5),
    meilleursLivres,
    parMois
  }
}

export function anneesDisponibles(livres) {
  const annees = new Set(
    livresLusAvecDate(livres).map((l) => new Date(l.date_lecture).getFullYear())
  )
  annees.add(new Date().getFullYear())
  return Array.from(annees).sort((a, b) => b - a)
}

export const NOMS_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
