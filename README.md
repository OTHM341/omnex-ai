# OMNEX AI

<p align="center">
  <img src="https://img.shields.io/badge/AI-Platform-blueviolet?style=for-the-badge&logo=openai&logoColor=white" alt="AI Platform" />
  <img src="https://img.shields.io/badge/Full--Stack-Application-blue?style=for-the-badge" alt="Full Stack Application" />
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React and TypeScript" />
  <img src="https://img.shields.io/badge/Spring_Boot-Backend-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Status-In_Development-orange?style=for-the-badge" alt="In Development" />
</p>

<p align="center">
  <strong>An intelligent AI workspace for conversations, coding, writing, and productivity.</strong>
</p>

---

## Overview

**OMNEX AI** is a modern AI-powered web application designed to provide an intelligent and intuitive workspace for interacting with artificial intelligence.

The platform aims to simplify everyday tasks through AI-assisted conversations, coding support, content generation, research, and productivity tools.

Built with a modern full-stack architecture, OMNEX AI combines a responsive React interface with a Spring Boot backend, PostgreSQL database, and Google Gemini AI integration.

## Features

### Currently Implemented

- Modern and responsive AI workspace
- Interactive AI chat interface
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
- Suggested prompts for new conversations
- Lazy-loaded application pages
- Loading indicators and error handling

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
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── backend/
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

### Clone the repository

```bash
git clone https://github.com/OTHM341/omnex-ai.git
cd omnex-ai
```

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### Start the backend

Navigate to the backend directory and run the Spring Boot application using Maven or your preferred Java IDE.

### Configure the environment

Configure the PostgreSQL database connection and Gemini API credentials in the backend configuration.

**Important:** Never commit API keys, passwords, or other sensitive credentials to GitHub.

## Production Build

```bash
cd frontend
npm run build
```

## Future Improvements

- Support for additional AI providers and models
- File uploads and document processing
- AI-powered PDF summarization
- Advanced coding assistance
- User authentication and authorization
- Custom AI assistant configuration
- Conversation search and organization
- Improved mobile experience

## Author

**Othmane Moutaouakil**

Computer Engineering Graduate | Full-Stack Developer

---

<p align="center">
  <sub>Designed and developed by Othmane Moutaouakil</sub>
</p>
