import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const fetchDataByQuery = async (query: string) => {
  return await prisma.model.findFirst({
    where: { query },
    include: {
      album: {
        include: {
          article: {
            include: {
              images: true,
              videos: true,
            },
          },
        },
      },
    },
  });
};
