# Vynthen AI UI Shell

Vynthen AI is a production-ready, minimalistic AI chat interface built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.  
This project is intentionally front-end only – there is **no backend or real AI model** wired up. It is meant to be used as a premium UI shell for your own AI stack.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS 3**

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Features

- Liquid glass aesthetic used across sidebar, chat area, input, and controls
- Fixed 260px sidebar with recent chats, mode switcher, and profile row
- Centered chat area (max width 720px content column) with floating feel
- Empty-state welcome screen with suggestion cards
- User and Vynthen message styling with subtle animations
- Typing indicator and dummy response cycle (front-end only)
- Chat / Agent mode with behavior and copy changes
- Light / dark modes with theme toggle and local persistence

## Production Notes

- This app is designed as a **pure UI shell**; wire it to your own APIs or models.
- All interactive behavior is implemented client-side with React state.
- Tailwind utility classes are combined with a reusable `.glass` component class for the liquid glass effect.

