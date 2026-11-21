const user = AngelicareApp.getUser();
const role = AngelicareApp.getRole();

const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeDescription = document.getElementById("welcomeDescription");
const quickAccess = document.getElementById("quickAccess");
const summaryCards = document.getElementById("summaryCards");
const scheduleContent = document.getElementById("scheduleContent");
const scheduleSection = document.getElementById("scheduleSection");
const scheduleLink = document.getElementById("scheduleLink");

const iconMarkup = {
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"></rect><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16.5h3M14 13h2"></path></svg>',
    patients: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"></path><circle cx="10" cy="7.5" r="3.5"></circle><path d="M17 11a3.2 3.2 0 1 0-1-6.2M17 15h1a3 3 0 0 1 3 3v2"></path></svg>',
    consultation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-3.8-7-10V5l7-2 7 2v6c0 6.2-7 10-7 10Z"></path><path d="M9 12h6M12 9v6"></path></svg>',
    records: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 20V5a1.5 1.5 0 0 1 2-1.5Z"></path><path d="M14 3.5V8h4M8 12h8M8 16h8"></path></svg>',
    prescription: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 4.2a5 5 0 0 1 7.1 0l4.5 4.5a5 5 0 0 1-7.1 7.1l-4.5-4.5a5 5 0 0 1 0-7.1Z"></path><path d="m9 15 6-6M6 18l-2 2M13 5l6 6"></path></svg>',
    referral: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"></path><path d="M5 5h5M5 19h5"></path></svg>',
    operations: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="m19.4 15 .1.1 1.1 1.9-1.8 1.8-1.9-1.1-.1-.1-1.5.6-.5 2.1h-2.6l-.5-2.1-1.5-.6-2 1.1-1.8-1.8 1.1-1.9-.6-1.5L3 13v-2.6l2.1-.5.6-1.5-1.1-2 1.8-1.8 2 1.1 1.5-.6.5-2.1H13l.5 2.1 1.5.6 1.9-1.1 1.8 1.8-1.1 2 .6 1.5 2.1.5V13l-2.1.5-.6 1.5Z"></path></svg>',
    reports: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V11M10 20V5M16 20v-8M22 20H2"></path></svg>',
    staff: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"></circle><path d="M3 20v-1.2A4.8 4.8 0 0 1 7.8 14h2.4a4.8 4.8 0 0 1 4.8 4.8V20M17 8h4M19 6v4"></path></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7v5l3.5 2"></path></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"></path></svg>',
    activity: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21"></path></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>'
};

