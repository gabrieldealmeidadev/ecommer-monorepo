FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY apps/api ./apps/api
RUN npm run db:generate -w apps/api && npm run build -w apps/api
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/api"]
