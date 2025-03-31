import { Router, Request, Response } from "express";
import { scrapeCoomer } from "../scrapy/coomer/scraper";
import { scrapeBunkr } from "../scrapy/bunkr/scraper";
import { scrapeErome } from "../scrapy/erome/scraper";
import { scrapeFapello } from "../scrapy/fapello/scraper";

const router = Router();

router.get(
  "/scrapy/fapello",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query.q as string;
      if (!q) {
        res.status(400).json({ message: "El parámetro 'q' es obligatorio." });
        return;
      }
      const result = await scrapeFapello(q);
      res.json(result);
    } catch (error) {
      console.error("❌ Error en la ruta /scrapy:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },
);

router.get(
  "/scrapy/coomer",
  async (req: Request, res: Response): Promise<void> => {
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
  },
);

router.get(
  "/scrapy/erome",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query.q as string;

      if (!q) {
        res.status(400).json({ message: "El parámetro 'q' es obligatorio." });
        return;
      }

      const result = await scrapeErome(q);
      res.json(result);
    } catch (error) {
      console.error("❌ Error en la ruta /scrapy:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },
);
router.get(
  "/scrapy/bunkr",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query.q as string;

      if (!q) {
        res.status(400).json({ message: "El parámetro 'q' es obligatorio." });
        return;
      }

      const result = await scrapeBunkr(q);
      res.json(result);
    } catch (error) {
      console.error("❌ Error en la ruta /scrapy:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  },
);

export default router;
