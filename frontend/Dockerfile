FROM node:20

WORKDIR /frontend

# Copiar archivos de dependencias desde la carpeta frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Instalamos pnpm globalmente
RUN npm install -g pnpm

# Instalamos dependencias con pnpm
RUN pnpm install --frozen-lockfile --prod

# Copiamos el resto del código
COPY frontend ./

# Construimos la aplicación
RUN pnpm build

# Exponer el puerto del frontend
EXPOSE 4321

# Asegurar que el servidor escuche en 0.0.0.0
CMD ["pnpm", "preview", "--host", "0.0.0.0"]
