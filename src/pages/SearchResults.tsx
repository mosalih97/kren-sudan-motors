
import { Header } from "@/components/Header";
import { SearchResults as SearchResultsComponent } from "@/components/SearchResults";
import { useSearchFilters } from "@/hooks/useSearchFilters";

const SearchResults = () => {
  const { searchResults, loading, hasSearched, filters } = useSearchFilters();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <SearchResultsComponent
          results={searchResults}
          loading={loading}
          hasSearched={hasSearched}
          searchQuery={filters.searchQuery}
        />
      </div>
    </div>
  );
};

export default SearchResults;
