// components/SidebarFilters.jsx
import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Home.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export default function SidebarFilters({ token, onResults, refreshKey = 0 }) {
  const [characters, setCharacters] = useState([]);
  const [forums, setForums] = useState([]);
  const [sel, setSel] = useState({ character: null, forum: null });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API_BASE}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) {
        setErr("Session expirée. Merci de vous reconnecter.");
        return;
      }
      if (!r.ok) throw new Error(`GET /tasks ${r.status}`);
      onResults((await safeJson(r)) || []);
      setSel({ character: null, forum: null });
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setErr("Impossible de charger les tâches.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, onResults]);

  const fetchFacets = useCallback(async () => {
    if (!token) return { characters: [], forums: [] };
    const r = await fetch(`${API_BASE}/tasks/facets?tick=${refreshKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 401) throw new Error("SESSION_EXPIRED");
    if (!r.ok) throw new Error(`GET /tasks/facets ${r.status}`);
    return safeJson(r);
  }, [token, refreshKey]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        setErr("");
        const data = await fetchFacets();
        if (!mounted) return;
        setCharacters(data?.characters || []);
        setForums(data?.forums || []);
      } catch (e) {
        if (e.message === "SESSION_EXPIRED")
          setErr("Session expirée. Merci de vous reconnecter.");
        else {
          console.error(e);
          setErr("Impossible de charger les filtres.");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, refreshKey, fetchFacets]);

  const filterBy = useCallback(
    async (type, name) => {
      if (!token) return;
      setLoading(true);
      setErr("");
      try {
        const qs = new URLSearchParams(
          type === "character" ? { character: name } : { forum: name }
        );
        const r = await fetch(`${API_BASE}/tasks?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.status === 401) {
          setErr("Session expirée. Merci de vous reconnecter.");
          return;
        }
        if (!r.ok) throw new Error(`GET /tasks?${qs} ${r.status}`);
        onResults((await safeJson(r)) || []);
        setSel({
          character: type === "character" ? name : null,
          forum: type === "forum" ? name : null,
        });
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErr("Filtre indisponible.");
        }
      } finally {
        setLoading(false);
      }
    },
    [token, onResults]
  );

  useEffect(() => {
    if (!token) return;
    (async () => {
      if (!sel.character && !sel.forum) return;
      const qs = new URLSearchParams({
        ...(sel.character ? { character: sel.character } : {}),
        ...(sel.forum ? { forum: sel.forum } : {}),
      });
      const r = await fetch(`${API_BASE}/tasks?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) {
        setErr("Session expirée. Merci de vous reconnecter.");
        return;
      }
      if (!r.ok) return;
      onResults((await safeJson(r)) || []);
    })();
  }, [refreshKey, token, sel.character, sel.forum, onResults]);

  return (
    <div>
      <button
        className={styles.resetBtn}
        onClick={fetchAll}
        disabled={loading || !token}
        aria-disabled={loading || !token}
      >
        Tout afficher
      </button>

      {/* Personnages */}
      <div className={styles.sideBlock}>
        <div className={styles.sideTitle}>Mes personnages</div>
        <ul className={styles.sideList}>
          {characters.length === 0 ? (
            <li className="u-muted" style={{ fontSize: 12 }}>
              (aucun)
            </li>
          ) : (
            characters.map((c) => {
              const active = sel.character === c.name;
              return (
                <li
                  key={c.name}
                  className={`${styles.sideItem} ${
                    active ? styles.sideItemActive : ""
                  }`}
                >
                  <button
                    onClick={() => filterBy("character", c.name)}
                    disabled={loading}
                    aria-current={active ? "true" : undefined}
                  >
                    {c.name}
                  </button>
                  <span className={styles.sideCount}>{c.count}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Forums */}
      <div className={styles.sideBlock}>
        <div className={styles.sideTitle}>Mes forums</div>
        <ul className={styles.sideList}>
          {forums.length === 0 ? (
            <li className="u-muted" style={{ fontSize: 12 }}>
              (aucun)
            </li>
          ) : (
            forums.map((f) => {
              const active = sel.forum === f.name;
              return (
                <li
                  key={f.name}
                  className={`${styles.sideItem} ${
                    active ? styles.sideItemActive : ""
                  }`}
                >
                  <button
                    onClick={() => filterBy("forum", f.name)}
                    disabled={loading}
                    aria-current={active ? "true" : undefined}
                  >
                    {f.name}
                  </button>
                  <span className={styles.sideCount}>{f.count}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {loading && (
        <div className="u-muted" style={{ fontSize: 12 }}>
          Chargement…
        </div>
      )}
      {err && <div style={{ color: "crimson", fontSize: 12 }}>{err}</div>}
    </div>
  );
}
