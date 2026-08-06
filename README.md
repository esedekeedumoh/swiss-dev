<div align="center">

<img src="https://raw.githubusercontent.com/tamil5152/Ai-Website-Builder/main/public/logo.png" alt="AI Website Builder Logo" width="80" height="80" onerror="this.style.display='none'">

# 🤖 AI Website Builder

**Transform your ideas into production-ready websites with the power of AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange)](https://convex.dev/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-blue?logo=google)](https://ai.google.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](https://ai-website-builder.vercel.app) · [Report Bug](https://github.com/tamil5152/Ai-Website-Builder/issues) · [Request Feature](https://github.com/tamil5152/Ai-Website-Builder/issues)

</div>

---

## ✨ Features

- **🪄 AI-Powered Generation** — Describe your website in plain English and get a fully working React app in seconds
- **💬 Chat Interface** — Refine your website iteratively through a conversational AI chat
- **⚡ Live Preview** — See your website rendered in real-time via Sandpack
- **📝 Code Editor** — Browse and edit the generated files directly in the browser
- **🌗 Dark & Light Themes** — Cream-professional light mode and a deep midnight dark mode with smooth transitions
- **✨ AI Prompt Enhancer** — Automatically improve your prompts for better results
- **📦 One-Click Download** — Export your entire project as a `.zip` ready to deploy
- **🔄 Persistent Workspaces** — All sessions are saved to Convex backend — pick up where you left off

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **AI Model** | [Google Gemini AI](https://ai.google.dev/) |
| **Backend / DB** | [Convex](https://convex.dev/) |
| **Code Sandbox** | [Sandpack](https://sandpack.codesandbox.io/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom Design Tokens |
| **Theme** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Fonts** | Inter + DM Serif Display (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Convex](https://dashboard.convex.dev/) account (free)

### 1. Clone the repository

```bash
git clone https://github.com/tamil5152/Ai-Website-Builder.git
cd Ai-Website-Builder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# .env.local

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 4. Set up Convex

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex (first time only)
- Create a new project and write `NEXT_PUBLIC_CONVEX_URL` to your `.env.local` automatically
- Watch for schema changes

### 5. Run the development server

In a new terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
Ai-Website-Builder/
├── app/
│   ├── (main)/workspace/[id]/  # Workspace page (chat + code editor)
│   ├── api/                    # API routes (AI chat, code gen, enhance)
│   ├── globals.css             # Design system & CSS variables
│   ├── layout.js               # Root layout
│   └── page.js                 # Home / Hero page
├── components/
│   └── custom/
│       ├── Header.jsx          # Navigation with theme toggle
│       ├── Hero.jsx            # Landing page hero
│       ├── ChatView.jsx        # AI chat interface
│       └── CodeView.jsx        # Code editor + live preview
├── context/
│   └── MessagesContext.js      # Global messages state
├── convex/
│   ├── schema.ts               # Database schema
│   └── workspace.ts            # Convex mutations & queries
├── data/
│   ├── Lookup.js               # Suggestions, default files, dependencies
│   └── Prompt.js               # AI system prompts
└── public/                     # Static assets
```

---

## 🎨 Design System

This project uses a warm cream/parchment professional design for light mode and a deep midnight theme for dark mode.

| Mode | Background | Primary | Accent |
|---|---|---|---|
| ☀️ Light | `#F7F3EE` (cream) | `#AD5D1F` (amber-brown) | `#933D18` (terracotta) |
| 🌙 Dark | `#0F1117` (midnight) | `#E8813A` (amber glow) | `#F5A34D` (warm amber) |

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place. Any contributions you make are **greatly appreciated**.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'feat: add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 🐛 Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/tamil5152/Ai-Website-Builder/issues) with:

- A clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Google Gemini AI](https://ai.google.dev/) for the powerful generative model
- [Convex](https://convex.dev/) for the real-time backend
- [CodeSandbox Sandpack](https://sandpack.codesandbox.io/) for the in-browser code execution
- [Vercel](https://vercel.com/) for deployment infrastructure

---

<div align="center">

Made with ❤️ by [tamil5152](https://github.com/tamil5152)

⭐ **Star this repo if you found it helpful!** ⭐

</div>
