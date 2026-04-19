import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;

async function main() {
  await connectDB();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
