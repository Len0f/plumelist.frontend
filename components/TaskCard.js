import React from "react";
import styles from "../styles/TaskCard.module.css";

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const formatName = (v) => (v && String(v).trim()) || "Nom du personnage";

export default function TaskCard({
  task,
  onDelete,
  onStart,
  onFinish,
  onToReply,
  onReplied,
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

  const isTodo = status === "TODO";
  const isDoing = status === "DOING";
  const needsReply = replyState === "TO_REPLY";

  return (
    <li className={`${styles.rowCard} ${styles[urgency]}`}>
      {/* Titre + perso */}
      {roleplayUrl ? (
        <a
          href={roleplayUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.rowTitle}
        >
          {title}
        </a>
      ) : (
        <span className={styles.rowTitle}>{title}</span>
      )}
      <span className={styles.rowDash}>—</span>
      <span className={styles.rowCharacter}>{formatName(character)}</span>

      {/* forum */}
      {forum && <span className={styles.badge}>{forum}</span>}

      {/* partenaires */}
      {partners?.length > 0 && (
        <div className={styles.chips}>
          {partners.map((p, i) => (
            <span key={`${_id}-p-${i}`} className={styles.chip}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* pousse actions à droite */}
      <div className={styles.rowSpacer} />

      {/* A répondre / Répondu : uniquement en cours */}
      {isDoing && (
        <button
          className={`${styles.tagBtn} ${needsReply ? styles.tagOn : ""}`}
          onClick={() => (needsReply ? onReplied?.(_id) : onToReply?.(_id))}
        >
          {needsReply ? "À répondre" : "Répondu"}
        </button>
      )}

      {/* dates */}
      <div className={styles.dates}>
        <u>
          <li>
            <span>Dern. mouv. : {formatDate(lastMoveAt)}</span>
          </li>
          <li>
            <span>Créé : {formatDate(createdAt)}</span>
          </li>
        </u>
      </div>

      {/* Flow principal */}
      {isTodo && (
        <button className={styles.primary} onClick={() => onStart?.(_id)}>
          Commencer
        </button>
      )}
      {isDoing && (
        <button className={styles.primary} onClick={() => onFinish?.(_id)}>
          Terminé
        </button>
      )}

      {/* delete */}
      <button
        className={styles.rowDelete}
        aria-label="Supprimer"
        title="Supprimer"
        onClick={() => onDelete?.(_id)}
      >
        ×
      </button>
    </li>
  );
}
