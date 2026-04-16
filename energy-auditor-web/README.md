# ⚡ EnergyAudit — Home Appliance Energy Auditor

> **PLDP Mini Project** · Div C, Group 63 · Problem Statement 110  
> Khan Zaid · Omkar Mhaske · Tanvi Bajrang Waghmare

A smart home energy dashboard that tracks consumption of 15 appliances over 30 days, identifies energy hogs, and recommends replacements.

## Features

- 📋 **Overview** — All 15 appliances with kWh, cost, and consumption bars
- 🏆 **Rankings** — Bubble sort by consumption (highest → lowest)
- ⚠️ **Recommendations** — Appliances above 75th percentile flagged for replacement
- 🔍 **Search** — Linear search by appliance name
- 📊 **Daily Stats** — 30-day bar chart with peak/low days and std deviation

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Vanilla CSS** (dark theme, glassmorphism)
- No database — all computed client-side

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Click **Deploy** — no config needed

Every push to `main` will auto-deploy.
