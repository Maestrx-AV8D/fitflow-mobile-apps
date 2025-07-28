import { useEffect, useState } from "react"
import { supabase } from "../lib/api"

export const useIsPremium = () => {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from('is_premium').select('is_premium').maybeSingle()
      setIsPremium(data?.is_premium ?? false)
    }
    check()
  }, [])

  return isPremium
}
