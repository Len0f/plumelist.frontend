// pages/_app.js
import "../styles/globals.css";
import Head from "next/head";
import React from "react";
import { Provider, useDispatch } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import user from "../reducers/user";
import tasks from "../reducers/tasks";
import { login as loginAction } from "../reducers/user";

// Ant Design v5 : si tu es en v5, garde cette ligne.
import "antd/dist/reset.css"; // (si tu es en v4, remplace par "antd/dist/antd.css")

const store = configureStore({ reducer: { user, tasks } });
const STORAGE_KEY = "plumelist_user";

function AuthHydrator() {
  const dispatch = useDispatch();
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.token) dispatch(loginAction(u)); // remet {token,email,username} dans Redux
      }
    } catch {}
  }, [dispatch]);
  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Head>
        <title>PlumeList</title>
      </Head>
      <AuthHydrator />
      <Component {...pageProps} />
    </Provider>
  );
}
