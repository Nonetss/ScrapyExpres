import express from "express";
import dotenv from "dotenv";
import scrapyRoutes from "./routes/scrapy.routes";
import fetchDataRoutes from "./routes/fetchData.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", scrapyRoutes);
app.use("/api", fetchDataRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
