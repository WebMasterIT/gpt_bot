# Базовый образ
FROM node:16-alpine

# Установка зависимостей
# Установка рабочего каталога
WORKDIR /app

# Копирование package.json и package-lock.json (если есть) в рабочий каталог
COPY package*.json ./

# Установка зависимостей    
# RUN npm install --production

# Установка зависимостей (2)
# RUN npm ci --only=production
RUN npm ci  


# Копирование приложения в контейнер
# (Копирование остальных файлов проекта в рабочий каталог)
COPY . .

# Установка переменной окружение для определения номера порта, который будет использоваться вашим приложением
ENV PORT = 3000

# Объяление порта, который будет использоваться вашим приложением
# EXPOSE $PORT


# Установка переменных окружения
ENV TELEGRAM_BOT_TOKEN=your_token_here
ENV NODE_ENV=production

# Команда для запуска приложения
CMD ["npm", "start"]


# Код для запуска Docker в консоли
# Собирает image 
# docker build -t boty .