const roleContent = {
    student: {
        description: "Book clinic visits and review your own clinic information.",
        heroTitle: "Your health information, all in one place.",
        heroDescription: "Check your appointments and stay up to date with the clinic information linked to your account.",
        heroEyebrow: "YOUR STUDENT CLINIC PORTAL",
        focusTitle: "Stay informed",
        focusDescription: "Check appointment updates and review the instructions recorded by the clinic.",
        focusTipTitle: "Your information stays personal",
        focusTipText: "Your portal shows clinic information linked to your own student account.",
        schedule: false,
        actions: [{ label: "View my appointments", url: "/appointments.html", primary: true }],
        modules: [
            { title: "My Appointments", description: "Book, review, or cancel eligible appointments.", url: "/appointments.html", icon: "calendar", category: "My clinic" },
            { title: "My Profile", description: "View your student clinic profile.", url: "/workspace.html?module=profile", icon: "profile", category: "My clinic" },
            { title: "Consultations", description: "Review your consultation history.", url: "/workspace.html?module=consultations", icon: "consultation", category: "My records" },
            { title: "Medical Records", description: "View diagnoses and treatments recorded by the clinic.", url: "/workspace.html?module=records", icon: "records", category: "My records" },
            { title: "Prescriptions", description: "View your medicine instructions.", url: "/workspace.html?module=prescriptions", icon: "prescription", category: "My records" },
            { title: "Referrals", description: "Track your external specialist referrals.", url: "/workspace.html?module=referrals", icon: "referral", category: "My records" }
        ]
    },
    nurse: {
        description: "Manage patients, appointments, consultations, clinic records, and daily operations.",
        heroTitle: "A smoother day for you and your patients.",
        heroDescription: "Keep bookings organized, document every visit, and coordinate the daily work of the school clinic.",
        heroEyebrow: "NURSE WORKSPACE",
        focusTitle: "Today's workflow",
        focusDescription: "Start with new bookings, keep patient details up to date, and make sure each visit is properly documented.",
        focusTipTitle: "Remember to complete visit records",
        focusTipText: "Record the assistance provided and follow-up instructions before closing a consultation.",
        schedule: true,
        actions: [
            { label: "Manage appointments", url: "/appointments.html", primary: true },
            { label: "Open patient records", url: "/workspace.html?module=patients", primary: false }
        ],
        modules: [
            { title: "Appointments", description: "Review bookings and update appointment statuses.", url: "/appointments.html", icon: "calendar", category: "Patient care" },
            { title: "Patients", description: "Create, update, and deactivate patient profiles.", url: "/workspace.html?module=patients", icon: "patients", category: "Patient care" },
            { title: "Consultations", description: "Record visits, assign doctors, and complete consultations.", url: "/workspace.html?module=consultations", icon: "consultation", category: "Patient care" },
            { title: "Medical Records", description: "Maintain diagnosis and treatment records.", url: "/workspace.html?module=records", icon: "records", category: "Clinical records" },
            { title: "Prescriptions", description: "View and maintain authorized prescriptions.", url: "/workspace.html?module=prescriptions", icon: "prescription", category: "Clinical records" },
            { title: "Referrals", description: "Create referrals and record returned findings.", url: "/workspace.html?module=referrals", icon: "referral", category: "Clinical records" },
            { title: "Clinic Operations", description: "Manage time slots, external doctors, and walk-in logs.", url: "/workspace.html?module=operations", icon: "operations", category: "Clinic management" },
            { title: "Reports", description: "View patient history and daily clinic schedules.", url: "/workspace.html?module=reports", icon: "reports", category: "Clinic management" }
        ]
    },
    doctor: {
        description: "Review consultations assigned to you, submit assessments, and issue prescriptions.",
        heroTitle: "Focus on the care that needs your review.",
        heroDescription: "Open your assigned consultations, document your clinical assessment, and manage eligible prescriptions.",
        heroEyebrow: "DOCTOR WORKSPACE",
        focusTitle: "Clinical review",
        focusDescription: "Review the consultation details before submitting your assessment.",
        focusTipTitle: "Review assigned cases only",
        focusTipText: "Assessments are restricted to consultations assigned to your Doctor account.",
        schedule: false,
        actions: [{ label: "Review assigned consultations", url: "/workspace.html?module=consultations", primary: true }],
        modules: [
            { title: "Assigned Consultations", description: "Review assigned cases and submit your assessment.", url: "/workspace.html?module=consultations", icon: "consultation", category: "Clinical work" },
            { title: "Prescriptions", description: "Issue prescriptions for eligible consultations.", url: "/workspace.html?module=prescriptions", icon: "prescription", category: "Clinical work" },
            { title: "My Profile", description: "View your Doctor profile information.", url: "/workspace.html?module=profile", icon: "profile", category: "Account" }
        ]
    },
    admin: {
        description: "Manage staff accounts and monitor clinic activity.",
        heroTitle: "Keep clinic access organized and secure.",
        heroDescription: "Manage staff accounts, maintain appropriate access, and review clinic activity summaries.",
        heroEyebrow: "ADMINISTRATOR WORKSPACE",
        focusTitle: "Account oversight",
        focusDescription: "Create staff accounts for authorized clinic personnel and review account status regularly.",
        focusTipTitle: "Protect administrator access",
        focusTipText: "Use the Admin account for account administration, not routine Nurse operations.",
        schedule: true,
        actions: [{ label: "Manage staff accounts", url: "/workspace.html?module=admin", primary: true }],
        modules: [
            { title: "Staff Accounts", description: "Create Nurse and Doctor accounts and manage account status.", url: "/workspace.html?module=admin", icon: "staff", category: "Administration" },
            { title: "Reports", description: "Review patient history and daily clinic schedules.", url: "/workspace.html?module=reports", icon: "reports", category: "Insights" }
        ]
    }
};

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-PH", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function formatTime(value) {
    if (!value) return "—";
    const parts = String(value).split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1] || 0);
    if (!Number.isFinite(hour)) return String(value);
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatShortDate(value) {
    if (!value) return "—";
    const key = String(value).split("T")[0];
    const [year, month, day] = key.split("-").map(Number);
    if (!year || !month || !day) return String(value);
    return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(year, month - 1, day));
}

