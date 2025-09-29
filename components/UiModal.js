import React from "react";
import { Modal } from "antd";
import styles from "../styles/Modal.module.css";

/**
 * UiModal — enveloppe AntD avec skin PlumeList
 *
 * Props:
 *  - open        : bool
 *  - onClose     : fn
 *  - title       : string | node
 *  - children    : contenu (form inputs, texte, etc.)
 *  - primary     : { label, onClick, disabled, loading }
 *  - secondary   : { label, onClick, disabled }
 *  - footer      : node (si fourni, remplace les boutons primary/secondary)
 */
export default function UiModal({
  open,
  onClose,
  title,
  children,
  primary,
  secondary,
  footer,
}) {
  return (
    <Modal
      className={styles.modalWide}
      open={open}
      onCancel={onClose}
      title={null} // header custom (ci-dessous)
      footer={null} // pas de footer AntD par défaut
      closable={false} // supprime la croix AntD → on évite la “double croix”
      destroyOnClose
    >
      <div className={styles.modalShell}>
        {/* Titre + bouton fermer */}
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Corps */}
        <div className={styles.modalBodyPad}>{children}</div>

        {/* Footer : soit custom, soit boutons primaires/secondaires */}
        <div className={styles.modalFooter}>
          {footer ?? (
            <>
              {secondary && (
                <button
                  className={styles.btn}
                  onClick={secondary.onClick}
                  disabled={secondary.disabled}
                >
                  {secondary.label ?? "Annuler"}
                </button>
              )}
              {primary && (
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={primary.onClick}
                  disabled={primary.disabled}
                >
                  {primary.loading ? "…" : primary.label ?? "Valider"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
