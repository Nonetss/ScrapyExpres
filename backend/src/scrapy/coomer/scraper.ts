import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";
import { procesarEnParalelo } from "./utils";

export async function scrapeCoomer(query: string) {
  console.log(`📌 Iniciando scraping para la query: ${query}`);
  const scraper = "coomer";
  const browser = await chromium.launch();

  try {
    const mainPage = await browser.newPage();
    await mainPage.goto(`https://coomer.su/artists?q=${query}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const enlaces = await mainPage.$$eval("a.user-card", (elements) =>
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
        await page.goto(enlace, { waitUntil: "networkidle", timeout: 60000 });
        await page.waitForSelector("article", { timeout: 10000 });
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(2000);

        // Procesamos cada página de paginación como un álbum
        let continuarPaginacion = true;
        while (continuarPaginacion) {
          // Usamos la URL actual de la página de paginación como identificador del álbum
          const currentUrl = page.url();

          // Extraemos los enlaces de artículos de la página actual
          const articleLinks = await page.$$eval(
            "article a.fancy-link--kemono",
            (elements) => elements.map((el) => (el as HTMLAnchorElement).href),
          );

          console.log(
            `📌 ${articleLinks.length} artículos encontrados en: ${currentUrl}`,
          );

          // Procesamos los artículos en paralelo
          const articleResults = await procesarEnParalelo(
            articleLinks,
            browser,
            5,
          );

          // Guardamos el álbum de esta página de paginación
          await saveItem(query, scraper, currentUrl, articleResults);
          allData.push({ album: currentUrl, articles: articleResults });

          // Verificamos si existe una siguiente página de paginación
          const nextLinks = await page.$$eval("menu a.next", (elements) =>
            elements.map((el) => (el as HTMLAnchorElement).href),
          );

          if (nextLinks.length > 0) {
            const nextLink = nextLinks[0];
            console.log(`➡️ Navegando a la siguiente página: ${nextLink}`);
            try {
              await page.goto(nextLink, {
                waitUntil: "networkidle",
                timeout: 60000,
              });
            } catch (error) {
              console.log(
                `⚠ Error al cargar ${nextLink}: ${(error as Error).message}. Terminando paginación.`,
              );
              break;
            }
            await page.evaluate(() =>
              window.scrollTo(0, document.body.scrollHeight),
            );
            await page.waitForTimeout(2000);
          } else {
            continuarPaginacion = false;
          }
        }
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
