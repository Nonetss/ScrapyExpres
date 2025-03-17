import { Browser, Page } from "@playwright/test";

export interface ArticleResult {
  articleURL: string;
  imagenes: string[];
  videos: string[];
}

/**
 * Crea un pool de páginas.
 */
async function crearPool(browser: Browser, poolSize: number): Promise<Page[]> {
  const pages: Page[] = [];
  for (let i = 0; i < poolSize; i++) {
    pages.push(await browser.newPage());
  }
  return pages;
}

/**
 * Cierra todas las páginas del pool.
 */
async function cerrarPool(pages: Page[]): Promise<void> {
  await Promise.all(pages.map((p) => p.close()));
}

/**
 * Obtiene una página disponible del pool.
 * Si el pool está vacío, espera hasta que se libere una.
 */
async function getPageFromPool(pool: Page[]): Promise<Page> {
  while (pool.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pool.pop()!;
}

/**
 * Procesa una URL usando la página proporcionada.
 */
async function processUrlWithPage(
  url: string,
  page: Page,
): Promise<ArticleResult> {
  try {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    // Simular scroll para cargar contenido
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Extraer imágenes y videos
    const imagenes: string[] = await page.$$eval(
      "figure a img",
      (elements: Element[]) =>
        elements.map((img) => (img as HTMLImageElement).src),
    );
    const videos: string[] = await page.$$eval(
      "ul li a.post__attachment-link",
      (elements: Element[]) =>
        elements.map((a) => (a as HTMLAnchorElement).href),
    );
    console.log(
      `De ${url}: ${videos.length} videos y ${imagenes.length} imágenes`,
    );
    return { articleURL: url, imagenes, videos };
  } catch (error: unknown) {
    console.log(`⚠ Error al visitar ${url}: ${(error as Error).message}`);
    return { articleURL: url, imagenes: [], videos: [] };
  }
}

/**
 * Procesa las URLs en paralelo usando un pool de páginas.
 */
export async function procesarEnParalelo(
  urls: string[],
  browser: Browser,
  poolSize: number = 20,
): Promise<ArticleResult[]> {
  // Crear el pool de páginas
  const pool = await crearPool(browser, poolSize);

  // Para cada URL, toma una página disponible, procesa la URL y la devuelve al pool.
  const tasks = urls.map(async (url) => {
    const page = await getPageFromPool(pool);
    try {
      return await processUrlWithPage(url, page);
    } finally {
      // Devolver la página al pool para su reutilización
      pool.push(page);
    }
  });

  // Espera que todas las tareas se completen
  const results = await Promise.all(tasks);
  // Cierra todas las páginas del pool
  await cerrarPool(pool);
  return results;
}
