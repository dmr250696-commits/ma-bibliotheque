export const STATUTS = {
  NON_LU: 'non_lu',
  LU: 'lu',
  PRETE: 'prete',
  SOUHAIT: 'souhait',
  DEDICACE: 'dedicace'
}

export const STATUT_CONFIG = {
  [STATUTS.NON_LU]: { label: 'À lire', couleur: '#6B5440', fond: '#E8DCC6' },
  [STATUTS.LU]: { label: 'Lu', couleur: '#5C7A5C', fond: '#E3E9DD' },
  [STATUTS.PRETE]: { label: 'Prêté', couleur: '#B0413E', fond: '#F3DEDC' },
  [STATUTS.SOUHAIT]: { label: 'Souhait', couleur: '#C9A35C', fond: '#F5EBD8' },
  [STATUTS.DEDICACE]: { label: 'Dédicacé', couleur: '#8B4513', fond: '#EAD9C4' }
}

export const STATUT_LISTE = Object.values(STATUTS)
