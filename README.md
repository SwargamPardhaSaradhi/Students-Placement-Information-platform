# 🎓 Placement Management System

A comprehensive, full-stack Placement Management System designed to handle student data, track placement drives (companies), visualize analytics, and provide an AI-powered conversational interface for querying placement statistics.

---

## 🌟 Overview

This project is built using a modern decoupled architecture. The frontend application visualizes the data, completely driven by our robust backend microservices. The entire system relies on **Firebase Firestore** as the primary database to store students, companies, and yearly analytics data.

**Key Features:**
- **📊 Interactive Dashboard & Analytics**: Visualize year-over-year placement trends, company-wise placements, and student success rates.
- **🏢 Company & Drive Management**: Track ongoing and completed placement drives, specific rounds, and qualified students per round.
- **👨‍🎓 Student Directory**: Manage student profiles, track individual applications, and monitor their placement status in real-time.
- **🏆 Leaderboard**: Rank top-performing companies based on successful placements.
- **📁 Automated Excel Data Upload**: Seamlessly upload round-by-round results using Excel (`.xlsx`/`.xls`) files to instantly update database records and track progression.
- **🤖 AI-Powered Chat Assistant**: Query complex placement data through a natural language chat interface that streams responses in real-time.
- **🔒 Secure Authentication & Admin Controls**: JWT-based role-based access control (Admin, Faculty, Student) for strict data security.

---

## 🛠️ Tech Stack & Architecture

This application leverages a modern, decoupled architecture connecting a dynamic frontend to robust backend microservices.

### **Frontend Technologies**
- **Core Framework**: React (Bootstrapped with Vite for instant server start and lightning-fast HMR).
- **Language**: TypeScript for strict typing and scalable, bug-free components.
- **Styling**: Custom CSS driving a modern, glassmorphic UI aesthetic.
- **Routing**: React Router for seamless Single Page Application (SPA) navigation.
- **Database Access**: Direct integration with the Firebase Client SDK for blazing-fast reads directly from Firestore to power the analytical dashboards.

### **Backend Technologies**
- **Core Framework**: Python & Flask.
- **Authentication**: JWT (JSON Web Tokens) for robust stateless authentication and `bcrypt` for secure password hashing.
- **Data Parsing & Processing**: `pandas` and `openpyxl` are utilized to efficiently parse, validate, and manipulate vast rows of Excel data during the upload cycles.
- **AI Integration**: The backend leverages the Groq API and advanced prompt engineering to build the intelligent AI Agent.
- **Database Connection**: Firebase Admin SDK for privileged, unrestricted write access to Firestore.

### **Database**
- **Firebase Firestore**: A NoSQL document database used over SQL due to its unparalleled real-time capabilities and flexible scaling. Collections include `users`, `students`, `companies`, `years`, and deeply nested subcollections like `rounds`.

---

## 🤖 The Power of AI in the Platform

One of the standout features of this system is the **AI Chat Assistant**, which demonstrates a highly effective application of Large Language Models (LLMs) in data-heavy environments. 

**How it works seamlessly:**
1. **Natural Language Processing**: Instead of clicking through complex filters, administrators or faculty can ask human questions like, *"How many students were placed in Google 2024?"* or *"List all the placement rounds for Microsoft."*
2. **Autonomous Tool Selection**: The backend AI Agent acts autonomously. It interprets the question, selects the precise database function needed to answer it, executes the query against Firestore, and fetches the resulting data.
3. **Data Distillation**: When handling vast datasets (e.g., retrieving thousands of student records), the AI doesn't just dump the raw JSON. It synthesizes the data points into a concise, easily readable narrative summary.
4. **Real-time SSE Streaming**: The responses aren't delayed behind long loading spinners. The system utilizes **Server-Sent Events (SSE)** to stream the AI's "thinking process" live. Users watch as the AI announces its logical deductions, executes functions, parses rows, and streams its final response, creating a highly interactive and transparent user experience.

---

## 🔌 API Documentation Summary

The backend exposes focused micro-services dedicated to specific responsibilities.

### 1. Authentication & User Management Service
Secures the application using HTTP-only cookies storing Access (15m expiry) and Refresh (7d expiry) JWT tokens.
- **`POST /auth/login`**: Authenticate and retrieve secure tokens.
- **`POST /auth/logout`**: Clear cookies and safely end the current session.
- **`POST /auth/change-password`**: Update account password.
- **`GET /users` & `POST /users` (Admin Only)**: Retrieve the entire list of system users and create new accounts (Admin, Faculty, Student).
- **`PUT /users/:id` & `DELETE /users/:id` (Admin Only)**: Modify user privileges and delete historical accounts.
- **`GET /summary/dashboard`**: A highly optimized endpoint bypassing massive Firestore reads by fetching pre-calculated system statistics strictly for the dashboard landing.

### 2. Data Processing & Excel Upload API
- **`POST /upload-round`**: Accepts multipart Excel file uploads (`.xlsx`/`.xls`). The API automatically unpackages the file, reads the student columns, maps them to existing Roll Numbers, creates new student profiles if they didn't exist, updates their application progression statuses (qualified, rejected, selected), and finally recalculates the year-level summary analytics.

### 3. AI Chat Streaming API
- **`POST /stream`**: The core conversational endpoint. Accepts a JSON payload containing the user's natural language query. It establishes an open connection and streams back a sequential series of events (the AI thinking, querying, building tables, and summarizing) directly to the web client.

---

## 🌐 Frontend Pages Overview

The robust React frontend is separated into several core views:
- **Home/Landing (`/`)**: Static entry page with placement highlights.
- **Login (`/login`)**: Secure entry portal connecting to Auth API.
- **Dashboard (`/dashboard`)**: Overview stats pulled via Firebase and Dashboard summary API.
- **Companies (`/companies`)**: Browse all registered placement drives.
- **Company Details (`/companies/:id`)**: Drill down into specific rounds and see who progressed.
- **Students (`/students`)**: Directory of all students and their application history.
- **Analytics & Trends (`/analytics`, `/trends`)**: Visual charts illustrating placement progression over years.
- **Leaderboard (`/leaderboard`)**: Ranks companies by the volume of successful hires.
- **Upload Data (`/upload`)**: Admin tool to submit Excel rosters to the Data Processing API.
- **AI Chat (`/chat`)**: The conversational AI interface.
- **Admin Panel (`/admin`)**: Manage user accounts and roles.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Firebase Account & Service Account Key (`firebase_credentials.json`)

### Setup Environment Variables

Create `.env` files in your respective backend folders (`authentication`, `excel_to_db`, `Ai_to_db`):
```env
JWT_SECRET_KEY=your_super_secret_key
JWT_REFRESH_SECRET_KEY=your_long_refresh_secret
GROQ_API_KEY=your_groq_api_key_for_ai
# Ensure Firebase Admin SDK JSON is placed correctly in your backend folders
```

### Running the Project Locally

**1. Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

**2. Start the Backend Services**

For the main authentication server:
```bash
cd authentication
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

*Follow the exact same virtual environment setup process for the `Ai_to_db` and `excel_to_db` folders.*

---

## 🔒 Security Notes
- Passwords are securely hashed using `bcrypt`.
- Authentication relies strictly on `HttpOnly`, `Secure`, `SameSite` cookies to prevent XSS and modern web vulnerabilities.
- Firebase operations within the backend APIs use Admin SDK permissions, while frontend Firebase reads are restricted via Firestore Rules.

---
*Built with ❤️ for modern placement management and student success tracking.*
