# Этап сборки фронтенда
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Этап запуска через Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Копируем собранный React (статика)
COPY --from=build /app/dist .
# COPY --from=build /app/build . # если CRA

# Копируем конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
