import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    // Deletes demo sandboxes older than 24 hours (see src/app/api/cron/cleanup-demo).
    { path: "/api/cron/cleanup-demo", schedule: "0 4 * * *" },
  ],
};