function unwrapArray(result) {
    const data = AngelicareApp.getData(result);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

async function loadEndpoint(path) {
    const result = await AngelicareApp.authFetch(path);
    return AngelicareApp.getData(result);
}

async function loadArray(path) {
    const result = await loadEndpoint(path);
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    return [];
}

function createIcon(name, className = "") {
    const holder = document.createElement("span");
    holder.className = `icon-frame ${className}`.trim();
    holder.setAttribute("aria-hidden", "true");
    holder.innerHTML = iconMarkup[name] || iconMarkup.activity;
    return holder;
}

function setDashboardDate() {
    const date = document.getElementById("dashboardDate");
    const year = document.getElementById("footerYear");
    if (date) date.textContent = formatDisplayDate();
    if (year) year.textContent = String(new Date().getFullYear());
}

function renderHero(content) {
    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
    const firstName = (user?.fullName || "there").trim().split(/\s+/)[0];

    welcomeTitle.textContent = `${greeting}, ${firstName}.`;
    welcomeDescription.textContent = content.description;
    document.getElementById("heroEyebrow").textContent = content.heroEyebrow;
    document.getElementById("heroTitle").textContent = content.heroTitle;
    document.getElementById("heroDescription").textContent = content.heroDescription;
    document.getElementById("focusHeading").textContent = content.focusTitle;
    document.getElementById("focusDescription").textContent = content.focusDescription;
    document.getElementById("focusTipTitle").textContent = content.focusTipTitle;
    document.getElementById("focusTipText").textContent = content.focusTipText;

    const actions = document.getElementById("dashboardActions");
    actions.replaceChildren();
    content.actions.forEach(action => {
        const link = document.createElement("a");
        link.href = action.url;
        link.className = action.primary ? "hero-button hero-button-primary" : "hero-button hero-button-secondary";
        link.textContent = action.label;
        actions.appendChild(link);
    });
}

function renderSummary(items, note) {
    summaryCards.replaceChildren();
    document.getElementById("summaryNote").textContent = note || "Live information from the clinic system";

    items.forEach(item => {
        const card = document.createElement("article");
        card.className = `summary-card summary-${item.tone || "blue"}`;

        const top = document.createElement("div");
        top.className = "summary-card-top";
        const label = document.createElement("span");
        label.className = "summary-label";
        label.textContent = item.label;
        top.append(label, createIcon(item.icon, "summary-icon"));

        const value = document.createElement("strong");
        value.className = "summary-value";
        value.textContent = item.value === null || item.value === undefined ? "—" : String(item.value);

        const noteText = document.createElement("span");
        noteText.className = "summary-detail";
        noteText.textContent = item.detail || "";

        card.append(top, value, noteText);
        summaryCards.appendChild(card);
    });
}

function renderModuleCards(modules) {
    quickAccess.replaceChildren();
    modules.forEach(module => {
        const card = document.createElement("a");
        card.className = "module-card";
        card.href = module.url;

        const category = document.createElement("span");
        category.className = "module-category";
        category.textContent = module.category || "CLINIC MODULE";

        const header = document.createElement("div");
        header.className = "module-card-header";
        header.appendChild(createIcon(module.icon, "module-icon"));
        const arrow = document.createElement("span");
        arrow.className = "module-arrow";
        arrow.innerHTML = iconMarkup.arrow;
        arrow.setAttribute("aria-hidden", "true");
        header.appendChild(arrow);

        const title = document.createElement("h3");
        title.textContent = module.title;
        const description = document.createElement("p");
        description.textContent = module.description;

        card.append(category, header, title, description);
        quickAccess.appendChild(card);
    });
}

function renderSchedule(result, errorMessage) {
    scheduleContent.replaceChildren();
    if (errorMessage) {
        const error = document.createElement("div");
        error.className = "schedule-message schedule-error";
        error.textContent = errorMessage;
        scheduleContent.appendChild(error);
        return;
    }

    const appointments = Array.isArray(result?.appointments) ? result.appointments.slice() : unwrapArray(result);
    appointments.sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));

    if (!appointments.length) {
        const empty = document.createElement("div");
        empty.className = "schedule-empty";
        empty.appendChild(createIcon("calendar", "schedule-empty-icon"));
        const title = document.createElement("strong");
        title.textContent = "No appointments scheduled";
        const detail = document.createElement("span");
        detail.textContent = "There are no appointments recorded for today.";
        empty.append(title, detail);
        scheduleContent.appendChild(empty);
        return;
    }

    const list = document.createElement("div");
    list.className = "schedule-list";

    appointments.slice(0, 6).forEach(appointment => {
        const row = document.createElement("div");
        row.className = "schedule-row";

        const time = document.createElement("div");
        time.className = "schedule-time";
        const start = document.createElement("strong");
        start.textContent = formatTime(appointment.startTime);
        const end = document.createElement("span");
        end.textContent = formatTime(appointment.endTime);
        time.append(start, end);

        const details = document.createElement("div");
        details.className = "schedule-details";
        const patient = document.createElement("strong");
        patient.textContent = appointment.patientName || `Patient #${appointment.patientId || "—"}`;
        const reason = document.createElement("span");
        reason.textContent = appointment.reason || appointment.doctorName || "Clinic appointment";
        details.append(patient, reason);

        const status = document.createElement("span");
        const normalizedStatus = String(appointment.status || "unknown").toLowerCase().replace(/[^a-z0-9-]/g, "");
        status.className = `schedule-status status-${normalizedStatus}`;
        status.textContent = appointment.status || "Unknown";

        row.append(time, details, status);
        list.appendChild(row);
    });

    scheduleContent.appendChild(list);

    if (appointments.length > 6) {
        const more = document.createElement("a");
        more.className = "schedule-more-link";
        more.href = "/appointments.html";
        more.textContent = `View all ${appointments.length} appointments`;
        scheduleContent.appendChild(more);
    }
}

