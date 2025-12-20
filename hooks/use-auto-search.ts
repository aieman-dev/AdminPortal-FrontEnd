"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

export function useAutoSearch(onSearch: (query: string) => void) {
  const searchParams = useSearchParams()
  const hasSearched = useRef(false) 

  useEffect(() => {
    const query = searchParams.get("search")
    
    // If URL has ?search=VALUE, run the function passed to this hook
    if (query && !hasSearched.current) {
      onSearch(query)
      hasSearched.current = true
    }
  }, [searchParams, onSearch])
}