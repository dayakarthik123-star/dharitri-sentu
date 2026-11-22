# Deploying Dharitri Sentu to Render via GitHub

This project is a unified full-stack Node.js + Vite React application. In production, the Node.js server (`server/index.mjs`) serves both the backend REST APIs and the compiled Vite React frontend (`dist/`), ensuring zero CORS friction and persistent session cookies.

---

## Step 1: Push to GitHub

1. Open your terminal inside the project directory:
   ```bash
   cd dharitri-sentu-live
   ```

2. Initialize Git (if not already done) and stage all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Dharitri Sentu complete full-stack app"
   ```

3. Link your remote repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```

*(Note: `.env`, `node_modules/`, and SQLite runtime storage are properly ignored by `.gitignore` so your secrets and local storage won't be pushed).*

---

## Step 2: Deploy to Render

### Option A: Automatic Blueprint Deployment (Recommended)
Because this repository includes `render.yaml`, Render can configure the service automatically:
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will read `render.yaml` and set up the Web Service automatically with the correct build and start commands.
5. Click **Apply**.

---

### Option B: Manual Web Service Setup
If creating a Web Service manually:
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your GitHub repository.
3. Configure the settings:
   - **Name**: `dharitri-sentu`
   - **Region**: Choose Singapore (closest to India / Assam) or Oregon/Frankfurt.
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`

4. Add **Environment Variables** under the Environment tab:
   - `NODE_ENV` = `production`
   - `HOST` = `0.0.0.0`
   - `ENABLE_DEMO_ACCOUNTS` = `true`
   - `SIMULATE_CLAMAV` = `true`
   - `VITE_MAPTILER_API_KEY` = `1Er6BdS2HVkdpdxxG7dr` *(Active MapTiler Satellite Hybrid Key)*
   - `OPENROUTER_API_KEY` = *(Optional: your OpenRouter key for AI land valuation & due diligence)*

5. Click **Create Web Service**.

---

## Verification
- Once Render completes the build, your app will be live at `https://dharitri-sentu.onrender.com` (or your chosen URL).
- Healthcheck endpoint: `https://<your-render-url>/api/health` should return `{"ok": true}`.
