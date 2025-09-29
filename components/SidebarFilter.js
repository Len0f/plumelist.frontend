// components/SidebarFilters.jsx (ou ./SidebarFilter.jsx si tu préfères)
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function SidebarFilters({ token, onResults, refreshKey = 0 }) {
  const [characters, setCharacters] = useState([]);
  const [forums, setForums] = useState([]);
  const [sel, setSel] = useState({ character: null, forum: null }); // on mémorise la sélection
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchAll = async () => {
    // recharge toutes les tasks (réinitialisation)
    try {
      setLoading(true);
      setErr("");
      const r = await fetch(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`GET /tasks ${r.status}`);
      onResults(await r.json());
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les tâches.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacets = async () => {
    const r = await fetch(`${API_BASE}/tasks/facets?tick=${refreshKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`GET /tasks/facets ${r.status}`);
    return r.json();
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setErr("");
        const data = await fetchFacets();
        setCharacters(data.characters || []);
        setForums(data.forums || []);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les filtres.");
      }
    })();
  }, [token, refreshKey]); // ← refetch facettes quand refreshKey change

  const filterBy = async (type, name) => {
    try {
      setLoading(true);
      setErr("");
      const qs = new URLSearchParams();
      if (type === "character") qs.set("character", name);
      if (type === "forum") qs.set("forum", name);
      const r = await fetch(`${API_BASE}/tasks?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`GET /tasks?${qs} ${r.status}`);
      onResults(await r.json());
      setSel({
        character: type === "character" ? name : null,
        forum: type === "forum" ? name : null,
      });
    } catch (e) {
      console.error(e);
      setErr("Filtre indisponible.");
    } finally {
      setLoading(false);
    }
  };

  // Si refreshKey change alors que l’utilisateur a un filtre actif,
  // on relance la requête avec la sélection courante pour que la liste côté droit reste cohérente.
  useEffect(() => {
    if (!token) return;
    const run = async () => {
      const qs = new URLSearchParams();
      if (sel.character) qs.set("character", sel.character);
      if (sel.forum) qs.set("forum", sel.forum);
      if (!sel.character && !sel.forum) return; // pas de filtre actif → rien à refaire
      const r = await fetch(`${API_BASE}/tasks?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;
      onResults(await r.json());
    };
    run().catch(() => {});
  }, [refreshKey]); // ← re-fetch des tasks filtrées si filtre actif

  return (
    <div>
      <button
        onClick={fetchAll}
        style={{
          marginBottom: 8,
          fontSize: 12,
          textDecoration: "underline",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Tout afficher
      </button>

      <h3>Mes personnages</h3>
      <ul>
        {characters.length === 0 ? (
          <li style={{ opacity: 0.6, fontSize: 12 }}>(aucun)</li>
        ) : (
          characters.map((c) => (
            <li key={c.name}>
              <button
                className={sel.character === c.name ? "active" : ""}
                onClick={() => filterBy("character", c.name)}
              >
                {c.name} ({c.count})
              </button>
            </li>
          ))
        )}
      </ul>

      <h3>Mes forums</h3>
      <ul>
        {forums.length === 0 ? (
          <li style={{ opacity: 0.6, fontSize: 12 }}>(aucun)</li>
        ) : (
          forums.map((f) => (
            <li key={f.name}>
              <button
                className={sel.forum === f.name ? "active" : ""}
                onClick={() => filterBy("forum", f.name)}
              >
                {f.name} ({f.count})
              </button>
            </li>
          ))
        )}
      </ul>

      {loading && <div style={{ opacity: 0.7, fontSize: 12 }}>Chargement…</div>}
      {err && <div style={{ color: "crimson", fontSize: 12 }}>{err}</div>}
    </div>
  );
}
