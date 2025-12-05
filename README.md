# Lead Automation — Frontend (Next.js + Tailwind + Framer Motion)

This is a lightweight, frontend-only scaffold for a lead-automation UI with:
- Landing page
- Business Search
- Website Email Extraction
- Email Validation
- WhatsApp Validation
- Centered creative navigation and theme toggle

## Quick start (step-by-step)

1. Make sure you have Node.js (18+) and npm/yarn installed.
2. Create project folder (if not using this scaffold):
   - `mkdir lead-automation-frontend && cd lead-automation-frontend`
3. Copy the files from this repository (or unzip the provided zip).
4. Install dependencies:
   - `npm install` or `yarn`
5. Run dev server:
   - `npm run dev`
6. Open `http://localhost:3000` in your browser.

## Notes & structure

- `pages/` — Next.js pages for each screen.
- `components/` — NavBar, Layout and small UI pieces.
- `styles/` — Global Tailwind + glassmorphism helpers.
- Theme toggling is handled in `_app.js` and persists to `localStorage`.
- Buttons that trigger backend actions currently show `alert()` as placeholders. Replace with API calls.

## Built with
- Next.js (React)
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)

If you want, I can also:
- Add form validation utilities
- Wire up example API calls (mocked)
- Convert to TypeScript

