import { useState } from "react";

export default function MovieForm({
  movie,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({
    title: movie?.title || "",
    overview:
      movie?.overview || "",
    poster: movie?.poster || "",
    backdrop:
      movie?.backdrop || "",
    year: movie?.year || "",
    videoUrl:
      movie?.videoUrl || "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await onSave(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        placeholder="Título"
        value={form.title}
        onChange={handleChange}
      />

      <input
        name="year"
        placeholder="Ano"
        value={form.year}
        onChange={handleChange}
      />

      <input
        name="poster"
        placeholder="Poster"
        value={form.poster}
        onChange={handleChange}
      />

      <input
        name="backdrop"
        placeholder="Backdrop"
        value={form.backdrop}
        onChange={handleChange}
      />

      <input
        name="videoUrl"
        placeholder="URL do vídeo"
        value={form.videoUrl}
        onChange={handleChange}
      />

      <textarea
        name="overview"
        placeholder="Descrição"
        value={form.overview}
        onChange={handleChange}
        rows={5}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button type="submit">
          Salvar
        </button>

        <button
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}