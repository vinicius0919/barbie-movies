
import "./CollectionsPage.css";

import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Film,
  Tv,
  Layers3,
  RefreshCw,
} from "lucide-react";

import MovieCard from "../components/MovieCard";
import SeriesCard from "../components/SeriesCard";

import { useCollections } from "../hooks/useCollections";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "movie", label: "Filmes" },
  { id: "series", label: "Séries" },
];

export default function CollectionDetailsPage() {
  const { id } = useParams();

  const {
    collections,
    loading,
    error,
    warnings,
    reload,
  } = useCollections();

  const [filter, setFilter] = useState("all");

  const collection = useMemo(
    () =>
      collections.find(
        (item) => item.id === id
      ),
    [collections, id]
  );

  const filteredItems = useMemo(() => {
    if (!collection) {
      return [];
    }

    if (filter === "all") {
      return collection.items;
    }

    return collection.items.filter(
      (item) => item.mediaType === filter
    );
  }, [collection, filter]);

  return (
    <main className="miqflix-collections">
      <div className="collections-container">
        <Link
          to="/collections"
          className="collections-back"
        >
          <ArrowLeft size={18} />
          Todas as coleções
        </Link>

        {loading && (
          <div
            className="collections-feedback"
            role="status"
          >
            <div className="collections-spinner" />
            <p>Carregando coleção...</p>
          </div>
        )}

        {!loading && error && (
          <div
            className="collections-feedback"
            role="alert"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={reload}
            >
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && !collection && (
          <div className="collections-feedback">
            <Layers3 size={34} />

            <h1>Coleção não encontrada</h1>

            <p>
              Esta coleção não está disponível
              no catálogo carregado.
            </p>

            <Link to="/collections">
              Explorar coleções
            </Link>
          </div>
        )}

        {!loading && !error && collection && (
          <>
            <header className="collection-details-header">
              <span className="collections-eyebrow">
                <Layers3 size={17} />
                COLEÇÃO MIQFLIX
              </span>

              <h1>{collection.title}</h1>

              <p>{collection.description}</p>

              <div className="collection-details-stats">
                <span>
                  <Layers3 size={17} />
                  {collection.total} títulos
                </span>

                <span>
                  <Film size={17} />
                  {collection.movieCount} filmes
                </span>

                <span>
                  <Tv size={17} />
                  {collection.seriesCount} séries
                </span>
              </div>
            </header>

            {warnings.length > 0 && (
              <div
                className="collections-warning"
                role="status"
              >
                {warnings.join(" ")}
                Alguns títulos podem não aparecer.
              </div>
            )}

            <div className="collection-details-toolbar">
              <h2>Explorar títulos</h2>

              <div
                className="collections-filters"
                role="group"
                aria-label="Filtrar títulos"
              >
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      filter === item.id
                        ? "active"
                        : ""
                    }
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="collections-feedback">
                <p>
                  Nenhum título disponível
                  para este filtro.
                </p>
              </div>
            ) : (
              <div className="collections-titles-grid">
                {filteredItems.map((item) =>
                  item.mediaType === "movie" ? (
                    <MovieCard
                      key={`movie-${item._id}`}
                      movie={item}
                    />
                  ) : (
                    <SeriesCard
                      key={`series-${item._id}`}
                      series={item}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
