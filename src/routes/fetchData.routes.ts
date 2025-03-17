import { Router, Request, Response } from "express";
import { fetchDataByQuery } from "../service/db/fetchData.service";

const router = Router();

router.get(
  "/fetch-data",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Extraer el parámetro 'q' o 'query'
      const query = (req.query.q as string) || (req.query.query as string);

      if (!query) {
        res
          .status(400)
          .json({ message: "El parámetro 'q' o 'query' es obligatorio." });
        return;
      }

      const data = await fetchDataByQuery(query);

      if (!data) {
        res
          .status(404)
          .json({ message: "No se encontraron datos para esta query." });
        return;
      }

      res.json(data);
    } catch (error) {
      console.error("❌ Error en /fetch-data:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },
);

export default router;
