// reducers/tasks.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: [] }; // value = tableau de tasks

export const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action) => {
      // remplace complètement la liste
      state.value = action.payload;
    },
    addTask: (state, action) => {
      // ajoute une nouvelle tâche
      state.value.push(action.payload);
    },
    updateTask: (state, action) => {
      // met à jour une tâche existante
      const index = state.value.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.value[index] = action.payload;
      }
    },
    removeTask: (state, action) => {
      // supprime une tâche
      state.value = state.value.filter((t) => t._id !== action.payload);
    },
    clearTasks: (state) => {
      state.value = [];
    },
  },
});

export const { setTasks, addTask, updateTask, removeTask, clearTasks } =
  tasksSlice.actions;
export default tasksSlice.reducer;
