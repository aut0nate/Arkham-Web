# Arkham Web

[![Github Pages](https://img.shields.io/badge/github%20pages-121013?style=for-the-badge&logo=github&logoColor=white)](https://aut0nate.github.io/Arkham-Web/index.html)

Arkham Web is a static marketing site for a fictitious London‑based AI and automation consultancy called **Arkham**. It’s designed as a modern, responsive landing page plus supporting sub‑pages that you can use as:

- A sandbox for learning Git, CI/CD, Azure, and Docker
- A reference for layout, styling, and component structure
- A starting point for your own portfolio or product site

## Overview

The site is built with plain **HTML5**, **CSS3**, and **Bootstrap**, and is intentionally framework‑free so it’s easy to run anywhere (GitHub Pages, Azure Static Web Apps, Nginx, etc.).

The core experience is:

- A **hero landing page** that highlights Arkham’s value proposition around AI and automation, with a primary call‑to‑action and a large hero illustration.
- A **Services** grid showcasing six structured offerings, each with equal‑height cards and consistent “Read More” CTAs.
- **About**, **Team**, and **Contact** pages that flesh out the brand, story, and ways to get in touch.
- A shared **footer** with contact details, social links, and a simple email “Subscribe” form.

The layout is tuned to look good on desktops first (like a marketing site), but remains usable down to mobile widths.

## Features

- **Responsive layout**
  - Bootstrap grid plus custom CSS for a flexible hero section, service cards, and team layout.
  - Hero content and illustration are aligned and centered for large screens and stack cleanly on smaller devices.

- **Coherent Arkham brand**
  - Logo locked into the top‑left navbar on every page.
  - Consistent typography, colour palette, and hero treatment across Home, About, Services, Team, and Contact.
  - Buttons (CTAs, “Read More”, “View All”, Subscribe) share a unified style and 8px border radius.

- **Service catalogue**
  - Six equal‑height service cards in `service.html`:
    - Arkham Automate
    - Arkham AI App Builder
    - Arkham Consulting
    - Arkham Fraud Detect
    - Arkham Edge Computing
    - Arkham RPA
  - Each card has an icon, title, descriptive copy, and CTA.

- **Contact and subscription flows**
  - Contact page with a structured project enquiry form (name, email, company, phone, message, consent).
  - Footer email “Subscribe” form on all main pages (wired to `mailto:` for simplicity, easy to swap for a real endpoint).

- **Simple tech stack**
  - No build system or JS framework required.
  - Uses Bootstrap for layout, Font Awesome for icons, Google Fonts, and a small amount of vanilla JS for behaviour (e.g. current year, carousel/slider).

- **Deployment‑friendly**
  - Works as a static site (GitHub Pages, Azure Static Web Apps, Nginx, Apache).
  - Includes a Dockerfile for containerised hosting via Nginx.

## File Structure

Key files in the `Arkham-Web` folder:

- `index.html` – Home page / hero and high‑level overview.
- `about.html` – Company story, mission, and positioning (“We Are Arkham”).
- `service.html` – Detailed service cards for the six Arkham offerings.
- `team.html` – Leadership/team grid with photos and social links.
- `contact.html` – Project enquiry form and contact details.
- `css/bootstrap.css` – Bootstrap CSS.
- `css/style.css` – Main custom styles, hero layout, buttons, cards, etc.
- `css/responsive.css` – Additional responsive tweaks.
- `images/` – Logos, hero illustration, and service icons.
- `js/` – Any JavaScript used for basic interactivity.
- `Dockerfile` – Nginx‑based container image for the static site.

## Usage

You can run this static website by opening `index.html` directly in a browser or by serving it through a simple HTTP server.

### Option 1: Open Directly

1. Download or clone the repository:

   ```bash
   git clone https://github.com/aut0nate/Arkham-Web.git
   cd Arkham-Web
   ```

2. Double‑click index.html (or open it from your editor) in your browser.

### Option 2: Use a Local HTTP Server

If you prefer to run behind a local web server (recommended for testing relative paths and assets), you can use Python:

   ```bash
   cd Arkham-Web
   python3 -m http.server 8000
   ```

For Nginx or Apache, copy the contents of Arkham-Web into the appropriate document root (for example /var/www/html) and reload the server.

## Running with Docker

This project includes a Dockerfile that serves the site via Nginx.

Build the image:

   ```bash
   docker build -t arkham-web .
   ```

Run the container:

  ```bash
   docker run -d -p 8080:80 --name arkham-web arkham-web
   ```

Open http://localhost:8080 to view the site.

## Live Demo

GitHub Pages: [https://aut0nate.github.io/Arkham-Web/index.html](https://aut0nate.github.io/Arkham-Web/index.html)

(You can also deploy the same static assets to Azure Static Web Apps, Azure App Service with a container, or any other static host.)

## Contributing

Contributions are welcome! Ideas that fit nicely with this project:

- Visual refinements (typography, spacing, accessibility).
- Additional sections (FAQs, case studies, blog).
- Improved forms (real backend for contact/subscribe, validation).
- Better deployment examples (Azure pipelines, GitHub Actions, etc).

Fork the repo, create a feature branch, and open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Disclaimer

This project is for educational and personal use only. It is not intended for commercial purposes. It was created with the help of ChatGPT to support specific learning goals, including Azure cloud services, CI/CD pipelines, Docker, and Git‑based workflows.