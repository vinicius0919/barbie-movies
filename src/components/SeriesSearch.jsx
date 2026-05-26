// components/series/SeriesSearch/index.jsx

import "./SeriesSearch.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  Loader2,
  Tv,
  Check,
} from "lucide-react";

import { searchTMDBSeries } from "../services/tmdb";

/* =========================================
   COMPONENT
========================================= */

export default function SeriesSearch({
  onSelect,
}) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [selectedId, setSelectedId] =
    useState(null);

  /* =========================================
     SEARCH
  ========================================= */

  useEffect(() => {
    if (
      query.trim().length < 3
    ) {
      setResults([]);
      return;
    }

    const timeout =
      setTimeout(async () => {
        try {
          setLoading(true);

          const response =
            await searchTMDBSeries(
              query
            );

          setResults(
            response.results || []
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }, 500);

    return () =>
      clearTimeout(timeout);
  }, [query]);

  /* =========================================
     SELECT
  ========================================= */

  function handleSelect(series) {
    setSelectedId(
      series.tmdbId
    );

    onSelect(series);
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="series-search">

      {/* =====================================
          INPUT
      ===================================== */}

      <div className="series-search-input">

        <Search size={18} />

        <input
          type="text"
          placeholder="Buscar série no TMDB..."
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
        />

        {loading && (
          <Loader2
            size={18}
            className="spin"
          />
        )}

      </div>

      {/* =====================================
          RESULTS
      ===================================== */}

      {results.length > 0 && (
        <div className="series-search-results">

          {results.map(
            (series) => (
              <button
                key={
                  series.tmdbId
                }
                className={`series-search-item ${
                  selectedId ===
                  series.tmdbId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSelect(
                    series
                  )
                }
              >

                {/* =====================
                    POSTER
                ===================== */}

                <div className="series-search-poster">

                  {series.poster ? (
                    <img
                      src={
                        series.poster
                      }
                      alt={
                        series.title
                      }
                    />
                  ) : (
                    <div className="series-search-no-image">
                      <Tv size={28} />
                    </div>
                  )}

                </div>

                {/* =====================
                    INFO
                ===================== */}

                <div className="series-search-info">

                  <div className="series-search-title-row">

                    <h4>
                      {
                        series.title
                      }
                    </h4>

                    {selectedId ===
                      series.tmdbId && (
                      <Check
                        size={18}
                      />
                    )}

                  </div>

                  <div className="series-search-meta">

                    <span>
                      {
                        series.year
                      }
                    </span>

                    {series.alreadyAdded && (
                      <span className="already-added">
                        Já adicionada
                      </span>
                    )}

                  </div>

                  <p>
                    {
                      series.overview
                    }
                  </p>

                </div>

              </button>
            )
          )}

        </div>
      )}

      {/* =====================================
          EMPTY
      ===================================== */}

      {!loading &&
        query.length >= 3 &&
        results.length === 0 && (
          <div className="series-search-empty">
            Nenhuma série encontrada.
          </div>
        )}

    </div>
  );
}