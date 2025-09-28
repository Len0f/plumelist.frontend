import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "antd";
import { register, login, logout } from "../reducers/user";
import styles from "../styles/Header.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const STORAGE_KEY = "plumelist_user";
const saveUser = (u) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
};
const clearUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default function Header() {
  const dispatch = useDispatch();
  const { token, email, username } = useSelector((state) => state.user.value);
  const displayName = username || (email ? email.split("@")[0] : "");

  // Modales
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);

  // Gestion des erreurs
  const [errorLogin, setErrorLogin] = useState("");
  const [errorRegister, setErrorRegister] = useState("");

  // Champs de connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Champ d'inscription
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Helpers
  const openLogin = () => {
    setErrorLogin("");
    setIsLoginVisible(true);
  };
  const closeLogin = () => {
    setIsLoginVisible(false);
    setErrorLogin("");
  };

  const openRegister = () => {
    setErrorRegister("");
    setIsRegisterVisible(true);
  };
  const closeRegister = () => {
    setIsRegisterVisible(false);
    setErrorRegister("");
  };

  const onEnter = (e, action) => {
    if (e.key === "Enter") action();
  };

  // Actions
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setErrorLogin("Email et mot de passe requis.");
      return;
    }
    setErrorLogin("");
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/users/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.result)
        throw new Error(data.error || "Connexion refusée");

      const userPayload = {
        token: data.token,
        email: data.email || loginEmail.trim(),
        // fallback si l'API ne renvoie pas username
        username: data.username || (data.email || loginEmail).split("@")[0],
      };
      dispatch(login(userPayload));
      saveUser(userPayload); // ← persiste
      setLoginEmail("");
      setLoginPassword("");
      closeLogin();
    } catch (e) {
      setErrorLogin(e.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword) {
      setErrorRegister("Pseudo, email et mot de passe sont requis.");
      return;
    }
    setErrorRegister("");
    setIsRegistering(true);
    try {
      const res = await fetch(`${API_BASE}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.result) {
        const msg = data.error || "";
        if (/E11000/.test(msg) && /username/.test(msg))
          throw new Error("Ce pseudo est déjà pris.");
        if (/E11000/.test(msg) && /email/.test(msg))
          throw new Error("Cet email est déjà utilisé.");
        throw new Error(msg || "Inscription refusée");
      }

      const userPayload = {
        token: data.token,
        email: data.email || regEmail.trim(),
        username: data.username || regUsername.trim(),
      };
      dispatch(register(userPayload));
      saveUser(userPayload); // ← persiste
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      closeRegister();
    } catch (e) {
      setErrorRegister(e.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    clearUser(); // ← efface la session persistée
  };

  return (
    <header className={styles.header}>
      <div className={styles.auth}>
        {!token ? (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={openRegister}
            >
              Inscription
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={openLogin}
            >
              Connexion
            </button>
          </>
        ) : (
          <>
            <span className={styles.userBadge} title={email}>
              {displayName}
            </span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </>
        )}
      </div>

      {/* MODALE CONNEXION */}
      {isLoginVisible && (
        <div id="react-modals">
          <Modal
            getContainer="#react-modals"
            className={styles.modal}
            visible={isLoginVisible} /* AntD v4 */
            closable={false}
            footer={null}
            onCancel={closeLogin}
          >
            <div className={styles.modalHeader}>
              <h3>Connexion</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeLogin}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleLogin)}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleLogin)}
              />
              {errorLogin && (
                <p className={styles.error} aria-live="polite">
                  {errorLogin}
                </p>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Connexion…" : "Se connecter"}
                </button>
                <button type="button" onClick={closeLogin}>
                  Annuler
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* MODALE INSCRIPTION */}
      {isRegisterVisible && (
        <div id="react-modals">
          <Modal
            getContainer="#react-modals"
            className={styles.modal}
            visible={isRegisterVisible} /* AntD v4 */
            closable={false}
            footer={null}
            onCancel={closeRegister}
          >
            <div className={styles.modalHeader}>
              <h3>Inscription</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeRegister}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <input
                placeholder="Pseudo (obligatoire)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleRegister)}
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleRegister)}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleRegister)}
              />
              {errorRegister && (
                <p className={styles.error} aria-live="polite">
                  {errorRegister}
                </p>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? "Inscription…" : "S'inscrire"}
                </button>
                <button type="button" onClick={closeRegister}>
                  Annuler
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </header>
  );
}
