import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";

export async function scrapeFapello(query: string) {
    console.log(`📌 Iniciando scraping para la query: ${query}`);
    const scraper = "fapello";
    const browser = await chromium.launch();

    try {
        const mainPage = await browser.newPage();
        await mainPage.goto(`https://fapello.com/search/${query}`, {
            waitUntil: "networkidle",
            timeout: 60000,
        });

        // Extraer enlaces de álbumes (donde el álbum y el artículo son la misma URL)
        const enlaces = await mainPage.$$eval("div.bg-red-400.max-w-full a", (elements) =>
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

                // Implementar scroll infinito
                let previousHeight = 0;
                let currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);

                while (previousHeight !== currentHeight) {
                    previousHeight = currentHeight;

                    // Hacer scroll hasta el final de la página
                    await page.evaluate(() => {
                        window.scrollTo(0, document.documentElement.scrollHeight);
                    });

                    // Esperar a que se cargue nuevo contenido
                    await page.waitForTimeout(1000); // Espera 2 segundos

                    // Obtener la nueva altura
                    currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
                }

                // Una vez completado el scroll, extraer las imágenes y videos
                const imagenes: string[] = await page.$$eval(
                    "div a div img[src]",
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
