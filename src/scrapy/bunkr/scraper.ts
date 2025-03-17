import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";
import { procesarEnParalelo } from "./utils";

export async function scrapeBunkr(query: string) {
  console.log(`📌 Iniciando scraping para la query: ${query}`);
  const scraper = "bunkr";
  const browser = await chromium.launch();

  try {
    // Abrir la página principal de búsqueda
    const mainPage = await browser.newPage();
    await mainPage.goto(`https://bunkr-albums.io/?search=${query}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Extraer los enlaces de álbumes de la página principal
    const albumLinks = await mainPage.$$eval("main div div a", (elements) =>
      elements.map((el) => (el as HTMLAnchorElement).href),
    );
    console.log(
      `🔎 Encontrados ${albumLinks.length} enlaces. Visitando uno por uno...`,
    );

    let allData: any[] = [];

    // Para cada enlace de álbum, recorremos sus páginas de paginación
    for (const albumLink of albumLinks) {
      console.log(`🔗 Visitando álbum: ${albumLink}`);
      let currentUrl = albumLink; // URL de la página actual (inicia con el enlace del álbum)
      let albumDataForThisAlbum: any[] = [];
      let continuePagination = true;

      while (continuePagination) {
        const page = await browser.newPage();
        try {
          await page.goto(currentUrl, {
            waitUntil: "networkidle",
            timeout: 60000,
          });
          // Espera a que cargue el selector que indica que la página tiene contenido (ajusta según la página)
          await page.waitForSelector("div.grid div div a", {
            timeout: 10000,
            state: "attached",
          });

          // Extraer enlaces de artículos de la página actual
          const articleLinks = await page.$$eval(
            "div.grid div div a",
            (elements) => elements.map((el) => (el as HTMLAnchorElement).href),
          );
          console.log(
            `📌 ${articleLinks.length} artículos encontrados en: ${currentUrl}`,
          );

          // Procesar artículos en paralelo
          const articleResults = await procesarEnParalelo(
            articleLinks,
            browser,
            5,
          );

          // Guardar la página actual (como álbum) en la base de datos
          await saveItem(query, scraper, currentUrl, articleResults);
          albumDataForThisAlbum.push({
            album: currentUrl,
            articles: articleResults,
          });

          // Buscar enlace a la siguiente página de paginación
          const nextLinks = await page.$$eval("a.ic-arrow-right", (elements) =>
            elements.map((el) => (el as HTMLAnchorElement).href),
          );
          if (nextLinks.length > 0) {
            currentUrl = nextLinks[0];
            console.log(`➡️ Navegando a la siguiente página: ${currentUrl}`);
          } else {
            continuePagination = false;
          }
        } catch (error) {
          console.log(
            `⚠ Error en la página ${currentUrl}: ${(error as Error).message}`,
          );
          continuePagination = false;
        } finally {
          await page.close();
        }
      }
      // Acumular los datos de este álbum (con todas sus paginaciones)
      allData.push(...albumDataForThisAlbum);
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
