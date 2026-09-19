import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Repositorio } from "../data/repositorio";
import type { Rol, Usuario } from "../domain/tipos";
import { ErrorDominio } from "../domain/tipos";

interface Ctx {
  repo: Repositorio;
  usuario: Usuario | null;
  cargandoSesion: boolean;
  entrar: (c: { email: string; password: string } | { rol: Rol }) => Promise<Usuario>;
  salir: () => Promise<void>;
  /** Cambia tras cada escritura para que las consultas se vuelvan a ejecutar. */
  version: number;
  /** Ejecuta una escritura, muestra el aviso y refresca las consultas. */
  mutar: <T>(accion: (u: Usuario) => Promise<T>, aviso?: string) => Promise<T>;
  toast: { texto: string; tipo: "ok" | "error" } | null;
  avisar: (texto: string, tipo?: "ok" | "error") => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ repo, children }: { repo: Repositorio; children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<Ctx["toast"]>(null);

  useEffect(() => {
    let vivo = true;
    repo
      .sesionActual()
      .then((u) => vivo && setUsuario(u))
      .finally(() => vivo && setCargandoSesion(false));
    return () => {
      vivo = false;
    };
  }, [repo]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const avisar = useCallback((texto: string, tipo: "ok" | "error" = "ok") => setToast({ texto, tipo }), []);

  const entrar = useCallback<Ctx["entrar"]>(
    async (c) => {
      const u = await repo.iniciarSesion(c);
      setUsuario(u);
      return u;
    },
    [repo]
  );

  const salir = useCallback(async () => {
    await repo.cerrarSesion();
    setUsuario(null);
  }, [repo]);

  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;

  const mutar = useCallback<Ctx["mutar"]>(
    async (accion, aviso) => {
      const u = usuarioRef.current;
      if (!u) throw new ErrorDominio("Tu sesión terminó. Vuelve a iniciar sesión.", "sesion");
      try {
        const r = await accion(u);
        setVersion((v) => v + 1);
        if (aviso) avisar(aviso);
        return r;
      } catch (e) {
        avisar(e instanceof ErrorDominio ? e.message : "Ocurrió un error inesperado.", "error");
        throw e;
      }
    },
    [avisar]
  );

  const value = useMemo(
    () => ({ repo, usuario, cargandoSesion, entrar, salir, version, mutar, toast, avisar }),
    [repo, usuario, cargandoSesion, entrar, salir, version, mutar, toast, avisar]
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp debe usarse dentro de AppProvider");
  return c;
}

export type Consulta<T> = { datos?: T; cargando: boolean; error: string | null; reintentar: () => void };

/** Ejecuta una lectura del repositorio para el usuario actual y la repite tras cada escritura. */
export function useConsulta<T>(leer: (repo: Repositorio, u: Usuario) => Promise<T>, deps: unknown[] = []): Consulta<T> {
  const { repo, usuario, version } = useApp();
  const [estado, setEstado] = useState<{ datos?: T; cargando: boolean; error: string | null }>({ cargando: true, error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    let vivo = true;
    setEstado((s) => ({ ...s, cargando: true, error: null }));
    leer(repo, usuario)
      .then((datos) => vivo && setEstado({ datos, cargando: false, error: null }))
      .catch((e: unknown) => vivo && setEstado({ cargando: false, error: e instanceof ErrorDominio ? e.message : "No se pudo cargar la información." }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, usuario, version, intento, ...deps]);

  return { ...estado, reintentar: () => setIntento((i) => i + 1) };
}
