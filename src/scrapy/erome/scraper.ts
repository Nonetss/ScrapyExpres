import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";

export async function scrapeErome(query: string) {
  console.log(`📌 Iniciando scraping para la query: ${query}`);
  const scraper = "erome";
  const browser = await chromium.launch();

  try {
    const mainPage = await browser.newPage();
    await mainPage.goto(`https://www.erome.com/search?q=${query}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Extraer enlaces de álbumes (donde el álbum y el artículo son la misma URL)
    const enlaces = await mainPage.$$eval("a.album-link", (elements) =>
      elements.map((el) => (el as HTMLAnchorElement).href),
    );
    console.log(
      `🔎 Encontrados ${enlaces.length} enlaces. Visitando uno por uno...`,
    );

    let allData: any[] = [];

    for (const enlace of enlaces) {
      console.log(`🔗 Visitando: ${enlace}`);
      const page = await browser.newPage();
      try {
        // Navega a la URL del álbum
        await page.goto(enlace);

        // Una vez cargada la página, extrae las imágenes y videos
        const imagenes: string[] = await page.$$eval(
          "div.media-group div.img img[src]",
          (elements) => elements.map((el) => (el as HTMLImageElement).src),
        );
        const videos: string[] = await page.$$eval("video source", (elements) =>
          elements.map((el) => (el as HTMLSourceElement).src),
        );
        console.log(
          `Extraídos ${imagenes.length} imágenes y ${videos.length} videos en: ${enlace}`,
        );

        // Guardar en la base de datos:
        // En este caso, album y article son la misma URL, y se crea un artículo único.
        await saveItem(query, scraper, enlace, [
          { articleURL: enlace, imagenes, videos },
        ]);

        allData.push({
          album: enlace,
          articles: [{ articleURL: enlace, imagenes, videos }],
        });
      } catch (error) {
        console.log(
          `⚠ Error en la página ${enlace}: ${(error as Error).message}`,
        );
      } finally {
        await page.close();
      }
    }

    console.log(
      "✅ Scraping finalizado y datos guardados en la base de datos.",
    );
    return allData;
  } catch (error) {
    console.log(`❌ Error durante el scraping: ${(error as Error).message}`);
  } finally {
    await browser.close();
  }
}
