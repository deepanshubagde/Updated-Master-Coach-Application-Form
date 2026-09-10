# Monkhood Master Coach Application

Official web application form for the **Monkhood Master Coach Program** with Mr. Deepanshu and team.

---

## 🚀 Features

- **Multi-Step Structured Application**: 14 in-depth qualification questions with validation, progress indicator, and smooth animations.
- **Direct Google Sheets Integration**: Real-time webhook submission to Google Sheets with serial number generation and timestamping.
- **Optimized for Mobile & Desktop**: Clean luxury aesthetics with Cinzel display typography, warm metallic accents, and high-contrast accessibility.
- **Offline & Redundancy Protection**: Submissions are backed up locally and sync to Google Sheets.
- **Direct Checkout Redirection**: Successful applicants are seamlessly redirected to the official checkout page.

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 6**
- **Tailwind CSS v4**
- **Motion** (Framer Motion animations)
- **Lucide Icons**

---

## 🌐 Deploy to Cloudflare Pages

### 1. Push to GitHub
Create a new GitHub repository (e.g. `monkhood-master-coach-application`) and push this code:

```bash
git init
git add .
git commit -m "Initial commit - Monkhood Master Coach Application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/monkhood-master-coach-application.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
3. Select your GitHub repository.
4. Set the build configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty or default)
5. Click **Save and Deploy**.

### 3. Connect Your Custom Domain
1. In Cloudflare Pages, go to your project &rarr; **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g., `apply.monkhood.in` or `coach.yourdomain.com`).
4. Follow Cloudflare's 1-click DNS configuration.

---

## 📊 Google Sheets Webhook
The application submits directly to Google Apps Script connected to Google Sheet:
- **Default Spreadsheet**: [Master Coach Application](https://docs.google.com/spreadsheets/d/1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI/edit)
- Webhook is defined in `src/lib/googleSheets.ts`.
