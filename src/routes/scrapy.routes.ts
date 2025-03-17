import { Router, Request, Response } from "express";
import { scrapeCoomer } from "../scrapy/coomer/scraper";

const router = Router();

router.get("/scrapy", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;

    if (!q) {
      res.status(400).json({ message: "El parámetro 'q' es obligatorio." });
      return;
    }

    const result = await scrapeCoomer(q);
    res.json(result);
  } catch (error) {
    console.error("❌ Error en la ruta /scrapy:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default router;
