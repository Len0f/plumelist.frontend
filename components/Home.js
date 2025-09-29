import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import TaskCard from "../components/TaskCard";
import AddTaskModal from "../components/AddTaskModal";
import SidebarFilters from "../components/SidebarFilter";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  setTasks,
  removeTask,
  updateTask,
  addTask,
  clearTasks,
} from "../reducers/tasks";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function Home() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.user.value.token);
  const tasks = useSelector((s) => s.tasks?.value) || [];
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [facetsTick, setFacetsTick] = useState(0); // ← signal de refresh

  // Charger les tasks
  useEffect(() => {
    if (!token) {
      dispatch(clearTasks());
      return;
    }
    fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => dispatch(setTasks(Array.isArray(data) ? data : [])))
      .catch(console.error);
  }, [token, dispatch]);

  // callback pour TasksFilters → remplace la liste affichée
  const onFiltered = useCallback(
    (list) => dispatch(setTasks(Array.isArray(list) ? list : [])),
    [dispatch]
  );

  // Groupes
  const groups = useMemo(
    () => ({
      DOING: tasks.filter((t) => t && t.status === "DOING"),
      TODO: tasks.filter((t) => t && t.status === "TODO"),
      DONE: tasks.filter((t) => t && t.status === "DONE"),
    }),
    [tasks]
  );

  // Actions rapides
  const post = (url) =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

  const onStart = async (id) =>
    dispatch(updateTask(await post(`${API_BASE}/tasks/${id}/start`)));
  const onFinish = async (id) =>
    dispatch(updateTask(await post(`${API_BASE}/tasks/${id}/finish`)));
  const onToReply = async (id) =>
    dispatch(updateTask(await post(`${API_BASE}/tasks/${id}/to-reply`)));
  const onReplied = async (id) =>
    dispatch(updateTask(await post(`${API_BASE}/tasks/${id}/replied`)));

  const onDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!(res.status === 204 || res.ok)) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Suppression refusée");
      }
      // succès => on retire du store
      dispatch(removeTask(id));
    } catch (e) {
      console.error("DELETE /tasks/:id", e);
      alert("Suppression impossible.");
    }
  };

  // Modale création
  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => setIsCreateOpen(false);
  const handleCreated = (task) => {
    dispatch(addTask(task)); // ajoute la task dans la liste
    setFacetsTick((n) => n + 1); // → demande à SidebarFilters de refetch les facettes
  };

  return (
    <div className={styles.parent}>
      <Header />

      {/* Sidebar */}
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
          <button onClick={openCreate}>+ Ajouter un suivi</button>
        </div>

        {token && (
          <SidebarFilters
            token={token}
            onResults={onFiltered}
            refreshKey={facetsTick} // ← on passe le signal
          />
        )}
      </div>

      {/* Zone Tasks */}
      <div className={styles.mainArea}>
        <div className={styles.boardGrid}>
          <section className={styles.column}>
            <h2>En cours</h2>
            <ul className={styles.tasksList}>
              {groups.DOING.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  onStart={onStart}
                  onFinish={onFinish}
                  onToReply={onToReply}
                  onReplied={onReplied}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>

          <section className={styles.column}>
            <h2>À venir</h2>
            <ul className={styles.tasksList}>
              {groups.TODO.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  onStart={onStart}
                  onFinish={onFinish}
                  onToReply={onToReply}
                  onReplied={onReplied}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>

          <section className={styles.column}>
            <h2>Terminé</h2>
            <ul className={styles.tasksList}>
              {groups.DONE.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  onDelete={onDelete}
                  onToReply={onToReply}
                  onReplied={onReplied}
                />
              ))}
            </ul>
          </section>
        </div>
      </div>

      <AddTaskModal
        open={isCreateOpen}
        onClose={closeCreate}
        token={token}
        onCreated={handleCreated}
      />
    </div>
  );
}

export default Home;
