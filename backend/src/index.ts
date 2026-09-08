import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import routes from "./routes/routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// health check — hit this first to confirm the server is alive
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "SIH 26191 backend running" });
});

app.use("/api", routes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
