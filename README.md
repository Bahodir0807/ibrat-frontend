# ibrat-frontend

React + Vite frontend for the Ibrat education panel.

## Run

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

## cPanel deploy

Frontend is prepared for static cPanel hosting.

What is already added:

- SPA rewrite rules in [`public/.htaccess`](/D:/MyProjects/ibrat-frontend/public/.htaccess)
- deployment script [`scripts/cpanel-deploy.mjs`](/D:/MyProjects/ibrat-frontend/scripts/cpanel-deploy.mjs)
- auto-deploy recipe [`.cpanel.yml`](/D:/MyProjects/ibrat-frontend/.cpanel.yml)
- production env template [`.env.production.example`](/D:/MyProjects/ibrat-frontend/.env.production.example)

Default deploy target:

- `$HOME/public_html`

If you need another target directory, set one of these environment variables before deploy:

- `CPANEL_FRONTEND_TARGET`
- `DEPLOY_TARGET`

Manual deploy flow:

```bash
npm install
npm run build:cpanel
npm run deploy:cpanel
```

Before production build, create `.env.production` from `.env.production.example` and set your real API URL.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
