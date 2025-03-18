# Etapa 1: Construcción de la aplicación
FROM node:20-bookworm AS builder

# Instalar Playwright 1.51.0 y sus dependencias (esto descarga los navegadores necesarios)
RUN npx -y playwright@1.51.0 install --with-deps

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm@8.15.3

# Copiar archivos de configuración
COPY backend/package.json backend/pnpm-lock.yaml ./

# Instalar dependencias en modo producción (forzando la regeneración del lockfile si es necesario)
RUN pnpm install --prod --force

# Copiar el resto de la aplicación
COPY backend .

# Compilar la aplicación (por ejemplo, generar la carpeta dist)
RUN pnpm build

# Etapa 2: Imagen final para producción
FROM node:20-bookworm

# Instalar Playwright 1.51.0 y sus dependencias en la imagen final
RUN npx -y playwright@1.51.0 install --with-deps

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm@8.15.3

# Copiar la aplicación compilada desde la etapa de construcción
COPY --from=builder /app /app

# Exponer el puerto en el que corre el servidor (por ejemplo, 3000)
EXPOSE 3000

# Comando para ejecutar Prisma y luego iniciar el servidor
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && pnpm start"]
