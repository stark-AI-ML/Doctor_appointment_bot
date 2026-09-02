import { useState, useEffect } from 'react'

/**
 * Debounce hook — delays value updates for search inputs.
 * Prevents API calls on every keystroke.
 * 
 * Usage: const debouncedSearch = useDebounce(searchTerm, 400)
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
