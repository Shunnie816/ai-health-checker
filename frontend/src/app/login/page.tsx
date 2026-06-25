"use client";

export default function LoginPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
        AI Health Checker
      </h1>
      {/* Google Sign-In は #22 で実装 */}
      <button
        type="button"
        disabled
        style={{ padding: "0.75rem 1.5rem", cursor: "not-allowed" }}
      >
        Google でログイン
      </button>
    </main>
  );
}
