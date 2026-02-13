/**
 * Search Components
 * Export all search-related components
 */

export {
  SearchAutocomplete,
  default as SearchAutocompleteDefault,
  type SearchAutocompleteProps,
} from './search-autocomplete';

export {
  ProductSuggestionItem,
  CategorySuggestionItem,
  RecentSearchItem,
  QuerySuggestionItem,
  ViewAllResults,
  SearchSuggestionsLoading,
  NoResults,
  type ProductSuggestionItemProps,
  type CategorySuggestionItemProps,
  type RecentSearchItemProps,
  type QuerySuggestionItemProps,
  type ViewAllResultsProps,
  type NoResultsProps,
} from './search-suggestion';
