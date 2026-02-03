import { useState, useEffect } from "react";

export function useLocalStorageSearch(key: string, initialValue: string = "") {
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, searchTerm);
    }
  }, [searchTerm, key]);

  return [searchTerm, setSearchTerm] as const;
}