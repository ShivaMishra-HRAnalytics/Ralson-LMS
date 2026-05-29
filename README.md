# 🏢 Ralson LMS — Corporate Learning Management System

> Built during HR Internship at Ralson India Limited | 2025-26

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ralson--lms.vercel.app-blue?style=for-the-badge)](https://ralson-lms.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## 📌 Project Overview

A full-featured **digital Learning Management System** designed to solve a real HR problem at Ralson India Ltd. — the company had no way to track whether employees were actually engaging with training content.

**Before this system:** Training videos shared on WhatsApp, completion tracked on Excel, zero accountability.

**After this system:** Real-time video analytics, automated quiz scoring, digital certificates, admin dashboard.

---

## 🎯 HR Problem Solved

| Problem | Solution |
|--------|----------|
| No training completion data | Video watch % tracked in real time |
| Employees skipping content | Skip count detection per employee |
| Manual quiz grading | Auto-scored MCQ with instant results |
| Paper certificates | Auto-generated digital certificates |
| No management reporting | Live analytics dashboard |

---

## ✨ Features

### 👨‍💼 Admin Portal
- Add, edit, delete employees with department tagging
- Create training modules with YouTube video links
- Assign specific training to specific employees
- View real-time **Video Analytics** (watch %, skip count, play count)
- Reports: completion rate, average quiz score, pending count

### 👷 Employee Portal
- Secure login with individual credentials
- Watch assigned training videos in-platform
- Take auto-generated MCQ quiz (60% pass mark)
- Download digital certificate on passing

---

## 📊 Video Analytics — Core Feature

Every time an employee watches a video, the system tracks:
- **Watch %** — How much of the video was actually watched
- **Skip Count** — How many times the employee jumped forward
- **Play Count** — How many times the video was replayed
- **Completion Status** — Auto-marked complete at 90%+ watch

This transforms training from activity-based to **outcome-based and data-driven**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, JSX, Vite |
| Backend | Supabase (PostgreSQL) |
| Hosting | Vercel (auto-deploy on push) |
| Video | YouTube IFrame API |
| Version Control | Git + GitHub |

---

## 🗄️ Database Structure
employees        — employee profiles and login credentials
trainings        — training modules with YouTube links and quiz questions
assignments      — maps employees to their assigned trainings
quiz_results     — scores, pass/fail status, timestamps
video_analytics  — watch%, skip_count, play_count, last_watched

------

## 👤 My Role (HR Intern)

This project was built as an **HR Business Analyst / Intern**, not as a developer.

My contributions:
- Defined all HR requirements and training workflow
- Identified what data points HR needs to make decisions
- Tested every feature from Admin and Employee perspective
- Diagnosed and resolved data integrity issues
- Validated analytics output against real employee sessions
- Escalated security vulnerability in video access management

> The technical build was done in collaboration with a developer. My role was bridging the HR process gap with technology — exactly how HR tech projects work in real organisations.

---

## 🔗 Live Demo

**[→ View Live at ralson-lms.vercel.app](https://ralson-lms.vercel.app)**

| Role | Email | Password |
|------|-------|----------|
| Admin | (your admin email) | (your admin password) |

---

## 📬 Connect

**Shiva Mishra** — HR Analytics & HR Technology  
TISS Mumbai | LSP Course | HR Intern @ Ralson India Ltd.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)]((https://www.linkedin.com/in/shiva-mishraa))
