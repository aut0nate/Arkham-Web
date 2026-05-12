# Arkham Web

## Introduction

Arkham Web is a static website for a fictitious company named Arkham, an AI product studio.

It is built for a small studio or personal brand that needs a clear public website, a practical service catalogue, and a simple contact.

## Features

- Responsive public pages for home, services, about, and contact.
- Service catalogue covering AI applications, automation, business intelligence, cloud migration, edge computing, and batch workloads.
- Contact enquiry form with browser-side validation and server-side validation.
- Optional Auth0 sign-in support when the required environment variables are provided.
- Docker-ready Node.js server for static hosting and the `/api/contact` endpoint.

## Stack

- Runtime: Node.js with npm.
- Server: Express.
- Frontend: HTML, CSS, and vanilla JavaScript.
- Styling: custom CSS with Bootstrap and Font Awesome assets.
- Storage: local JSON file at `data/contact_submissions.json` for contact submissions.
- Packaging: Docker.
- Deployment: Azure App Service for Containers using Azure Container Registry and GitHub Actions.

## Requirements

Before running this project, install:

- Node.js 18 or newer.
- npm.
- Docker, for container testing or server deployment.
- An Azure subscription with App Service for Containers and Azure Container Registry, for production deployment.

## Configuration (.env)

The site runs without a `.env` file for basic local testing. Create one only when you need to change the port, restrict CORS origins, or enable Auth0.

1. Create a local `.env` file:

    ```bash
    touch .env
    ```

2. Update `.env` with values for your local setup:

    ```bash
    PORT=3000
    BASE_URL=http://localhost:3000
    ALLOWED_ORIGINS=http://localhost:3000
    AUTH0_DOMAIN=
    AUTH0_CLIENT_ID=
    AUTH0_CLIENT_SECRET=
    AUTH0_AUDIENCE=
    AUTH0_ENTRA_CONNECTION=
    ```

Environment notes:

- `PORT` controls the local server port. If omitted, the server uses `3000`.
- `BASE_URL` sets the default public origin used by the server.
- `ALLOWED_ORIGINS` is a comma-separated list of browser origins allowed to call the API.
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` enable Auth0 routes when all three are set.
- `AUTH0_AUDIENCE` is returned to the frontend Auth0 configuration when provided.
- `AUTH0_ENTRA_CONNECTION` optionally points login to a specific Microsoft Entra connection.
- Contact submissions are stored locally in `./data/contact_submissions.json`; inside Docker this path is `/app/data/contact_submissions.json`.

## Test Locally

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create and update `.env` using the configuration steps above, if you need optional settings.

3. Start the site and API:

    ```bash
    npm start
    ```

4. Open `http://127.0.0.1:3000`.

5. Test the main pages:

    ```text
    http://127.0.0.1:3000/
    http://127.0.0.1:3000/service.html
    http://127.0.0.1:3000/about.html
    http://127.0.0.1:3000/contact.html
    ```

6. Before handing off changes, run:

    ```bash
    node --check server.js
    npm test
    ```

## Test Locally Using Docker

Docker is useful for checking the Node.js server in a container before deploying it. This repository has a `Dockerfile`, but no local Docker Compose file.

1. Build the Docker image:

    ```bash
    docker build -t arkham-web .
    ```

2. Start the container:

    ```bash
    docker run -d -p 8080:3000 --name arkham-web arkham-web
    ```

    The site will be available at `http://127.0.0.1:8080`.

3. Stop and remove the container when finished:

    ```bash
    docker stop arkham-web
    docker rm arkham-web
    ```

## Server Deployment

Server deployment depends on where the project is hosted. The server should run the tested container image with production configuration stored separately from the repository.

Use the structure that fits your own environment and preferred deployment methods. For public-facing access, put the service behind HTTPS using a reverse proxy such as Nginx Proxy Manager, Caddy, Traefik, a managed platform router, or another preferred option.

The current production target is Azure App Service for Containers on the F1 Container plan. Images are published to Azure Container Registry:

```text
arkham.azurecr.io/arkham-web:latest
arkham.azurecr.io/arkham-web:<commit-sha>
```

For Azure App Service deployment:

1. Create or open the Azure Web App for Containers.
2. Configure the Web App to use the `arkham` Azure Container Registry.
3. Configure the main site container:

    ```text
    Container name: main
    Image: arkham-web
    Tag: latest, or a deployed commit SHA
    Port: 3000
    Startup command: leave blank
    ```

4. Assign the Web App managed identity the `AcrPull` role on the `arkham` registry.
5. Add production application settings in the Web App:

    ```text
    PORT=3000
    BASE_URL=https://example.com
    ALLOWED_ORIGINS=https://example.com
    ```

6. Deploy through GitHub Actions after CI passes on `main`.
7. Verify the public URL after deployment.

Example production files:

- `Dockerfile`
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

After deployment, verify:

- The public homepage loads.
- The services, about, and contact pages load.
- Invalid contact forms show validation errors.
- Valid contact forms are saved to `data/contact_submissions.json`.

Back up contact submissions regularly from the server storage location that contains `data/contact_submissions.json`.

## GitHub Actions

- `CI` runs on pull requests, pushes to `main`, and manual dispatch.
- CI installs dependencies, checks `server.js`, runs `npm test`, and builds the Docker image.
- `Deploy to Azure` runs after `CI` succeeds on `main`, or by manual dispatch.
- CD logs in to Azure using OpenID Connect, pushes `latest` and commit SHA image tags to `arkham.azurecr.io`, updates the App Service `main` site container, sets `PORT=3000`, and restarts the Web App.
- Deployment credentials should be stored in GitHub Actions secrets, not committed to the repository.
- Production runtime values should live in Azure App Service application settings, not in workflow files.

Required GitHub Actions secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

Required GitHub Actions variables:

```text
AZURE_WEBAPP_NAME
AZURE_RESOURCE_GROUP
```

The GitHub Actions Azure identity needs `AcrPush` on the `arkham` registry and permission to update the Web App, such as `Website Contributor`. The Web App managed identity needs `AcrPull` on the `arkham` registry so Azure can pull the image at runtime.

## Security Notes

- Do not commit `.env`.
- Do not commit `data/contact_submissions.json` or other local contact submissions.
- Store production secrets in the deployment environment or GitHub Actions secrets, not in the repository.
- Use GitHub Actions OpenID Connect for Azure deployment instead of storing Azure client secrets.
- Restrict `ALLOWED_ORIGINS` in production to the public site origin.
- Rotate exposed secrets immediately.
- Public visitors should only see content that is intended to be public.

## AI-Assisted Development

Arkham Web was built with **OpenAI Codex using GPT-5.5**. This repository includes an [`AGENTS.md`](./AGENTS.md) file, which provides structured instructions and context for AI coding agents. It defines expectations, constraints, and project-specific guidance to help keep contributions consistent and reliable.

## Contributions

Contributions, ideas, and suggestions are welcome.

If you have improvements, feature ideas, or bug fixes, feel free to open an issue or submit a pull request. All contributions are appreciated and help improve the project.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
