import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/internal/is-ready")({
  server: {
    handlers: {
      GET: () => {
        return json({ ok: "ok" }, { status: 200 });
      },
    },
  },
});
