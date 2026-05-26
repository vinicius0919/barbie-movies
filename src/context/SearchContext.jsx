import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const SearchContext =
  createContext(null);

export function SearchProvider({
  children,
}) {
  const [search, setSearch] =
    useState("");

  const [
    genreFilter,
    setGenreFilter,
  ] = useState("");

  const value = useMemo(() => ({
    search,
    setSearch,

    genreFilter,
    setGenreFilter,
  }), [
    search,
    genreFilter,
  ]);

  return (
    <SearchContext.Provider
      value={value}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context =
    useContext(SearchContext);

  if (!context) {
    throw new Error(
      "useSearch deve ser usado dentro do SearchProvider"
    );
  }

  return context;
}