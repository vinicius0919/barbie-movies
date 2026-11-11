import "./CollectionsPage.css";

import { useMemo, useState } from "react";

import { Layers3, Search, RefreshCw } from "lucide-react";

import CollectionCard from "../components/CollectionCard";
import { useCollections } from "../hooks/useCollections";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "movie", label: "Filmes" },
  { id: "series", label: "Séries" },
];

export default function CollectionsPage() {
  const { collections, loading, error, warnings, reload } = useCollections();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");

    return collections.filter((collection) => {
      const matchesSearch = collection.title
        .toLocaleLowerCase("pt-BR")
        .includes(query);

      const matchesType =
        filter === "all" ||
        (filter === "movie" && collection.movieCount > 0) ||
        (filter === "series" && collection.seriesCount > 0);

      return matchesSearch && matchesType;
    });
  }, [collections, search, filter]);

  return (
    <main className="miqflix-collections">
      <div className="collections-container">
        <header className="collections-header">
          <div className="collections-heading">
            <span className="collections-eyebrow">
              <Layers3 size={17} />
              DESCUBRA MAIS
            </span>

            <h1>Explorar coleções</h1>

            <p>
              Explore coleções especiais de filmes e séries, cuidadosamente
              organizadas para você.
            </p>
          </div>

          <div className="collections-toolbar">
            <label className="collections-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Buscar coleções..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div
              className="collections-filters"
              role="group"
              aria-label="Filtrar coleções"
            >
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={filter === item.id ? "active" : ""}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading && (
          <div className="collections-feedback" role="status">
            <div className="collections-spinner" />
            <p>Carregando coleções...</p>
          </div>
        )}

        {!loading && error && (
          <div className="collections-feedback" role="alert">
            <p>{error}</p>

            <button type="button" onClick={reload}>
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {warnings.length > 0 && (
              <div className="collections-warning" role="status">
                {warnings.join(" ")}
                Algumas coleções podem estar incompletas.
              </div>
            )}

            <div className="collections-results">
              <h2>Coleções disponíveis</h2>

              <span>{filteredCollections.length} coleções</span>
            </div>

            {filteredCollections.length === 0 ? (
              <div className="collections-feedback">
                <Layers3 size={34} />

                <p>Nenhuma coleção encontrada.</p>
              </div>
            ) : (
              <div className="collections-grid">
                {filteredCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