function showScheduleSection(visible) {
    scheduleSection.hidden = !visible;
}

async function loadNurseDashboard() {
    const today = localDateKey();
    const requests = await Promise.allSettled([
        loadArray("/Patients"),
        loadArray("/Appointments"),
        loadArray("/Consultations"),
        loadEndpoint(`/Reports/daily-schedule?date=${encodeURIComponent(today)}`)
    ]);

    const patients = requests[0].status === "fulfilled" ? requests[0].value : null;
    const appointments = requests[1].status === "fulfilled" ? requests[1].value : null;
    const consultations = requests[2].status === "fulfilled" ? requests[2].value : null;
    const schedule = requests[3].status === "fulfilled" ? requests[3].value : null;

    const todaysAppointments = Array.isArray(schedule?.appointments) ? schedule.appointments : null;
    const todayConsultations = consultations
        ? consultations.filter(item => String(item.consultationDate || "").split("T")[0] === today)
        : null;
    const pendingBookings = appointments
        ? appointments.filter(item => String(item.status || "").toLowerCase() === "booked").length
        : null;
    const activePatients = patients
        ? patients.filter(item => item.isActive === true).length
        : null;

    renderSummary([
        { label: "Active patients", value: activePatients, detail: patients ? "Active patient profiles" : "Unable to load patient data", icon: "patients", tone: "blue" },
        { label: "Today's appointments", value: todaysAppointments?.length ?? null, detail: todaysAppointments ? "Bookings scheduled today" : "Unable to load daily schedule", icon: "calendar", tone: "teal" },
        { label: "Pending bookings", value: pendingBookings, detail: appointments ? "Awaiting confirmation" : "Unable to load appointment data", icon: "clock", tone: "amber" },
        { label: "Consultations today", value: todayConsultations?.length ?? null, detail: todayConsultations ? "Visits recorded today" : "Unable to load consultation data", icon: "activity", tone: "violet" }
    ]);

    if (requests[3].status === "fulfilled") {
        renderSchedule(schedule);
    } else {
        renderSchedule(null, "Today's schedule could not be loaded. Open Reports to check the daily schedule.");
    }
}

async function loadStudentDashboard() {
    const paths = ["/Appointments/my", "/Consultations/my", "/Prescriptions/my", "/Referrals/my"];
    const results = await Promise.allSettled(paths.map(loadArray));
    const appointments = results[0].status === "fulfilled" ? results[0].value : null;
    const consultations = results[1].status === "fulfilled" ? results[1].value : null;
    const prescriptions = results[2].status === "fulfilled" ? results[2].value : null;
    const referrals = results[3].status === "fulfilled" ? results[3].value : null;
    const today = localDateKey();
    const upcoming = appointments
        ? appointments.filter(item => {
            const status = String(item.status || "").toLowerCase();
            const date = String(item.slotDate || "").split("T")[0];
            return date >= today && (status === "booked" || status === "confirmed");
        }).length
        : null;

    renderSummary([
        { label: "Upcoming appointments", value: upcoming, detail: appointments ? "Booked or confirmed visits" : "Unable to load appointments", icon: "calendar", tone: "teal" },
        { label: "Consultations", value: consultations?.length ?? null, detail: consultations ? "Your recorded clinic visits" : "Unable to load consultations", icon: "consultation", tone: "blue" },
        { label: "Prescriptions", value: prescriptions?.length ?? null, detail: prescriptions ? "Prescriptions on your profile" : "Unable to load prescriptions", icon: "prescription", tone: "violet" },
        { label: "Referrals", value: referrals?.length ?? null, detail: referrals ? "Your clinic referrals" : "Unable to load referrals", icon: "referral", tone: "amber" }
    ], "Personal clinic information linked to your account");
}

