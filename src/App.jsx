import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ralson_lms_rebuild_v1";
const ADMIN_EMAIL = "admin@company.com";
const ADMIN_PASSWORD = "admin123";

const CATEGORIES = ["Onboarding", "Soft Skills", "Sales", "Technical", "HR Policies"];

const QUIZ_BANK = {
  Onboarding: [
    {
      question: "What is the main purpose of onboarding?",
      options: ["To confuse new hires", "To help a new employee understand the company", "To reduce salary"],
      answer: 1,
    },
    {
      question: "Which is usually covered in onboarding?",
      options: ["Company culture", "Movie reviews", "Holiday shopping"],
      answer: 0,
    },
    {
      question: "Onboarding should be:",
      options: ["Random", "Structured", "Ignored"],
      answer: 1,
    },
  ],
  "Soft Skills": [
    {
      question: "Which is a soft skill?",
      options: ["Communication", "Machine repair", "Typing code only"],
      answer: 0,
    },
    {
      question: "Good listening helps in:",
      options: ["Better understanding", "More mistakes", "Ignoring others"],
      answer: 0,
    },
    {
      question: "Teamwork means:",
      options: ["Working alone always", "Working together", "No cooperation"],
      answer: 1,
    },
  ],
  Sales: [
    {
      question: "What is important in sales?",
      options: ["Product knowledge", "Sleeping in meeting", "Ignoring customer"],
      answer: 0,
    },
    {
      question: "A customer objection should be handled by:",
      options: ["Listening and responding", "Arguing loudly", "Leaving the call"],
      answer: 0,
    },
    {
      question: "Sales training improves:",
      options: ["Confidence and conversion", "Confusion only", "No result"],
      answer: 0,
    },
  ],
  Technical: [
    {
      question: "Technical training helps employees to:",
      options: ["Use tools and systems correctly", "Avoid learning", "Forget SOPs"],
      answer: 0,
    },
    {
      question: "If a system issue comes, first step is:",
      options: ["Check the issue carefully", "Panic", "Ignore it"],
      answer: 0,
    },
    {
      question: "Documentation is important because it:",
      options: ["Creates clarity", "Creates confusion", "Removes knowledge"],
      answer: 0,
    },
  ],
  "HR Policies": [
    {
      question: "HR policies help employees understand:",
      options: ["Rules and processes", "Only sports news", "Shopping websites"],
      answer: 0,
    },
    {
      question: "Leave policy tells you about:",
      options: ["How to apply leave", "How to play games", "How to cook food"],
      answer: 0,
    },
    {
      question: "Attendance policy is related to:",
      options: ["Punctuality and presence", "Music", "Vacation only"],
      answer: 0,
    },
  ],
};

const seedEmployees = [
  {
    id: 1,
    name: "Rahul Sharma",
    department: "Sales",
    email: "rahul@company.com",
    password: "1234",
    training: "Sales Product Training",
    status: "Completed",
  },
  {
    id: 2,
    name: "Priya Verma",
    department: "HR",
    email: "priya@company.com",
    password: "1234",
    training: "HR Policy Orientation",
    status: "Pending",
  },
  {
    id: 3,
    name: "Amit Singh",
    department: "Operations",
    email: "amit@company.com",
    password: "1234",
    training: "Workplace Safety SOP",
    status: "Completed",
  },
];

const seedTrainings = [
  {
    id: 1,
    title: "Corporate Induction",
    category: "Onboarding",
    department: "General",
    duration: "45 min",
    type: "Video",
    mandatory: "Yes",
    description: "Welcome training for new employees.",
    objectives: "Understand company culture and basic rules.",
    materialName: "Induction video",
    materialLink: "",
    quizQuestions: QUIZ_BANK.Onboarding,
  },
  {
    id: 2,
    title: "HR Policy Orientation",
    category: "HR Policies",
    department: "HR",
    duration: "30 min",
    type: "PDF",
    mandatory: "Yes",
    description: "Introduction to company HR rules and policies.",
    objectives: "Learn attendance, leave, and conduct policies.",
    materialName: "HR policy PDF",
    materialLink: "",
    quizQuestions: QUIZ_BANK["HR Policies"],
  },
  {
    id: 3,
    title: "Sales Product Training",
    category: "Sales",
    department: "Sales",
    duration: "60 min",
    type: "Video",
    mandatory: "Yes",
    description: "Product knowledge and sales handling basics.",
    objectives: "Improve product understanding and customer handling.",
    materialName: "Sales training video",
    materialLink: "",
    quizQuestions: QUIZ_BANK.Sales,
  },
  {
    id: 4,
    title: "Workplace Safety SOP",
    category: "Technical",
    department: "Operations",
    duration: "40 min",
    type: "PPT",
    mandatory: "Yes",
    description: "Workplace safety and SOP awareness module.",
    objectives: "Follow safety rules and standard procedures.",
    materialName: "Safety SOP PPT",
    materialLink: "",
    quizQuestions: QUIZ_BANK.Technical,
  },
];

const seedAssignments = [
  {
    id: 1,
    employeeId: 1,
    trainingId: 3,
    status: "Completed",
    viewed: true,
    quizScore: 100,
    completedAt: "2026-05-01",
    lastViewed: "2026-05-01",
  },
  {
    id: 2,
    employeeId: 2,
    trainingId: 2,
    status: "Pending",
    viewed: false,
    quizScore: null,
    completedAt: "",
    lastViewed: "",
  },
];

const emptyEmployeeForm = {
  name: "",
  department: "",
  email: "",
  password: "",
  training: "",
  status: "Pending",
};

