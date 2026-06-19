import { prisma } from "@ilgam/database";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
