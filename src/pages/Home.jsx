import "./Home.css";

import { useEffect, useMemo, useState } from "react";

import MovieRow from "../components/MovieRow";

import HeroBanner from "../components/HeroBanner";

import {
  getHome,
} from "../services/movies";

import {
  useSearch,
} from "../hooks/useSearch";

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
    useState(true);

  /* =========================================
     LOAD HOME
  ========================================= */

  /* =========================================
     RELOAD ON FILTER CHANGE
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getHome({
          search,
          genre: genreFilter,
        });

        if (cancelled) return;

        setRows(response.rows || []);
        setFeatured(response.featured || []);
      } catch (error) {
        if (!cancelled) console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [genreFilter, search]);

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
