import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import TaskCard from "../components/TaskCard";
import AddTaskModal from "../components/AddTaskModal";
import SidebarFilters from "../components/SidebarFilter"; // ← si ton fichier s'appelle SidebarFilters.jsx, ajuste l'import
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  setTasks,
  removeTask,
  updateTask,
  addTask,
  clearTasks,
} from "../reducers/tasks";
import { logout } from "../reducers/user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** Petit util pour lire du JSON en tolérant les erreurs. */
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

function Home() {
  const dispatch = useDispatch();

  // Récupère le token et la liste de tâches depuis le store Redux
  const token = useSelector((s) => s.user.value.token);
  const tasks = useSelector((s) => s.tasks?.value) || [];

  // UI state
  const [isCreateOpen, setIsCreateOpen] = useState(false); // modale "Ajouter un suivi"
  const [facetsTick, setFacetsTick] = useState(0); // signal de refresh pour la sidebar
  const [loading, setLoading] = useState(false); // charge la liste initiale
  const [error, setError] = useState("");

  // =======================
  // FETCH initial des tasks
  // =======================
  useEffect(() => {
    // Si pas connecté → on vide et on ne fait rien
    if (!token) {
      dispatch(clearTasks());
      setLoading(false);
      setError("");
      return;
    }

    const ctrl = new AbortController();
    const fetchTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });

        // 401 → session invalide/expirée, on déconnecte proprement
        if (res.status === 401) {
          dispatch(logout());
          dispatch(clearTasks());
          setError("Session expirée. Merci de vous reconnecter.");
          return;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Erreur serveur (${res.status})`);
        }

        const data = await safeJson(res);
        dispatch(setTasks(Array.isArray(data) ? data : []));
      } catch (e) {
        if (e.name === "AbortError") return; // ignore si on a annulé la requête
        console.error("GET /tasks", e);
        setError(e.message || "Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    // Annule la requête si le composant se démonte ou si le token change
    return () => ctrl.abort();
  }, [token, dispatch]);

  // ===========================
  // Callback utilisé par filtre
  // Remplace la liste affichée
  // ===========================
  const onFiltered = useCallback(
    (list) => dispatch(setTasks(Array.isArray(list) ? list : [])),
    [dispatch]
  );

  // ==========
  // Groupes UI
  // ==========
  const groups = useMemo(
    () => ({
      DOING: tasks.filter((t) => t && t.status === "DOING"),
      TODO: tasks.filter((t) => t && t.status === "TODO"),
      PAUSED: tasks.filter((t) => t && t.status === "PAUSED"),
      DONE: tasks.filter((t) => t && t.status === "DONE"),
    }),
    [tasks]
  );

  // =======================
  // Actions rapides (POST)
  // =======================
  const postAction = useCallback(
    async (path) => {
      // Sécurité : si pas de token, on évite la requête
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // 401 → on déconnecte, on vide, on remonte une erreur lisible
      if (res.status === 401) {
        dispatch(logout());
        dispatch(clearTasks());
        throw new Error("Session expirée. Merci de vous reconnecter.");
      }

      const data = await safeJson(res);
      if (!res.ok) {
        const msg = (data && data.error) || `Erreur (${res.status})`;
        throw new Error(msg);
      }
      return data;
    },
    [token, dispatch]
  );

  // Wrappers par action (stabilisés avec useCallback)
  const onStart = useCallback(
    async (id) => dispatch(updateTask(await postAction(`/tasks/${id}/start`))),
    [dispatch, postAction]
  );
  const onFinish = useCallback(
    async (id) => dispatch(updateTask(await postAction(`/tasks/${id}/finish`))),
    [dispatch, postAction]
  );
  const onToReply = useCallback(
    async (id) =>
      dispatch(updateTask(await postAction(`/tasks/${id}/to-reply`))),
    [dispatch, postAction]
  );
  const onReplied = useCallback(
    async (id) =>
      dispatch(updateTask(await postAction(`/tasks/${id}/replied`))),
    [dispatch, postAction]
  );

  // ============
  // Edition task
  // ============
  const onPatch = useCallback(
    async (id, payload) => {
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        dispatch(logout());
        dispatch(clearTasks());
        throw new Error("Session expirée. Merci de vous reconnecter.");
      }
      const data = await safeJson(res);
      if (!res.ok)
        throw new Error((data && data.error) || `Erreur (${res.status})`);
      // ✅ met à jour le store (et donc l'UI) avec la task modifiée
      dispatch(updateTask(data));
      // Optionnel : ping la sidebar pour rafraîchir les facettes si forum/character changent
      setFacetsTick((n) => n + 1);
      return data;
    },
    [token, dispatch]
  );

  // ================
  // Suppression task
  // ================
  const onDelete = useCallback(
    async (id) => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          dispatch(logout());
          dispatch(clearTasks());
          throw new Error("Session expirée. Merci de vous reconnecter.");
        }

        if (!(res.status === 204 || res.ok)) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Suppression refusée");
        }

        // succès => on retire du store
        dispatch(removeTask(id));
        setFacetsTick((n) => n + 1);
      } catch (e) {
        console.error("DELETE /tasks/:id", e);
        alert(e.message || "Suppression impossible.");
      }
    },
    [token, dispatch]
  );

  // =================
  // Modale création
  // =================
  const openCreate = useCallback(() => setIsCreateOpen(true), []);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);
  const handleCreated = useCallback(
    (task) => {
      dispatch(addTask(task)); // ajoute la task dans la liste
      setFacetsTick((n) => n + 1); // demande à SidebarFilters de refetch ses facettes
    },
    [dispatch]
  );

  // Rendus d'états utiles (non connecté / chargement / erreurs / vides)
  // Rendus d'états utiles (non connecté / chargement / erreurs / vides)
  const NotLogged = !token && (
    <div className={styles.emptyState} role="status" aria-live="polite">
      <div className={styles.emptyCard}>
        <h2 className={styles.emptyTitle}>Bienvenue sur PlumeList</h2>
        <p className={styles.emptyText}>
          Garde le fil de tous tes RPs, vois en un clin d’œil qui doit répondre
          et organise tes suivis sans stress.
        </p>
        <p className={styles.emptyHint}>
          Connecte-toi (ou crée un compte) avec les boutons en haut à droite
          pour commencer.
        </p>
      </div>
    </div>
  );

  const Loading = loading && (
    <div className={styles.loadingState}>
      <p>Chargement des suivis…</p>
    </div>
  );

  const ErrorBlock = !!error && (
    <div className={styles.errorState} role="alert">
      <p>{error}</p>
    </div>
  );

  const EmptyColumns = token && !loading && !error && tasks.length === 0 && (
    <div className={styles.emptyState}>
      <div className={styles.emptyCard}>
        <p className={styles.emptyText}>Aucun suivi pour le moment.</p>
      </div>
    </div>
  );

  return (
    <div className={styles.parent}>
      {/* En-tête (auth, etc.) */}
      {/* En-tête (auth, etc.) */}
      <div className={styles.headerArea}>
        <Header />
      </div>

      {/* Sidebar latérale (logo, bouton, filtres) */}
      <div className={styles.leftPanel}>
        <div className={styles.logoBlock}>
          <img
            src="/plumelist.png"
            alt="PlumeList logo"
            className={styles.logo}
          />
          <div className={styles.titrePlume}>PlumeList</div>
        </div>

        <div>
          <button className={styles.addBtn} onClick={openCreate}>
            + Ajouter un suivi
          </button>
        </div>

        {/* Filtres visibles uniquement si connecté */}
        {token && (
          <SidebarFilters
            token={token}
            onResults={onFiltered}
            refreshKey={facetsTick} // ← signal pour demander un refetch interne
          />
        )}
      </div>

      {/* Zone principale : board + états de chargement/erreur */}
      <div className={styles.mainArea}>
        <div className={styles.contentContainer}>
          {NotLogged}
          {Loading}
          {ErrorBlock}
          {EmptyColumns}

          {/* Board visible si connecté + pas en erreur */}
          {token && !error && (
            <div className={styles.boardGrid}>
              {/* Colonne DOING */}
              <section className={styles.column}>
                <div className={styles.sectionHeader}>
                  <span className={`${styles.sectionPill} ${styles.pillDoing}`}>
                    <span className={styles.dot} />
                    En cours
                  </span>
                  <span className={styles.sectionCount}>
                    {groups.DOING.length}
                  </span>
                </div>

                <ul className={styles.tasksList}>
                  {groups.DOING.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onStart={onStart}
                      onFinish={onFinish}
                      onToReply={onToReply}
                      onReplied={onReplied}
                      onPatch={onPatch}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              </section>

              {/* Colonne TODO */}
              <section className={styles.column}>
                <div className={styles.sectionHeader}>
                  <span className={`${styles.sectionPill} ${styles.pillTodo}`}>
                    <span className={styles.dot} />À venir
                  </span>
                  <span className={styles.sectionCount}>
                    {groups.TODO.length}
                  </span>
                </div>

                <ul className={styles.tasksList}>
                  {groups.TODO.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onStart={onStart}
                      onFinish={onFinish}
                      onToReply={onToReply}
                      onReplied={onReplied}
                      onPatch={onPatch}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              </section>

              {/* Colonne PAUSED */}
              <section className={styles.column}>
                <div className={styles.sectionHeader}>
                  <span
                    className={`${styles.sectionPill} ${styles.pillPaused}`}
                  >
                    <span className={styles.dot} />
                    En pause
                  </span>
                  <span className={styles.sectionCount}>
                    {groups.PAUSED.length}
                  </span>
                </div>

                <ul className={styles.tasksList}>
                  {groups.PAUSED.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onDelete={onDelete}
                      onPatch={onPatch}
                      /* Pas de gestion "réponse" pour PAUSED */
                    />
                  ))}
                </ul>
              </section>

              {/* Colonne DONE */}
              <section className={styles.column}>
                <div className={styles.sectionHeader}>
                  <span className={`${styles.sectionPill} ${styles.pillDone}`}>
                    <span className={styles.dot} />
                    Terminé
                  </span>
                  <span className={styles.sectionCount}>
                    {groups.DONE.length}
                  </span>
                </div>

                <ul className={styles.tasksList}>
                  {groups.DONE.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onDelete={onDelete}
                      onToReply={onToReply}
                      onReplied={onReplied}
                      onPatch={onPatch}
                    />
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Modale "Ajouter un suivi" */}
      <AddTaskModal
        open={isCreateOpen}
        onClose={closeCreate}
        token={token}
        onCreated={handleCreated}
      />
      {/* Signature */}
      <div className={styles.signature}>
        © {new Date().getFullYear()} — Créé par{" "}
        <a
          href="https://github.com/Len0f"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>Caroline Viot</strong>
        </a>
      </div>
    </div>
  );
}

export default Home;
