import "dotenv/config";
import app from "./index.js";

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

app.listen(port, () => {
  console.warn(`API listening on port ${port}`);
});
