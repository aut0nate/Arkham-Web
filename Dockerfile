# Use a lightweight Node.js image to serve static content and the API
FROM node:18-alpine

WORKDIR /app

COPY package.json ./

# Install production dependencies (none by default) to support the API runtime
RUN npm install --production=false

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
