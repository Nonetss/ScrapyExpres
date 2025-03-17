import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Importa el paquete cors
import scrapyRoutes from "./routes/scrapy.routes";
import fetchDataRoutes from "./routes/fetchData.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configura CORS para permitir cualquier origen
app.use(
  cors({
    origin: "*", // Permite cualquier origen
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Headers permitidos
    credentials: true, // Permite enviar cookies o credenciales
  }),
);

app.use(express.json());
app.use("/api", scrapyRoutes);
app.use("/api", fetchDataRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
