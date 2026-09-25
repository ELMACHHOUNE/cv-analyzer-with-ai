import { useCallback, useEffect, useState } from 'react'

export function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}

export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  const onOpen = useCallback(() => setIsOpen(true), [])
  const onClose = useCallback(() => setIsOpen(false), [])
  const onToggle = useCallback(() => setIsOpen((currentState) => !currentState), [])
  return { isOpen, onOpen, onClose, onToggle, setIsOpen }
}
