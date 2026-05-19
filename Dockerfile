FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    libexpat1-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 80
ENV PORT=80
ENV HOSTNAME=0.0.0.0
CMD ["npx", "next", "start", "-p", "80"]
