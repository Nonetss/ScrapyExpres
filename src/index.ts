import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas de ejemplo
app.get("/", (req, res) => {
  res.send("¡Hola, Express con TypeScript!");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use("/api", userRoutes);
