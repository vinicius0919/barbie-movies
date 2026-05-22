import "./MovieForm.css";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X, Plus } from "lucide-react";
import { refreshMovieFromTMDB } from "../services/movies";

export default function MovieForm({
  movie,
  onSave,
  onCancel,
  onRefresh,
}) {
  const [form, setForm] = useState({
    title: "",
    overview: "",
    poster: "",
    backdrop: "",
    year: "",
    videoUrl: "",
    tmdbId: "",
    genres: [],
  });

  const [genreInput, setGenreInput] = useState("");
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  useEffect(() => {
    if (movie) {
      setForm({
        title: movie.title || "",
        overview: movie.overview || "",
        poster: movie.poster || "",
        backdrop: movie.backdrop || "",
        year: movie.year || "",
        videoUrl: movie.videoUrl || "",
        tmdbId: movie.tmdbId || "",
        genres: movie.genres || [],
      });
    }
  }, [movie]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addGenre = () => {
    const value = genreInput.trim();
    if (!value || form.genres.includes(value)) return;

    setForm((prev) => ({
      ...prev,
      genres: [...prev.genres, value],
    }));

    setGenreInput("");
  };

  const removeGenre = (genre) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.filter((g) => g !== genre),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  const handleRefresh = async () => {
    if (!movie?._id) return;

    try {
      setLoadingRefresh(true);

      const updated = onRefresh
        ? await onRefresh(movie._id)
        : await refreshMovieFromTMDB(movie._id);

      if (updated) {
        setForm((prev) => ({
          ...prev,
          ...updated,
        }));
      }
    } finally {
      setLoadingRefresh(false);
    }
  };

  const modal = (
    <div className="movie-form-overlay" onClick={onCancel}>
      <div
        className="movie-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="movie-form-header">
          <div>
            <span className="movie-form-badge">
              {movie ? "Editar filme" : "Novo filme"}
            </span>
            <h2>{form.title || "Filme sem título"}</h2>
          </div>

          <div className="movie-form-actions-header">
            {movie?.tmdbId && (
              <button
                type="button"
                className="icon-button"
                onClick={handleRefresh}
                disabled={loadingRefresh}
              >
                <RefreshCw className={loadingRefresh ? "spin" : ""} size={18} />
              </button>
            )}

            <button
              type="button"
              className="icon-button"
              onClick={onCancel}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FORM */}
        <form className="movie-form" onSubmit={handleSubmit}>
          <div className="movie-form-grid">
            <div className="form-field full">
              <label>Título</label>
              <input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div className="form-field full">
              <label>Descrição</label>
              <textarea
                rows={4}
                value={form.overview}
                onChange={(e) => handleChange("overview", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Ano</label>
              <input
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>TMDB ID</label>
              <input
                value={form.tmdbId}
                onChange={(e) => handleChange("tmdbId", e.target.value)}
              />
            </div>

            {/* GENRES */}
            <div className="form-field full">
              <label>Genres</label>

              <div className="input-wrapper">
                <input
                  value={genreInput}
                  placeholder="Adicionar gênero"
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                />

                <button type="button" onClick={addGenre}>
                  <Plus size={16} />
                </button>
              </div>

              <div className="genre-list">
                {form.genres.map((genre) => (
                  <span key={genre} className="genre-chip">
                    {genre}
                    <button type="button" onClick={() => removeGenre(genre)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-field full">
              <label>Video URL</label>
              <input
                value={form.videoUrl}
                onChange={(e) => handleChange("videoUrl", e.target.value)}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="movie-form-actions">
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancelar
            </button>

            <button className="primary-button">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}