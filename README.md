# 🎓 Ralson LMS — Corporate Learning Management System

<div align="center">

![PHP](https://img.shields.io/badge/Backend-PHP%208-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Apache](https://img.shields.io/badge/Server-Apache%20%7C%20XAMPP-D22128?style=for-the-badge&logo=apache&logoColor=white)
![Live](https://ralsonlms.infinityfreeapp.com/))

**A full-stack enterprise HR-Tech system — designed, built, and deployed from scratch.**

*Built during HR Internship at Ralson India Ltd. | Shiva Mishra | TISS Mumbai LSP*

🌐 **[View Live →](https://ralsonlms.infinityfreeapp.com)**

</div>

---

## ⚡ Project at a Glance

> *"Ralson had no way to know whether employees were actually watching training videos, passing tests, or retaining knowledge. This system fixed all of that."*

This is not a tutorial project. This is a **live, production-deployed LMS** built for a real manufacturing company with real users — complete with proctored testing, video enforcement, and automated effectiveness reporting.

| Parameter | Details |
|-----------|---------|
| **Company** | Ralson India Limited — Tyre Manufacturing |
| **Project Type** | Full-Stack Web Application |
| **My Role** | Sole designer, developer, and deployer — zero external developers |
| **Users** | HR Admin · Employees · Managers |
| **Deployment** | Live on InfinityFree — accessible from any device |
| **Database** | 10 tables — fully relational MySQL schema |
| **Tech Stack** | PHP 8 · MySQL · HTML5 · CSS3 · Vanilla JavaScript · Apache |

---

## 🎯 The HR Problem This Solves

| Before This System | After This System |
|-------------------|------------------|
| Training videos shared on WhatsApp | Secure portal with department-wise assignment |
| Completion tracked on Excel manually | Real-time video watch % tracked per employee |
| No way to verify employees watched | No-skip video enforcement + watch % analytics |
| No knowledge verification | Proctored pre-test & post-test with camera |
| Manual certificate distribution | Auto-generated printable digital certificates |
| No effectiveness measurement | Auto-calculated effectiveness (Post − Pre score) |
| No management reporting | Live analytics dashboard + CSV export |

---

## 🏗️ System Architecture — 3 Portals, 1 Database

```
┌─────────────────────────────────────────────────────────────────┐
│                        RALSON LMS                               │
├──────────────────┬──────────────────┬───────────────────────────┤
│   HR ADMIN       │   EMPLOYEE       │   MANAGER                 │
│   PORTAL         │   PORTAL         │   PORTAL                  │
├──────────────────┼──────────────────┼───────────────────────────┤
│ • Dashboard      │ • My Dashboard   │ • Rate Team Members       │
│ • Employee Mgmt  │ • My Trainings   │ • View Effectiveness      │
│ • Add Trainings  │ • Watch Video    │ • Add Remarks             │
│ • Assign Modules │ • Pre-Test       │ • Flag Retraining         │
│ • Question Bank  │ • Post-Test      │                           │
│ • Reports + CSV  │ • Feedback Form  │                           │
│ • Video Analytics│ • Certificate    │                           │
│ • Manager Ratings│ • My Profile     │                           │
│ • Grant Reattempt│                  │                           │
│ • Login History  │                  │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   MySQL Database   │
                    │  10 Tables · 100%  │
                    │  Relational Schema │
                    └───────────────────┘
```

---

## ✨ Feature Showcase

### 🎬 Video Enforcement Engine
The most technically complex part — employees **cannot skip or fast-forward** training videos.

- **Local MP4**: JavaScript monitors `currentTime` every tick — if it jumps more than 3 seconds ahead of `maxWatched`, video auto-rewinds and skip overlay appears
- **YouTube**: YouTube IFrame API detects play/pause state — timer only increments when `PlayerState === PLAYING`
- **Google Drive / Vimeo / External**: Timer-based tracking with confirmation checkpoint
- Progress saves every 10-15 seconds via async `fetch()` — employee can close browser and resume exactly where they left off

```javascript
// No-skip enforcement (simplified)
video.addEventListener('timeupdate', function() {
    if (currentTime > maxWatched + 3) {
        video.currentTime = maxWatched;  // Rewind
        showSkipBlockOverlay();           // Show warning
    }
    if (currentTime > maxWatched) maxWatched = currentTime;
});
```

### 📝 Proctored Post-Test
When an employee starts the post-test:
- **Camera activates** via `getUserMedia()` — visible feed shown during exam
- **Window switching detected** via `visibilitychange` and `blur` events
- **Warning system**: 2 strikes before disqualification
- **Auto-submit** on timer expiry (30 minutes)
- **HR re-attempt grant**: Only HR Admin can unlock a second attempt — not the employee

### 📊 Auto Effectiveness Calculation
```
Effectiveness = Post-Test Score − Pre-Test Score

Example: Pre = 40% → Post = 75% → Effectiveness = +35%
```
Calculated and stored automatically on post-test submission. Visible in Reports, Manager Portal, and Certificate.

### 🏆 Digital Certificate
Auto-generated completion certificate with:
- Employee name, code, department, plant
- Training title and category
- Pre-test %, Post-test %, Effectiveness %
- Three signature lines (HR Admin, Employee, Training Manager)
- Unique Certificate ID: `RALSON-[MD5HASH]`
- Print-ready via `window.print()`

### 📈 Real-Time Video Analytics
Every employee session tracked:
| Metric | Description |
|--------|-------------|
| Watch % | Percentage of video actually watched |
| Watched Minutes | Total time watched in minutes |
| Skip Attempts | Number of times skip was blocked |
| Completed | Yes/No — did they reach 90%+ |
| Last Watched | Timestamp of last viewing session |

---

## 🗄️ Database Schema — 10 Tables

```sql
employees        — Profiles, roles, departments, plants, credentials
trainings        — Modules: title, type, file/link, category, duration
assignments      — Employee ↔ Training links, scores, status, effectiveness
test_questions   — Pre/Post question bank per training (ABCD MCQ)
test_attempts    — Scores, camera status, warnings, disqualification
video_analytics  — Watch %, seconds watched, skip attempts per session
feedback         — Employee ratings + comments post-training
manager_ratings  — Boss rating (1-5) + retraining recommendation
login_history    — IP, timestamp per login (audit trail)
```

---

## 🔄 Employee Training Flow

```
Assigned Training
       │
       ▼
   [PRE-TEST]
   MCQ · No timer
   Score recorded
       │
       ▼
  [WATCH VIDEO]
  No skip/FF
  Progress saved
  90%+ required
       │
       ▼
  [POST-TEST]
  Camera on
  Window locked
  30 min timer
  2 warning system
       │
       ▼
  [FEEDBACK FORM]
  Rating + Comments
       │
       ▼
  [CERTIFICATE]
  Auto-generated
  Printable PDF
       │
       ▼
  [MANAGER RATES]
  1-5 stars
  Remarks
  Retraining flag
```

---

## 🛠️ Tech Stack — Deep Dive

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | PHP 8.x | Server-side logic, session management, file uploads |
| Database | MySQL (InnoDB) | Relational data, foreign keys, transactions |
| Frontend | HTML5 + CSS3 | Semantic markup, responsive layout |
| Interactivity | Vanilla JavaScript | No framework dependency — lightweight and fast |
| Video APIs | YouTube IFrame API, Vimeo Player API | Play/pause state detection |
| Camera | WebRTC `getUserMedia()` | Browser-native — no plugins needed |
| Charts | Chart.js | Department completion + monthly trends |
| Hosting | InfinityFree (Apache) | Free tier — production deployment |
| Local Dev | XAMPP | Apache + MySQL + PHP local stack |

---

## 📁 Repository Structure

```
ralson-lms/
│
├── index.php                  ← Login page (3 roles)
├── signup.php                 ← Employee self-registration
├── logout.php
│
├── admin/                     ← HR Admin Portal (11 pages)
│   ├── dashboard.php          ← KPI cards + Chart.js analytics
│   ├── employees.php          ← CRUD + approve/reject signups
│   ├── trainings.php          ← Upload + universal link detection
│   ├── assignments.php        ← Bulk assign by department
│   ├── questions.php          ← Pre/Post question bank (single + bulk)
│   ├── reports.php            ← Full report + CSV export
│   ├── analytics.php          ← Video watch tracking table
│   ├── manager-ratings.php    ← Boss ratings view
│   ├── grant-reattempt.php    ← HR-only test re-attempt grants
│   ├── login-history.php      ← Audit trail
│   └── profile.php            ← Password management
│
├── employee/                  ← Employee Portal (8 pages)
│   ├── dashboard.php
│   ├── my-trainings.php       ← Training cards with progress
│   ├── watch-video.php        ← No-skip video engine
│   ├── save-progress.php      ← Async progress API endpoint
│   ├── take-test.php          ← Proctored exam engine
│   ├── feedback.php
│   ├── certificate.php        ← Auto-generated + printable
│   └── profile.php
│
├── manager/
│   └── rate-team.php          ← Rate completed employees
│
├── includes/
│   ├── db.php                 ← Database connection
│   └── auth.php               ← Role-based access control
│
└── uploads/
    ├── videos/
    ├── pdfs/
    ├── ppts/
    └── images/
```

---

## 🔐 Demo Access

| Role | Employee Code | Email | Password |
|------|--------------|-------|----------|
| **HR Admin** | HR001 | admin@ralson.com | admin123 |
| **Employee** | EMP001 | emp@ralson.com | emp123 |
| **Manager** | MGR001 | manager@ralson.com | mgr123 |

🌐 **Live URL**: [ralsonlms.infinityfreeapp.com](https://ralsonlms.infinityfreeapp.com)

---

## ⚙️ Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ralson-lms.git

# 2. Place in XAMPP htdocs
cp -r ralson-lms C:/xampp/htdocs/

# 3. Import database
# phpMyAdmin → Create DB 'ralson_lms' → Import database/ralson_lms.sql

# 4. Configure DB connection
# Edit includes/db.php → set $host, $dbname, $username, $password

# 5. Start Apache + MySQL in XAMPP
# Open: http://localhost/ralson-lms
```

---

## 📊 Departments Supported

`Production` · `Design` · `Quality Control` · `Technical` · `Mechanical Maintenance` · `Electrical Maintenance` · `Accounts` · `Finance` · `Security` · `PPC` · `I.T` · `Purchase` · `Sales & Marketing` · `HR`

---

## 📚 Training Categories

`Technical Training` · `Product Training` · `Tyre Manufacturing Process` · `Sales Training` · `Soft Skills` · `Behavioural Training` · `MS Office Training` · `Safety Training` · `Leadership Training` · `Induction Training`

---

## 🎯 Key Learning & Impact

**As the intern who built this from zero:**

- Translated a real HR manager's 14-point requirement document into a working system — no developer intermediary
- Learned full-stack development while solving an actual business problem
- Deployed to production on a live URL accessible across all 4 Ralson plants
- Built HR-specific features (effectiveness calculation, no-skip enforcement) that generic LMS tools don't offer
- Demonstrated that HR professionals can build HR tech — not just specify it

**Skills demonstrated beyond coding:**
- HR process design — pre/post test framework, feedback loops, manager rating system
- People data thinking — what to measure, why, and how to surface it
- Business translation — converted business requirements into database schema and UX

---

## 🛡️ Security Features

- Role-based access control — 3 roles, fully separated portals
- Session-based authentication with approval workflow
- HR Admin approval required before any employee can log in
- SQL prepared statements (parameterised queries) on critical paths
- Disqualification system with HR-only reattempt grants
- Login audit trail with IP logging

---

## 🚀 Planned Enhancements

- [ ] Company cloud storage integration for video hosting
- [ ] Email notifications on assignment and completion
- [ ] Mobile-responsive redesign
- [ ] Bulk employee import via CSV
- [ ] WhatsApp notifications via Twilio API
- [ ] Department-wise training calendar

---

## 👤 About the Builder

**Shiva Mishra**
HR Intern · TISS Mumbai — Labour Studies & Social Protection (LSP)
Specialisation: HR Analytics & People Technology

This project was independently built during my internship at Ralson India Limited. I owned the complete lifecycle — from requirement gathering with HR management, to database design, backend development, frontend design, and live deployment.

📫 (https://www.linkedin.com/in/shiva-mishraa)](#) · 📊 [Attrition Analysis Project](https://github.com/ShivaMishra-HRAnalytics/Ralson.India.Limited-Attrition-Analysis-2026) · 🌐 [Live LMS](https://ralsonlms.infinityfreeapp.com)

---

<div align="center">

*Built by an HR intern, for an HR problem, in a real company. No tutorial. No template. No developer.*

</div>
