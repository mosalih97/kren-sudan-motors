
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (searchResults: any[]) => {
    setResults(searchResults);
    setHasSearched(true);
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setHasSearched(false);
  }, []);

  return {
    results,
    loading,
    hasSearched,
    handleSearch,
    clearSearch
  };
}
