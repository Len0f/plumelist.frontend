import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UiModal from "./UiModal";
import styles from "../styles/Header.module.css"; // boutons du header (inscription/connexion/déconnexion)
import modalStyles from "../styles/Modal.module.css"; // styles des modales (formError, etc.)
import { register, login, logout } from "../reducers/user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_KEY = "plumelist_user";

// persistance utilisateur
const saveUser = (u) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
};
const clearUser = () => {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
};
const normalizeEmail = (e) => (e || "").trim().toLowerCase();

export default function Header() {
  const dispatch = useDispatch();
  const { token, email, username } = useSelector((s) => s.user.value);
  const displayName = username || (email ? email.split("@")[0] : "");

  // états modales
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isRegisterVisible, setIsRegisterVisible] = useState(false);

  // erreurs UI
  const [errorLogin, setErrorLogin] = useState("");
  const [errorRegister, setErrorRegister] = useState("");

  // champs connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // champs inscription
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // helpers ouverture/fermeture
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

  // ===== Connexion =====
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
          email: normalizeEmail(loginEmail),
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.result)
        throw new Error(data.error || "Connexion refusée");

      const userPayload = {
        token: data.token,
        email: data.email || normalizeEmail(loginEmail),
        username: data.username || (data.email || loginEmail).split("@")[0],
      };
      dispatch(login(userPayload));
      saveUser(userPayload);
      setLoginEmail("");
      setLoginPassword("");
      closeLogin();
    } catch (e) {
      setErrorLogin(e.message || "Erreur de connexion");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ===== Inscription =====
  const pwdMismatch =
    !!regPassword && !!regPassword2 && regPassword !== regPassword2;

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword || !regPassword2) {
      setErrorRegister("Tous les champs sont requis.");
      return;
    }
    if (regPassword.length < 8) {
      setErrorRegister("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwdMismatch) {
      setErrorRegister("Les mots de passe ne correspondent pas.");
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
          email: normalizeEmail(regEmail),
          password: regPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
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
        email: data.email || normalizeEmail(regEmail),
        username: data.username || regUsername.trim(),
      };
      dispatch(register(userPayload));
      saveUser(userPayload);

      // reset des champs
      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setRegPassword2("");
      closeRegister();
    } catch (e) {
      setErrorRegister(e.message || "Erreur d’inscription");
    } finally {
      setIsRegistering(false);
    }
  };

  // ===== Déconnexion =====
  const handleLogout = () => {
    dispatch(logout());
    clearUser();
  };

  return (
    <header className={styles.header}>
      <div className={styles.auth}>
        {!token ? (
          <>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={openRegister}
            >
              Inscription
            </button>
            <button
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
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </>
        )}
      </div>

      {/* ===== Modale Connexion ===== */}
      <UiModal
        open={isLoginVisible}
        onClose={closeLogin}
        title="Connexion"
        primary={{
          label: isLoggingIn ? "Connexion…" : "Se connecter",
          onClick: handleLogin,
          disabled: isLoggingIn,
          loading: isLoggingIn,
        }}
        secondary={{
          label: "Annuler",
          onClick: closeLogin,
          disabled: isLoggingIn,
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          onKeyDown={(e) => onEnter(e, handleLogin)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          onKeyDown={(e) => onEnter(e, handleLogin)}
        />
        {errorLogin && (
          <div
            className={modalStyles.formError}
            role="alert"
            aria-live="polite"
          >
            {errorLogin}
          </div>
        )}
      </UiModal>

      {/* ===== Modale Inscription ===== */}
      <UiModal
        open={isRegisterVisible}
        onClose={closeRegister}
        title="Inscription"
        primary={{
          label: isRegistering ? "Inscription…" : "S'inscrire",
          onClick: handleRegister,
          disabled: isRegistering || pwdMismatch,
          loading: isRegistering,
        }}
        secondary={{
          label: "Annuler",
          onClick: closeRegister,
          disabled: isRegistering,
        }}
      >
        <input
          placeholder="Pseudo (obligatoire)"
          value={regUsername}
          onChange={(e) => setRegUsername(e.target.value)}
          onKeyDown={(e) => onEnter(e, handleRegister)}
          autoFocus
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
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={regPassword2}
          onChange={(e) => setRegPassword2(e.target.value)}
          onKeyDown={(e) => onEnter(e, handleRegister)}
        />

        {/* messages d'erreur / aide */}
        {pwdMismatch && (
          <div className={modalStyles.formError} role="alert">
            Les mots de passe ne correspondent pas.
          </div>
        )}
        {errorRegister && (
          <div
            className={modalStyles.formError}
            role="alert"
            aria-live="polite"
          >
            {errorRegister}
          </div>
        )}
      </UiModal>
    </header>
  );
}
