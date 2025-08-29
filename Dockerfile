# Этап сборки фронтенда
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Отладка: проверим, что dist/ собрался
RUN ls -la /app/dist

# Этап запуска через Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Копируем собранный Vite-проект
COPY --from=build /app/dist .

# Отладка: проверим, что файлы попали в html/
RUN ls -la /usr/share/nginx/html

# Копируем конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
