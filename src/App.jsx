import { supabase } from "./supabaseClient";
import { useEffect, useRef, useMemo, useState } from "react";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const CATEGORIES = ["Onboarding", "Soft Skills", "Sales", "Technical", "HR Policies"];

const QUIZ_BANK = {
  Onboarding: [
    { question: "What is the main purpose of onboarding?", options: ["To confuse new hires", "To help a new employee understand the company", "To reduce salary"], answer: 1 },
    { question: "Which is usually covered in onboarding?", options: ["Company culture", "Movie reviews", "Holiday shopping"], answer: 0 },
    { question: "Onboarding should be:", options: ["Random", "Structured", "Ignored"], answer: 1 },
  ],
  "Soft Skills": [
    { question: "Which is a soft skill?", options: ["Communication", "Machine repair", "Typing code only"], answer: 0 },
    { question: "Good listening helps in:", options: ["Better understanding", "More mistakes", "Ignoring others"], answer: 0 },
    { question: "Teamwork means:", options: ["Working alone always", "Working together", "No cooperation"], answer: 1 },
  ],
  Sales: [
    { question: "What is important in sales?", options: ["Product knowledge", "Sleeping in meeting", "Ignoring customer"], answer: 0 },
    { question: "A customer objection should be handled by:", options: ["Listening and responding", "Arguing loudly", "Leaving the call"], answer: 0 },
    { question: "Sales training improves:", options: ["Confidence and conversion", "Confusion only", "No result"], answer: 0 },
  ],
  Technical: [
    { question: "Technical training helps employees to:", options: ["Use tools and systems correctly", "Avoid learning", "Forget SOPs"], answer: 0 },
    { question: "If a system issue comes, first step is:", options: ["Check the issue carefully", "Panic", "Ignore it"], answer: 0 },
    { question: "Documentation is important because it:", options: ["Creates clarity", "Creates confusion", "Removes knowledge"], answer: 0 },
  ],
  "HR Policies": [
    { question: "HR policies help employees understand:", options: ["Rules and processes", "Only sports news", "Shopping websites"], answer: 0 },
    { question: "Leave policy tells you about:", options: ["How to apply leave", "How to play games", "How to cook food"], answer: 0 },
    { question: "Attendance policy is related to:", options: ["Punctuality and presence", "Music", "Vacation only"], answer: 0 },
  ],
};

const emptyEmployeeForm = { name: "", department: "", email: "", password: "", training: "", status: "Pending" };
const emptyTrainingForm = { title: "", category: "Onboarding", department: "", duration: "", type: "Video", mandatory: "Yes", description: "", objectives: "", materialName: "", materialLink: "" };
const emptyAssignForm = { employeeId: "", trainingId: "" };

const buildQuiz = (category) => (QUIZ_BANK[category] || QUIZ_BANK.Onboarding).map((item) => ({ ...item }));
const getMenuStyle = (active, current) => ({ ...styles.menuBtn, ...(active === current ? styles.menuBtnActive : {}) });

// ─── YOUTUBE PLAYER COMPONENT ─────────────────────────────────────────────────
function YouTubePlayer({ videoId, assignmentId, employeeId, trainingId, employeeName, trainingTitle, onAnalyticsUpdate }) {
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const analyticsRef = useRef({ watchPercent: 0, skipCount: 0, playCount: 0, lastPosition: 0, started: false });
  const intervalRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    const loadPlayer = () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }

      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 1 },
        events: {
          onStateChange: (event) => {
            const YT = window.YT;
            if (event.data === YT.PlayerState.PLAYING) {
              analyticsRef.current.playCount += 1;
              analyticsRef.current.started = true;
              startTracking();
            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
              stopTracking();
              if (event.data === YT.PlayerState.ENDED) {
                analyticsRef.current.watchPercent = 100;
              }
              saveAnalytics();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      window.onYouTubeIframeAPIReady = loadPlayer;
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      stopTracking();
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch (_) {}
        playerInstanceRef.current = null;
      }
    };
  }, [videoId]);

  const startTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const p = playerInstanceRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const current = p.getCurrentTime();
      const duration = p.getDuration();
      if (!duration) return;

      const diff = current - analyticsRef.current.lastPosition;
      if (diff > 5 && analyticsRef.current.started) {
        analyticsRef.current.skipCount += 1;
      }
      analyticsRef.current.lastPosition = current;
      const percent = Math.round((current / duration) * 100);
      if (percent > analyticsRef.current.watchPercent) {
        analyticsRef.current.watchPercent = percent;
      }
    }, 2000);
  };

  const stopTracking = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const saveAnalytics = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const a = analyticsRef.current;
      const now = new Date().toISOString();
      const record = {
        id: Number(`${employeeId}${trainingId}`),
        employee_id: employeeId,
        training_id: trainingId,
        employee_name: employeeName,
        training_title: trainingTitle,
        watch_percent: a.watchPercent,
        skip_count: a.skipCount,
        play_count: a.playCount,
        last_watched: now,
        completed: a.watchPercent >= 90,
      };

      await supabase.from("video_analytics").upsert(record, { onConflict: "id" });
      if (onAnalyticsUpdate) onAnalyticsUpdate(record);
    }, 1000);
  };

  if (!videoId) return <div style={styles.noVideo}>No YouTube link added for this training.</div>;

  return (
    <div style={styles.playerWrap}>
      <div ref={playerRef} style={styles.playerDiv} />
      <div style={styles.analyticsBar}>
        <span style={styles.analyticsChip}>▶ Plays: {analyticsRef.current.playCount}</span>
        <span style={styles.analyticsChip}>👁 Watched: {analyticsRef.current.watchPercent}%</span>
        <span style={styles.analyticsChip}>⏭ Skips: {analyticsRef.current.skipCount}</span>
      </div>
    </div>
  );
}

