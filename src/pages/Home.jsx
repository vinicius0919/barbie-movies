import {
  useEffect,
  useState,
} from "react";

import MovieCard from "../components/MovieCard";

import { getMovies } from "../services/movies";

import { useSearch } from "../context/SearchContext";

export default function Home() {
  const [movies, setMovies] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const { search } =
    useSearch();

  async function loadMovies(
    currentPage = 1,
    reset = false
  ) {
    if (loading) return;

    try {
      setLoading(true);

      const response =
        await getMovies(
          currentPage,
          20,
          search
        );

      if (reset) {
        setMovies(
          response.data
        );
      } else {
        setMovies((prev) => [
          ...prev,
          ...response.data,
        ]);
      }

      setHasMore(
        response.pagination
          .hasNextPage
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);

    loadMovies(1, true);
  }, [search]);

  function handleLoadMore() {
    const nextPage =
      page + 1;

    setPage(nextPage);

    loadMovies(nextPage);
  }

  return (
    <div className="container">
      <h1>Filmes</h1>

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={movie}
          />
        ))}
      </div>

      {hasMore && (
        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            marginTop: "24px",
          }}
        >
          <button
            onClick={
              handleLoadMore
            }
            disabled={loading}
          >
            {loading
              ? "Carregando..."
              : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}