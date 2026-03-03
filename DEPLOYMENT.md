# Deploying TaskNow to tasknow.me (IONOS domain)

This guide covers connecting your TaskNow app to your existing domain **tasknow.me** (bought on IONOS).

---

## Option A: Domain on IONOS, hosting on Hostinger

You keep **tasknow.me** registered at IONOS and point it to your Hostinger hosting.

### 1. Add tasknow.me in Hostinger

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com).
2. Go to **Domains** → **Domain portfolio** (or **Add domain**).
3. Choose **Connect domain** or **Add external domain** and enter **tasknow.me**.
4. Hostinger will show you **two nameservers** (e.g. `ns1.dns-parking.com` and `ns2.dns-parking.com` — your values may differ). **Copy them**; you’ll need them in IONOS.

### 2. Point tasknow.me from IONOS to Hostinger (nameservers)

1. Log in to [IONOS](https://www.ionos.com) → **Domains & SSL**.
2. Select **tasknow.me** → **Manage** (or the domain settings).
3. Open **Nameservers** (or **DNS** / **Nameserver settings**).
4. Choose **Use custom nameservers** (or “Change nameservers”).
5. Replace the current nameservers with the **two Hostinger nameservers** from step 1.
6. Save. DNS can take from a few minutes up to 24–48 hours to propagate.

After propagation, **tasknow.me** will resolve to Hostinger. You can manage DNS for it in Hostinger’s DNS Zone Editor if needed.

### 3. Deploy TaskNow to Hostinger

**Build the app locally:**

```bash
npm ci
npm run build
```

The built files are in the **`dist`** folder (including `index.html`, assets, and `.htaccess` for SPA routing).

**Upload to Hostinger:**

1. In hPanel go to **Files** → **File Manager** (or use FTP with the credentials Hostinger gave you).
2. Open the **document root** for tasknow.me (often `public_html` or a folder like `public_html/tasknow.me` — use the one Hostinger shows for this domain).
3. Upload **all contents** of your local **`dist`** folder into that root (so `index.html` and `.htaccess` are in the root, not inside a `dist` subfolder).

The **`public/.htaccess`** in this repo is copied into `dist` during build so that refreshing or opening direct links (e.g. `tasknow.me/map`) works correctly on Hostinger’s Apache.

### 4. SSL (HTTPS) on Hostinger

1. In hPanel go to **SSL** (or **Security** / **Domains**).
2. Select **tasknow.me** and enable **SSL** (e.g. Let’s Encrypt). Hostinger will issue and renew the certificate.
3. Once active, your site will be available at **https://tasknow.me**.

### 5. (Optional) Environment variables

If you use a backend API, set `VITE_BACKEND_URL` in a `.env` file **before** running `npm run build`, then build and upload the new `dist` again. Vite bakes `VITE_*` into the build, so you must rebuild when you change env vars.

---

## Option B: Deploy to Vercel or Netlify, use IONOS for DNS

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

## Option C: Host on IONOS (Web Hosting)

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
- [ ] SPA routing works (no 404 on refresh): `vercel.json` (Vercel), `public/.htaccess` (Hostinger / IONOS Apache)
- [ ] Domain `tasknow.me` points to your host (Hostinger nameservers in IONOS, or A/CNAME for Vercel/Netlify)
- [ ] SSL enabled for tasknow.me
- [ ] `VITE_BACKEND_URL` set if you use an API

**Summary:** Domain on IONOS + hosting on Hostinger → use **Option A** (point tasknow.me to Hostinger via nameservers, then upload `dist` to Hostinger).
