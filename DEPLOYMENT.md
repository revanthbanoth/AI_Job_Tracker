# Deployment Guide

This project is separated into three distinct parts:
1.  **Frontend** (React + Vite)
2.  **Backend** (Node.js + Express)
3.  **AI Service** (Python + FastAPI)

Here is how you can deploy them.

## 1. Frontend Deployment (Vercel/Netlify)
The frontend is a static site (SPA).
*   **Platform:** Vercel (Recommended) or Netlify.
*   **Root Directory:** `frontend` (Make sure to set this in project settings).
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Environment Variables:**
    *   `VITE_API_URL`: URL of your deployed Backend (e.g., `https://your-backend.onrender.com/api`).
    *   `VITE_AI_API_URL`: URL of your deployed AI Service (e.g., `https://your-ai-service.onrender.com`).

## 2. Backend Deployment (Render/Heroku/Railway)
The backend is a Node.js API.
*   **Platform:** Render (Web Service) or Railway.
*   **Root Directory:** `backend`
*   **Build Command:** `npm install`
*   **Start Command:** `npm start` (or `node server.js`)
*   **Environment Variables:**
    *   `MONGO_URI`: Your MongoDB Connection String (Atlas).
    *   `JWT_SECRET`: A strong secret key.
    *   `PORT`: (Automatically set by platform, usually 5000 or 10000).

## 3. AI Service Deployment (Render/Railway)
The AI service is a Python FastAPI app.
*   **Platform:** Render (Web Service) or Railway.
*   **Root Directory:** `ai-service`
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables:**
    *   `PORT`: (Automatically set by platform).

## Docker Deployment (Advanced)
If you prefer Docker, `Dockerfile`s are provided in `backend/` and `ai-service/`.
You can build images and deploy them to any container orchestration service (AWS ECS, DigitalOcean App Platform, etc.).
