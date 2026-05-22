import {
  createContext,
  useContext,
  useState,
} from "react";

const SearchContext =
  createContext();

export function SearchProvider({
  children,
}) {
  const [search, setSearch] =
    useState("");

  const [
    genreFilter,
    setGenreFilter,
  ] = useState("");

  return (
    <SearchContext.Provider
      value={{
        search,
        setSearch,

        genreFilter,
        setGenreFilter,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(
    SearchContext
  );
}