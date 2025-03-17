import { Browser, Page } from "@playwright/test";

export interface ArticleResult {
  articleURL: string;
  imagenes: string[];
  videos: string[];
}

export async function procesarEnParalelo(
  urls: string[],
  browser: Browser,
  limite: number = 5,
): Promise<ArticleResult[]> {
  let resultados: ArticleResult[] = [];
  let tareasActivas: Promise<ArticleResult>[] = [];

  for (const url of urls) {
    const tarea = (async (): Promise<ArticleResult> => {
      const nuevaPagina: Page = await browser.newPage();
      try {
        await nuevaPagina.goto(url, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
        // Simular scroll para cargar contenido
        await nuevaPagina.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await nuevaPagina.waitForTimeout(2000);
        // Extraer imágenes y videos
        const imagenes: string[] = await nuevaPagina.$$eval(
          "main figure img",
          (elements: Element[]) =>
            elements.map((img) => (img as HTMLImageElement).src),
        );
        const videos: string[] = await nuevaPagina.$$eval(
          "video source",
          (elements: Element[]) =>
            elements.map((a) => (a as HTMLVideoElement).src),
        );
        console.log(
          `De ${url}: ${videos.length} videos y ${imagenes.length} imágenes`,
        );
        return { articleURL: url, imagenes, videos };
      } catch (error: unknown) {
        console.log(`⚠ Error al visitar ${url}: ${(error as Error).message}`);
        return { articleURL: url, imagenes: [], videos: [] };
      } finally {
        await nuevaPagina.close();
      }
    })();

    tareasActivas.push(tarea);

    if (tareasActivas.length >= limite) {
      // Envuelve cada promesa para obtener su índice cuando se resuelva.
      const indexedPromises = tareasActivas.map((p, index) =>
        p.then((result) => ({ index, result })),
      );
      const { index, result } = await Promise.race(indexedPromises);
      resultados.push(result);
      // Elimina la promesa que ya se resolvió usando su índice.
      tareasActivas.splice(index, 1);
    }
  }

  const ultimosResultados = await Promise.all(tareasActivas);
  resultados.push(...ultimosResultados);
  return resultados;
}

export async function closeAllOtherPages(mainPage: Page): Promise<void> {
  const pages = mainPage.context().pages();
  for (const p of pages) {
    if (p !== mainPage && !p.isClosed()) {
      try {
        await p.close();
        console.log("Cerrada página extra.");
      } catch (error: unknown) {
        console.log(
          `⚠ Error al cerrar una página: ${(error as Error).message}`,
        );
      }
    }
  }
}
