import { Router, Request, Response } from "express";
import { fetchDataByQuery } from "../service/db/fetchData.service";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

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

// Endpoint para obtener todas las queries buscadas
router.get("/queries", async (req: Request, res: Response) => {
  try {
    // Consultar todas las queries únicas en la tabla Model
    const queries = await prisma.model.findMany({
      select: {
        query: true, // Seleccionar solo el campo 'query'
      },
      distinct: ["query"], // Asegurarse de que las queries sean únicas
    });

    // Extraer solo las queries del resultado
    const queryList = queries.map((model) => model.query);

    // Devolver la lista de queries
    res.status(200).json({ queries: queryList });
  } catch (error) {
    console.error("Error al obtener las queries:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
export default router;
