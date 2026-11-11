import "./AdminCollectionsPage.css";

import { useEffect, useMemo, useState } from "react";

import {
  Layers3,
  Plus,
  Save,
  Trash2,
  Search,
  Film,
  Tv,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

import {
  getCollectionsCatalog,
  getAdminCollectionConfigs,
  createCollection,
  updateCollection,
  deleteCollection,
  getAdminCollectionsMedia,
} from "../services/collections";

import { buildCollections } from "../utils/buildCollections";
import { mergeCollections } from "../utils/mergeCollections";

const EMPTY_FORM = {
  type: "manual",
  title: "",
  description: "",
  coverUrl: "",
  genre: "",
  published: false,
  featured: false,
  sortOrder: 100,
  items: [],
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

export default function AdminCollectionsPage() {
  const [catalog, setCatalog] = useState({
    movies: [],
    series: [],
  });

  const [configs, setConfigs] = useState([]);
  const [warnings, setWarnings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedId, setSelectedId] = useState("new");
  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const [listSearch, setListSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
  const [adminMedia, setAdminMedia] = useState({
    movies: [],
    series: [],
  });

async function loadData() {
  setLoading(true);
  setError("");

  try {
    const [
      catalogData,
      savedConfigs,
      adminCatalog,
    ] = await Promise.all([
      getCollectionsCatalog(),
      getAdminCollectionConfigs(),
      getAdminCollectionsMedia(),
    ]);

    setCatalog({
      movies: catalogData.movies,
      series: catalogData.series,
    });

    setAdminMedia({
      movies: adminCatalog.movies,
      series: adminCatalog.series,
    });

    setWarnings(catalogData.warnings);
    setConfigs(savedConfigs);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    void loadData();
  }, []);

  const automaticCollections = useMemo(
    () => buildCollections(catalog.movies, catalog.series),
    [catalog],
  );

  const collections = useMemo(
    () =>
      mergeCollections(
        automaticCollections,
        configs,
        catalog.movies,
        catalog.series,
        { includeUnpublished: true },
      ),
    [automaticCollections, configs, catalog],
  );

  const filteredCollections = useMemo(() => {
    const query = listSearch.trim().toLocaleLowerCase("pt-BR");

    return collections.filter((collection) =>
      collection.title.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [collections, listSearch]);


const mediaOptions = useMemo(() => {
  const movies = adminMedia.movies
    .map((item) => ({
      ...item,
      _id: String(item._id ?? item.id ?? ""),
      mediaType: "movie",
    }));

  const series = adminMedia.series
    .map((item) => ({
      ...item,
      _id: String(item._id ?? item.id ?? ""),
      mediaType: "series",
    }));

  return [...movies, ...series]
    .filter((item) => item._id && item.title)
    .sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR")
    );
}, [adminMedia]);


  const mediaIndex = useMemo(
    () =>
      new Map(
        mediaOptions.map((item) => [`${item.mediaType}:${item._id}`, item]),
      ),
    [mediaOptions],
  );

  const availableMedia = useMemo(() => {
    const query = mediaSearch.trim().toLocaleLowerCase("pt-BR");

    const selected = new Set(
      form.items.map((item) => `${item.mediaType}:${item.mediaId}`),
    );

    return mediaOptions
      .filter((item) => {
        const key = `${item.mediaType}:${item._id}`;

        return (
          !selected.has(key) &&
          item.title.toLocaleLowerCase("pt-BR").includes(query)
        );
      })
      .slice(0, 50);
  }, [mediaOptions, mediaSearch, form.items]);

  const hasSavedConfig = configs.some((config) => config.id === selectedId);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function startNewCollection() {
    setSelectedId("new");
    setForm({
      ...EMPTY_FORM,
      items: [],
    });
    setMediaSearch("");
    setMessage("");
    setError("");
  }

  function selectCollection(collection) {
    const saved = configs.find((item) => item.id === collection.id);

    setSelectedId(collection.id);

    setForm({
      type: collection.type,
      title: collection.title,
      description: collection.description || "",
      coverUrl: collection.coverUrl || "",
      genre: collection.genre || "",
      published: collection.published !== false,
      featured: collection.featured === true,
      sortOrder: collection.sortOrder ?? 100,
      items:
        collection.type === "manual"
          ? (saved?.items || []).map((item) => ({
              mediaType: item.mediaType,
              mediaId: String(item.mediaId),
            }))
          : [],
    });

    setMediaSearch("");
    setMessage("");
    setError("");
  }

  function addMedia(item) {
    setForm((previous) => {
      const exists = previous.items.some(
        (reference) =>
          reference.mediaType === item.mediaType &&
          reference.mediaId === item._id,
      );

      if (exists) return previous;

      return {
        ...previous,
        items: [
          ...previous.items,
          {
            mediaType: item.mediaType,
            mediaId: item._id,
          },
        ],
      };
    });
  }

  function removeMedia(index) {
    setForm((previous) => ({
      ...previous,
      items: previous.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function moveMedia(index, direction) {
    setForm((previous) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= previous.items.length) {
        return previous;
      }

      const items = [...previous.items];

      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];

      return {
        ...previous,
        items,
      };
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Informe o título da coleção.");
      return;
    }

    if (form.type === "manual" && form.published && form.items.length === 0) {
      setError("Adicione pelo menos um título antes de publicar.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      coverUrl: form.coverUrl.trim(),
      published: form.published,
      featured: form.featured,
      sortOrder: Number(form.sortOrder),
    };

    if (form.type === "manual") {
      payload.items = form.items;
    } else {
      payload.genre = form.genre;
    }

    setSaving(true);

    try {
      const saved =
        selectedId === "new"
          ? await createCollection(payload)
          : await updateCollection(selectedId, payload);

      setSelectedId(saved.id);
      await loadData();

      setMessage("Coleção salva com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving || selectedId === "new" || !hasSavedConfig) {
      return;
    }

    const restoring = form.type === "genre";

    const confirmed = window.confirm(
      restoring
        ? "Restaurar as configurações originais desta coleção?"
        : "Excluir esta coleção? Os filmes e séries não serão apagados.",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteCollection(selectedId);
      await loadData();

      startNewCollection();

      setMessage(
        restoring
          ? "Configurações originais restauradas."
          : "Coleção excluída com sucesso.",
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-collections">
      <header className="admin-collections-header">
        <div>
          <span className="admin-collections-eyebrow">
            <Layers3 size={17} />
            ADMINISTRAÇÃO
          </span>

          <h1>Gerenciar coleções</h1>

          <p>
            Organize filmes e séries e personalize as coleções disponíveis no
            MiqFlix.
          </p>
        </div>

        <button
          type="button"
          className="admin-collections-primary"
          onClick={startNewCollection}
        >
          <Plus size={18} />
          Nova coleção
        </button>
      </header>

      {error && (
        <div className="admin-collections-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-collections-alert success" role="status">
          {message}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="admin-collections-alert">{warnings.join(" ")}</div>
      )}

      {loading && (
        <div className="admin-collections-loading">
          <RefreshCw size={20} className="spinning" />
          Carregando coleções...
        </div>
      )}

      {!loading && (
        <div className="admin-collections-layout">
          <aside className="admin-collections-list">
            <div className="admin-collections-list-header">
              <h2>Coleções</h2>
              <span>{collections.length}</span>
            </div>

            <label className="admin-collections-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Buscar coleção..."
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
              />
            </label>

            <div className="admin-collections-list-items">
              {filteredCollections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className={
                    "admin-collections-list-item " +
                    (selectedId === collection.id ? "selected" : "")
                  }
                  onClick={() => selectCollection(collection)}
                >
                  <span className="admin-collections-list-icon">
                    {collection.type === "genre" ? (
                      <Layers3 size={20} />
                    ) : (
                      <Film size={20} />
                    )}
                  </span>

                  <span className="admin-collections-list-info">
                    <strong>{collection.title}</strong>

                    <small>
                      {collection.type === "genre" ? "Automática" : "Manual"}
                      {" · "}
                      {collection.total} títulos
                    </small>
                  </span>

                  <span
                    className={
                      "admin-collections-status " +
                      (collection.published ? "published" : "draft")
                    }
                    title={collection.published ? "Publicada" : "Oculta"}
                  />
                </button>
              ))}

              {filteredCollections.length === 0 && (
                <p className="admin-collections-empty">
                  Nenhuma coleção encontrada.
                </p>
              )}
            </div>
          </aside>

          <section className="admin-collections-editor">
            <form onSubmit={handleSave}>
              <div className="admin-collections-editor-heading">
                <div>
                  <h2>
                    {selectedId === "new" ? "Nova coleção" : "Editar coleção"}
                  </h2>

                  <p>
                    {form.type === "genre"
                      ? "Personalize esta coleção automática."
                      : "Escolha os conteúdos e a apresentação."}
                  </p>
                </div>

                <span className="admin-collections-type">
                  {form.type === "genre" ? "Automática" : "Manual"}
                </span>
              </div>

              <div className="admin-collections-fields">
                <label>
                  Título
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="Nome da coleção"
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Descreva esta coleção..."
                  />
                </label>

                <label>
                  Imagem de capa (URL HTTPS)
                  <input
                    type="url"
                    value={form.coverUrl}
                    onChange={(event) =>
                      updateField("coverUrl", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>

                {form.coverUrl && /^https:\/\//i.test(form.coverUrl) && (
                  <div className="admin-collections-cover">
                    <img src={form.coverUrl} alt="Prévia da capa" />
                  </div>
                )}

                <label>
                  Ordem de exibição
                  <input
                    type="number"
                    min="-10000"
                    max="10000"
                    step="1"
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateField("sortOrder", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="admin-collections-switches">
                <label>
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      updateField("published", event.target.checked)
                    }
                  />
                  Coleção publicada
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                  />
                  Destacar coleção
                </label>
              </div>

              {form.type === "genre" ? (
                <div className="admin-collections-section">
                  <h3>Regra automática</h3>

                  <p>
                    Os conteúdos são selecionados automaticamente pelo gênero:
                    <strong> {form.genre}</strong>.
                  </p>

                  <p>
                    Novos títulos desse gênero serão incluídos automaticamente.
                  </p>
                </div>
              ) : (
                <div className="admin-collections-section">
                  <div className="admin-collections-section-heading">
                    <h3>Conteúdos selecionados</h3>

                    <span>{form.items.length} títulos</span>
                  </div>

                  <div className="admin-collections-selected">
                    {form.items.map((reference, index) => {
                      const item = mediaIndex.get(
                        `${reference.mediaType}:${reference.mediaId}`,
                      );

                      return (
                        <div
                          key={`${reference.mediaType}:${reference.mediaId}`}
                          className="admin-collections-media-row"
                        >
                          <span className="admin-collections-media-icon">
                            {reference.mediaType === "movie" ? (
                              <Film size={19} />
                            ) : (
                              <Tv size={19} />
                            )}
                          </span>

                          <div className="admin-collections-media-info">
                            <strong>
                              {item?.title || "Título indisponível"}
                            </strong>

                            <small>
                              {reference.mediaType === "movie"
                                ? "Filme"
                                : "Série"}
                            </small>
                          </div>

                          <button
                            type="button"
                            title="Mover para cima"
                            disabled={index === 0}
                            onClick={() => moveMedia(index, -1)}
                          >
                            <ArrowUp size={17} />
                          </button>

                          <button
                            type="button"
                            title="Mover para baixo"
                            disabled={index === form.items.length - 1}
                            onClick={() => moveMedia(index, 1)}
                          >
                            <ArrowDown size={17} />
                          </button>

                          <button
                            type="button"
                            title="Remover título"
                            onClick={() => removeMedia(index)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      );
                    })}

                    {form.items.length === 0 && (
                      <p className="admin-collections-empty">
                        Nenhum título selecionado.
                      </p>
                    )}
                  </div>

                  <h3>Adicionar filmes e séries</h3>

                  <label className="admin-collections-search">
                    <Search size={18} />

                    <input
                      type="search"
                      placeholder="Pesquisar no catálogo..."
                      value={mediaSearch}
                      onChange={(event) => setMediaSearch(event.target.value)}
                    />
                  </label>

                  <div className="admin-collections-media-results">
                    {availableMedia.map((item) => (
                      <div
                        key={`${item.mediaType}:${item._id}`}
                        className="admin-collections-media-row"
                      >
                        <span className="admin-collections-media-icon">
                          {item.mediaType === "movie" ? (
                            <Film size={19} />
                          ) : (
                            <Tv size={19} />
                          )}
                        </span>

                        <div className="admin-collections-media-info">
                          <strong>{item.title}</strong>

                          <small>
                            {item.mediaType === "movie" ? "Filme" : "Série"}
                          </small>
                        </div>

                        <button
                          type="button"
                          title="Adicionar"
                          onClick={() => addMedia(item)}
                        >
                          <Plus size={19} />
                        </button>
                      </div>
                    ))}

                    {availableMedia.length === 0 && (
                      <p className="admin-collections-empty">
                        Nenhum título disponível.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="admin-collections-actions">
                <button
                  type="submit"
                  className="admin-collections-primary"
                  disabled={saving}
                >
                  <Save size={18} />

                  {saving ? "Salvando..." : "Salvar coleção"}
                </button>

                {selectedId !== "new" && hasSavedConfig && (
                  <button
                    type="button"
                    className="admin-collections-danger"
                    disabled={saving}
                    onClick={handleDelete}
                  >
                    <Trash2 size={17} />

                    {form.type === "genre" ? "Restaurar padrão" : "Excluir"}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
