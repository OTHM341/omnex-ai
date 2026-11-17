# OMNEX AI

\<p align="center">   \<img src="[https://img.shields.io/badge/AI-Platform-blueviolet](https://img.shields.io/badge/AI-Platform-blueviolet)" alt="AI Platform" />   \<img src="[https://img.shields.io/badge/Full--Stack-Web%20Application-blue](https://img.shields.io/badge/Full--Stack-Web%20Application-blue)" alt="Full Stack" />   \<img src="[https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB)" alt="React and TypeScript" />   \<img src="[https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F)" alt="Spring Boot" />   \<img src="[https://img.shields.io/badge/Status-In%20Development-orange](https://img.shields.io/badge/Status-In%20Development-orange)" alt="In Development" /> \</p>

## Overview

**OMNEX AI** is a modern AI-powered web application designed to provide an intelligent and intuitive workspace for interacting with artificial intelligence.

The platform aims to simplify everyday tasks through AI-assisted conversations, coding support, content generation, research, and productivity tools.

Built with a modern full-stack architecture, OMNEX AI combines a responsive React interface with a Spring Boot backend and AI integration.

## Features

### Currently Implemented

- Modern and responsive AI workspace
- Interactive chat interface
- Real-time AI response streaming
- Conversation history management
- Create and manage conversations
- Multiple assistant types:
  - General Assistant
  - Coding Assistant
  - Writing Assistant
  - Research Assistant
- Markdown rendering for AI responses
- Syntax highlighting for code blocks
- Copy code and download AI responses
- Auto-resizing message input
- Chat suggestions for starting conversations
- Lazy-loaded application pages
- Error handling and loading indicators

### In Development

- Advanced AI model selection
- File attachments and document analysis
- User authentication and account management
- Personalized AI assistant settings
- Advanced conversation management

## Technologies

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Axios
- React Markdown
- Remark GFM
- Rehype Highlight

### Backend

- Java
- Spring Boot
- REST API
- Server-Sent Events (SSE)

### Database

- PostgreSQL

### AI Integration

- Google Gemini API

## Project Structure

```text
omnex-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   └── MessageBubble.tsx
│   │   │   │
│   │   │   └── layout/
│   │   │       └── MainLayout.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── History.tsx
│   │   │   └── Assistants.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── App.tsx
│   │   └── App.css
│   │
│   └── package.json
│
├── backend/
│   └── ...
│
├── README.md
└── ...
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Java JDK
- Maven
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/OTHM341/omnex-ai.git
```

### 2. Navigate to the project

```bash
cd omnex-ai
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Start the backend

Navigate to the backend directory and run the Spring Boot application using Maven or your preferred Java IDE.

### 5. Configure the environment

Configure the PostgreSQL database connection and Gemini API credentials in the backend configuration.

**Note:** Never commit API keys, passwords, or other sensitive credentials to GitHub.

## Production Build

To generate an optimized frontend production build:

```bash
cd frontend
npm run build
```

## Future Improvements

- Support for additional AI providers and models
- File uploads and document processing
- AI-powered PDF summarization
- Advanced code assistance
- User authentication and authorization
- Custom AI assistant configuration
- Conversation search and organization
- Improved mobile experience

## Author

**Othmane Moutaouakil**

Computer Engineering Graduate | Full-Stack Developer

---

\<p align="center">
&#x20; \<sub>Designed and developed by Othmane Moutaouakil\</sub>
\</p>
