"use client";

/** Last-resort boundary when the root layout itself fails. Keeps styling self-contained. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 360, padding: 20 }}>
          <h1 style={{ fontSize: 20 }}>Relaydesk ran into a problem</h1>
          <p style={{ color: "#666", fontSize: 14 }}>Please try again. If it keeps happening, come back in a few minutes.</p>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
