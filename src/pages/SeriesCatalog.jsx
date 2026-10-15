import "./SeriesCatalog.css";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { Search, Play, Tv, AlertCircle, Loader2 } from "lucide-react";

import { getSeries } from "../services/series";

import SeriesCard from "../components/SeriesCard";

export default function SeriesCatalog() {
  const navigate = useNavigate();

  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Todos");

  useEffect(() => {
    let active = true;

    async function loadSeries() {
      try {
        setLoading(true);
        setError("");

        const data = await getSeries();
        console.log("SeriesCatalog - loadSeries", data);

        if (active) {
          setSeriesList(
            Array.isArray(data)
              ? data.filter((series) => series.published === true)
              : [],
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error || "Não foi possível carregar as séries.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSeries();

    return () => {
      active = false;
    };
  }, []);

  const genres = useMemo(() => {
    const values = seriesList.flatMap((series) =>
      Array.isArray(series.genres) ? series.genres : [],
    );

    return ["Todos", ...new Set(values.filter(Boolean))];
  }, [seriesList]);

  const filteredSeries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return seriesList.filter((series) => {
      const matchesSearch =
        !term || series.title?.toLocaleLowerCase("pt-BR").includes(term);

      const matchesGenre = genre === "Todos" || series.genres?.includes(genre);

      return matchesSearch && matchesGenre;
    });
  }, [seriesList, search, genre]);

  const featuredSeries = seriesList[0];

  return (
    <main className="series-catalog">
      {!loading && featuredSeries && (
        <section
          className="series-catalog-hero"
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(10,10,15,.96),
                rgba(10,10,15,.65),
                rgba(10,10,15,.2)
              ),
              url("${featuredSeries.backdrop || featuredSeries.poster}")
            `,
          }}
        >
          <div className="series-catalog-hero-content">
            <span className="series-catalog-eyebrow">
              <Tv size={16} />
              Destaque em séries
            </span>

            <h1>{featuredSeries.title}</h1>

            <div className="series-catalog-hero-meta">
              <span>{featuredSeries.year}</span>
              <span>
                {featuredSeries.totalSeasons ??
                  featuredSeries.seasons?.length ??
                  0}{" "}
                temporadas
              </span>
            </div>

            <p>{featuredSeries.overview}</p>

            <button
              type="button"
              onClick={() => navigate(`/series/${featuredSeries._id}`)}
            >
              <Play size={18} fill="currentColor" />
              Ver série
            </button>
          </div>
        </section>
      )}

      <div className="series-catalog-container">
        <header className="series-catalog-header">
          <div>
            <span className="series-catalog-label">MIQFLIX</span>
            <h2>Explorar séries</h2>
            <p>Descubra histórias e escolha sua próxima maratona.</p>
          </div>

          <label className="series-catalog-search">
            <Search size={19} />
            <input
              type="search"
              placeholder="Buscar séries..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </header>

        {!loading && genres.length > 1 && (
          <div className="series-catalog-genres">
            {genres.map((item) => (
              <button
                key={item}
                type="button"
                className={genre === item ? "active" : ""}
                onClick={() => setGenre(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="series-catalog-feedback">
            <Loader2 size={32} className="series-catalog-spin" />
            <p>Carregando catálogo...</p>
          </div>
        ) : error ? (
          <div className="series-catalog-feedback" role="alert">
            <AlertCircle size={30} />
            <p>{error}</p>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="series-catalog-feedback">
            <Tv size={32} />
            <p>
              {seriesList.length === 0
                ? "Nenhuma série disponível no momento."
                : "Nenhuma série encontrada."}
            </p>
          </div>
        ) : (
          <>
            <div className="series-catalog-results">
              <h3>{genre === "Todos" ? "Todas as séries" : genre}</h3>

              <span>
                {filteredSeries.length}{" "}
                {filteredSeries.length === 1 ? "série" : "séries"}
              </span>
            </div>

            <div className="series-catalog-grid">
              {filteredSeries.map((series) => (
                <SeriesCard key={series._id} series={series} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
