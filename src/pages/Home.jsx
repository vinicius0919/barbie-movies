// Home.jsx

import "./Home.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MovieRow from "../components/MovieRow";
import HeroBanner from "../components/HeroBanner";

import { getMovies } from "../services/movies";

import { useSearch } from "../context/SearchContext";

const GENRE_ROWS = [
  "Animação",
  "Comédia",
  "Romance",
  "Fantasia",
];

export default function Home() {
  const [baseRows, setBaseRows] =
    useState([]);

  const [extraRows, setExtraRows] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const {
    search,
    genreFilter,
  } = useSearch();

  /* =========================================
     LOAD INITIAL
  ========================================= */

  async function loadInitialMovies() {
    try {
      setLoading(true);

      const response =
        await getMovies(
          1,
          20,
          search,
          genreFilter
        );

      const movies =
        response.data || [];

      setPage(1);

      setHasMore(
        response.pagination
          ?.hasNextPage || false
      );

      /* =========================================
         CATEGORY ROWS
      ========================================= */

      const usedMovies =
        new Set();

      const rows =
        GENRE_ROWS.map(
          (genre) => {
            const genreMovies =
              movies.filter(
                (movie) => {
                  const hasGenre =
                    movie.genres?.includes(
                      genre
                    );

                  const alreadyUsed =
                    usedMovies.has(
                      movie._id
                    );

                  if (
                    hasGenre &&
                    !alreadyUsed
                  ) {
                    usedMovies.add(
                      movie._id
                    );

                    return true;
                  }

                  return false;
                }
              );

            return {
              id: genre,
              title: genre,
              movies:
                genreMovies,
            };
          }
        ).filter(
          (row) =>
            row.movies.length > 0
        );

      setBaseRows(rows);

      /* =========================================
         CONTINUATION ROW
      ========================================= */

      setExtraRows([
        {
          id: "initial-row",
          title: "",
          movies,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     LOAD MORE
  ========================================= */

  async function handleLoadMore() {
    if (loading || !hasMore)
      return;

    try {
      setLoading(true);

      const nextPage =
        page + 1;

      const response =
        await getMovies(
          nextPage,
          20,
          search,
          genreFilter
        );

      const movies =
        response.data || [];

      setPage(nextPage);

      setHasMore(
        response.pagination
          ?.hasNextPage || false
      );

      setExtraRows((prev) => [
        ...prev,
        {
          id: `page-${nextPage}`,
          title: "",
          movies,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     RELOAD
  ========================================= */

  useEffect(() => {
    loadInitialMovies();
  }, [search, genreFilter]);

  /* =========================================
     ALL MOVIES
  ========================================= */

  const allMovies = useMemo(() => {
    return [
      ...baseRows.flatMap(
        (row) => row.movies
      ),

      ...extraRows.flatMap(
        (row) => row.movies
      ),
    ];
  }, [baseRows, extraRows]);

  /* =========================================
     FEATURED
  ========================================= */

  const featuredMovie =
    allMovies[0];

  /* =========================================
     EMPTY
  ========================================= */

  if (
    !loading &&
    allMovies.length === 0
  ) {
    return (
      <main className="container">
        <div className="home-empty">
          <p>
            Nenhum filme encontrado.
          </p>
        </div>
      </main>
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="container">
      {featuredMovie && (
        <HeroBanner
          movies={allMovies}
        />
      )}

      <div className="home-content">
        {baseRows.map((row) => (
          <MovieRow
            key={row.id}
            title={row.title}
            movies={row.movies}
          />
        ))}

        {extraRows.map((row) => (
          <MovieRow
            key={row.id}
            title=""
            movies={row.movies}
          />
        ))}
      </div>

      {loading && (
        <div className="home-loading">
          <div className="home-loader" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="load-more-wrapper">
          <button
            className="load-more-button"
            onClick={
              handleLoadMore
            }
          >
            Carregar mais
          </button>
        </div>
      )}
    </main>
  );
}