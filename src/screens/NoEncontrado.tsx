import { useNavigate } from "react-router-dom";

export default function NoEncontrado({ volver = "/" }: { volver?: string }) {
  const navigate = useNavigate();
  return (
    <>
      <header className="title-band">
        <h1>No encontrado</h1>
      </header>
      <main className="screen">
        <p className="empty">Este elemento no existe o fue eliminado.</p>
        <div className="stack">
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate(volver, { replace: true })}>
            Regresar
          </button>
        </div>
      </main>
    </>
  );
}
