# 🎓 Smart Campus Assistant — MERN Stack

A full-featured Smart Campus management system built with **MongoDB Atlas + Express.js + React (Vite) + Node.js**, with **Socket.io**, **Cloudinary**, **JWT Auth**, and role-based access for Students and Faculty.

---

## 🏗️ Architecture

```
Frontend (React + Vite)          → http://localhost:5173
      ↓ API calls (Axios)
Backend (Express.js)             → http://localhost:5000
      ↓ Business Logic (Controllers)
Database (MongoDB Atlas)         → Cloud-hosted
      ↓ Cloud Services
Cloudinary (File Storage) + Socket.io (Real-time)
```

---

## ✨ Features

### 👨‍🎓 Student
- View attendance with subject-wise % & circular progress
- Download assignments (PDFs/docs from Cloudinary)
- Read notices (categorized, filterable)
- AI Chatbot assistant (attendance, assignments, campus FAQ)
- Real-time notifications via Socket.io

### 👨‍🏫 Faculty
- Upload assignments to Cloudinary
- Mark individual & bulk attendance
- Post notices with category, audience targeting, pinning
- Dashboard analytics (stats, recent attendance)
- Auto-notify all relevant students in real-time

### ⚙️ Common
- JWT Authentication (register/login/profile)
- Role-based access control (student / faculty / admin)
- Real-time updates with Socket.io
- Cloudinary file uploads (PDF, images)
- Responsive dark-themed UI with Syne + DM Sans fonts

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

---

### 2. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 3. Configure Environment Variables

#### create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/smart-campus?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here_change_this
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
### 4. Run the Application

```bash
# Terminal 1 — Backend
cd backend
node server.js        # Uses nodemon for hot-reload

# Terminal 2 — Frontend
cd frontend
npm run dev        # Vite dev server
```

Open **http://localhost:5173** in your browser.
---
