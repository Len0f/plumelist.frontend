// reducers/tasks.js
// ----------------------------------------------------
// Slice Redux Toolkit pour gérer la liste des tasks.
// Chaque task = { _id, title, forum, character, ... }.
//
// Le state a la forme : { value: [ {task}, {task}, ... ] }
//
// Actions fournies :
// - setTasks   : remplacer toute la liste
// - addTask    : ajouter une tâche (sans doublon)
// - updateTask : mettre à jour une tâche existante
// - removeTask : supprimer une tâche
// - clearTasks : vider la liste
// - reset      : alias de clearTasks (pratique pour logout)
// ----------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: [] };

export const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    /** Remplace complètement la liste */
    setTasks: (state, action) => {
      state.value = action.payload;
    },

    /** Ajoute une nouvelle tâche (évite les doublons) */
    addTask: (state, action) => {
      const exists = state.value.some((t) => t._id === action.payload._id);
      if (!exists) {
        state.value.push(action.payload);
      }
    },

    /** Met à jour une tâche existante */
    updateTask: (state, action) => {
      const index = state.value.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        // Ici on remplace tout l’objet.
        // Variante possible : fusionner (Object.assign) pour MAJ partielle.
        state.value[index] = action.payload;
      }
    },

    /** Supprime une tâche par son _id */
    removeTask: (state, action) => {
      state.value = state.value.filter((t) => t._id !== action.payload);
    },

    /** Vide la liste (utile quand l’utilisateur se déconnecte) */
    clearTasks: (state) => {
      state.value = [];
    },

    /** Alias de clearTasks (par convention on aime bien appeler reset) */
    reset: (state) => {
      state.value = [];
    },
  },
});

// Export des actions (dispatchables dans tes composants)
export const { setTasks, addTask, updateTask, removeTask, clearTasks, reset } =
  tasksSlice.actions;

// Export du reducer (à brancher dans le store Redux)
export default tasksSlice.reducer;
