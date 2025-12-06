# JackyCrocs 🐊  
Live inventory & order system for a viral Crocs reselling business

🌐 **Live site:** https://jackycrocs.com/  
🚀 **Hosting:** Vercel (Production)

---

## Overview

JackyCrocs started as a small side business, reselling Crocs locally in **Tijuana, Mexico**.

After unexpectedly going **viral on TikTok**, we were suddenly flooded with **~1,000+ DMs**, all asking for colors, sizes, prices, and availability. Managing everything manually through WhatsApp between just two people became overwhelming very quickly.

To solve this, I built a **simple, functional website as fast as possible** — nothing fancy, just what we needed to survive the volume and stay organized.

This repository contains the source code for that solution, which is now **live in production** and actively used to manage real inventory and orders.

---

## What This Project Solves

✅ Reduces repetitive WhatsApp messages  
✅ Shows customers **live inventory**  
✅ Prevents selling out-of-stock sizes/colors  
✅ Keeps the workflow simple for non-technical users  
✅ Works well for mobile customers  
✅ Scales better than pure DM-based selling

---

## Features

### 🛍 Public Storefront
- Live inventory by **color and size**
- Add multiple pairs to cart
- Spanish-first UI with **English / Spanish toggle**
- Mobile-friendly (most customers come from TikTok)

<img width="1022" height="1352" alt="Screenshot 2025-12-03 at 10 05 22 PM" src="https://github.com/user-attachments/assets/a4627f2e-2699-4cc9-aeaa-cc9623f52312" />


---

### 🔐 Admin Panel (Private)
- Manage inventory counts
- Update colors and sizes
- View basic dashboard metrics
- Simple and fast — designed for real-time selling

<img width="2548" height="1356" alt="Screenshot 2025-12-03 at 10 08 57 PM" src="https://github.com/user-attachments/assets/1afbda53-990d-4b35-9392-10ef629e7d47" />
<img width="2556" height="1353" alt="Screenshot 2025-12-03 at 10 08 50 PM" src="https://github.com/user-attachments/assets/e6b4e0f5-d2b1-49d0-9aea-3a85de9ea36d" />

---

## Order Flow (Current)

1. Customer selects **color & size**
2. Adds items to cart
3. Clicks **“Send Order”**
4. Site opens **WhatsApp** with a **pre-filled order message**
5. Payment & pickup are handled manually via WhatsApp


This flow keeps things simple while still:
- Reducing message back-and-forth
- Standardizing order formats
- Letting us close sales quickly

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Messaging Integration:** WhatsApp deep links
- **Language Support:** Spanish / English toggle

---

## Why Vercel?

- Zero-config deployments
- Fast global CDN
- Perfect for rapid iteration during viral growth
- Reliable production performance with minimal overhead

This app is **actively used in production** for a real business.

---

## Local Development

```bash
npm install
npm run dev
```

App will run locally at:

* http://localhost:3000

## Vercel

https://vercel.com/hector-dominguezs-projects/jackiecrocs

## Database
* https://supabase.com/


