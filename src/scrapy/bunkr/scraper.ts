import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";
import { procesarEnParalelo } from "./utils";

export async function scrapeBunkr(query: string) {
  console.log(`📌 Iniciando scraping para la query: ${query}`);
  const scraper = "bunkr";
  const browser = await chromium.launch();

  try {
    // 1. Paginación en la búsqueda principal
    let currentSearchPage = 1;
    let searchHasNextPage = true;
    const allAlbumLinks: string[] = [];

    const searchPage = await browser.newPage();

    while (searchHasNextPage) {
      await searchPage.goto(
        `https://bunkr-albums.io/?search=${query}&page=${currentSearchPage}`,
        { waitUntil: "networkidle", timeout: 60000 },
      );

      // Extraer enlaces de álbumes
      const albumLinks = await searchPage.$$eval("main div div a", (elements) =>
        elements.map((el) => (el as HTMLAnchorElement).href),
      );

      // Si no hay álbumes en la página, detener la paginación
      if (albumLinks.length === 0) {
        console.log(
          `🚫 No se encontraron álbumes en la página ${currentSearchPage}. Deteniendo paginación.`,
        );
        searchHasNextPage = false;
        break;
      }

      allAlbumLinks.push(...albumLinks);
      console.log(
        `🔎 Página ${currentSearchPage}: ${albumLinks.length} álbumes encontrados`,
      );

      // Verificar si hay siguiente página
      const nextPageDisabled = await searchPage.$("a.ic-arrow-right.disabled");
      searchHasNextPage = !nextPageDisabled;
      currentSearchPage++;
    }

    await searchPage.close();
    console.log(`✅ Total de álbumes encontrados: ${allAlbumLinks.length}`);

    // 2. Procesar cada álbum
    let allData: any[] = [];

    for (const albumLink of allAlbumLinks) {
      console.log(`\n🔗 Procesando álbum: ${albumLink}`);
      const albumPage = await browser.newPage();

      try {
        // Obtener contenido principal del álbum
        await albumPage.goto(albumLink, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        // Procesar elementos del álbum
        const articleLinks = await albumPage.$$eval(
          "div.grid div div a",
          (elements) => elements.map((el) => (el as HTMLAnchorElement).href),
        );

        // Procesar en paralelo
        const articleResults = await procesarEnParalelo(
          articleLinks,
          browser,
          5,
        );

        // Guardar en base de datos
        await saveItem(query, scraper, albumLink, articleResults);
        allData.push(...articleResults);
      } catch (error) {
        console.log(
          `⚠ Error procesando álbum ${albumLink}: ${(error as Error).message}`,
        );
      } finally {
        await albumPage.close();
      }
    }

    console.log("✅ Scraping finalizado correctamente");
    return allData;
  } catch (error) {
    console.log(`❌ Error durante el scraping: ${(error as Error).message}`);
    throw error;
  } finally {
    await browser.close();
  }
}
