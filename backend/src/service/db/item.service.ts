import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ArticleResult {
  articleURL: string;
  imagenes: string[];
  videos: string[];
}

export const saveItem = async (
  modelQuery: string,
  scraper: string,
  albumEnlace: string,
  articleResults: ArticleResult[],
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar o crear el Model según la query
    let model = await tx.model.findFirst({
      where: { query: modelQuery },
    });

    if (!model) {
      model = await tx.model.create({
        data: { query: modelQuery },
      });
    }

    let album = await tx.album.findFirst({
      where: {
        scraper: scraper,
        modelId: model.id,
        albumUrl: albumEnlace,
      },
    });

    if (!album) {
      album = await tx.album.create({
        data: {
          scraper: scraper,
          modelId: model.id,
          albumUrl: albumEnlace,
        },
      });
    }

    // 3. Procesar cada artículo obtenido
    for (const articleData of articleResults) {
      const { articleURL, imagenes, videos } = articleData;

      // Buscar o crear el Article
      let article = await tx.article.findFirst({
        where: {
          url: articleURL,
          albumId: album.id,
        },
      });

      if (!article) {
        article = await tx.article.create({
          data: {
            url: articleURL,
            albumId: album.id,
          },
        });
      }

      // 4. Insertar imágenes nuevas
      const existingImages = await tx.image.findMany({
        where: { url: { in: imagenes } },
      });

      const newImages = imagenes
        .filter((img) => !existingImages.some((e) => e.url === img))
        .map((url) => ({ url, articleId: article.id }));

      if (newImages.length > 0) {
        await tx.image.createMany({
          data: newImages,
          skipDuplicates: true, // Omite duplicados basados en el campo único 'url'
        });
      }

      // 5. Insertar videos nuevos
      const existingVideos = await tx.video.findMany({
        where: { url: { in: videos } },
      });

      const newVideos = videos
        .filter((vid) => !existingVideos.some((e) => e.url === vid))
        .map((url) => ({ url, articleId: article.id }));

      if (newVideos.length > 0) {
        await tx.video.createMany({
          data: newVideos,
          skipDuplicates: true, // Omite los registros duplicados basados en el campo único 'url'
        });
      }
    }

    return { message: "Item guardado correctamente" };
  });
};