const emptyTrainingForm = {
  title: "",
  category: "Onboarding",
  department: "",
  duration: "",
  type: "Video",
  mandatory: "Yes",
  description: "",
  objectives: "",
  materialName: "",
  materialLink: "",
};

const emptyAssignForm = {
  employeeId: "",
  trainingId: "",
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getStorageState = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw, null);
};

const buildQuiz = (category) => {
  const quiz = QUIZ_BANK[category] || QUIZ_BANK.Onboarding;
  return quiz.map((item) => ({ ...item }));
};

const getMenuStyle = (active, current) => ({
  ...styles.menuBtn,
  ...(active === current ? styles.menuBtnActive : {}),
});

export default function App() {
  const saved = getStorageState();

  const [session, setSession] = useState(null);
  const [adminPage, setAdminPage] = useState("dashboard");
  const [employeePage, setEmployeePage] = useState("dashboard");

  const [employees, setEmployees] = useState(saved?.employees ?? seedEmployees);
  const [trainings, setTrainings] = useState(saved?.trainings ?? seedTrainings);
  const [assignments, setAssignments] = useState(saved?.assignments ?? seedAssignments);
  const [quizResults, setQuizResults] = useState(saved?.quizResults ?? []);

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
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ employees, trainings, assignments, quizResults })
      );
    } catch (error) {
      console.error("Save failed", error);
    }
  }, [employees, trainings, assignments, quizResults]);

  const currentEmployee =
    session?.role === "employee" ? employees.find((e) => e.id === session.userId) : null;

  const myAssignments = currentEmployee
    ? assignments.filter((a) => a.employeeId === currentEmployee.id)
    : [];

  const myQuizHistory = currentEmployee
    ? quizResults.filter((q) => q.employeeId === currentEmployee.id)
    : [];

  const completedCount = assignments.filter((a) => a.status === "Completed").length;
  const pendingCount = assignments.filter((a) => a.status === "Pending").length;
  const viewedCount = assignments.filter((a) => a.status === "Viewed").length;
  const completionRate = assignments.length
    ? Math.round((completedCount / assignments.length) * 100)
    : 0;
  const averageQuizScore = quizResults.length
    ? Math.round(quizResults.reduce((sum, item) => sum + item.score, 0) / quizResults.length)
    : 0;

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesSearch =
        !term ||
        [e.name, e.department, e.email, e.training, e.status].join(" ").toLowerCase().includes(term);
      const matchesDepartment = departmentFilter === "All" || e.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, departmentFilter]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
      const matchesDepartment = departmentFilter === "All" || t.department === departmentFilter;
      return matchesCategory && matchesDepartment;
    });
  }, [trainings, categoryFilter, departmentFilter]);

  const recentAssignments = [...assignments].slice(-5).reverse();

  const resetLogin = () => setLoginForm({ role: "admin", email: "", password: "" });

  const handleLogin = () => {
    if (loginForm.role === "admin") {
      if (loginForm.email.trim().toLowerCase() === ADMIN_EMAIL && loginForm.password === ADMIN_PASSWORD) {
        setSession({ role: "admin", userId: null, name: "Admin" });
        setAdminPage("dashboard");
        resetLogin();
      } else {
        alert("Admin login: admin@company.com / admin123");
      }
      return;
    }

    const found = employees.find(
      (e) => e.email.trim().toLowerCase() === loginForm.email.trim().toLowerCase() && e.password === loginForm.password
    );

    if (!found) {
      alert("Employee login failed. Check email and password.");
      return;
    }

    setSession({ role: "employee", userId: found.id, name: found.name });
    setEmployeePage("dashboard");
    resetLogin();
  };

  const handleLogout = () => {
    setSession(null);
    setAdminPage("dashboard");
    setEmployeePage("dashboard");
  };

  const openEditEmployee = (emp) => {
    if (!emp) return;
    setEmployeeForm({
      name: emp.name || "",
      department: emp.department || "",
      email: emp.email || "",
      password: emp.password || "",
      training: emp.training || "",
      status: emp.status || "Pending",
    });
    setEditEmployeeId(emp.id);
    setShowEmployeeModal(true);
  };

  const openNewEmployee = () => {
    setEmployeeForm(emptyEmployeeForm);
    setEditEmployeeId(null);
    setShowEmployeeModal(true);
  };

  const openEditTraining = (training) => {
    if (!training) return;
    setTrainingForm({
      title: training.title || "",
      category: training.category || "Onboarding",
      department: training.department || "",
      duration: training.duration || "",
      type: training.type || "Video",
      mandatory: training.mandatory || "Yes",
      description: training.description || "",
      objectives: training.objectives || "",
      materialName: training.materialName || "",
      materialLink: training.materialLink || "",
    });
    setEditTrainingId(training.id);
    setShowTrainingModal(true);
  };

  const openNewTraining = () => {
    setTrainingForm(emptyTrainingForm);
    setEditTrainingId(null);
    setShowTrainingModal(true);
  };

  const saveEmployee = () => {
    if (!employeeForm.name || !employeeForm.department || !employeeForm.email || !employeeForm.password || !employeeForm.training) {
      alert("Please fill all employee fields.");
      return;
    }

    if (editEmployeeId) {
      setEmployees((prev) => prev.map((item) => (item.id === editEmployeeId ? { ...item, ...employeeForm } : item)));
    } else {
      setEmployees((prev) => [...prev, { id: Date.now(), ...employeeForm }]);
    }

    setEmployeeForm(emptyEmployeeForm);
    setEditEmployeeId(null);
    setShowEmployeeModal(false);
  };

  const saveTraining = () => {
    if (!trainingForm.title || !trainingForm.category || !trainingForm.department || !trainingForm.duration || !trainingForm.type) {
      alert("Please fill all training fields.");
      return;
    }

    const quizQuestions = buildQuiz(trainingForm.category);
    const oldTraining = trainings.find((t) => t.id === editTrainingId);

    if (editTrainingId) {
      setTrainings((prev) =>
        prev.map((item) =>
          item.id === editTrainingId
            ? { ...item, ...trainingForm, quizQuestions }
            : item
        )
      );

      if (oldTraining && oldTraining.title !== trainingForm.title) {
        setEmployees((prev) =>
          prev.map((emp) => (emp.training === oldTraining.title ? { ...emp, training: trainingForm.title } : emp))
        );
        setAssignments((prev) =>
          prev.map((a) =>
            a.trainingId === oldTraining.id
              ? { ...a, trainingId: editTrainingId }
              : a
          )
        );
      }
    } else {
      setTrainings((prev) => [...prev, { id: Date.now(), ...trainingForm, quizQuestions }]);
    }

    setTrainingForm(emptyTrainingForm);
    setEditTrainingId(null);
    setShowTrainingModal(false);
  };

  const saveAssignment = () => {
    if (!assignForm.employeeId || !assignForm.trainingId) {
      alert("Please select employee and training.");
      return;
    }

    const employee = employees.find((e) => String(e.id) === String(assignForm.employeeId));
    const training = trainings.find((t) => String(t.id) === String(assignForm.trainingId));
    if (!employee || !training) return;

    const duplicate = assignments.find((a) => a.employeeId === employee.id && a.trainingId === training.id);
    if (duplicate) {
      alert("This training is already assigned to this employee.");
      return;
    }

    setAssignments((prev) => [
      ...prev,
      {
        id: Date.now(),
        employeeId: employee.id,
        trainingId: training.id,
        status: "Pending",
        viewed: false,
        quizScore: null,
        completedAt: "",
        lastViewed: "",
      },
    ]);

    setEmployees((prev) =>
      prev.map((item) =>
        item.id === employee.id ? { ...item, training: training.title, status: "Pending" } : item
      )
    );

    setAssignForm(emptyAssignForm);
    setShowAssignModal(false);
  };

  const deleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((item) => item.id !== id));
    setAssignments((prev) => prev.filter((item) => item.employeeId !== id));
    setQuizResults((prev) => prev.filter((item) => item.employeeId !== id));
  };

  const deleteTraining = (id) => {
    const training = trainings.find((t) => t.id === id);
    setTrainings((prev) => prev.filter((item) => item.id !== id));
    setAssignments((prev) => prev.filter((item) => item.trainingId !== id));
    setQuizResults((prev) => prev.filter((item) => item.trainingId !== id));

    if (training) {
      setEmployees((prev) =>
        prev.map((item) => (item.training === training.title ? { ...item, training: "", status: "Pending" } : item))
      );
    }
  };

  const deleteAssignment = (id) => setAssignments((prev) => prev.filter((item) => item.id !== id));

  const markEmployeeCompleted = (id) => {
    setEmployees((prev) => prev.map((item) => (item.id === id ? { ...item, status: "Completed" } : item)));
  };

  const openTrainingMaterial = (training) => {
    if (!training) return;
    const file = training.materialLink;
    if (!file) {
      alert("No external file link available for this training.");
      return;
    }
    window.open(file, "_blank", "noopener,noreferrer");
  };

  const openAssignmentViewer = (assignmentId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignmentId
          ? { ...item, viewed: true, status: item.status === "Pending" ? "Viewed" : item.status, lastViewed: new Date().toISOString() }
          : item
      )
    );
    setActiveAssignmentId(assignmentId);
    setShowViewerModal(true);
  };

  const openQuizForAssignment = (assignmentId) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    const training = trainings.find((t) => t.id === assignment.trainingId);
    if (!training) return;

    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignmentId
          ? { ...item, viewed: true, status: item.status === "Pending" ? "Viewed" : item.status, lastViewed: new Date().toISOString() }
          : item
      )
    );
    setActiveAssignmentId(assignmentId);
    setQuizAnswers(new Array((training.quizQuestions || []).length).fill(""));
    setShowQuizModal(true);
  };

  const submitQuiz = () => {
    const assignment = assignments.find((a) => a.id === activeAssignmentId);
    if (!assignment) return;
    const training = trainings.find((t) => t.id === assignment.trainingId);
    if (!training) return;

    const questions = training.quizQuestions || [];
    let correct = 0;
    questions.forEach((q, index) => {
      if (Number(quizAnswers[index]) === q.answer) correct += 1;
    });

    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= 60;

    setAssignments((prev) =>
      prev.map((item) =>
        item.id === activeAssignmentId
          ? {
              ...item,
              quizScore: score,
              viewed: true,
              status: passed ? "Completed" : "Viewed",
              completedAt: passed ? new Date().toISOString() : item.completedAt,
              lastViewed: new Date().toISOString(),
            }
          : item
      )
    );

    setQuizResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        employeeId: assignment.employeeId,
        trainingId: training.id,
        employeeName: employees.find((e) => e.id === assignment.employeeId)?.name || "",
        trainingTitle: training.title,
        category: training.category,
        score,
        passed,
        date: new Date().toLocaleString(),
      },
    ]);

    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (emp) {
      setEmployees((prev) =>
        prev.map((item) => (item.id === emp.id ? { ...item, status: passed ? "Completed" : "Viewed" } : item))
      );
    }

    if (passed) {
      setActiveCertificate({
        employeeName: employees.find((e) => e.id === assignment.employeeId)?.name || "",
        trainingTitle: training.title,
        date: new Date().toLocaleDateString(),
        score,
      });
      setShowCertificateModal(true);
    }

    setShowQuizModal(false);
    setQuizAnswers([]);
  };

  const markCompleted = (assignmentId) => {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return;
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignmentId
          ? { ...item, status: "Completed", viewed: true, completedAt: new Date().toISOString() }
          : item
      )
    );

    const emp = employees.find((e) => e.id === assignment.employeeId);
    if (emp) {
      setEmployees((prev) => prev.map((item) => (item.id === emp.id ? { ...item, status: "Completed" } : item)));
    }
  };

  const selectedAssignment = assignments.find((item) => item.id === activeAssignmentId);
  const selectedTraining = selectedAssignment
    ? trainings.find((t) => t.id === selectedAssignment.trainingId)
    : null;

  if (!isLoaded) {
    return <div style={styles.loading}>Loading LMS...</div>;
  }

  if (!session) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.loginLeft}>
            <h1 style={styles.loginBrand}>Ralson LMS</h1>
            <h2 style={styles.loginTitle}>Corporate Training Portal</h2>
            <p style={styles.loginText}>
              Login as Admin or Employee. Admin manages trainings, employees, assignments, reports and uploads.
              Employee can see only assigned trainings, open content, take quiz, and track progress.
            </p>
            <p style={styles.loginPoint}>• Admin dashboard</p>
            <p style={styles.loginPoint}>• Employee portal</p>
            <p style={styles.loginPoint}>• Training + quiz tracking</p>
          </div>

          <div style={styles.loginRight}>
            <h3 style={styles.loginHeading}>Login</h3>

            <label style={styles.label}>Role</label>
            <select
              style={styles.input}
              value={loginForm.role}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email"
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />

            <button style={styles.loginButton} onClick={handleLogin}>
              Sign In
            </button>

            <p style={styles.loginHint}>Admin login: admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  if (session.role === "employee" && !currentEmployee) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.warningCard}>
          <h2>Employee not found</h2>
          <p>This user was deleted or is no longer available.</p>
          <button style={styles.primaryBtnSmall} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

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
            <div style={styles.profileCard}>
              <strong>{currentEmployee.name}</strong>
              <p style={styles.smallText}>{currentEmployee.department}</p>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </aside>

        <main style={styles.content}>
          <p style={styles.smallTitle}>Employee Learning Portal</p>
          <h1 style={styles.title}>My training dashboard</h1>

          {employeePage === "dashboard" && (
            <>
              <section style={styles.heroCard}>
                <div>
                  <div style={styles.miniBadge}>Your Learning Summary</div>
                  <p style={styles.heroText}>
                    View only your assigned training modules, open content, mark viewed, take quiz and complete learning.
                  </p>
                </div>
                <div style={styles.statusBox}>
                  <div style={styles.statusLabel}>Assigned Trainings</div>
                  <div style={styles.statusNumber}>{myAssignments.length}</div>
                  <div style={styles.statusSub}>Completed: {myAssignments.filter((a) => a.status === "Completed").length}</div>
                </div>
              </section>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}><h2>{myAssignments.filter((a) => a.status === "Completed").length}</h2><p>Completed</p></div>
                <div style={styles.statCard}><h2>{myAssignments.filter((a) => a.status === "Viewed").length}</h2><p>Viewed</p></div>
                <div style={styles.statCard}><h2>{myAssignments.filter((a) => a.status === "Pending").length}</h2><p>Pending</p></div>
                <div style={styles.statCard}><h2>{myQuizHistory.length ? Math.round(myQuizHistory.reduce((s, item) => s + item.score, 0) / myQuizHistory.length) : 0}%</h2><p>Avg Quiz Score</p></div>
              </div>

              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h2 style={styles.sectionTitle}>Assigned Trainings</h2>
                  <span style={styles.tag}>Only your content</span>
                </div>
                {myAssignments.length === 0 ? (
                  <p style={styles.emptyText}>No training assigned yet.</p>
                ) : (
                  myAssignments.map((assignment) => {
                    const training = trainings.find((t) => t.id === assignment.trainingId);
                    return (
                      <div key={assignment.id} style={styles.listCard}>
                        <div>
                          <div style={styles.itemTitle}>{training ? training.title : "Training removed"}</div>
                          <div style={styles.smallText}>Category: {training?.category || "-"} • Type: {training?.type || "-"} • Status: {assignment.status}</div>
                          <div style={styles.smallText}>Quiz Score: {assignment.quizScore ?? "NA"}</div>
                        </div>
                        <div style={styles.listActions}>
                          <button style={styles.primaryBtnSmall} onClick={() => openAssignmentViewer(assignment.id)}>View</button>
                          <button style={styles.secondarySmallBtn} onClick={() => openQuizForAssignment(assignment.id)}>Quiz</button>
                          <button style={styles.markBtn} onClick={() => markCompleted(assignment.id)}>Complete</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </>
          )}

          {employeePage === "learning" && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.sectionTitle}>My Trainings</h2>
                <span style={styles.tag}>Assigned modules</span>
              </div>
              {myAssignments.length === 0 ? (
                <p style={styles.emptyText}>No training assigned yet.</p>
              ) : (
                myAssignments.map((assignment) => {
                  const training = trainings.find((t) => t.id === assignment.trainingId);
                  return (
                    <div key={assignment.id} style={styles.listCard}>
                      <div>
                        <div style={styles.itemTitle}>{training ? training.title : "Training removed"}</div>
                        <div style={styles.smallText}>{training?.category || "-"} • {training?.department || "-"} • {training?.duration || "-"}</div>
                        <div style={styles.smallText}>Status: {assignment.status} • Quiz: {assignment.quizScore ?? "NA"}</div>
                      </div>
                      <div style={styles.listActions}>
                        <button style={styles.primaryBtnSmall} onClick={() => openAssignmentViewer(assignment.id)}>Open</button>
                        <button style={styles.secondarySmallBtn} onClick={() => openQuizForAssignment(assignment.id)}>Take Quiz</button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}

          {employeePage === "history" && (
            <section style={styles.panel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.sectionTitle}>Quiz History</h2>
                <span style={styles.tag}>Saved results</span>
              </div>
              {myQuizHistory.length === 0 ? (
                <p style={styles.emptyText}>No quiz submitted yet.</p>
              ) : (
                myQuizHistory.map((item) => (
                  <div key={item.id} style={styles.assignmentCard}>
                    <strong>{item.trainingTitle}</strong>
                    <p style={styles.smallText}>Category: {item.category} • Score: {item.score}% • {item.passed ? "Passed" : "Needs improvement"} • {item.date}</p>
                    {item.passed && (
                      <button
                        style={styles.primaryBtnSmall}
                        onClick={() => {
                          setActiveCertificate({
                            employeeName: item.employeeName,
                            trainingTitle: item.trainingTitle,
                            date: item.date,
                            score: item.score,
                          });
                          setShowCertificateModal(true);
                        }}
                      >
                        View Certificate
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>
          )}
        </main>

        {showViewerModal && selectedAssignment && selectedTraining && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <h2 style={styles.modalTitle}>{selectedTraining.title}</h2>
              <p style={styles.smallText}>Category: {selectedTraining.category} • Type: {selectedTraining.type} • Duration: {selectedTraining.duration}</p>
              <div style={styles.contentBox}>
                <p><strong>Description:</strong> {selectedTraining.description || "-"}</p>
                <p><strong>Objectives:</strong> {selectedTraining.objectives || "-"}</p>
                <p><strong>Uploaded Material:</strong> {selectedTraining.materialName || "-"}</p>
                <p><strong>Mandatory:</strong> {selectedTraining.mandatory}</p>
                <div style={styles.listActions}>
                  <button style={styles.primaryBtnSmall} onClick={() => openTrainingMaterial(selectedTraining)}>Open File</button>
                  {selectedTraining.materialLink ? (
                    <a href={selectedTraining.materialLink} target="_blank" rel="noreferrer" style={styles.linkBtn}>Open Link</a>
                  ) : null}
                </div>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} onClick={() => setShowViewerModal(false)}>Close</button>
                <button style={styles.primaryBtnSmall} onClick={() => { markCompleted(selectedAssignment.id); setShowViewerModal(false); }}>Mark Complete</button>
                <button style={styles.markBtn} onClick={() => { setShowViewerModal(false); openQuizForAssignment(selectedAssignment.id); }}>Take Quiz</button>
              </div>
            </div>
          </div>
        )}

        {showQuizModal && selectedAssignment && selectedTraining && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <h2 style={styles.modalTitle}>Quiz: {selectedTraining.title}</h2>
              <p style={styles.smallText}>Answer all questions and submit your score.</p>
              {(selectedTraining.quizQuestions || []).map((q, index) => (
                <div key={index} style={styles.quizCard}>
                  <p style={styles.quizQuestion}>{index + 1}. {q.question}</p>
                  {q.options.map((option, optIndex) => (
                    <label key={optIndex} style={styles.radioRow}>
                      <input
                        type="radio"
                        name={`q-${index}`}
                        value={optIndex}
                        checked={String(quizAnswers[index]) === String(optIndex)}
                        onChange={() => {
                          const next = [...quizAnswers];
                          next[index] = optIndex;
                          setQuizAnswers(next);
                        }}
                      />
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

        {showCertificateModal && activeCertificate && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalLarge}>
              <h2 style={styles.modalTitle}>Certificate of Completion</h2>
              <div style={styles.certificateBox}>
                <h1 style={styles.certificateHeading}>Certificate</h1>
                <p>This certifies that</p>
                <div style={styles.certificateName}>{activeCertificate.employeeName}</div>
                <p>has successfully completed</p>
                <div style={styles.certificateTraining}>{activeCertificate.trainingTitle}</div>
                <p style={styles.smallText}>Completion Date: {activeCertificate.date}</p>
                <p style={styles.smallText}>Quiz Score: {activeCertificate.score}%</p>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.secondaryBtn} onClick={() => setShowCertificateModal(false)}>Close</button>
                <button style={styles.primaryBtnSmall} onClick={() => window.print()}>Print Certificate</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>Ralson LMS</h2>
          <p style={styles.sublogo}>Learning & Development Portal</p>
          <div style={styles.menu}>
            <button style={getMenuStyle(adminPage, "dashboard")} onClick={() => setAdminPage("dashboard")}>Dashboard</button>
            <button style={getMenuStyle(adminPage, "employees")} onClick={() => setAdminPage("employees")}>Employees</button>
            <button style={getMenuStyle(adminPage, "training")} onClick={() => setAdminPage("training")}>Training Modules</button>
            <button style={getMenuStyle(adminPage, "assign")} onClick={() => setAdminPage("assign")}>Assign Training</button>
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
              {[...new Set(employees.map((e) => e.department))].map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            <select style={styles.filterInput} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {adminPage === "dashboard" && (
          <>
            <section style={styles.heroCard}>
              <div>
                <div style={styles.miniBadge}>MVP • Reusable Training Portal</div>
                <p style={styles.heroText}>
                  Upload trainings once, assign them to employees, track progress, and reduce repeated manual training.
                </p>
              </div>
              <div style={styles.statusBox}>
                <div style={styles.statusLabel}>Today's status</div>
                <div style={styles.statusNumber}>{pendingCount} pending</div>
                <div style={styles.statusSub}>{completedCount} completed</div>
              </div>
            </section>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h2>{employees.length}</h2><p>Total Employees</p></div>
              <div style={styles.statCard}><h2>{trainings.length}</h2><p>Total Trainings</p></div>
              <div style={styles.statCard}><h2>{completedCount}</h2><p>Completed</p></div>
              <div style={styles.statCard}><h2>{completionRate}%</h2><p>Completion Rate</p></div>
            </div>

            <div style={styles.grid2}>
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h2 style={styles.sectionTitle}>Training Modules</h2>
                  <span style={styles.tag}>{filteredTrainings.length} visible</span>
                </div>
                {filteredTrainings.map((item) => (
                  <div key={item.id} style={styles.listCard}>
                    <div>
                      <div style={styles.itemTitle}>{item.title}</div>
                      <div style={styles.smallText}>Category: {item.category} • Department: {item.department}</div>
                      <div style={styles.smallText}>Duration: {item.duration} • Type: {item.type} • Mandatory: {item.mandatory}</div>
                      <div style={styles.smallText}>Material: {item.materialName || "-"}</div>
                    </div>
                    <div style={styles.listActions}>
                      <button style={styles.primaryBtnSmall} onClick={() => openTrainingMaterial(item)}>View</button>
                      <button style={styles.editBtn} onClick={() => openEditTraining(item)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => deleteTraining(item.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </section>

              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <h2 style={styles.sectionTitle}>Recent Assignments</h2>
                  <span style={styles.tag}>Live tracking</span>
                </div>
                {recentAssignments.length === 0 ? (
                  <p style={styles.emptyText}>No assignments yet.</p>
                ) : (
                  recentAssignments.map((item) => {
                    const emp = employees.find((e) => e.id === item.employeeId);
                    const training = trainings.find((t) => t.id === item.trainingId);
                    return (
                      <div key={item.id} style={styles.assignmentCard}>
                        <strong>{emp?.name || "Employee removed"}</strong>
                        <p style={styles.smallText}>{training?.title || "Training removed"} • {training?.category || "-"} • {item.status} • Score: {item.quizScore ?? "NA"}</p>
                        <div style={styles.listActions}>
                          <button style={styles.primaryBtnSmall} onClick={() => openTrainingMaterial(training)}>View</button>
                          <button style={styles.deleteBtn} onClick={() => deleteAssignment(item.id)}>Delete Assignment</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </div>
          </>
        )}

        {adminPage === "employees" && (
          <section style={{ ...styles.panel, width: "100%" }}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Employee Training Status</h2>
              <input style={styles.searchInput} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Training</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Edit</th>
                    <th style={styles.th}>Delete</th>
                    <th style={styles.th}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={styles.td}>{emp.name}</td>
                      <td style={styles.td}>{emp.department}</td>
                      <td style={styles.td}>{emp.email || "-"}</td>
                      <td style={styles.td}>{emp.training}</td>
                      <td style={{ ...styles.td, color: emp.status === "Completed" ? "green" : emp.status === "Viewed" ? "#b45309" : "#64748b" }}>{emp.status}</td>
                      <td style={styles.td}><button style={styles.editBtn} onClick={() => openEditEmployee(emp)}>Edit</button></td>
                      <td style={styles.td}><button style={styles.deleteBtn} onClick={() => deleteEmployee(emp.id)}>Delete</button></td>
                      <td style={styles.td}><button style={styles.secondarySmallBtn} onClick={() => markEmployeeCompleted(emp.id)}>Mark Complete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {adminPage === "training" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Training Library</h2>
              <button style={styles.primaryBtnSmall} onClick={openNewTraining}>Add Training</button>
            </div>

            {filteredTrainings.map((item) => (
              <div key={item.id} style={styles.listCard}>
                <div>
                  <div style={styles.itemTitle}>{item.title}</div>
                  <div style={styles.smallText}>Category: {item.category} • Department: {item.department}</div>
                  <div style={styles.smallText}>Duration: {item.duration} • Type: {item.type} • Mandatory: {item.mandatory}</div>
                  <div style={styles.smallText}>Material: {item.materialName || "-"}</div>
                </div>
                <div style={styles.listActions}>
                  <button style={styles.primaryBtnSmall} onClick={() => openTrainingMaterial(item)}>View</button>
                  <button style={styles.editBtn} onClick={() => openEditTraining(item)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => deleteTraining(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {adminPage === "assign" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Assign Training</h2>
              <button style={styles.primaryBtnSmall} onClick={() => setShowAssignModal(true)}>New Assignment</button>
            </div>
            <p style={styles.heroText}>Assign an existing training module to an employee and track viewed, completed, and quiz score.</p>

            {assignments.map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              const training = trainings.find((t) => t.id === item.trainingId);
              return (
                <div key={item.id} style={styles.assignmentCard}>
                  <strong>{emp?.name || "Employee removed"}</strong>
                  <p style={styles.smallText}>{training?.title || "Training removed"} • {training?.category || "-"} • {item.status} • Quiz: {item.quizScore ?? "NA"}</p>
                  <div style={styles.listActions}>
                    <button style={styles.primaryBtnSmall} onClick={() => openAssignmentViewer(item.id)}>View</button>
                    <button style={styles.secondarySmallBtn} onClick={() => openQuizForAssignment(item.id)}>Quiz</button>
                    <button style={styles.deleteBtn} onClick={() => deleteAssignment(item.id)}>Delete Assignment</button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {adminPage === "reports" && (
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Reports</h2>
              <span style={styles.tag}>Auto summary</span>
            </div>

            <div style={styles.reportGrid}>
              <div style={styles.reportCard}><p style={styles.smallText}>Completion Rate</p><h2 style={styles.statNumber}>{completionRate}%</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Viewed</p><h2 style={styles.statNumber}>{viewedCount}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Average Quiz Score</p><h2 style={styles.statNumber}>{averageQuizScore}%</h2></div>
            </div>

            <div style={styles.reportGrid}>
              <div style={styles.reportCard}><p style={styles.smallText}>Pending Employees</p><h2 style={styles.statNumber}>{pendingCount}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Employees</p><h2 style={styles.statNumber}>{employees.length}</h2></div>
              <div style={styles.reportCard}><p style={styles.smallText}>Trainings</p><h2 style={styles.statNumber}>{trainings.length}</h2></div>
            </div>
          </section>
        )}
      </main>

      {showEmployeeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editEmployeeId ? "Edit Employee" : "Add Employee"}</h2>
            <p style={styles.smallText}>Create or update employee data.</p>

            <label style={styles.label}>Employee Name</label>
            <input style={styles.input} type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, name: e.target.value }))} />
            <label style={styles.label}>Department</label>
            <input style={styles.input} type="text" value={employeeForm.department} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, department: e.target.value }))} />
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, email: e.target.value }))} />
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="text" value={employeeForm.password} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, password: e.target.value }))} />
            <label style={styles.label}>Training Module</label>
            <input style={styles.input} type="text" value={employeeForm.training} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, training: e.target.value }))} />
            <label style={styles.label}>Status</label>
            <select style={styles.input} value={employeeForm.status} onChange={(e) => setEmployeeForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="Pending">Pending</option>
              <option value="Viewed">Viewed</option>
              <option value="Completed">Completed</option>
            </select>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowEmployeeModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveEmployee}>Save Employee</button>
            </div>
          </div>
        </div>
      )}

      {showTrainingModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <h2 style={styles.modalTitle}>{editTrainingId ? "Edit Training" : "Add Training"}</h2>
            <p style={styles.smallText}>Create or update training module data.</p>

            <label style={styles.label}>Training Title</label>
            <input style={styles.input} type="text" value={trainingForm.title} onChange={(e) => setTrainingForm((prev) => ({ ...prev, title: e.target.value }))} />

            <label style={styles.label}>Category</label>
            <select style={styles.input} value={trainingForm.category} onChange={(e) => setTrainingForm((prev) => ({ ...prev, category: e.target.value }))}>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <label style={styles.label}>Department</label>
            <input style={styles.input} type="text" value={trainingForm.department} onChange={(e) => setTrainingForm((prev) => ({ ...prev, department: e.target.value }))} />

            <label style={styles.label}>Duration</label>
            <input style={styles.input} type="text" value={trainingForm.duration} onChange={(e) => setTrainingForm((prev) => ({ ...prev, duration: e.target.value }))} />

            <label style={styles.label}>Content Type</label>
            <select style={styles.input} value={trainingForm.type} onChange={(e) => setTrainingForm((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="Video">Video</option>
              <option value="PDF">PDF</option>
              <option value="PPT">PPT</option>
            </select>

            <label style={styles.label}>Material Name</label>
            <input style={styles.input} type="text" value={trainingForm.materialName} onChange={(e) => setTrainingForm((prev) => ({ ...prev, materialName: e.target.value }))} placeholder="File name or title" />

            <label style={styles.label}>Material Link</label>
            <input style={styles.input} type="text" value={trainingForm.materialLink} onChange={(e) => setTrainingForm((prev) => ({ ...prev, materialLink: e.target.value }))} placeholder="https://..." />

            <label style={styles.label}>Upload File Name Only (safe)</label>
            <input
              style={styles.input}
              type="file"
              accept=".pdf,.ppt,.pptx,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setTrainingForm((prev) => ({
                  ...prev,
                  materialName: file.name,
                  materialLink: "",
                }));
                alert("File name saved successfully. Add a public link for opening the file.");
              }}
            />

            <label style={styles.label}>Mandatory</label>
            <select style={styles.input} value={trainingForm.mandatory} onChange={(e) => setTrainingForm((prev) => ({ ...prev, mandatory: e.target.value }))}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} value={trainingForm.description} onChange={(e) => setTrainingForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Training description" />

            <label style={styles.label}>Objectives</label>
            <textarea style={styles.textarea} value={trainingForm.objectives} onChange={(e) => setTrainingForm((prev) => ({ ...prev, objectives: e.target.value }))} placeholder="Training objectives" />

            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowTrainingModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveTraining}>Save Training</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Assign Training</h2>
            <p style={styles.smallText}>Assign a module to an employee.</p>
            <label style={styles.label}>Employee</label>
            <select style={styles.input} value={assignForm.employeeId} onChange={(e) => setAssignForm((prev) => ({ ...prev, employeeId: e.target.value }))}>
              <option value="">Select employee</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>)}
            </select>
            <label style={styles.label}>Training</label>
            <select style={styles.input} value={assignForm.trainingId} onChange={(e) => setAssignForm((prev) => ({ ...prev, trainingId: e.target.value }))}>
              <option value="">Select training</option>
              {trainings.map((item) => <option key={item.id} value={item.id}>{item.title} - {item.category}</option>)}
            </select>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button style={styles.primaryBtnSmall} onClick={saveAssignment}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}

      {showCertificateModal && activeCertificate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <h2 style={styles.modalTitle}>Certificate of Completion</h2>
            <div style={styles.certificateBox}>
              <h1 style={styles.certificateHeading}>Certificate</h1>
              <p>This certifies that</p>
              <div style={styles.certificateName}>{activeCertificate.employeeName}</div>
              <p>has successfully completed</p>
              <div style={styles.certificateTraining}>{activeCertificate.trainingTitle}</div>
              <p style={styles.smallText}>Completion Date: {activeCertificate.date}</p>
              <p style={styles.smallText}>Quiz Score: {activeCertificate.score}%</p>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowCertificateModal(false)}>Close</button>
              <button style={styles.primaryBtnSmall} onClick={() => window.print()}>Print Certificate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    overflowX: "hidden",
    fontFamily: "Arial, sans-serif",
    background: "#f8fafc",
  },
  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontSize: "18px",
    color: "#0f172a",
    background: "#f8fafc",
  },
  sidebar: {
    width: "260px",
    minWidth: "260px",
    flexShrink: 0,
    background: "#0f172a",
    color: "white",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "18px",
    boxSizing: "border-box",
  },
  logo: {
    color: "#38bdf8",
    margin: 0,
    fontSize: "24px",
  },
  sublogo: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "6px",
    marginBottom: "22px",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  menuBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#1e293b",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 600,
    boxSizing: "border-box",
  },
  menuBtnActive: {
    background: "#2563eb",
    color: "white",
    fontWeight: 700,
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryBtnSmall: {
    padding: "12px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  darkBtn: {
    width: "100%",
    padding: "12px",
    background: "#334155",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    marginTop: "10px",
  },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
    marginTop: "16px",
  },
  content: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: "34px",
    boxSizing: "border-box",
  },
  smallTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },
  title: {
    marginTop: "8px",
    marginBottom: "24px",
    fontSize: "40px",
    lineHeight: 1.1,
    color: "#0f172a",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterInput: {
    minWidth: "180px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "white",
  },
  heroCard: {
    width: "100%",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "22px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
    flexWrap: "wrap",
    boxSizing: "border-box",
  },
  miniBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "12px",
  },
  heroText: {
    margin: 0,
    maxWidth: "760px",
    lineHeight: 1.7,
    color: "#475569",
  },
  statusBox: {
    minWidth: "220px",
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },
  statusLabel: {
    color: "#64748b",
    fontSize: "13px",
  },
  statusNumber: {
    fontSize: "28px",
    fontWeight: 800,
    marginTop: "6px",
  },
  statusSub: {
    color: "#0ea5e9",
    fontSize: "13px",
    marginTop: "4px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
    width: "100%",
  },
  statCard: {
    background: "white",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  statNumber: {
    margin: "0 0 10px 0",
    fontSize: "34px",
    color: "#0f172a",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
    gap: "18px",
    alignItems: "start",
    width: "100%",
  },
  panel: {
    width: "100%",
    minWidth: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
    boxSizing: "border-box",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
  },
  listCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
    background: "#fafcff",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  assignmentCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    background: "#fafcff",
  },
  itemTitle: {
    fontWeight: 800,
    fontSize: "16px",
    marginBottom: "4px",
  },
  listActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  smallText: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
  },
  emptyText: {
    color: "#64748b",
    marginTop: "8px",
  },
  searchInput: {
    minWidth: "220px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "white",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    display: "block",
  },
  table: {
    width: "100%",
    minWidth: "900px",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
  editBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#f59e0b",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  markBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#10b981",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondarySmallBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
    width: "100%",
  },
  reportCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "18px",
    background: "#f8fafc",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 50,
    overflowY: "auto",
  },
  modal: {
    width: "min(92vw, 620px)",
    maxHeight: "90vh",
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  modalLarge: {
    width: "min(94vw, 760px)",
    maxHeight: "90vh",
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: "6px",
  },
  label: {
    display: "block",
    marginTop: "14px",
    marginBottom: "8px",
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    background: "white",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    background: "white",
    resize: "vertical",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: "22px",
  },
  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  loginPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
    padding: "20px",
  },
  loginCard: {
    width: "980px",
    maxWidth: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  },
  loginLeft: {
    background: "#0f172a",
    color: "white",
    padding: "50px",
  },
  loginRight: {
    padding: "50px",
  },
  loginBrand: {
    color: "#38bdf8",
    fontSize: "18px",
    marginBottom: "20px",
  },
  loginTitle: {
    fontSize: "42px",
    margin: "20px 0",
    color: "#ffffff",
    lineHeight: "1.1",
  },
  loginText: {
    marginTop: "20px",
    lineHeight: "1.7",
    color: "#cbd5e1",
  },
  loginPoint: {
    marginTop: "12px",
    color: "#e2e8f0",
    fontSize: "15px",
  },
  loginHeading: {
    fontSize: "40px",
    marginBottom: "24px",
    color: "#0f172a",
  },
  loginButton: {
    width: "100%",
    marginTop: "30px",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#0f172a",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  loginHint: {
    marginTop: "12px",
    color: "#64748b",
    fontSize: "13px",
  },
  centerBox: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "20px",
  },
  warningCard: {
    background: "white",
    padding: "28px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },
  contentBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginTop: "14px",
    marginBottom: "16px",
  },
  linkBtn: {
    display: "inline-block",
    marginTop: "10px",
    color: "white",
    background: "#2563eb",
    padding: "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: 700,
  },
  quizCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginTop: "14px",
  },
  quizQuestion: {
    marginTop: 0,
    marginBottom: "12px",
    fontWeight: 700,
  },
  radioRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    cursor: "pointer",
  },
  certificateBox: {
    border: "8px solid #0f172a",
    borderRadius: "20px",
    padding: "40px",
    textAlign: "center",
    background: "#fff",
  },
  certificateHeading: {
    color: "#0f172a",
    marginBottom: "10px",
  },
  certificateName: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "20px 0",
  },
  certificateTraining: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: "10px",
  },
};
