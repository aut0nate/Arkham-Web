# Use a lightweight Node.js image to serve static content and the API
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install only the dependencies needed to run the site and API
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
