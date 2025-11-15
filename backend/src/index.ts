import "dotenv/config";
import { createServer } from "http";
import { connectDatabase } from "@/config/database";
import { createApp } from "@/app";

const port = Number(process.env.PORT || 4000);

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
