---
name: Port availability on Replit
description: Which ports are reserved or browser-blocked; safe choices for additional services
---

## Rule
- Port **3000** is occupied by Replit internally — do not bind services there.
- Port **6000** is blocked by browsers as an unsafe port (X11) — do not use it for web-accessible services.
- Safe ports for additional services: **8001**, **8002**, **8090**, etc.

**Why:** Replit proxies all preview traffic through the browser; using an unsafe or reserved port means the service runs but is completely unreachable.

**How to apply:** Whenever adding a new service (PHP admin, secondary API, etc.), pick a port like 8001+ and confirm it's not already in use by another workflow.

## Current port assignments (this project)
- 5173 — Vite frontend dev server (sports-app)
- 8080 — Node.js API server
- 8001 — PHP admin panel
