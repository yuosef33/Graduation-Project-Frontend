# 🎨 Cloud-Based Lab Examination Platform - Frontend

> Frontend application for the Cloud-Based Lab Examination Platform, built with React and Vite. Provides browser-based access to cloud-hosted Windows and Linux virtual machines, authentication, lab management, and exam interaction.

🔗 **Backend Repository:** https://github.com/yuosef33/Cloud-Based-Examination-Platform

---

## 📌 Overview

The frontend provides the user interface for the Cloud-Based Lab Examination Platform. It enables students and instructors to interact with the system through a modern web application built with React.

Students can browse available labs, attend exams, and access dedicated Windows or Linux virtual machines directly from the browser using VNC technology.

Administrators can create VM templates, manage labs, monitor exam sessions, and collect student submissions through dedicated dashboard pages.

---

## 🎯 Features

* 🔐 JWT Authentication
* 🔑 Google OAuth2 Login
* 👥 Role-Based Route Protection
* 🖥️ Browser-Based VNC Access
* 🪟🐧 Support for Windows and Linux VMs
* ⏱️ Exam Session Interface
* 📋 Lab Management
* 🏗️ Template Management
* 📱 Responsive User Interface
* ⚡ Fast Development Experience with Vite

---

## 🧰 Built With

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-D0021B?style=for-the-badge\&logo=react-router\&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge)
![Formik](https://img.shields.io/badge/Formik-2563EB?style=for-the-badge)
![Yup](https://img.shields.io/badge/Yup-111827?style=for-the-badge)
![VNC](https://img.shields.io/badge/react--vnc-FF6B35?style=for-the-badge)

---

## 🖥️ Browser-Based VM Access

Students interact with cloud-hosted virtual machines directly from the browser through a VNC client.

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

No additional software installation is required.

---

## 🔐 Authentication

Supported Authentication Methods:

* Email & Password Login
* Google OAuth2 Login
* JWT Access Tokens
* Protected Routes
* Role-Based Authorization

Roles:

* ADMIN
* USER

---

## 📂 Project Structure

```text
src/
├── api/
│   └── axios.js
│
├── assets/
│
├── components/
│   ├── InputField.jsx
│   ├── LoginForm.jsx
│   ├── SignupForm.jsx
│   ├── ProtectedRoute.jsx
│   └── RoleRoute.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── OAuthCallback.jsx
│   ├── Home.jsx
│   ├── LabExam.jsx
│   ├── AdminHome.jsx
│   ├── AdminLabs.jsx
│   ├── CreateLab.jsx
│   ├── CreateTemplate.jsx
│   └── VncTest.jsx
│
├── App.jsx
└── main.jsx
```

---

## 📄 Main Pages

| Page           | Description                     |
| -------------- | ------------------------------- |
| Login          | User authentication             |
| Signup         | User registration               |
| OAuthCallback  | Google OAuth2 callback handling |
| Home           | Student dashboard               |
| LabExam        | Exam session and VM access      |
| AdminHome      | Admin dashboard                 |
| AdminLabs      | Lab management                  |
| CreateLab      | Create and schedule labs        |
| CreateTemplate | Create VM templates             |
| VncTest        | VNC testing page                |

---

## 🚀 Running Locally

```bash
git clone https://github.com/yuosef33/Graduation-Project-Frontend.git

cd Graduation-Project-Frontend

npm install

npm run dev
```

Application will be available at:

```text
http://localhost:5173
```

---

## ⚙️ Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 👤 Author

**Yuosef Jamal**

Individual Graduation Project

* LinkedIn: https://www.linkedin.com/in/yuosefjamal33/
* GitHub: https://github.com/yuosef33

---

## 📄 License

This project is licensed under the MIT License.
