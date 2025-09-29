import React, { useMemo, useState, useCallback } from "react";
import styles from "../styles/TaskCard.module.css";
import TaskEditModal from "./TaskEditModal";
import UiModal from "./UiModal";

/** dd/mm/yy ou "—" */
const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
};

const formatName = (v) => (v && String(v).trim()) || "Nom du personnage";
const normalizeUrl = (u) => {
  if (!u) return "";
  try {
    new URL(u);
    return u;
  } catch {
    return `http://${u}`;
  }
};

export default function TaskCard({
  task,
  onDelete,
  onStart,
  onFinish,
  onToReply,
  onReplied,
  onPatch, // (id, payload) => Promise
  allowEditCreatedAt = true,
  allowEditLastMoveAt = true,
}) {
  if (!task) return null;

  const {
    _id,
    title = "Titre du rp",
    roleplayUrl,
    character,
    forum,
    partners = [],
    status = "",
    replyState = "REPLIED",
    urgency = "normal",
    createdAt,
    lastMoveAt,
  } = task;

  const isDoing = status === "DOING";
  const isTodo = status === "TODO";
  const isPaused = status === "PAUSED";
  const isDone = status === "DONE";
  const needsReply = replyState === "TO_REPLY";
  const safeUrl = useMemo(() => normalizeUrl(roleplayUrl), [roleplayUrl]);

  const [pending, setPending] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleStart = useCallback(async () => {
    if (!onStart || pending) return;
    try {
      setPending(true);
      await onStart(_id);
    } finally {
      setPending(false);
    }
  }, [onStart, _id, pending]);

  const handleFinish = useCallback(async () => {
    if (!onFinish || pending) return;
    try {
      setPending(true);
      await onFinish(_id);
    } finally {
      setPending(false);
    }
  }, [onFinish, _id, pending]);

  const handleToggleReply = useCallback(async () => {
    if (pending) return;
    try {
      setPending(true);
      if (needsReply) await onReplied?.(_id);
      else await onToReply?.(_id);
    } finally {
      setPending(false);
    }
  }, [needsReply, onReplied, onToReply, _id, pending]);

  const handleDelete = useCallback(async () => {
    if (!onDelete || pending) return;
    if (!confirm("Supprimer ce suivi ?")) return;
    try {
      setPending(true);
      await onDelete(_id);
    } finally {
      setPending(false);
    }
  }, [onDelete, _id, pending]);

  return (
    <>
      <li
        className={`${styles.rowCard} ${
          isPaused
            ? styles.paused
            : isDone
            ? styles.done
            : isTodo
            ? styles.todo
            : styles[urgency]
        }`}
        title={
          isPaused
            ? "En pause"
            : isTodo
            ? "À venir"
            : isDone
            ? "Terminé"
            : urgency === "red"
            ? "Très ancien (> 30 jours)"
            : urgency === "orange"
            ? "Ancien (14–30 jours)"
            : "Récent (< 14 jours)"
        }
      >
        {/* Col 1 — Ligne 1 : Titre */}
        <div className={styles.cTitle}>
          {roleplayUrl ? (
            <a
              className={styles.rowTitle}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={safeUrl}
            >
              {title}
            </a>
          ) : (
            <span className={styles.rowTitle}>{title}</span>
          )}
        </div>

        {/* Col 1 — Ligne 2 : Forum */}
        <div className={styles.cForum}>
          {forum ? (
            <span className={`${styles.badge} ${styles.forumBadge}`}>
              {forum}
            </span>
          ) : (
            <span className={styles.placeholder} />
          )}
        </div>

        {/* Col 2 — Ligne 1 : Personnage */}
        <div className={styles.cCharacter}>
          <span className={styles.rowCharacter}>{formatName(character)}</span>
        </div>

        {/* Col 2 — Ligne 2 : Bouton partenaires (ou placeholder) */}
        <div className={styles.cPartners}>
          {partners?.length > 0 ? (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setPartnersOpen(true)}
              aria-haspopup="dialog"
              aria-controls={`partners-${_id}`}
            >
              Partenaires ({partners.length})
            </button>
          ) : (
            <span className={styles.placeholder} />
          )}
        </div>

        {/* Col 3 — Ligne 1 : Dernier mouvement */}
        <div className={styles.cLast}>
          <span className={styles.meta}>
            Etat changé le : {formatDate(lastMoveAt)}
          </span>
        </div>

        {/* Col 3 — Ligne 2 : Créé le */}
        <div className={styles.cCreated}>
          <span className={styles.meta}>
            RP créé le : {formatDate(createdAt)}
          </span>
        </div>

        {/* Col 4 — Ligne 1 : Toggle À répondre / Répondu (placeholder sinon) */}
        <div className={styles.cReply}>
          {isDoing && !isPaused ? (
            <button
              type="button"
              className={`${styles.tagBtn} ${needsReply ? styles.tagOn : ""}`}
              onClick={handleToggleReply}
              disabled={pending}
              aria-pressed={needsReply}
              title={
                needsReply
                  ? "Marquer comme répondu"
                  : "Marquer comme à répondre"
              }
            >
              {needsReply ? "À répondre" : "Répondu"}
            </button>
          ) : (
            <span className={styles.placeholder} />
          )}
        </div>

        {/* Col 4 — Ligne 2 : Action principale */}
        <div
          className={`${styles.cPrimary} ${isTodo ? styles.cPrimarySpan : ""}`}
        >
          {isTodo && (
            <button
              type="button"
              className={`${styles.primary} ${styles.primaryStart}`}
              onClick={handleStart}
              disabled={pending}
              title="Passer en En cours"
            >
              Commencer
            </button>
          )}
          {isDoing && (
            <button
              type="button"
              className={`${styles.primary} ${styles.primaryFinish}`}
              onClick={handleFinish}
              disabled={pending}
              title="Passer en Terminé"
            >
              Terminé
            </button>
          )}
        </div>

        {/* Col 5 — Supprimer (centré sur 2 lignes) */}
        <div className={styles.cDelete}>
          <button
            type="button"
            className={styles.rowEdit}
            aria-label="Éditer"
            title="Éditer"
            onClick={() => setEditOpen(true)}
            disabled={pending}
          >
            ✎
          </button>
          <button
            type="button"
            className={styles.rowDelete}
            aria-label="Supprimer"
            title="Supprimer"
            onClick={handleDelete}
            disabled={pending}
          >
            ×
          </button>
        </div>
      </li>

      {/* Modale Partenaires */}
      <UiModal
        open={partnersOpen}
        onClose={() => setPartnersOpen(false)}
        title="Partenaires"
        primary={null}
        secondary={{ label: "Fermer", onClick: () => setPartnersOpen(false) }}
      >
        <ul id={`partners-${_id}`} className={styles.partnersList}>
          {partners.map((p, i) => (
            <li key={`${_id}-partner-${p}-${i}`}>{p}</li>
          ))}
        </ul>
      </UiModal>

      {/* Modale Édition */}
      <TaskEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        task={task}
        onPatch={onPatch}
        allowEditCreatedAt={allowEditCreatedAt}
        allowEditLastMoveAt={allowEditLastMoveAt}
      />
    </>
  );
}
