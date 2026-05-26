import "./Home.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MovieRow from "../components/MovieRow";

import HeroBanner from "../components/HeroBanner";

import {
  getHome,
} from "../services/movies";

import {
  useSearch,
} from "../context/SearchContext";

export default function Home() {

  const {
    search,
    genreFilter,
  } = useSearch();

  const [rows, setRows] =
    useState([]);

  const [featured, setFeatured] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  /* =========================================
     LOAD HOME
  ========================================= */

  async function loadHome() {
    try {
      setLoading(true);

      const response =
        await getHome({
          search,
          genre: genreFilter,
        });

      setRows(
        response.rows || []
      );

      setFeatured(
        response.featured || []
      );

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     RELOAD ON FILTER CHANGE
  ========================================= */

  useEffect(() => {
    loadHome();
  }, [
    search,
    genreFilter,
  ]);

  /* =========================================
     ALL MOVIES
  ========================================= */

  const allMovies =
    useMemo(() => {
      return rows.flatMap(
        (row) => row.movies
      );
    }, [rows]);

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

      {featured.length > 0 && (
        <HeroBanner
          movies={featured}
        />
      )}

      <div className="home-content">

        {rows.map((row) => (
          <MovieRow
            key={row.id}
            title={row.title}
            movies={row.movies}
          />
        ))}

      </div>

      {loading && (
        <div className="home-loading">
          <div className="home-loader" />
        </div>
      )}

    </main>
  );
}