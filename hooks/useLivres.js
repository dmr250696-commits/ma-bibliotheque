import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useLivres(accessKey) {
  const [livres, setLivres] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const chargerLivres = useCallback(async () => {
    if (!accessKey) return
    setChargement(true)
    setErreur(null)

    const { data, error } = await supabase
      .from('livres')
      .select('*')
      .eq('cle_acces', accessKey)
      .order('cree_le', { ascending: false })

    if (error) {
      setErreur(error.message)
    } else {
      setLivres(data)
    }
    setChargement(false)
  }, [accessKey])

  useEffect(() => {
    chargerLivres()
  }, [chargerLivres])

  const ajouterLivre = useCallback(
    async (livre) => {
      const { data, error } = await supabase
        .from('livres')
        .insert([{ ...livre, cle_acces: accessKey }])
        .select()
        .single()

      if (error) throw error
      setLivres((prev) => [data, ...prev])
      return data
    },
    [accessKey]
  )

  const modifierLivre = useCallback(async (id, changements) => {
    const { data, error } = await supabase
      .from('livres')
      .update(changements)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setLivres((prev) => prev.map((l) => (l.id === id ? data : l)))
    return data
  }, [])

  const supprimerLivre = useCallback(async (id) => {
    const { error } = await supabase.from('livres').delete().eq('id', id)
    if (error) throw error
    setLivres((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { livres, chargement, erreur, ajouterLivre, modifierLivre, supprimerLivre, recharger: chargerLivres }
}
