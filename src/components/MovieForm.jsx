import {
  useEffect,
  useState,
} from "react";

export default function MovieForm({
  movie,
  onSave,
  onCancel,
}) {
  const [form, setForm] =
    useState({
      title:
        movie?.title || "",

      overview:
        movie?.overview || "",

      poster:
        movie?.poster || "",

      backdrop:
        movie?.backdrop || "",

      year:
        movie?.year || "",

      videoUrl:
        movie?.videoUrl || "",
    });

  useEffect(() => {
    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "auto";
    };
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  }

  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    await onSave(form);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,

        background:
          "rgba(0,0,0,0.7)",

        display: "flex",

        alignItems: "center",

        justifyContent:
          "center",

        zIndex: 9999,

        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        style={{
          width: "100%",
          maxWidth: 700,

          maxHeight: "90vh",

          overflowY: "auto",

          background: "#111",

          borderRadius: 16,

          padding: 24,

          color: "#fff",

          boxShadow:
            "0 10px 40px rgba(0,0,0,.4)",
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
            }}
          >
            Editar Filme
          </h2>

          <button
            onClick={onCancel}
            style={{
              background:
                "transparent",

              border: "none",

              color: "#fff",

              fontSize: 24,

              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          style={{
            display: "flex",

            flexDirection:
              "column",

            gap: 16,
          }}
        >
          <input
            name="title"
            placeholder="Título"
            value={form.title}
            onChange={
              handleChange
            }
          />

          <input
            name="year"
            placeholder="Ano"
            value={form.year}
            onChange={
              handleChange
            }
          />

          <input
            name="poster"
            placeholder="Poster"
            value={form.poster}
            onChange={
              handleChange
            }
          />

          <input
            name="backdrop"
            placeholder="Backdrop"
            value={form.backdrop}
            onChange={
              handleChange
            }
          />

          <input
            name="videoUrl"
            placeholder="URL do vídeo"
            value={
              form.videoUrl
            }
            onChange={
              handleChange
            }
          />

          <textarea
            name="overview"
            placeholder="Descrição"
            value={
              form.overview
            }
            onChange={
              handleChange
            }
            rows={6}
          />

          <div
            style={{
              display: "flex",

              gap: 12,

              marginTop: 8,
            }}
          >
            <button
              type="submit"
            >
              Salvar
            </button>

            <button
              type="button"
              onClick={
                onCancel
              }
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}