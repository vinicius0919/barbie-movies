import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

const MAX_BENEFITS = 20;
const MAX_LENGTH = 160;

export default function BenefitsEditor({ benefits, onChange, disabled = false }) {
  const items = Array.isArray(benefits) ? benefits : [];

  function update(index, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function add() {
    if (disabled || items.length >= MAX_BENEFITS) return;
    onChange([...items, ""]);
  }

  function remove(index) {
    if (disabled) return;
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index, direction) {
    if (disabled) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  return (
    <section className="benefits-editor" aria-labelledby="benefits-editor-title">
      <div className="benefits-editor-heading">
        <div>
          <h3 id="benefits-editor-title">Benefícios</h3>
          <p>{items.length}/{MAX_BENEFITS} itens</p>
        </div>
        <button type="button" onClick={add} disabled={disabled || items.length >= MAX_BENEFITS}>
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {items.length === 0 && <p className="benefits-editor-empty">Nenhum benefício adicionado.</p>}

      <div className="benefits-editor-list">
        {items.map((benefit, index) => (
          <div className="benefit-editor-row" key={`benefit-${index}`}>
            <label>
              <span className="sr-only">Benefício {index + 1}</span>
              <input
                value={benefit}
                maxLength={MAX_LENGTH}
                disabled={disabled}
                onChange={(event) => update(index, event.target.value)}
                placeholder="Ex.: Acesso ao catálogo disponível"
              />
              <small>{benefit.length}/{MAX_LENGTH}</small>
            </label>
            <div className="benefit-editor-actions">
              <button type="button" aria-label={`Mover benefício ${index + 1} para cima`} onClick={() => move(index, -1)} disabled={disabled || index === 0}>
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label={`Mover benefício ${index + 1} para baixo`} onClick={() => move(index, 1)} disabled={disabled || index === items.length - 1}>
                <ArrowDown size={16} />
              </button>
              <button type="button" className="danger" aria-label={`Remover benefício ${index + 1}`} onClick={() => remove(index)} disabled={disabled}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