// ─── EXTRACT YOUTUBE VIDEO ID ─────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [adminPage, setAdminPage] = useState("dashboard");
  const [employeePage, setEmployeePage] = useState("dashboard");

  const [employees, setEmployees] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [videoAnalytics, setVideoAnalytics] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [loginForm, setLoginForm] = useState({ role: "admin", email: "", password: "" });
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [quizAnswers, setQuizAnswers] = useState([]);

  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [editTrainingId, setEditTrainingId] = useState(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState(null);

  // ─── LOAD ALL DATA ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      if (!supabase) { setIsLoaded(true); return; }
      try {
        const [empRes, trainRes, assignRes, quizRes, vidRes] = await Promise.all([
          supabase.from("employees").select("*"),
          supabase.from("trainings").select("*"),
          supabase.from("assignments").select("*"),
          supabase.from("quiz_results").select("*"),
          supabase.from("video_analytics").select("*"),
        ]);
        if (cancelled) return;
        setEmployees(empRes.data || []);
        setTrainings((trainRes.data || []).map((t) => ({ ...t, materialName: t.material_name, materialLink: t.material_link, quizQuestions: t.quiz_questions })));
        setAssignments((assignRes.data || []).map((a) => ({ ...a, employeeId: a.employee_id, trainingId: a.training_id, quizScore: a.quiz_score, completedAt: a.completed_at, lastViewed: a.last_viewed })));
        setQuizResults((quizRes.data || []).map((q) => ({ ...q, employeeId: q.employee_id, trainingId: q.training_id, employeeName: q.employee_name, trainingTitle: q.training_title })));
        setVideoAnalytics((vidRes.data || []).map((v) => ({ ...v, employeeId: v.employee_id, trainingId: v.training_id, employeeName: v.employee_name, trainingTitle: v.training_title, watchPercent: v.watch_percent, skipCount: v.skip_count, playCount: v.play_count, lastWatched: v.last_watched })));
      } catch (err) { console.error("Load failed:", err); }
      finally { if (!cancelled) setIsLoaded(true); }
    };
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ─── SAVE EMPLOYEE ────────────────────────────────────────────────────────────
  const saveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.department || !employeeForm.email || !employeeForm.password || !employeeForm.training) { alert("Please fill all employee fields."); return; }
    if (editEmployeeId) {
      const { error } = await supabase.from("employees").update({ name: employeeForm.name, department: employeeForm.department, email: employeeForm.email, password: employeeForm.password, training: employeeForm.training, status: employeeForm.status }).eq("id", editEmployeeId);
      if (error) { alert("Save failed: " + error.message); return; }
      setEmployees((prev) => prev.map((item) => item.id === editEmployeeId ? { ...item, ...employeeForm } : item));
    } else {
      const newId = Date.now();
      const { error } = await supabase.from("employees").insert({ id: newId, name: employeeForm.name, department: employeeForm.department, email: employeeForm.email, password: employeeForm.password, training: employeeForm.training, status: employeeForm.status });
      if (error) { alert("Save failed: " + error.message); return; }
      setEmployees((prev) => [...prev, { id: newId, ...employeeForm }]);
    }
    setEmployeeForm(emptyEmployeeForm); setEditEmployeeId(null); setShowEmployeeModal(false);
  };

  // ─── SAVE TRAINING ────────────────────────────────────────────────────────────
  const saveTraining = async () => {
    if (!trainingForm.title || !trainingForm.category || !trainingForm.department || !trainingForm.duration || !trainingForm.type) { alert("Please fill all training fields."); return; }
    const quizQuestions = buildQuiz(trainingForm.category);
    const oldTraining = trainings.find((t) => t.id === editTrainingId);
    if (editTrainingId) {
      const { error } = await supabase.from("trainings").update({ title: trainingForm.title, category: trainingForm.category, department: trainingForm.department, duration: trainingForm.duration, type: trainingForm.type, mandatory: trainingForm.mandatory, description: trainingForm.description, objectives: trainingForm.objectives, material_name: trainingForm.materialName, material_link: trainingForm.materialLink, quiz_questions: quizQuestions }).eq("id", editTrainingId);
      if (error) { alert("Save failed: " + error.message); return; }
      setTrainings((prev) => prev.map((item) => item.id === editTrainingId ? { ...item, ...trainingForm, quizQuestions } : item));
      if (oldTraining && oldTraining.title !== trainingForm.title) {
        setEmployees((prev) => prev.map((emp) => emp.training === oldTraining.title ? { ...emp, training: trainingForm.title } : emp));
      }
    } else {
      const newId = Date.now();
      const { error } = await supabase.from("trainings").insert({ id: newId, title: trainingForm.title, category: trainingForm.category, department: trainingForm.department, duration: trainingForm.duration, type: trainingForm.type, mandatory: trainingForm.mandatory, description: trainingForm.description, objectives: trainingForm.objectives, material_name: trainingForm.materialName, material_link: trainingForm.materialLink, quiz_questions: quizQuestions });
      if (error) { alert("Save failed: " + error.message); return; }
      setTrainings((prev) => [...prev, { id: newId, ...trainingForm, quizQuestions }]);
    }
    setTrainingForm(emptyTrainingForm); setEditTrainingId(null); setShowTrainingModal(false);
  };

  // ─── SAVE ASSIGNMENT ──────────────────────────────────────────────────────────
  const saveAssignment = async () => {
    if (!assignForm.employeeId || !assignForm.trainingId) { alert("Please select employee and training."); return; }
    const employee = employees.find((e) => String(e.id) === String(assignForm.employeeId));
    const training = trainings.find((t) => String(t.id) === String(assignForm.trainingId));
    if (!employee || !training) return;
    const duplicate = assignments.find((a) => a.employeeId === employee.id && a.trainingId === training.id);
    if (duplicate) { alert("Already assigned."); return; }
    const newId = Date.now();
    const { error } = await supabase.from("assignments").insert({ id: newId, employee_id: employee.id, training_id: training.id, status: "Pending", viewed: false, quiz_score: null, completed_at: "", last_viewed: "" });
    if (error) { alert("Save failed: " + error.message); return; }
    setAssignments((prev) => [...prev, { id: newId, employeeId: employee.id, trainingId: training.id, status: "Pending", viewed: false, quizScore: null, completedAt: "", lastViewed: "" }]);
    setEmployees((prev) => prev.map((item) => item.id === employee.id ? { ...item, training: training.title, status: "Pending" } : item));
    await supabase.from("employees").update({ training: training.title, status: "Pending" }).eq("id", employee.id);
    setAssignForm(emptyAssignForm); setShowAssignModal(false);
  };

  // ─── DELETE FUNCTIONS ─────────────────────────────────────────────────────────
  const deleteEmployee = async (id) => {
    await supabase.from("employees").delete().eq("id", id);
    await supabase.from("assignments").delete().eq("employee_id", id);
    await supabase.from("quiz_results").delete().eq("employee_id", id);
    await supabase.from("video_analytics").delete().eq("employee_id", id);
    setEmployees((prev) => prev.filter((item) => item.id !== id));
    setAssignments((prev) => prev.filter((item) => item.employeeId !== id));
    setQuizResults((prev) => prev.filter((item) => item.employeeId !== id));
    setVideoAnalytics((prev) => prev.filter((item) => item.employeeId !== id));
  };

  const deleteTraining = async (id) => {
    const training = trainings.find((t) => t.id === id);
    await supabase.from("trainings").delete().eq("id", id);
    await supabase.from("assignments").delete().eq("training_id", id);
    await supabase.from("quiz_results").delete().eq("training_id", id);
    await supabase.from("video_analytics").delete().eq("training_id", id);
    setTrainings((prev) => prev.filter((item) => item.id !== id));
    setAssignments((prev) => prev.filter((item) => item.trainingId !== id));
    setQuizResults((prev) => prev.filter((item) => item.trainingId !== id));
    setVideoAnalytics((prev) => prev.filter((item) => item.trainingId !== id));
    if (training) setEmployees((prev) => prev.map((item) => item.training === training.title ? { ...item, training: "", status: "Pending" } : item));
  };

  const deleteAssignment = async (id) => {
    await supabase.from("assignments").delete().eq("id", id);
    setAssignments((prev) => prev.filter((item) => item.id !== id));
  };

  // ─── OTHER HELPERS ────────────────────────────────────────────────────────────
  const markEmployeeCompleted = async (id) => {
    await supabase.from("employees").update({ status: "Completed" }).eq("id", id);
    setEmployees((prev) => prev.map((item) => item.id === id ? { ...item, status: "Completed" } : item));
  };

  const openAssignmentViewer = async (assignmentId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    const newStatus = assignment.status === "Pending" ? "Viewed" : assignment.status;
    await supabase.from("assignments").update({ viewed: true, status: newStatus, last_viewed: new Date().toISOString() }).eq("id", assignmentId);
    setAssignments((prev) => prev.map((item) => item.id === assignmentId ? { ...item, viewed: true, status: newStatus, lastViewed: new Date().toISOString() } : item));
    setActiveAssignmentId(assignmentId);
    setShowViewerModal(true);
  };

  const openQuizForAssignment = async (assignmentId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    const training = trainings.find((t) => t.id === assignment.trainingId);
    if (!training) return;
    const newStatus = assignment.status === "Pending" ? "Viewed" : assignment.status;
    await supabase.from("assignments").update({ viewed: true, status: newStatus, last_viewed: new Date().toISOString() }).eq("id", assignmentId);
    setAssignments((prev) => prev.map((item) => item.id === assignmentId ? { ...item, viewed: true, status: newStatus, lastViewed: new Date().toISOString() } : item));
    setActiveAssignmentId(assignmentId);
    setQuizAnswers(new Array((training.quizQuestions || []).length).fill(""));
    setShowQuizModal(true);
  };

  const submitQuiz = async () => {
    const assignment = assignments.find((a) => a.id === activeAssignmentId);
    if (!assignment) return;
    const training = trainings.find((t) => t.id === assignment.trainingId);
    if (!training) return;
    const questions = training.quizQuestions || [];
    let correct = 0;
    questions.forEach((q, index) => { if (Number(quizAnswers[index]) === q.answer) correct += 1; });
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= 60;
    const now = new Date().toISOString();
    await supabase.from("assignments").update({ quiz_score: score, viewed: true, status: passed ? "Completed" : "Viewed", completed_at: passed ? now : assignment.completedAt, last_viewed: now }).eq("id", activeAssignmentId);
    setAssignments((prev) => prev.map((item) => item.id === activeAssignmentId ? { ...item, quizScore: score, viewed: true, status: passed ? "Completed" : "Viewed", completedAt: passed ? now : item.completedAt, lastViewed: now } : item));
    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (emp) {
      await supabase.from("employees").update({ status: passed ? "Completed" : "Viewed" }).eq("id", emp.id);
      setEmployees((prev) => prev.map((item) => item.id === emp.id ? { ...item, status: passed ? "Completed" : "Viewed" } : item));
    }
    const newQuizId = Date.now();
    const quizRow = { id: newQuizId, employee_id: assignment.employeeId, training_id: training.id, employee_name: emp?.name || "", training_title: training.title, category: training.category, score, passed, date: new Date().toLocaleString() };
    await supabase.from("quiz_results").insert(quizRow);
    setQuizResults((prev) => [...prev, { id: newQuizId, employeeId: assignment.employeeId, trainingId: training.id, employeeName: emp?.name || "", trainingTitle: training.title, category: training.category, score, passed, date: new Date().toLocaleString() }]);
    if (passed) { setActiveCertificate({ employeeName: emp?.name || "", trainingTitle: training.title, date: new Date().toLocaleDateString(), score }); setShowCertificateModal(true); }
    setShowQuizModal(false); setQuizAnswers([]);
  };

  const markCompleted = async (assignmentId) => {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return;
    const now = new Date().toISOString();
    await supabase.from("assignments").update({ status: "Completed", viewed: true, completed_at: now }).eq("id", assignmentId);
    setAssignments((prev) => prev.map((item) => item.id === assignmentId ? { ...item, status: "Completed", viewed: true, completedAt: now } : item));
    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (emp) {
      await supabase.from("employees").update({ status: "Completed" }).eq("id", emp.id);
      setEmployees((prev) => prev.map((item) => item.id === emp.id ? { ...item, status: "Completed" } : item));
    }
  };

  // ─── MODAL HELPERS ────────────────────────────────────────────────────────────
  const openEditEmployee = (emp) => { if (!emp) return; setEmployeeForm({ name: emp.name || "", department: emp.department || "", email: emp.email || "", password: emp.password || "", training: emp.training || "", status: emp.status || "Pending" }); setEditEmployeeId(emp.id); setShowEmployeeModal(true); };
  const openNewEmployee = () => { setEmployeeForm(emptyEmployeeForm); setEditEmployeeId(null); setShowEmployeeModal(true); };
  const openEditTraining = (training) => { if (!training) return; setTrainingForm({ title: training.title || "", category: training.category || "Onboarding", department: training.department || "", duration: training.duration || "", type: training.type || "Video", mandatory: training.mandatory || "Yes", description: training.description || "", objectives: training.objectives || "", materialName: training.materialName || "", materialLink: training.materialLink || "" }); setEditTrainingId(training.id); setShowTrainingModal(true); };
  const openNewTraining = () => { setTrainingForm(emptyTrainingForm); setEditTrainingId(null); setShowTrainingModal(true); };

  // ─── COMPUTED ─────────────────────────────────────────────────────────────────
  const currentEmployee = session?.role === "employee" ? employees.find((e) => e.id === session.userId) : null;
  const myAssignments = currentEmployee ? assignments.filter((a) => a.employeeId === currentEmployee.id) : [];
  const myQuizHistory = currentEmployee ? quizResults.filter((q) => q.employeeId === currentEmployee.id) : [];
  const completedCount = assignments.filter((a) => a.status === "Completed").length;
  const pendingCount = assignments.filter((a) => a.status === "Pending").length;
  const viewedCount = assignments.filter((a) => a.status === "Viewed").length;
  const completionRate = assignments.length ? Math.round((completedCount / assignments.length) * 100) : 0;
  const averageQuizScore = quizResults.length ? Math.round(quizResults.reduce((sum, item) => sum + item.score, 0) / quizResults.length) : 0;
  const recentAssignments = [...assignments].slice(-5).reverse();

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesSearch = !term || [e.name, e.department, e.email, e.training, e.status].join(" ").toLowerCase().includes(term);
      const matchesDepartment = departmentFilter === "All" || e.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, departmentFilter]);

  const filteredTrainings = useMemo(() => trainings.filter((t) => {
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    const matchesDepartment = departmentFilter === "All" || t.department === departmentFilter;
    return matchesCategory && matchesDepartment;
  }), [trainings, categoryFilter, departmentFilter]);

  const selectedAssignment = assignments.find((item) => item.id === activeAssignmentId);
  const selectedTraining = selectedAssignment ? trainings.find((t) => t.id === selectedAssignment.trainingId) : null;

  const resetLogin = () => setLoginForm({ role: "admin", email: "", password: "" });
  const handleLogin = () => {
    if (loginForm.role === "admin") {
      if (loginForm.email.trim().toLowerCase() === ADMIN_EMAIL && loginForm.password === ADMIN_PASSWORD) { setSession({ role: "admin", userId: null, name: "Admin" }); setAdminPage("dashboard"); resetLogin(); }
      else { alert("Admin login: " + ADMIN_EMAIL); }
      return;
    }
    const found = employees.find((e) => e.email.trim().toLowerCase() === loginForm.email.trim().toLowerCase() && e.password === loginForm.password);
    if (!found) { alert("Employee login failed. Check email and password."); return; }
    setSession({ role: "employee", userId: found.id, name: found.name });
    setEmployeePage("dashboard");
    resetLogin();
  };
  const handleLogout = () => { setSession(null); setAdminPage("dashboard"); setEmployeePage("dashboard"); };

  if (!isLoaded) return <div style={styles.loading}>Loading LMS...</div>;

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.loginLeft}>
            <h1 style={styles.loginBrand}>Ralson LMS</h1>
            <h2 style={styles.loginTitle}>Corporate Training Portal</h2>
            <p style={styles.loginText}>Login as Admin or Employee to access your training dashboard.</p>
            <p style={styles.loginPoint}>• Admin dashboard with video analytics</p>
            <p style={styles.loginPoint}>• Employee portal with YouTube player</p>
            <p style={styles.loginPoint}>• Watch time + skip tracking</p>
          </div>
          <div style={styles.loginRight}>
            <h3 style={styles.loginHeading}>Login</h3>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={loginForm.role} onChange={(e) => setLoginForm((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter email" />
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Enter password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            <button style={styles.loginButton} onClick={handleLogin}>Sign In</button>
            <p style={styles.loginHint}>Admin: {ADMIN_EMAIL}</p>
          </div>
        </div>
      </div>
    );
  }

  if (session.role === "employee" && !currentEmployee) {
    return <div style={styles.centerBox}><div style={styles.warningCard}><h2>Employee not found</h2><p>This user was deleted.</p><button style={styles.primaryBtnSmall} onClick={handleLogout}>Logout</button></div></div>;
  }

  // ─── EMPLOYEE PORTAL ──────────────────────────────────────────────────────────
  if (session.role === "employee") {
    return (
      <div style={styles.app}>
        <aside style={styles.sidebar}>
          <div>
            <h2 style={styles.logo}>Ralson LMS</h2>
            <p style={styles.sublogo}>Employee Portal</p>
            <div style={styles.menu}>
              <button style={getMenuStyle(employeePage, "dashboard")} onClick={() => setEmployeePage("dashboard")}>Dashboard</button>
              <button style={getMenuStyle(employeePage, "learning")} onClick={() => setEmployeePage("learning")}>My Trainings</button>
              <button style={getMenuStyle(employeePage, "history")} onClick={() => setEmployeePage("history")}>Quiz History</button>
            </div>
          </div>
          <div>
            <div style={styles.profileCard}><strong>{currentEmployee.name}</strong><p style={styles.smallText}>{currentEmployee.department}</p></div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </aside>
        <main style={styles.content}>
          <p style={styles.smallTitle}>Employee Learning Portal</p>
          <h1 style={styles.title}>My Training Dashboard</h1>

          {employeePage === "dashboard" && (
            <>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}><h2>{myAssignments.length}</h2><p>Assigned</p></div>
                <div style={styles.statCard}><h2>{myAssignments.filter((a) => a.status === "Completed").length}</h2><p>Completed</p></div>
                <div style={styles.statCard}><h2>{myAssignments.filter((a) => a.status === "Pending").length}</h2><p>Pending</p></div>
                <div style={styles.statCard}><h2>{myQuizHistory.length ? Math.round(myQuizHistory.reduce((s, i) => s + i.score, 0) / myQuizHistory.length) : 0}%</h2><p>Avg Quiz</p></div>
              </div>
              <section style={styles.panel}>
                <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>My Assigned Trainings</h2></div>
                {myAssignments.length === 0 ? <p style={styles.emptyText}>No training assigned yet.</p> : myAssignments.map((assignment) => {
                  const training = trainings.find((t) => t.id === assignment.trainingId);
                  return (
                    <div key={assignment.id} style={styles.listCard}>
                      <div>
                        <div style={styles.itemTitle}>{training ? training.title : "Training removed"}</div>
                        <div style={styles.smallText}>Category: {training?.category || "-"} • Status: {assignment.status} • Quiz: {assignment.quizScore ?? "NA"}</div>
                      </div>
                      <div style={styles.listActions}>
                        <button style={styles.primaryBtnSmall} onClick={() => openAssignmentViewer(assignment.id)}>Watch Video</button>
                        <button style={styles.secondarySmallBtn} onClick={() => openQuizForAssignment(assignment.id)}>Take Quiz</button>
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}

          {employeePage === "learning" && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>My Trainings</h2></div>
              {myAssignments.length === 0 ? <p style={styles.emptyText}>No training assigned yet.</p> : myAssignments.map((assignment) => {
                const training = trainings.find((t) => t.id === assignment.trainingId);
                return (
                  <div key={assignment.id} style={styles.listCard}>
                    <div>
                      <div style={styles.itemTitle}>{training ? training.title : "Training removed"}</div>
                      <div style={styles.smallText}>{training?.category || "-"} • {training?.duration || "-"} • Status: {assignment.status}</div>
                    </div>
                    <div style={styles.listActions}>
                      <button style={styles.primaryBtnSmall} onClick={() => openAssignmentViewer(assignment.id)}>Watch</button>
                      <button style={styles.secondarySmallBtn} onClick={() => openQuizForAssignment(assignment.id)}>Quiz</button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {employeePage === "history" && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>Quiz History</h2></div>
              {myQuizHistory.length === 0 ? <p style={styles.emptyText}>No quiz submitted yet.</p> : myQuizHistory.map((item) => (
                <div key={item.id} style={styles.assignmentCard}>
                  <strong>{item.trainingTitle}</strong>
                  <p style={styles.smallText}>Score: {item.score}% • {item.passed ? "✅ Passed" : "❌ Failed"} • {item.date}</p>
                  {item.passed && <button style={styles.primaryBtnSmall} onClick={() => { setActiveCertificate({ employeeName: item.employeeName, trainingTitle: item.trainingTitle, date: item.date, score: item.score }); setShowCertificateModal(true); }}>View Certificate</button>}
                </div>
              ))}
            </section>
          )}
        </main>

        {/* VIDEO VIEWER MODAL */}
        {showViewerModal && selectedAssignment && selectedTraining && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <h2 style={styles.modalTitle}>{selectedTraining.title}</h2>
              <p style={styles.smallText}>{selectedTraining.category} • {selectedTraining.type} • {selectedTraining.duration}</p>
              <YouTubePlayer
                videoId={extractYouTubeId(selectedTraining.materialLink)}
                assignmentId={selectedAssignment.id}
                employeeId={currentEmployee.id}
                trainingId={selectedTraining.id}
                employeeName={currentEmployee.name}
                trainingTitle={selectedTraining.title}
                onAnalyticsUpdate={(record) => {
                  setVideoAnalytics((prev) => {
                    const exists = prev.find((v) => v.id === record.id);
                    if (exists) return prev.map((v) => v.id === record.id ? { ...v, ...record, employeeId: record.employee_id, trainingId: record.training_id, watchPercent: record.watch_percent, skipCount: record.skip_count, playCount: record.play_count, lastWatched: record.last_watched } : v);
                    return [...prev, { ...record, employeeId: record.employee_id, trainingId: record.training_id, watchPercent: record.watch_percent, skipCount: record.skip_count, playCount: record.play_count, lastWatched: record.last_watched }];
                  });
                }}
              />
              <div style={styles.contentBox}>
                <p><strong>Description:</strong> {selectedTraining.description || "-"}</p>
                <p><strong>Objectives:</strong> {selectedTraining.objectives || "-"}</p>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} onClick={() => setShowViewerModal(false)}>Close</button>
                <button style={styles.primaryBtnSmall} onClick={() => { markCompleted(selectedAssignment.id); setShowViewerModal(false); }}>Mark Complete</button>
                <button style={styles.markBtn} onClick={() => { setShowViewerModal(false); openQuizForAssignment(selectedAssignment.id); }}>Take Quiz</button>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ MODAL */}
        {showQuizModal && selectedAssignment && selectedTraining && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <h2 style={styles.modalTitle}>Quiz: {selectedTraining.title}</h2>
              {(selectedTraining.quizQuestions || []).map((q, index) => (
                <div key={index} style={styles.quizCard}>
                  <p style={styles.quizQuestion}>{index + 1}. {q.question}</p>
                  {q.options.map((option, optIndex) => (
                    <label key={optIndex} style={styles.radioRow}>
                      <input type="radio" name={`q-${index}`} value={optIndex} checked={String(quizAnswers[index]) === String(optIndex)} onChange={() => { const next = [...quizAnswers]; next[index] = optIndex; setQuizAnswers(next); }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ))}
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} onClick={() => setShowQuizModal(false)}>Cancel</button>
                <button style={styles.primaryBtnSmall} onClick={submitQuiz}>Submit Quiz</button>
              </div>
            </div>
          </div>
        )}

        {/* CERTIFICATE MODAL */}
        {showCertificateModal && activeCertificate && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <div style={styles.certificateBox}>
                <h1 style={styles.certificateHeading}>Certificate of Completion</h1>
                <p>This certifies that</p>
                <div style={styles.certificateName}>{activeCertificate.employeeName}</div>
                <p>has successfully completed</p>
                <div style={styles.certificateTraining}>{activeCertificate.trainingTitle}</div>
                <p style={styles.smallText}>Date: {activeCertificate.date} • Score: {activeCertificate.score}%</p>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} onClick={() => setShowCertificateModal(false)}>Close</button>
                <button style={styles.primaryBtnSmall} onClick={() => window.print()}>Print</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>Ralson LMS</h2>
          <p style={styles.sublogo}>Admin Portal</p>
          <div style={styles.menu}>
            <button style={getMenuStyle(adminPage, "dashboard")} onClick={() => setAdminPage("dashboard")}>Dashboard</button>
            <button style={getMenuStyle(adminPage, "employees")} onClick={() => setAdminPage("employees")}>Employees</button>
            <button style={getMenuStyle(adminPage, "training")} onClick={() => setAdminPage("training")}>Trainings</button>
            <button style={getMenuStyle(adminPage, "assign")} onClick={() => setAdminPage("assign")}>Assignments</button>
            <button style={getMenuStyle(adminPage, "analytics")} onClick={() => setAdminPage("analytics")}>📊 Video Analytics</button>
            <button style={getMenuStyle(adminPage, "reports")} onClick={() => setAdminPage("reports")}>Reports</button>
          </div>
        </div>
        <div>
          <button style={styles.primaryBtn} onClick={openNewEmployee}>Add Employee</button>
          <button style={styles.darkBtn} onClick={openNewTraining}>Add Training</button>
          <button style={styles.darkBtn} onClick={() => setShowAssignModal(true)}>Assign Module</button>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main style={styles.content}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.smallTitle}>Corporate Training Dashboard</p>
            <h1 style={styles.title}>Manage learning in one place</h1>
          </div>
          <div style={styles.filterRow}>
            <select style={styles.filterInput} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="All">All Departments</option>
              {[...new Set(employees.map((e) => e.department))].map((dep) => (<option key={dep} value={dep}>{dep}</option>))}
            </select>
            <select style={styles.filterInput} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
        </div>

        {adminPage === "dashboard" && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h2>{employees.length}</h2><p>Total Employees</p></div>
              <div style={styles.statCard}><h2>{trainings.length}</h2><p>Total Trainings</p></div>
              <div style={styles.statCard}><h2>{completedCount}</h2><p>Completed</p></div>
              <div style={styles.statCard}><h2>{completionRate}%</h2><p>Completion Rate</p></div>
            </div>
            <section style={styles.panel}>
              <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>Recent Assignments</h2></div>
              {recentAssignments.length === 0 ? <p style={styles.emptyText}>No assignments yet.</p> : recentAssignments.map((item) => {
                const emp = employees.find((e) => e.id === item.employeeId);
                const training = trainings.find((t) => t.id === item.trainingId);
                return (
                  <div key={item.id} style={styles.assignmentCard}>
                    <strong>{emp?.name || "Removed"}</strong>
                    <p style={styles.smallText}>{training?.title || "Removed"} • {item.status} • Quiz: {item.quizScore ?? "NA"}</p>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {adminPage === "employees" && (
          <section style={{ ...styles.panel, width: "100%" }}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Employees</h2>
              <input style={styles.searchInput} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th><th style={styles.th}>Department</th><th style={styles.th}>Email</th><th style={styles.th}>Training</th><th style={styles.th}>Status</th><th style={styles.th}>Edit</th><th style={styles.th}>Delete</th><th style={styles.th}>Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={styles.td}>{emp.name}</td>
                      <td style={styles.td}>{emp.department}</td>
                      <td style={styles.td}>{emp.email}</td>
                      <td style={styles.td}>{emp.training}</td>
                      <td style={{ ...styles.td, color: emp.status === "Completed" ? "green" : emp.status === "Viewed" ? "#b45309" : "#64748b" }}>{emp.status}</td>
                      <td style={styles.td}><button style={styles.editBtn} onClick={() => openEditEmployee(emp)}>Edit</button></td>
                      <td style={styles.td}><button style={styles.deleteBtn} onClick={() => deleteEmployee(emp.id)}>Delete</button></td>
                      <td style={styles.td}><button style={styles.secondarySmallBtn} onClick={() => markEmployeeCompleted(emp.id)}>✓</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {adminPage === "training" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>Training Library</h2><button style={styles.primaryBtnSmall} onClick={openNewTraining}>Add Training</button></div>
            {filteredTrainings.map((item) => (
              <div key={item.id} style={styles.listCard}>
                <div>
                  <div style={styles.itemTitle}>{item.title}</div>
                  <div style={styles.smallText}>{item.category} • {item.department} • {item.type} • {item.duration}</div>
                  <div style={styles.smallText}>YouTube Link: {item.materialLink ? <a href={item.materialLink} target="_blank" rel="noreferrer">{item.materialLink.substring(0, 50)}...</a> : "Not added"}</div>
                </div>
                <div style={styles.listActions}>
                  <button style={styles.editBtn} onClick={() => openEditTraining(item)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => deleteTraining(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {adminPage === "assign" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>Assignments</h2><button style={styles.primaryBtnSmall} onClick={() => setShowAssignModal(true)}>New Assignment</button></div>
            {assignments.map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              const training = trainings.find((t) => t.id === item.trainingId);
              return (
                <div key={item.id} style={styles.assignmentCard}>
                  <strong>{emp?.name || "Removed"}</strong>
                  <p style={styles.smallText}>{training?.title || "Removed"} • {item.status} • Quiz: {item.quizScore ?? "NA"}</p>
                  <div style={styles.listActions}>
                    <button style={styles.deleteBtn} onClick={() => deleteAssignment(item.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── VIDEO ANALYTICS PAGE ── */}
        {adminPage === "analytics" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>📊 Video Analytics</h2>
              <span style={styles.tag}>{videoAnalytics.length} records</span>
            </div>
            <p style={styles.heroText}>Real-time tracking of how much each employee watched, skips detected, and play count.</p>

            {videoAnalytics.length === 0 ? (
              <div style={styles.emptyAnalytics}>
                <p style={{ fontSize: "32px", marginBottom: "12px" }}>📭</p>
                <p style={{ fontWeight: 700, marginBottom: "6px" }}>No video data yet</p>
                <p style={styles.smallText}>Employee ne abhi koi video nahi dekhi. Jab employee video dekhega, data yahan dikhega.</p>
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Employee</th>
                      <th style={styles.th}>Training</th>
                      <th style={styles.th}>Watch %</th>
                      <th style={styles.th}>Skips</th>
                      <th style={styles.th}>Play Count</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Last Watched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoAnalytics.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}><strong>{item.employeeName}</strong></td>
                        <td style={styles.td}>{item.trainingTitle}</td>
                        <td style={styles.td}>
                          <div style={styles.progressWrap}>
                            <div style={{ ...styles.progressBar, width: `${item.watchPercent}%`, background: item.watchPercent >= 90 ? "#10b981" : item.watchPercent >= 50 ? "#f59e0b" : "#ef4444" }} />
                            <span style={styles.progressText}>{item.watchPercent}%</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: item.skipCount > 2 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                          {item.skipCount > 2 ? `⚠️ ${item.skipCount}` : `✅ ${item.skipCount}`}
                        </td>
                        <td style={styles.td}>{item.playCount}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.statusPill, background: item.completed ? "#dcfce7", color: item.completed ? "#16a34a" : "#dc2626" }}>
                            {item.completed ? "✅ Completed" : "⏳ In Progress"}
                          </span>
                        </td>
                        <td style={styles.td}>{item.lastWatched ? new Date(item.lastWatched).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {adminPage === "reports" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}><h2 style={styles.sectionTitle}>Reports</h2></div>
            <div style={styles.reportGrid}>
              <div style={styles.reportCard}><p style={styles.smallText}>Completion Rate</p><h2 style={styles.statNumber}>{completionRate}%</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Viewed</p><h2 style={styles.statNumber}>{viewedCount}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Avg Quiz Score</p><h2 style={styles.statNumber}>{averageQuizScore}%</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Pending</p><h2 style={styles.statNumber}>{pendingCount}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Employees</p><h2 style={styles.statNumber}>{employees.length}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Trainings</p><h2 style={styles.statNumber}>{trainings.length}</h2></div>
            </div>
          </section>
        )}
      </main>

      {/* EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editEmployeeId ? "Edit Employee" : "Add Employee"}</h2>
            <label style={styles.label}>Name</label><input style={styles.input} value={employeeForm.name} onChange={(e) => setEmployeeForm((p) => ({ ...p, name: e.target.value }))} />
            <label style={styles.label}>Department</label><input style={styles.input} value={employeeForm.department} onChange={(e) => setEmployeeForm((p) => ({ ...p, department: e.target.value }))} />
            <label style={styles.label}>Email</label><input style={styles.input} type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} />
            <label style={styles.label}>Password</label><input style={styles.input} value={employeeForm.password} onChange={(e) => setEmployeeForm((p) => ({ ...p, password: e.target.value }))} />
            <label style={styles.label}>Training Module</label><input style={styles.input} value={employeeForm.training} onChange={(e) => setEmployeeForm((p) => ({ ...p, training: e.target.value }))} />
            <label style={styles.label}>Status</label>
            <select style={styles.input} value={employeeForm.status} onChange={(e) => setEmployeeForm((p) => ({ ...p, status: e.target.value }))}>
              <option>Pending</option><option>Viewed</option><option>Completed</option>
            </select>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowEmployeeModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveEmployee}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* TRAINING MODAL */}
      {showTrainingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <h2 style={styles.modalTitle}>{editTrainingId ? "Edit Training" : "Add Training"}</h2>
            <label style={styles.label}>Title</label><input style={styles.input} value={trainingForm.title} onChange={(e) => setTrainingForm((p) => ({ ...p, title: e.target.value }))} />
            <label style={styles.label}>Category</label>
            <select style={styles.input} value={trainingForm.category} onChange={(e) => setTrainingForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
            <label style={styles.label}>Department</label><input style={styles.input} value={trainingForm.department} onChange={(e) => setTrainingForm((p) => ({ ...p, department: e.target.value }))} />
            <label style={styles.label}>Duration</label><input style={styles.input} value={trainingForm.duration} onChange={(e) => setTrainingForm((p) => ({ ...p, duration: e.target.value }))} />
            <label style={styles.label}>Type</label>
            <select style={styles.input} value={trainingForm.type} onChange={(e) => setTrainingForm((p) => ({ ...p, type: e.target.value }))}>
              <option>Video</option><option>PDF</option><option>PPT</option>
            </select>
            <label style={styles.label}>🎬 YouTube Link (paste full URL)</label>
            <input style={styles.input} value={trainingForm.materialLink} onChange={(e) => setTrainingForm((p) => ({ ...p, materialLink: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
            <label style={styles.label}>Material Name</label><input style={styles.input} value={trainingForm.materialName} onChange={(e) => setTrainingForm((p) => ({ ...p, materialName: e.target.value }))} />
            <label style={styles.label}>Mandatory</label>
            <select style={styles.input} value={trainingForm.mandatory} onChange={(e) => setTrainingForm((p) => ({ ...p, mandatory: e.target.value }))}>
              <option>Yes</option><option>No</option>
            </select>
            <label style={styles.label}>Description</label><textarea style={styles.textarea} value={trainingForm.description} onChange={(e) => setTrainingForm((p) => ({ ...p, description: e.target.value }))} />
            <label style={styles.label}>Objectives</label><textarea style={styles.textarea} value={trainingForm.objectives} onChange={(e) => setTrainingForm((p) => ({ ...p, objectives: e.target.value }))} />
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowTrainingModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveTraining}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Assign Training</h2>
            <label style={styles.label}>Employee</label>
            <select style={styles.input} value={assignForm.employeeId} onChange={(e) => setAssignForm((p) => ({ ...p, employeeId: e.target.value }))}>
              <option value="">Select employee</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>)}
            </select>
            <label style={styles.label}>Training</label>
            <select style={styles.input} value={assignForm.trainingId} onChange={(e) => setAssignForm((p) => ({ ...p, trainingId: e.target.value }))}>
              <option value="">Select training</option>
              {trainings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveAssignment}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertificateModal && activeCertificate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.certificateBox}>
              <h1 style={styles.certificateHeading}>Certificate of Completion</h1>
              <p>This certifies that</p>
              <div style={styles.certificateName}>{activeCertificate.employeeName}</div>
              <p>has successfully completed</p>
              <div style={styles.certificateTraining}>{activeCertificate.trainingTitle}</div>
              <p style={styles.smallText}>Date: {activeCertificate.date} • Score: {activeCertificate.score}%</p>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowCertificateModal(false)}>Close</button>
              <button style={styles.primaryBtnSmall} onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { display: "flex", minHeight: "100vh", width: "100%", fontFamily: "Arial, sans-serif", background: "#f8fafc" },
  loading: { minHeight: "100vh", display: "grid", placeItems: "center", fontSize: "18px", background: "#f8fafc" },
  sidebar: { width: "clamp(220px,18vw,260px)", minWidth: "220px", flexShrink: 0, background: "#0f172a", color: "white", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "18px", boxSizing: "border-box" },
  logo: { color: "#38bdf8", margin: 0, fontSize: "clamp(20px,1.6vw,24px)" },
  sublogo: { fontSize: "12px", color: "#94a3b8", marginTop: "6px", marginBottom: "22px" },
  menu: { display: "flex", flexDirection: "column", gap: "10px" },
  menuBtn: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "none", background: "#1e293b", color: "white", cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: 600, boxSizing: "border-box" },
  menuBtnActive: { background: "#2563eb", color: "white", fontWeight: 700 },
  primaryBtn: { width: "100%", padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700 },
  primaryBtnSmall: { padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700 },
  darkBtn: { width: "100%", padding: "12px", background: "#334155", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700, marginTop: "10px" },
  logoutBtn: { width: "100%", padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 700, marginTop: "16px" },
  content: { flex: 1, minWidth: 0, padding: "clamp(20px,2vw,34px)", boxSizing: "border-box" },
  smallTitle: { margin: 0, color: "#64748b", fontSize: "14px" },
  title: { marginTop: "8px", marginBottom: "24px", fontSize: "clamp(28px,3vw,40px)", lineHeight: 1.1, color: "#0f172a" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "18px", flexWrap: "wrap" },
  filterRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  filterInput: { minWidth: "180px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "white" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "16px", marginBottom: "22px" },
  statCard: { background: "white", padding: "22px", borderRadius: "18px", boxShadow: "0 10px 25px rgba(15,23,42,.05)", border: "1px solid #e2e8f0", textAlign: "center" },
  statNumber: { margin: "0 0 10px 0", fontSize: "clamp(24px,2.5vw,34px)", color: "#0f172a" },
  panel: { width: "100%", background: "white", border: "1px solid #e2e8f0", borderRadius: "22px", padding: "22px", boxShadow: "0 10px 25px rgba(15,23,42,.05)", boxSizing: "border-box", marginBottom: "22px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  sectionTitle: { margin: 0, fontSize: "clamp(18px,1.8vw,22px)" },
  tag: { padding: "7px 12px", borderRadius: "999px", background: "#eff6ff", color: "#1d4ed8", fontSize: "12px", fontWeight: 700 },
  heroText: { margin: "0 0 16px 0", color: "#475569", fontSize: "14px", lineHeight: 1.7 },
  listCard: { border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px", marginBottom: "12px", background: "#fafcff", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  assignmentCard: { border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginBottom: "12px", background: "#fafcff" },
  itemTitle: { fontWeight: 800, fontSize: "16px", marginBottom: "4px" },
  listActions: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  smallText: { color: "#64748b", fontSize: "13px", margin: 0 },
  emptyText: { color: "#64748b" },
  emptyAnalytics: { textAlign: "center", padding: "48px 20px", color: "#64748b" },
  searchInput: { minWidth: "220px", padding: "12px 14px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "white" },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: "700px", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "13px" },
  td: { padding: "12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
  editBtn: { padding: "8px 12px", borderRadius: "10px", border: "none", background: "#f59e0b", color: "white", cursor: "pointer", fontWeight: 700 },
  deleteBtn: { padding: "8px 12px", borderRadius: "10px", border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontWeight: 700 },
  markBtn: { padding: "8px 12px", borderRadius: "10px", border: "none", background: "#10b981", color: "white", cursor: "pointer", fontWeight: 700 },
  secondarySmallBtn: { padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 },
  progressWrap: { position: "relative", background: "#f1f5f9", borderRadius: "999px", height: "22px", width: "120px", overflow: "hidden" },
  progressBar: { position: "absolute", top: 0, left: 0, height: "100%", borderRadius: "999px", transition: "width 0.4s" },
  progressText: { position: "absolute", width: "100%", textAlign: "center", fontSize: "11px", fontWeight: 700, top: "3px", color: "#0f172a" },
  statusPill: { padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 },
  reportGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" },
  reportCard: { border: "1px solid #e2e8f0", borderRadius: "16px", padding: "18px", background: "#f8fafc" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50, overflowY: "auto" },
  modal: { width: "min(92vw,620px)", maxHeight: "90vh", background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflowY: "auto", boxSizing: "border-box" },
  modalLarge: { width: "min(94vw,800px)", maxHeight: "90vh", background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,.2)", overflowY: "auto", boxSizing: "border-box" },
  modalTitle: { marginTop: 0, marginBottom: "6px" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "22px" },
  label: { display: "block", marginTop: "14px", marginBottom: "6px", fontWeight: 700, color: "#0f172a" },
  input: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box", background: "white" },
  textarea: { width: "100%", minHeight: "80px", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box", background: "white", resize: "vertical" },
  secondaryBtn: { padding: "12px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 },
  loginPage: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9", padding: "20px" },
  loginCard: { width: "min(980px,96vw)", display: "grid", gridTemplateColumns: "1fr 1fr", background: "white", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,.1)" },
  loginLeft: { background: "#0f172a", color: "white", padding: "clamp(24px,4vw,50px)" },
  loginRight: { padding: "clamp(24px,4vw,50px)" },
  loginBrand: { color: "#38bdf8", fontSize: "28px", fontWeight: 800, marginBottom: "16px" },
  loginTitle: { fontSize: "clamp(24px,3vw,36px)", margin: "16px 0", color: "white", lineHeight: 1.2 },
  loginText: { color: "#cbd5e1", lineHeight: 1.7, fontSize: "14px" },
  loginPoint: { marginTop: "10px", color: "#e2e8f0", fontSize: "14px" },
  loginHeading: { fontSize: "clamp(24px,3vw,36px)", marginBottom: "24px", color: "#0f172a" },
  loginButton: { width: "100%", marginTop: "28px", padding: "14px", border: "none", borderRadius: "12px", background: "#0f172a", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
  loginHint: { marginTop: "10px", color: "#64748b", fontSize: "12px" },
  centerBox: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" },
  warningCard: { background: "white", padding: "28px", borderRadius: "18px", textAlign: "center" },
  contentBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", margin: "14px 0" },
  profileCard: { background: "#1e293b", borderRadius: "12px", padding: "14px", marginBottom: "10px" },
  quizCard: { border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", marginTop: "14px" },
  quizQuestion: { marginTop: 0, marginBottom: "12px", fontWeight: 700 },
  radioRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", cursor: "pointer" },
  certificateBox: { border: "8px solid #0f172a", borderRadius: "20px", padding: "40px", textAlign: "center" },
  certificateHeading: { color: "#0f172a", marginBottom: "10px" },
  certificateName: { fontSize: "32px", fontWeight: "bold", margin: "20px 0" },
  certificateTraining: { fontSize: "24px", fontWeight: "bold", color: "#2563eb", marginBottom: "10px" },
  noVideo: { background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "12px", padding: "20px", textAlign: "center", color: "#92400e", fontWeight: 600, margin: "16px 0" },
  playerWrap: { margin: "16px 0", borderRadius: "14px", overflow: "hidden", background: "#000" },
  playerDiv: { width: "100%", height: "420px" },
  analyticsBar: { display: "flex", gap: "12px", padding: "12px 16px", background: "#0f172a", flexWrap: "wrap" },
  analyticsChip: { background: "#1e293b", color: "#e2e8f0", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 700 },
};