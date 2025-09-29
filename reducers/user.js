// reducers/user.js
// ----------------------------------------------------
// Slice Redux Toolkit pour gérer l'utilisateur connecté.
//
// Le state a la forme :
// { value: { token: string|null, email: string|null, username: string|null } }
//
// Actions fournies :
// - register : appelé après une inscription réussie
// - login    : appelé après une connexion réussie
// - logout   : supprime les infos (déconnexion)
// - setUser  : action générique (utile si on recharge depuis localStorage)
// - reset    : alias de logout (plus explicite dans certains cas)
// ----------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

// État initial : pas d'utilisateur connecté
const initialState = {
  value: {
    token: null,
    email: null,
    username: null,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    /** Après inscription → on remplit le state utilisateur */
    register: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.username = action.payload.username;
    },

    /** Après connexion → même effet que register */
    login: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.username = action.payload.username;
    },

    /** Déconnexion → on vide tout */
    logout: (state) => {
      state.value.token = null;
      state.value.email = null;
      state.value.username = null;
    },

    /** Générique : permet de définir l'utilisateur (utile depuis localStorage) */
    setUser: (state, action) => {
      state.value = { ...state.value, ...action.payload };
    },

    /** Alias de logout */
    reset: (state) => {
      state.value = { token: null, email: null, username: null };
    },
  },
});

// Export des actions (dispatchables depuis tes composants)
export const { register, login, logout, setUser, reset } = userSlice.actions;

// Export du reducer (à brancher dans le store Redux)
export default userSlice.reducer;
