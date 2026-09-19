import { useEffect, useRef } from "react";
import type { Actividad, Estado } from "../data/types";
import { ESTADOS } from "../data/seed";
import { useStore } from "../store";
import { fechaHora, tagClass } from "../utils";

export type Filtro = "Todas" | Estado;
const FILTROS: Filtro[] = ["Todas", ...ESTADOS];

export function Filtros({ value, onChange }: { value: Filtro; onChange: (f: Filtro) => void }) {
  return (
    <div className="chips" role="tablist" aria-label="Filtrar por estado">
      {FILTROS.map((f) => (
        <button
          key={f}
          type="button"
          role="tab"
          aria-selected={value === f}
          className={"chip" + (value === f ? " is-on" : "")}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

export function EstadoTag({ estado, className = "" }: { estado: Estado; className?: string }) {
  return <span className={tagClass(estado) + " " + className}>{estado}</span>;
}

/** Botón verde grande usado en los tableros ("Próximas actividades", tutorados). */
export function PillButton({ titulo, subtitulo, onClick }: { titulo: string; subtitulo: string; onClick: () => void }) {
  return (
    <button type="button" className="pill" onClick={onClick}>
      <span className="pill-title">{titulo}</span>
      <span className="pill-sub">{subtitulo}</span>
    </button>
  );
}

export function ActividadResumen({ a }: { a: Actividad }) {
  return (
    <>
      <span className="card-title">{a.titulo}</span>
      <span className="card-meta">{fechaHora(a)}</span>
      <EstadoTag estado={a.estado} />
    </>
  );
}

export function Datos({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="datos">
      {items.map((d) => (
        <div key={d.label} className="dato">
          <dt>{d.label}</dt>
          <dd>{d.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function ConfirmDialog({
  titulo,
  mensaje,
  confirmar,
  onCancel,
  onConfirm
}: {
  titulo: string;
  mensaje: string;
  confirmar: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b" onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-t" className="dialog-title">{titulo}</h2>
        <p id="dlg-b" className="dialog-body">{mensaje}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmar}</button>
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <div className="toast-region" aria-live="polite">
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
