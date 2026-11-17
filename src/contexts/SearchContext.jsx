import {
  useMemo,
  useState,
} from "react";
import { SearchContext } from "./searchContext";

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