async function loadDoctorDashboard() {
    const results = await Promise.allSettled([
        loadArray("/Consultations/assigned"),
        loadArray("/Prescriptions/assigned")
    ]);
    const consultations = results[0].status === "fulfilled" ? results[0].value : null;
    const prescriptions = results[1].status === "fulfilled" ? results[1].value : null;
    const awaiting = consultations
        ? consultations.filter(item => !item.doctorReviewedAt && !item.timeOut).length
        : null;
    const reviewed = consultations
        ? consultations.filter(item => !!item.doctorReviewedAt).length
        : null;

    renderSummary([
        { label: "Assigned consultations", value: consultations?.length ?? null, detail: consultations ? "Cases assigned to your account" : "Unable to load assigned cases", icon: "consultation", tone: "blue" },
        { label: "Awaiting assessment", value: awaiting, detail: consultations ? "Assigned cases needing review" : "Unable to load assigned cases", icon: "clock", tone: "amber" },
        { label: "Reviewed consultations", value: reviewed, detail: consultations ? "Assessment submitted" : "Unable to load assigned cases", icon: "check", tone: "teal" },
        { label: "Prescriptions", value: prescriptions?.length ?? null, detail: prescriptions ? "Prescriptions for assigned cases" : "Unable to load prescriptions", icon: "prescription", tone: "violet" }
    ], "Work assigned to your Doctor account");
}

async function loadAdminDashboard() {
    const today = localDateKey();
    const results = await Promise.allSettled([
        loadArray("/admin/users"),
        loadArray("/Patients"),
        loadEndpoint(`/Reports/daily-schedule?date=${encodeURIComponent(today)}`)
    ]);
    const users = results[0].status === "fulfilled" ? results[0].value : null;
    const patients = results[1].status === "fulfilled" ? results[1].value : null;
    const schedule = results[2].status === "fulfilled" ? results[2].value : null;
    const staff = users ? users.filter(item => ["nurse", "doctor"].includes(String(item.role || "").toLowerCase())) : null;
    const activeStaff = staff ? staff.filter(item => item.isActive === true).length : null;
    const appointments = Array.isArray(schedule?.appointments) ? schedule.appointments : null;

    renderSummary([
        { label: "Staff accounts", value: staff?.length ?? null, detail: staff ? "Nurse and Doctor accounts" : "Unable to load staff accounts", icon: "staff", tone: "blue" },
        { label: "Active staff", value: activeStaff, detail: staff ? "Accounts currently enabled" : "Unable to load staff status", icon: "check", tone: "teal" },
        { label: "Patient profiles", value: patients?.length ?? null, detail: patients ? "Registered clinic profiles" : "Unable to load patients", icon: "patients", tone: "violet" },
        { label: "Today's appointments", value: appointments?.length ?? null, detail: appointments ? "Bookings scheduled today" : "Unable to load daily schedule", icon: "calendar", tone: "amber" }
    ], "System access and clinic activity overview");

    if (results[2].status === "fulfilled") {
        renderSchedule(schedule);
    } else {
        renderSchedule(null, "Today's schedule could not be loaded. Open Reports to check the daily schedule.");
    }
}

async function initializeDashboard() {
    if (!user || !roleContent[role]) {
        AngelicareApp.logout();
        return;
    }

    setDashboardDate();
    const content = roleContent[role];
    renderHero(content);
    renderModuleCards(content.modules);
    showScheduleSection(content.schedule);

    if (scheduleLink) {
        scheduleLink.href = role === "admin" ? "/workspace.html?module=reports" : "/appointments.html";
        scheduleLink.textContent = role === "admin" ? "Open reports →" : "View appointments →";
    }

    const loaders = {
        student: loadStudentDashboard,
        nurse: loadNurseDashboard,
        doctor: loadDoctorDashboard,
        admin: loadAdminDashboard
    };

    try {
        await loaders[role]();
    } catch {
        renderSummary([
            { label: "Overview unavailable", value: "—", detail: "Refresh the page or check your connection.", icon: "activity", tone: "blue" }
        ]);
    }
}

initializeDashboard();
