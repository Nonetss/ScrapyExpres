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

    let allData = [];

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

        let allArticleResults = [];
        let continuarPaginacion = true;

        while (continuarPaginacion) {
          const articleLinks = await page.$$eval(
            "article a.fancy-link--kemono",
            (elements) => elements.map((el) => (el as HTMLAnchorElement).href),
          );

          console.log(
            `📌 ${articleLinks.length} artículos encontrados en: ${page.url()}`,
          );

          const resultados = await procesarEnParalelo(articleLinks, browser, 5);
          allArticleResults.push(...resultados);

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

        await saveItem(query, scraper, enlace, allArticleResults);
        allData.push({ enlace, articles: allArticleResults });
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
