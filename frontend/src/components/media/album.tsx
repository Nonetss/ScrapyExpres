import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Grid3x3, Film, ArrowUpRight } from "lucide-react";

interface AlbumData {
  id: number;
  scraper: string;
  modelId: number;
  article: Array<{
    id: number;
    albumId: number;
    url: string;
    images: Array<{ id: number; articleId: number; url: string }>;
    videos: Array<{ id: number; articleId: number; url: string }>;
  }>;
}

type ViewMode = "grid" | "carousel";

export function Album() {
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [viewportHeight, setViewportHeight] = useState(0);
  const [visibleItems, setVisibleItems] = useState(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("fetchData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setAlbums(parsedData.album || []);
      }

      // Obtener altura del viewport y actualizar al redimensionar
      const updateViewportHeight = () => {
        setViewportHeight(window.innerHeight);
      };

      updateViewportHeight();
      window.addEventListener("resize", updateViewportHeight);

      return () => {
        window.removeEventListener("resize", updateViewportHeight);
      };
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, entry.target.dataset.mediaId]));
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    const elements = document.querySelectorAll('.media-container');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Función para obtener todos los medios ordenados (videos primero)
  const getSortedMedia = (album: AlbumData) => {
    const allVideos = album.article.flatMap((article) =>
      article.videos.map((video) => ({
        type: "video",
        data: video,
        articleUrl: article.url,
      })),
    );

    const allImages = album.article.flatMap((article) =>
      article.images.map((image) => ({
        type: "image",
        data: image,
        articleUrl: article.url,
      })),
    );

    return [...allVideos, ...allImages];
  };

  // Función para ordenar los artículos con videos primero
  const sortArticlesByMedia = (articles) => {
    return [...articles].sort((a, b) => {
      if (a.videos.length > 0 && b.videos.length === 0) return -1;
      if (a.videos.length === 0 && b.videos.length > 0) return 1;
      return 0;
    });
  };

  if (albums.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No hay álbumes para mostrar.
      </p>
    );
  }

  // Calcular la altura del 80% del viewport
  const mediaHeight = `${viewportHeight * 0.8}px`;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">
          Galería de Contenido
        </h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "secondary"}
            onClick={() => setViewMode("grid")}
            className="gap-2 transition-all"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Cuadrícula</span>
          </Button>
          <Button
            variant={viewMode === "carousel" ? "default" : "secondary"}
            onClick={() => setViewMode("carousel")}
            className="gap-2 transition-all"
          >
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Carrusel</span>
          </Button>
        </div>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {albums.map((album) => {
          const totalImages = album.article.reduce(
            (sum, article) => sum + article.images.length,
            0,
          );
          const totalVideos = album.article.reduce(
            (sum, article) => sum + article.videos.length,
            0,
          );

          const sortedMedia = getSortedMedia(album);

          return (
            <AccordionItem
              key={album.id}
              value={`item-${album.id}`}
              className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="p-4 hover:no-underline group">
                <div className="flex items-center gap-3 ">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center text-white">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className=" flex   justify-between">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {album.scraper.split("-")[0].toUpperCase()} - Álbum{" "}
                      {album.id}
                    </h3>
                    <a
                      href={album.albumUrl}
                      target="_blank"
                      rel="noopener"
                      className=" text-primary text-sm flex items-center gap-1"
                    >
                      Ver video original
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <p className="text-sm text-muted-foreground">
                      {totalVideos > 0 &&
                        `${totalVideos} Video${totalVideos > 1 ? "s" : ""}`}
                      {totalVideos > 0 && totalImages > 0 && " • "}
                      {totalImages > 0 &&
                        `${totalImages} Imagen${totalImages > 1 ? "es" : ""}`}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                {viewMode === "carousel" ? (
                  <div className="relative py-6">
                    <Carousel className="w-full mx-auto">
                      <CarouselContent>
                        {sortedMedia.map((media, index) => (
                          <CarouselItem key={`${media.type}-${media.data.id}`}>
                            <div className="p-2">
                              <div className="relative bg-background rounded-xl shadow-lg overflow-hidden group media-container" data-media-id={`${media.type}-${media.data.id}`}>
                                {media.type === "video" ? (
                                  <div
                                    className="relative"
                                    style={{ height: mediaHeight }}
                                  >
                                    <video
                                      controls
                                      preload="metadata"
                                      className="absolute inset-0 w-full h-full object-contain rounded-t-xl"
                                    >
                                      <source
                                        src={media.data.url}
                                        type="video/mp4"
                                      />
                                    </video>
                                  </div>
                                ) : (
                                  <div
                                    className="relative"
                                    style={{ height: mediaHeight }}
                                  >
                                    <img
                                      src={media.data.url}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-contain rounded-t-xl transition-transform group-hover:scale-105"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
                                  <div className="flex items-center justify-between text-white">
                                    <span className="inline-flex items-center gap-2">
                                      {media.type === "video" ? (
                                        <span className="bg-red-500 px-2 py-1 rounded-md text-xs font-medium">
                                          Video
                                        </span>
                                      ) : (
                                        <span className="bg-blue-500 px-2 py-1 rounded-md text-xs font-medium">
                                          Imagen
                                        </span>
                                      )}
                                      <span className="text-sm opacity-75">
                                        #{index + 1}
                                      </span>
                                    </span>
                                    <a
                                      href={media.articleUrl}
                                      target="_blank"
                                      rel="noopener"
                                      className="text-sm hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                      Origen
                                      <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {sortedMedia.length > 1 && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-full px-4">
                          <CarouselPrevious className="left-2 h-10 w-10" />
                          <CarouselNext className="right-2 h-10 w-10" />
                        </div>
                      )}
                    </Carousel>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
                    {sortArticlesByMedia(album.article).map((article) => (
                      <div key={article.id} className="space-y-4">
                        <div className="bg-background rounded-xl shadow-lg overflow-hidden group media-container" data-media-id={`article-${article.id}`}>
                          {article.videos.map((video) => (
                            <div
                              key={video.id}
                              className="relative"
                              style={{ height: mediaHeight }}
                            >
                              <video
                                controls
                                preload="metadata"
                                className="absolute inset-0 w-full h-full object-contain"
                              >
                                <source src={video.url} type="video/mp4" />
                              </video>
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener"
                                  className="text-white hover:text-primary text-sm flex items-center gap-1"
                                >
                                  Ver video original
                                  <ArrowUpRight className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                          {article.images.map((image) => (
                            <div
                              key={image.id}
                              className="relative group"
                              style={{ height: mediaHeight }}
                            >
                              <img
                                src={image.url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3">
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener"
                                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm flex items-center gap-1"
                                >
                                  Ver imagen original
                                  <ArrowUpRight className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
