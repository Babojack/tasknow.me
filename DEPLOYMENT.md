# Deploying TaskNow to tasknow.me (IONOS domain)

This guide covers connecting your TaskNow app to your existing domain **tasknow.me** on IONOS.

---

## Option A: Deploy to Vercel or Netlify (recommended), use IONOS for DNS

This is the simplest way to get HTTPS, global CDN, and easy updates.

### 1. Deploy the app

**Vercel**

1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. Leave **Build Command** as `npm run build`, **Output Directory** as `dist`.
4. Add environment variables in **Settings → Environment Variables** if you use a backend:
   - `VITE_BACKEND_URL` = your API URL
5. Deploy. You’ll get a URL like `tasknow-demo-xxx.vercel.app`.

**Netlify**

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Build command: `npm run build`, publish directory: `dist`.
3. Add `VITE_BACKEND_URL` in **Site settings → Environment variables** if needed.
4. Deploy. You’ll get a URL like `xxx.netlify.app`.

### 2. Connect tasknow.me in the host

**Vercel**

- **Project → Settings → Domains** → add `tasknow.me` and `www.tasknow.me`.
- Vercel will show the DNS records you need (e.g. A record to `76.76.21.21` or CNAME for `www`).

**Netlify**

- **Domain management → Add custom domain** → add `tasknow.me` and `www.tasknow.me`.
- Netlify will show the required DNS records (e.g. A or CNAME).

### 3. Set DNS at IONOS

1. Log in to [IONOS](https://www.ionos.com) → **Domains & SSL** → select **tasknow.me**.
2. Open **Manage** (or **DNS**) for that domain.

**If you use Vercel/Netlify only for DNS (optional):**  
Switch the domain to their nameservers (Vercel/Netlify will tell you which). Then you manage DNS in their dashboard.

**If you keep IONOS nameservers:** add these records (replace with the values Vercel/Netlify show you):

| Type | Name / Host | Value / Target        |
|------|-------------|------------------------|
| A    | `@`         | (e.g. `76.76.21.21` for Vercel) |
| CNAME| `www`       | (e.g. `cname.vercel-dns.com` or your Netlify subdomain) |

3. Save. DNS can take from a few minutes up to 24–48 hours.
4. In Vercel/Netlify, trigger **Verify** for `tasknow.me` and `www.tasknow.me`. They will issue SSL for your domain.

After DNS and SSL are green, your app will be live at **https://tasknow.me**.

---

## Option B: Host on IONOS (Web Hosting)

If you want to host the app on IONOS (e.g. Web Hosting / static space):

### 1. Build the app

```bash
npm ci
npm run build
```

The output is in the **`dist`** folder.

### 2. Upload to IONOS

1. In IONOS: **Hosting** → your package → **File Manager** (or use FTP).
2. Open the **document root** (often `public_html` or the folder IONOS shows as “Web root” for your domain).
3. Upload **all contents** of `dist/` (including `index.html`, assets folder, and `.htaccess`) into that root.  
   - The file **`public/.htaccess`** is copied into `dist/` during build, so it will be uploaded with the rest. If not, upload the `.htaccess` from the repo’s `public/` folder into the same directory as `index.html`.

### 3. Point tasknow.me to this hosting

1. **Domains & SSL** → **tasknow.me** → ensure the domain is **pointed to** this IONOS hosting (same contract or “forward to” the correct web space).
2. If IONOS gave you a shared IP or hostname, you can add an **A record** for `@` and, if needed, a **CNAME** for `www` to that host (or use IONOS “Domain connect” to the hosting if offered).

### 4. HTTPS

- In IONOS, enable **SSL** for the domain (e.g. **SSL** / **Let’s Encrypt** in the same control panel).  
- After it’s active, the app will be available at **https://tasknow.me**.

---

## Environment variables for production

If your app uses a backend API:

1. Copy `.env.example` to `.env`.
2. Set `VITE_BACKEND_URL` to your real API (e.g. `https://api.tasknow.me` or your backend URL).
3. For **Vercel/Netlify**, add `VITE_BACKEND_URL` in the project’s environment variables (and redeploy).
4. For **IONOS**, you’d need to build locally with the correct `.env` and then upload the built `dist/` again (Vite bakes `VITE_*` into the build).

---

## Quick checklist

- [ ] App builds: `npm run build`
- [ ] SPA routing works (no 404 on refresh): `vercel.json` (Vercel) or `public/.htaccess` (IONOS Apache)
- [ ] Domain `tasknow.me` (and `www`) DNS points to your host
- [ ] SSL enabled for tasknow.me
- [ ] `VITE_BACKEND_URL` set if you use an API

If you tell me whether you prefer **Vercel**, **Netlify**, or **IONOS hosting**, I can give you the exact DNS values and clicks for tasknow.me.
