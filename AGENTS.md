# Arkham Web Agent Guide

## Project Overview

Arkham Web is a static marketing site for Arkham, an AI product studio focused on practical AI applications, workflow automation, Power Platform delivery, and Azure services. The current visual direction is "Signal lab": dark, precise, technical, and restrained.

## Tools, Languages, And Frameworks

- Frontend: plain HTML, CSS, and vanilla JavaScript.
- Backend: Node.js with Express for static serving and the `/api/contact` endpoint.
- Styling: custom CSS in `css/style.css`; `css/responsive.css` is intentionally minimal.
- Brand mark: `images/arkham-logo.png` is the canonical Arkham logo.
- Service icons: inline SVG line icons, 64x64 viewBox, rounded strokes, CSS-controlled cyan and signal-green accents.

## Commands

- Install dependencies: `npm install`
- Start locally: `npm start`
- Syntax check server: `node --check server.js`
- Docker build: `docker build -t arkham-web .`
- Docker run: `docker run -d -p 8080:3000 --name arkham-web arkham-web`

## Code Style

- Use British English for all user-facing text, documentation, comments, labels, and examples.
- Keep the stack simple and command-line friendly.
- Prefer clear static HTML sections over unnecessary JavaScript rendering.
- Keep SVG service icons consistent: same frame, stroke weight, rounded caps/joins, and semantic `aria-label`.
- Do not tint the logo itself. Place the monochrome logo inside suitable light or dark containers.

## Testing Instructions

- Run `node --check server.js` after backend changes.
- Run `npm start` and test pages through `http://localhost:3000`.
- Verify home, services, approach, and contact pages on desktop and mobile widths.
- Confirm all 13 services render under Application, Power Platform, and Azure.
- Submit invalid and valid contact forms and verify local persistence in `data/contact_submissions.json`.

## Security Considerations

- Never commit `.env` files, tokens, keys, credentials, or local contact submissions.
- Keep secrets in environment variables.
- The contact endpoint currently stores submissions locally; production email, CRM, or database routing should be added deliberately and documented.
- Auth0 is optional and only enabled when all required Auth0 environment variables are present.

## Deployment Notes

- Optimise for local testing first.
- The Dockerfile packages the Node server and static site for VPS deployment.
- Keep assets local; do not depend on a CMS or remote asset host for core site rendering.
