# Arkham Web

Welcome to the Arkham Web repository! This is a static website built for a fictitious company named Arkham. It features a fully responsive design with modern styling, making it ideal for use as a test site or a personal project.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [File Structure](#file-structure)
- [Usage](#usage)
- [Running with Docker](#running-with-docker)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Arkham Web is a simple, static website project that demonstrates clean design principles and responsiveness using modern web technologies such as HTML5, CSS3, and JavaScript. It includes pre-built pages such as:

- **Home**
- **About**
- **Services**
- **Contact**

This project is ideal for anyone looking for a pre-built website for testing purposes.

---

## Features

- **Fully Responsive Design**: Works seamlessly across different screen sizes and devices.
- **Clean, Modern UI**: Styled using Bootstrap and custom CSS for a professional look.
- **Easy to Customize**: The modular structure allows for straightforward customization.
- **Cross-Browser Compatibility**: Compatible with modern browsers, including Chrome, Firefox, and Edge.

---

## Usage

You can run this static website by opening the `index.html` file directly in a browser or by serving it through a simple HTTP server.

### **Option 1: Open Directly**

1. Download or clone the repository:

   ```bash
   git clone https://github.com/aut0nate/Arkham-Web.git
   ```
  
2. Open index.html in your browser.

### Option 2: Use a Local HTTP Server

If you'd prefer to serve the website locally using a proper web server, you can use **Nginx** or **Apache**. Below are simple steps to set up the site with either of these servers:

#### **Using Nginx**

1. **Install Nginx via your preferred package manager** (if not already installed):

   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Copy the website files to Nginx’s root directory:

   ```bash
   sudo cp -r /path/to/Arkham-Web/* /var/www/html/
   ```
  
3. Restart Nginx to apply changes:

   ```bash
   sudo systemctl restart nginx
   ```

4. Open your browser and go to <http://localhost>.

#### Using Apache

1. Install Apache via your preferred package manager (if not already installed):

   ```bash
   sudo apt update
   sudo apt install apache2
   ```

2. Copy the website files to Apache’s root directory:

   ```bash
   sudo cp -r /path/to/Arkham-Web/* /var/www/html/
   ```

3. Restart Apache to apply changes:

   ```bash
   sudo systemctl restart apache2
   ```

4. Open your browser and go to <http://localhost>.

---

## Running with Docker

This project includes a Dockerfile that allows you to run the website in a lightweight Nginx container.

Steps to Run with Docker:

1. Build the Docker image:

   ```bash
   docker build -t arkham-web .
   ```

2. Run the Docker container:

   ```bash
    docker run -d -p 8080:80 --name arkham-web arkham-web
   ```

3. Open your browser and go to <http://localhost:8080>.

## Contributing

Contributions are welcome! If you'd like to improve the design, add new features, or fix any issues, feel free to fork this repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

**Disclaimer:** This project is for educational and personal use only. It is not intended for commercial purposes.I am not a professional web developer, I used ChatGPT to assist in building this website to support specific use cases, including learning more about Azure Cloud Services, Azure DevOps, CI/CD pipelines, and version control using Git.
