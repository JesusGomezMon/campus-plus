import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ACTIVIDADES_INICIALES } from "./data/seed";
import type { Actividad, Estado } from "./data/types";

const STORAGE_KEY = "campus-plus:v1:actividades";

function cargar(): Actividad[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data as Actividad[];
    }
  } catch {
    /* almacenamiento no disponible: se usan los datos iniciales */
  }
  return ACTIVIDADES_INICIALES.map((a) => ({ ...a }));
}

export type NuevaActividad = Omit<Actividad, "id">;

interface Store {
  actividades: Actividad[];
  obtener: (id: number) => Actividad | undefined;
  crear: (a: NuevaActividad) => Actividad;
  actualizar: (id: number, cambios: Partial<Actividad>) => void;
  cambiarEstado: (id: number, estado: Estado) => void;
  eliminar: (id: number) => void;
  restablecer: () => void;
  toast: string | null;
  avisar: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(cargar);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actividades));
    } catch {
      /* sin persistencia en modo privado */
    }
  }, [actividades]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const obtener = useCallback((id: number) => actividades.find((a) => a.id === id), [actividades]);

  const crear = useCallback((a: NuevaActividad) => {
    const nueva = { ...a, id: Date.now() };
    setActividades((prev) => [...prev, nueva]);
    return nueva;
  }, []);

  const actualizar = useCallback((id: number, cambios: Partial<Actividad>) => {
    setActividades((prev) => prev.map((a) => (a.id === id ? { ...a, ...cambios, id } : a)));
  }, []);

  const cambiarEstado = useCallback((id: number, estado: Estado) => actualizar(id, { estado }), [actualizar]);

  const eliminar = useCallback((id: number) => {
    setActividades((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const restablecer = useCallback(() => setActividades(ACTIVIDADES_INICIALES.map((a) => ({ ...a }))), []);

  const value = useMemo(
    () => ({ actividades, obtener, crear, actualizar, cambiarEstado, eliminar, restablecer, toast, avisar: setToast }),
    [actividades, obtener, crear, actualizar, cambiarEstado, eliminar, restablecer, toast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore debe usarse dentro de StoreProvider");
  return s;
}
