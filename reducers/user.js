import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: { token: null, email: null, username: null } };

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    register: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.username = action.payload.username;
    },
    login: (state, action) => {
      state.value.token = action.payload.token;
      state.value.email = action.payload.email;
      state.value.username = action.payload.username;
    },
    logout: (state) => {
      state.value.token = null;
      state.value.email = null;
      state.value.username = null;
    },
  },
});

export const { register, login, logout } = userSlice.actions;
export default userSlice.reducer;
