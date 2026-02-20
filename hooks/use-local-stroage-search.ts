import { useState, useEffect } from "react";

export function useLocalStorageSearch(key: string, initialValue: string = "") {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  //  Hydrate from storage only after mounting (Browser only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setSearchTerm(stored);
      }
    }
  }, [key]);

  //  Persist changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, searchTerm);
    }
  }, [searchTerm, key]);

  return [searchTerm, setSearchTerm] as const;
}