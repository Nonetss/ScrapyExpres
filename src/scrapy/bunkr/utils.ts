import { Browser, Page } from "@playwright/test";

export interface ArticleResult {
  articleURL: string;
  imagenes: string[];
  videos: string[];
}

// Función para crear un pool de páginas
async function crearPool(browser: Browser, poolSize: number): Promise<Page[]> {
  const pages: Page[] = [];
  for (let i = 0; i < poolSize; i++) {
    pages.push(await browser.newPage());
  }
  return pages;
}

// Función para cerrar todas las páginas del pool
async function cerrarPool(pages: Page[]): Promise<void> {
  await Promise.all(pages.map((p) => p.close()));
}

// Función para obtener una página disponible del pool
async function getPageFromPool(pool: Page[]): Promise<Page> {
  // Si el pool está vacío, espera un momento hasta que se libere una página
  while (pool.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pool.pop()!;
}

// Procesa las URLs en paralelo usando un pool de páginas
export async function procesarEnParalelo(
  urls: string[],
  browser: Browser,
  poolSize: number = 20,
): Promise<ArticleResult[]> {
  // Crear el pool de páginas
  const pool = await crearPool(browser, poolSize);

  // Para cada URL, toma una página del pool, procesa la URL y devuelve la página al pool
  const tasks = urls.map(async (url) => {
    const page = await getPageFromPool(pool);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      // Simula scroll para cargar contenido
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      // Extrae imágenes y videos
      const imagenes: string[] = await page.$$eval(
        "main figure img",
        (elements: Element[]) =>
          elements.map((img) => (img as HTMLImageElement).src),
      );
      const videos: string[] = await page.$$eval(
        "video source",
        (elements: Element[]) =>
          elements.map((el) => (el as HTMLVideoElement).src),
      );
      console.log(
        `De ${url}: ${videos.length} videos y ${imagenes.length} imágenes`,
      );
      return { articleURL: url, imagenes, videos };
    } catch (error: unknown) {
      console.log(`⚠ Error al visitar ${url}: ${(error as Error).message}`);
      return { articleURL: url, imagenes: [], videos: [] };
    } finally {
      // Devuelve la página al pool para reutilizarla
      pool.push(page);
    }
  });

  // Espera a que todas las tareas se completen
  const results = await Promise.all(tasks);
  // Cierra las páginas restantes del pool
  await cerrarPool(pool);
  return results;
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
