import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export function useTrustScore(userId) {
  const [score, setScore] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    let timer = null
    let isMounted = true

    async function load() {
      setIsLoading(true)
      try {
        const { data } = await api.get(`/api/trust-score/${userId}`)
        if (isMounted) setScore(data)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()
    timer = setInterval(load, 6000)

    return () => {
      isMounted = false
      if (timer) clearInterval(timer)
    }
  }, [userId])

  return { score, isLoading }
}

