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
