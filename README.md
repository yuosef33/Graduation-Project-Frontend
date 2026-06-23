# 🎨 Cloud-Based Lab Examination Platform - Frontend

> React frontend for the Cloud-Based Lab Examination Platform. Provides browser-based access to cloud-hosted Windows and Linux virtual machines, lab management dashboards, authentication, and real-time exam interaction.

🔗 **Backend Repository:** https://github.com/yuosef33/Cloud-Based-Examination-Platform

---

## 📌 Overview

The frontend serves as the user interface for the Cloud-Based Lab Examination Platform. It allows students and instructors to interact with the system through a modern web application built with React and Vite.

Students can attend practical labs, access dedicated Windows or Linux virtual machines directly from the browser using VNC technology, monitor remaining exam time, and reconnect to their assigned machine at any point during the lab session.

Instructors can create and manage lab templates, schedule exams, monitor student environments, collect submissions, and download student files through an intuitive dashboard.

---

## 🎯 Key Features

* 🌐 Browser-based access to Windows and Linux VMs
* 🖥️ Integrated VNC client using react-vnc/noVNC
* 🔐 JWT Authentication & Google OAuth2 Login
* 👥 Role-based routing and protected pages
* ⏱️ Real-time exam countdown timer
* 📋 Lab and template management dashboards
* 📁 Student submission and file management
* 🔄 Automatic VM reconnection support
* 📱 Responsive user interface
* ⚡ Fast development experience with Vite

---

## 🧰 Built With

* React 19
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* Formik
* Yup
* react-vnc
* JWT Authentication

---

## 🏗️ Frontend Architecture

```text
React Application
│
├── Authentication
│   ├── Login
│   ├── Register
│   └── Google OAuth2
│
├── Student Portal
│   ├── Available Labs
│   ├── Exam Details
│   ├── VM Access
│   └── Countdown Timer
│
├── Admin Dashboard
│   ├── Template Management
│   ├── Lab Management
│   ├── Student Monitoring
│   └── File Collection
│
└── Shared Components
    ├── Protected Routes
    ├── Forms
    ├── Navigation
    └── VNC Components
```

---

## 🖥️ Browser-Based VM Access

The platform integrates react-vnc to provide direct browser access to cloud-hosted virtual machines.

Connection Flow:

```text
React Frontend
        ↓
WebSocket
        ↓
Websockify
        ↓
TigerVNC
        ↓
Windows / Linux VM
```

Students interact with a full remote desktop without installing any software.

---

## 🔐 Authentication

Supported authentication methods:

* Email & Password Login
* Google OAuth2 Login
* JWT Access Tokens
* Refresh Token Support
* Protected Routes

User Roles:

* ADMIN
* USER

---

## 📂 Project Structure

```text
src/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── context/
├── routes/
├── assets/
└── utils/
```

---

## 🚀 Running Locally

```bash
git clone https://github.com/yuosef33/Graduation-Project-Frontend.git

cd Graduation-Project-Frontend

npm install

npm run dev
```

Application:

```text
http://localhost:5173
```

---

## ⚙️ Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 👤 Author

**Yuosef Jamal**

Individual Graduation Project

* LinkedIn: https://www.linkedin.com/in/yuosefjamal33/
* GitHub: https://github.com/yuosef33

```
```
