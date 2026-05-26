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

import { useSearch }
  from "../context/SearchContext";

export default function Home() {
  const [rows, setRows] =
    useState([]);

  const [featured, setFeatured] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const {
    search,
    genreFilter,
  } = useSearch();

  async function loadHome() {
    try {
      setLoading(true);

      const response =
        await getHome();

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

  useEffect(() => {
    loadHome();
  }, []);

  const filteredRows =
    useMemo(() => {

      return rows.map((row) => {

        const filteredMovies =
          row.movies.filter(
            (movie) => {

              const matchSearch =
                movie.title
                  ?.toLowerCase()
                  .includes(
                    search.toLowerCase()
                  );

              const matchGenre =
                !genreFilter ||
                movie.genres?.includes(
                  genreFilter
                );

              return (
                matchSearch &&
                matchGenre
              );
            }
          );

        return {
          ...row,
          movies:
            filteredMovies,
        };
      });

    }, [
      rows,
      search,
      genreFilter,
    ]);

  const allMovies =
    useMemo(() => {

      return filteredRows.flatMap(
        (row) => row.movies
      );

    }, [filteredRows]);

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

  return (
    <main className="container">
      {featured.length > 0 && (
        <HeroBanner
          movies={featured}
        />
      )}

      <div className="home-content">
        {filteredRows.map((row) => {

          if (
            row.movies.length === 0
          ) {
            return null;
          }

          return (
            <MovieRow
              key={row.id}
              title={row.title}
              movies={row.movies}
            />
          );
        })}
      </div>

      {loading && (
        <div className="home-loading">
          <div className="home-loader" />
        </div>
      )}
    </main>
  );
}