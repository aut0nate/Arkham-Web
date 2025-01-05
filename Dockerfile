# Use the official Nginx image
FROM nginx:alpine

# Copy the website files into the Nginx default directory
COPY . /usr/share/nginx/html

# Expose port 80 to make the site accessible
EXPOSE 80
