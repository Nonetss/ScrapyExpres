import { chromium } from "@playwright/test";
import { saveItem } from "../../service/db/item.service";

export async function scrapeFapello(query: string) {
    console.log(`📌 Iniciando scraping para la query: ${query}`);
    const scraper = "fapello";
    const browser = await chromium.launch({
        timeout: 120000, // Aumentamos el timeout global a 2 minutos
    });

    try {
        const mainPage = await browser.newPage();
        await mainPage.goto(`https://fapello.com/search/${query}`, {
            waitUntil: "domcontentloaded", // Cambiamos a domcontentloaded en lugar de networkidle
            timeout: 60000,
        });

        // Esperamos a que aparezcan los enlaces
        await mainPage.waitForSelector("div[id] a", {
            timeout: 30000,
        });

        const enlaces = `https://fapello.com/${query}`

        console.log(`🔎 Encontrados ${enlaces.length} enlaces. Visitando uno por uno...`);

        let allData: any[] = [];

        for (const enlace of enlaces) {
            console.log(`🔗 Visitando: ${enlace}`);
            const page = await browser.newPage();

            try {
                // Configuramos timeouts más específicos
                await page.setDefaultTimeout(60000);
                await page.setDefaultNavigationTimeout(60000);

                // Intentamos navegar con reintentos
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts) {
                    try {
                        await page.goto(enlace, {
                            waitUntil: "domcontentloaded",
                            timeout: 60000,
                        });
                        break; // Si tiene éxito, salimos del bucle
                    } catch (error) {
                        attempts++;
                        console.log(`Intento ${attempts} fallido para ${enlace}`);
                        if (attempts === maxAttempts) throw error;
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos entre intentos
                    }
                }

                // Scroll con timeout más largo
                let previousHeight = 0;
                let currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
                let scrollAttempts = 0;
                const maxScrollAttempts = 10;

                while (previousHeight !== currentHeight && scrollAttempts < maxScrollAttempts) {
                    previousHeight = currentHeight;
                    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
                    await page.waitForTimeout(2000);
                    currentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
                    scrollAttempts++;
                }

                // Extraer contenido
                const imagenes = await page.$$eval(
                    "div a div img[src]",
                    (elements) => elements.map((el) => (el as HTMLImageElement).src),
                );
                const videos = await page.$$eval(
                    "video source",
                    (elements) => elements.map((el) => (el as HTMLSourceElement).src),
                );

                console.log(`Extraídos ${imagenes.length} imágenes y ${videos.length} videos en: ${enlace}`);

                if (imagenes.length > 0 || videos.length > 0) {
                    await saveItem(query, scraper, enlace, [
                        { articleURL: enlace, imagenes, videos },
                    ]);

                    allData.push({
                        album: enlace,
                        articles: [{ articleURL: enlace, imagenes, videos }],
                    });
                }
            } catch (error) {
                console.log(`⚠ Error en la página ${enlace}: ${(error as Error).message}`);
            } finally {
                await page.close().catch(() => { }); // Ignoramos errores al cerrar la página
            }
        }

        console.log("✅ Scraping finalizado y datos guardados en la base de datos.");
        return allData;
    } catch (error) {
        console.log(`❌ Error durante el scraping: ${(error as Error).message}`);
        return [];
    } finally {
        await browser.close().catch(() => { }); // Ignoramos errores al cerrar el navegador
    }
}
