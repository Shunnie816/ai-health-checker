"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export function HomeContent() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        AI Health Checker
      </h1>
      <p>ようこそ、{user?.displayName ?? user?.email} さん</p>
      <button
        type="button"
        onClick={handleSignOut}
        style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
      >
        ログアウト
      </button>
    </main>
  );
}
