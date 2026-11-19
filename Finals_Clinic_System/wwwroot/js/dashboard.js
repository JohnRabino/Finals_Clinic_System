import { authFetch, hideAlert } from "./api.js";

const token = localStorage.getItem("clinic_token");
const user = JSON.parse(localStorage.getItem("clinic_user") || "null");

if (!token || !user) {
    window.location.href = "index.html";
}

document.getElementById("user-name").textContent = user.fullName;
document.getElementById("user-role").textContent = user.role;
document.getElementById("user-avatar").textContent = (user.fullName || "U")[0].toUpperCase();

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    window.location.href = "index.html";
});

function toast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function renderKpis(items) {
    document.getElementById("kpi-strip").innerHTML = items
        .map((k) => `
      <div class="kpi-card">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value">${k.value}</div>
      </div>`)
        .join("");
}

window.openModal = (id) => document.getElementById(id)?.classList.remove("hidden");
window.closeModals = () => document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.add("hidden"));

// Role Navigation
const ROLE_VIEWS = {
    Student: [
        { id: "view-student-appointments", label: "📅 Book & Appointments", subtitle: "Select an available clinic slot and track your visits", loader: loadStudentAppointments },
        { id: "view-student-history", label: "🩺 My Health Records", subtitle: "Consultations, diagnoses, prescriptions & referrals", loader: loadStudentHealthHistory },
    ],
    Doctor: [
        { id: "view-doctor-consultations", label: "🩺 Assigned Consultations", subtitle: "Review assigned patients and issue prescriptions", loader: loadDoctorConsultations },
    ],
    Nurse: [
        { id: "view-nurse-appointments", label: "📅 Appointments & Slots", subtitle: "Publish clinic schedules and manage patient bookings", loader: loadNurseAppointments },
        { id: "view-nurse-consultations", label: "📋 Consultations & Dx", subtitle: "Record vitals, triage notes, and medical diagnoses", loader: loadNurseConsultations },
        { id: "view-nurse-patients", label: "👥 Patients & Referrals", subtitle: "Manage patient directory and specialist referrals", loader: loadNursePatientsAndReferrals },
        { id: "view-reports", label: "📊 Clinic Reports", subtitle: "Daily schedules and consolidated patient histories", loader: initReports },
    ],
    Admin: [
        { id: "view-admin-users", label: "🛡️ Staff & User Accounts", subtitle: "Provision Nurse, Doctor, and Admin accounts", loader: loadAdminUsers },
        { id: "view-reports", label: "📊 Clinic Reports", subtitle: "Daily clinic schedules and patient history audits", loader: initReports },
    ],
};

let currentView = null;
const navContainer = document.getElementById("role-nav");
const allowedViews = ROLE_VIEWS[user.role] || [];

function switchView(viewObj) {
    currentView = viewObj;
    hideAlert();
    document.querySelectorAll(".view-section").forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    document.getElementById(viewObj.id)?.classList.remove("hidden");
    document.querySelector(`[data-view="${viewObj.id}"]`)?.classList.add("active");
    document.getElementById("page-title").textContent = viewObj.label.replace(/^[^\w]+/, "");
    document.getElementById("page-subtitle").textContent = viewObj.subtitle;
    if (viewObj.loader) viewObj.loader();
}

document.getElementById("refresh-btn").addEventListener("click", () => {
    if (currentView?.loader) {
        currentView.loader();
        toast("Data refreshed");
    }
});

allowedViews.forEach((v, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-btn";
    btn.dataset.view = v.id;
    btn.textContent = v.label;
    btn.addEventListener("click", () => switchView(v));
    navContainer.appendChild(btn);
    if (idx === 0) switchView(v);
});

// ==================== STUDENT LOGIC ====================
let cachedStudentAppts = [];

async function loadAvailableSlots(date = "") {
    const query = date ? `?date=${date}` : "";
    const slots = (await authFetch(`/clinictimeslots/available${query}`)) || [];
    const grid = document.getElementById("slot-cards-grid");
    const hiddenInput = document.getElementById("appointment-slot");
    const banner = document.getElementById("selected-slot-banner");
    const submitBtn = document.getElementById("book-submit-btn");

    hiddenInput.value = "";
    submitBtn.disabled = true;
    banner.textContent = "Click a time slot card above to select your schedule.";

    if (!slots.length) {
        grid.innerHTML = `
      <div class="empty-slot-box">
        <strong>No open time slots found${date ? ` for ${date}` : ""}.</strong><br>
        A Nurse must publish clinic time slots first (log in as Nurse → <em>Publish Clinic Time Slot</em>), or click <strong>All Dates</strong> to check other days.
      </div>`;
        return;
    }

    grid.innerHTML = slots
        .map((s) => `
      <button type="button" class="slot-card" data-slot-id="${s.timeSlotId}" data-label="${s.slotDate} (${s.startTime} - ${s.endTime})">
        <span class="slot-date">${s.slotDate}</span>
        <span class="slot-time">${s.startTime} – ${s.endTime}</span>
      </button>`)
        .join("");

    grid.querySelectorAll(".slot-card").forEach((card) => {
        card.addEventListener("click", () => {
            grid.querySelectorAll(".slot-card").forEach((c) => c.classList.remove("selected"));
            card.classList.add("selected");
            hiddenInput.value = card.dataset.slotId;
            banner.textContent = `Selected Schedule: ${card.dataset.label}`;
            submitBtn.disabled = false;
        });
    });
}

document.getElementById("slot-date-filter")?.addEventListener("change", (e) => loadAvailableSlots(e.target.value));
document.getElementById("clear-slot-filter")?.addEventListener("click", () => {
    document.getElementById("slot-date-filter").value = "";
    loadAvailableSlots("");
});

function renderStudentAppointmentsTable() {
    const filter = document.getElementById("student-appt-filter").value;
    const filtered = filter === "ALL" ? cachedStudentAppts : cachedStudentAppts.filter((a) => a.status === filter);
    const tbody = document.getElementById("student-appointments-tbody");

    tbody.innerHTML = filtered.length
        ? filtered.map((a) => `
        <tr>
          <td><strong>${a.slotDate}</strong><br><span class="muted">${a.startTime} – ${a.endTime}</span></td>
          <td>${a.doctorName || "Any Available"}</td>
          <td>${a.reason || "-"}</td>
          <td><span class="badge status-${a.status}">${a.status}</span></td>
        </tr>`).join("")
        : `<tr><td colspan="4" class="muted">No appointments match this filter.</td></tr>`;
}

document.getElementById("student-appt-filter")?.addEventListener("change", renderStudentAppointmentsTable);

async function loadStudentAppointments() {
    try {
        await loadAvailableSlots(document.getElementById("slot-date-filter").value);
        cachedStudentAppts = (await authFetch("/appointments/my")) || [];
        renderKpis([
            { label: "Total Bookings", value: cachedStudentAppts.length },
            { label: "Upcoming / Confirmed", value: cachedStudentAppts.filter((a) => a.status === "Booked" || a.status === "Confirmed").length },
            { label: "Completed Visits", value: cachedStudentAppts.filter((a) => a.status === "Completed").length },
        ]);
        renderStudentAppointmentsTable();
    } catch (err) {
        toast(err.message, "error");
    }
}

document.getElementById("book-appointment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const slotId = document.getElementById("appointment-slot").value;
    if (!slotId) return toast("Please click a time slot card first.", "error");

    const btn = document.getElementById("book-submit-btn");
    btn.disabled = true;

    try {
        const doctorVal = document.getElementById("appointment-doctor-id").value;
        const res = await authFetch("/appointments", {
            method: "POST",
            body: JSON.stringify({
                timeSlotId: Number(slotId),
                doctorId: doctorVal ? Number(doctorVal) : null,
                reason: document.getElementById("appointment-reason").value.trim(),
            }),
        });
        toast(res.message || "Appointment booked!");
        e.target.reset();
        await loadStudentAppointments();
    } catch (err) {
        toast(err.message, "error");
    } finally {
        btn.disabled = false;
    }
});

async function loadStudentHealthHistory() {
    try {
        const [consults, records, rxs, refs] = await Promise.all([
            authFetch("/consultations/my"),
            authFetch("/medicalrecords/my"),
            authFetch("/prescriptions/my"),
            authFetch("/referrals/my"),
        ]);

        renderKpis([
            { label: "Consultations", value: consults.length },
            { label: "Diagnoses", value: records.length },
            { label: "Prescriptions", value: rxs.length },
            { label: "Referrals", value: refs.length },
        ]);

        document.getElementById("student-consultations-tbody").innerHTML = consults.length
            ? consults.map((c) => `
          <tr>
            <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
            <td>${c.complaint}</td>
            <td>${c.assessment || "-"}</td>
            <td>${c.doctorAssessment || '<span class="muted">Pending</span>'}</td>
            <td>${c.followUpInstructions || "-"}</td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No consultation records yet.</td></tr>`;

        document.getElementById("student-records-tbody").innerHTML = records.length
            ? records.map((r) => `
          <tr>
            <td>${new Date(r.recordDate).toLocaleDateString()}</td>
            <td><strong>${r.diagnosis}</strong></td>
            <td>${r.treatment}</td>
            <td>${r.doctorName || "Clinic Staff"}</td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No medical records yet.</td></tr>`;

        const combined = [
            ...rxs.map((p) => `<tr><td>${new Date(p.prescriptionDate).toLocaleDateString()}</td><td><strong>Rx:</strong> ${p.medicineName}</td><td>${p.dosage}</td><td>${p.instructions}</td></tr>`),
            ...refs.map((r) => `<tr><td>${new Date(r.referralDate).toLocaleDateString()}</td><td><strong>Ref:</strong> ${r.externalDoctorName}</td><td>${r.reason}</td><td><span class="badge status-${r.status}">${r.status}</span></td></tr>`),
        ];
        document.getElementById("student-rx-ref-tbody").innerHTML = combined.length
            ? combined.join("")
            : `<tr><td colspan="4" class="muted">No prescriptions or referrals yet.</td></tr>`;
    } catch (err) {
        toast(err.message, "error");
    }
}

// ==================== DOCTOR LOGIC ====================
let cachedDoctorConsults = [];

window.openDoctorReview = (consultId, patientName) => {
    document.getElementById("doc-consult-id").value = consultId;
    document.getElementById("modal-doc-title").textContent = `Review Consultation #${consultId} — ${patientName}`;
    window.openModal("modal-doctor-review");
};

window.openDoctorRx = (consultId, patientId, patientName) => {
    document.getElementById("doc-rx-consult-id").value = consultId;
    document.getElementById("doc-rx-patient-id").value = patientId;
    document.getElementById("modal-rx-title").textContent = `Prescribe for ${patientName} (Consult #${consultId})`;
    window.openModal("modal-doctor-rx");
};

function renderDoctorTable() {
    const q = document.getElementById("doctor-search").value.toLowerCase();
    const filtered = cachedDoctorConsults.filter(
        (c) => (c.patientName || "").toLowerCase().includes(q) || (c.complaint || "").toLowerCase().includes(q)
    );

    document.getElementById("doctor-consultations-tbody").innerHTML = filtered.length
        ? filtered.map((c) => `
        <tr>
          <td>#${c.consultationId}</td>
          <td><strong>${c.patientName || `Patient #${c.patientId}`}</strong></td>
          <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
          <td><strong>${c.complaint}</strong><br><span class="muted">BP: ${c.bloodPressure || "-"} | Temp: ${c.temperature || "-"}°C</span></td>
          <td>${c.doctorAssessment || '<span class="badge status-Pending">Awaiting Review</span>'}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="window.openDoctorReview(${c.consultationId}, '${(c.patientName || "Patient").replace(/'/g, "")}')">Review</button>
            <button class="btn btn-outline btn-sm" onclick="window.openDoctorRx(${c.consultationId}, ${c.patientId}, '${(c.patientName || "Patient").replace(/'/g, "")}')">+ Rx</button>
          </td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="muted">No assigned consultations found.</td></tr>`;
}

document.getElementById("doctor-search")?.addEventListener("input", renderDoctorTable);

async function loadDoctorConsultations() {
    try {
        cachedDoctorConsults = (await authFetch("/consultations/assigned")) || [];
        renderKpis([
            { label: "Assigned Cases", value: cachedDoctorConsults.length },
            { label: "Pending Review", value: cachedDoctorConsults.filter((c) => !c.doctorAssessment).length },
            { label: "Reviewed", value: cachedDoctorConsults.filter((c) => !!c.doctorAssessment).length },
        ]);
        renderDoctorTable();
    } catch (err) {
        toast(err.message, "error");
    }
}

document.getElementById("doctor-assessment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("doc-consult-id").value;
    try {
        const res = await authFetch(`/consultations/${id}/doctor-assessment`, {
            method: "PUT",
            body: JSON.stringify({ doctorAssessment: document.getElementById("doc-assessment-text").value.trim() }),
        });
        toast(res.message || "Assessment saved!");
        e.target.reset();
        window.closeModals();
        await loadDoctorConsultations();
    } catch (err) {
        toast(err.message, "error");
    }
});

document.getElementById("doctor-prescription-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch("/prescriptions", {
            method: "POST",
            body: JSON.stringify({
                patientId: Number(document.getElementById("doc-rx-patient-id").value),
                consultationId: Number(document.getElementById("doc-rx-consult-id").value),
                medicineName: document.getElementById("doc-rx-med").value.trim(),
                dosage: document.getElementById("doc-rx-dosage").value.trim(),
                instructions: document.getElementById("doc-rx-instructions").value.trim(),
            }),
        });
        toast(res.message || "Prescription issued!");
        e.target.reset();
        window.closeModals();
    } catch (err) {
        toast(err.message, "error");
    }
});

// ==================== NURSE LOGIC ====================
let cachedNurseAppts = [];

window.startConsultFromAppt = (apptId, patientId, doctorId, patientName) => {
    document.getElementById("cons-appt-id").value = apptId;
    document.getElementById("cons-patient-id").value = patientId;
    document.getElementById("cons-doctor-id").value = doctorId || "";
    document.getElementById("modal-cons-title").textContent = `Start Consultation — ${patientName}`;
    window.openModal("modal-new-consultation");
};

window.changeApptStatus = async (id, status) => {
    try {
        const res = await authFetch(`/appointments/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
        toast(res.message || `Status updated to ${status}`);
        await loadNurseAppointments();
    } catch (err) {
        toast(err.message, "error");
    }
};

function renderNurseApptsTable() {
    const q = document.getElementById("nurse-appt-search").value.toLowerCase();
    const statusFilter = document.getElementById("nurse-appt-filter").value;

    const filtered = cachedNurseAppts.filter((a) => {
        const matchName = (a.patientName || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
        return matchName && matchStatus;
    });

    document.getElementById("nurse-appointments-tbody").innerHTML = filtered.length
        ? filtered.map((a) => {
            let actions = `<span class="muted">Finalized</span>`;
            if (a.status === "Booked") {
                actions = `
            <button class="btn btn-success btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Confirmed')">Confirm</button>
            <button class="btn btn-danger btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Cancelled')">Cancel</button>`;
            } else if (a.status === "Confirmed") {
                actions = `
            <button class="btn btn-primary btn-sm" onclick="window.startConsultFromAppt(${a.appointmentId}, ${a.patientId}, ${a.doctorId || "null"}, '${(a.patientName || "Patient").replace(/'/g, "")}')">Consult</button>
            <button class="btn btn-success btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Completed')">Complete</button>
            <button class="btn btn-danger btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Cancelled')">Cancel</button>`;
            }
            return `
          <tr>
            <td>#${a.appointmentId}</td>
            <td><strong>${a.patientName || `Patient #${a.patientId}`}</strong></td>
            <td>${a.slotDate}<br><span class="muted">${a.startTime} – ${a.endTime}</span></td>
            <td>${a.reason || "-"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
            <td>${actions}</td>
          </tr>`;
        }).join("")
        : `<tr><td colspan="6" class="muted">No matching appointments found.</td></tr>`;
}

document.getElementById("nurse-appt-search")?.addEventListener("input", renderNurseApptsTable);
document.getElementById("nurse-appt-filter")?.addEventListener("change", renderNurseApptsTable);

async function loadNurseAppointments() {
    try {
        cachedNurseAppts = (await authFetch("/appointments")) || [];
        renderKpis([
            { label: "Total Appointments", value: cachedNurseAppts.length },
            { label: "Pending Confirmation", value: cachedNurseAppts.filter((a) => a.status === "Booked").length },
            { label: "Confirmed Queue", value: cachedNurseAppts.filter((a) => a.status === "Confirmed").length },
            { label: "Completed", value: cachedNurseAppts.filter((a) => a.status === "Completed").length },
        ]);
        renderNurseApptsTable();
    } catch (err) {
        toast(err.message, "error");
    }
}

document.getElementById("create-slot-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        let start = document.getElementById("slot-start").value;
        let end = document.getElementById("slot-end").value;
        if (start.length === 5) start += ":00";
        if (end.length === 5) end += ":00";

        const res = await authFetch("/clinictimeslots", {
            method: "POST",
            body: JSON.stringify({
                slotDate: document.getElementById("slot-date").value,
                startTime: start,
                endTime: end,
            }),
        });
        toast(res.message || "Time slot published!");
        e.target.reset();
    } catch (err) {
        toast(err.message, "error");
    }
});

window.openRecordModal = (consultId, patientId, patientName) => {
    document.getElementById("rec-consult-id").value = consultId;
    document.getElementById("rec-patient-id").value = patientId;
    document.getElementById("modal-rec-title").textContent = `Diagnosis for ${patientName} (Consult #${consultId})`;
    window.openModal("modal-new-record");
};

window.completeConsult = async (id) => {
    const notes = prompt("Optional completion notes:") || "";
    try {
        const res = await authFetch(`/consultations/${id}/complete`, {
            method: "PUT",
            body: JSON.stringify({ notes }),
        });
        toast(res.message || "Consultation completed!");
        await loadNurseConsultations();
    } catch (err) {
        toast(err.message, "error");
    }
};

async function loadNurseConsultations() {
    try {
        const list = (await authFetch("/consultations")) || [];
        document.getElementById("nurse-consultations-tbody").innerHTML = list.length
            ? list.map((c) => `
          <tr>
            <td>#${c.consultationId}</td>
            <td><strong>${c.patientName || `#${c.patientId}`}</strong></td>
            <td>${c.complaint}<br><span class="muted">BP: ${c.bloodPressure || "-"} | Temp: ${c.temperature || "-"}°C</span></td>
            <td>${c.doctorAssessment || '<span class="muted">None</span>'}</td>
            <td>${c.timeOut ? '<span class="badge status-Completed">Completed</span>' : '<span class="badge status-Booked">In Progress</span>'}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="window.openRecordModal(${c.consultationId}, ${c.patientId}, '${(c.patientName || "Patient").replace(/'/g, "")}')">+ Diagnosis</button>
              ${!c.timeOut ? `<button class="btn btn-success btn-sm" onclick="window.completeConsult(${c.consultationId})">Complete</button>` : ""}
            </td>
          </tr>`).join("")
            : `<tr><td colspan="6" class="muted">No consultations recorded yet.</td></tr>`;
    } catch (err) {
        toast(err.message, "error");
    }
}

document.getElementById("create-consultation-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const apptVal = document.getElementById("cons-appt-id").value;
        const docVal = document.getElementById("cons-doctor-id").value;
        const tempVal = document.getElementById("cons-temp").value;

        const res = await authFetch("/consultations", {
            method: "POST",
            body: JSON.stringify({
                patientId: Number(document.getElementById("cons-patient-id").value),
                appointmentId: apptVal ? Number(apptVal) : null,
                doctorId: docVal ? Number(docVal) : null,
                complaint: document.getElementById("cons-complaint").value.trim(),
                bloodPressure: document.getElementById("cons-bp").value.trim() || null,
                temperature: tempVal ? Number(tempVal) : null,
                assessment: document.getElementById("cons-assessment").value.trim() || null,
                assistanceProvided: document.getElementById("cons-assistance").value.trim() || null,
            }),
        });
        toast(res.message || "Consultation created!");
        e.target.reset();
        window.closeModals();
        if (currentView?.id === "view-nurse-consultations") await loadNurseConsultations();
    } catch (err) {
        toast(err.message, "error");
    }
});

document.getElementById("create-record-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch("/medicalrecords", {
            method: "POST",
            body: JSON.stringify({
                patientId: Number(document.getElementById("rec-patient-id").value),
                consultationId: Number(document.getElementById("rec-consult-id").value),
                diagnosis: document.getElementById("rec-diagnosis").value.trim(),
                treatment: document.getElementById("rec-treatment").value.trim(),
            }),
        });
        toast(res.message || "Medical record saved!");
        e.target.reset();
        window.closeModals();
    } catch (err) {
        toast(err.message, "error");
    }
});

let cachedPatients = [];

window.openReferralForPatient = (patientId) => {
    document.getElementById("ref-patient-id").value = patientId;
    window.openModal("modal-new-referral");
};

function renderPatientsTable() {
    const q = document.getElementById("nurse-patient-search").value.toLowerCase();
    const filtered = cachedPatients.filter((p) => (p.fullName || "").toLowerCase().includes(q));
    document.getElementById("nurse-patients-tbody").innerHTML = filtered.length
        ? filtered.map((p) => `
        <tr>
          <td>#${p.patientId}</td>
          <td><strong>${p.fullName}</strong></td>
          <td><span class="badge ${p.isActive ? "status-Active" : "status-Inactive"}">${p.isActive ? "Active" : "Inactive"}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.openReferralForPatient(${p.patientId})">Refer</button>
            ${p.isActive ? `<button class="btn btn-danger btn-sm" onclick="window.deactivatePatient(${p.patientId})">Deactivate</button>` : ""}
          </td>
        </tr>`).join("")
        : `<tr><td colspan="4" class="muted">No patients found.</td></tr>`;
}

document.getElementById("nurse-patient-search")?.addEventListener("input", renderPatientsTable);

async function loadNursePatientsAndReferrals() {
    try {
        const [patients, referrals] = await Promise.all([authFetch("/patients"), authFetch("/referrals")]);
        cachedPatients = patients || [];
        renderPatientsTable();

        document.getElementById("nurse-referrals-tbody").innerHTML = referrals.length
            ? referrals.map((r) => `
          <tr>
            <td>#${r.referralId}</td>
            <td>${r.patientName || `#${r.patientId}`}</td>
            <td>${r.externalDoctorName}</td>
            <td>${r.reason}</td>
            <td><span class="badge status-${r.status}">${r.status}</span></td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No referrals recorded.</td></tr>`;
    } catch (err) {
        toast(err.message, "error");
    }
}

window.deactivatePatient = async (id) => {
    try {
        const res = await authFetch(`/patients/${id}`, { method: "DELETE" });
        toast(res.message || "Patient deactivated.");
        await loadNursePatientsAndReferrals();
    } catch (err) {
        toast(err.message, "error");
    }
};

document.getElementById("create-patient-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch("/patients", {
            method: "POST",
            body: JSON.stringify({ fullName: document.getElementById("new-patient-name").value.trim() }),
        });
        toast(res.message || "Patient added!");
        e.target.reset();
        await loadNursePatientsAndReferrals();
    } catch (err) {
        toast(err.message, "error");
    }
});

document.getElementById("create-referral-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch("/referrals", {
            method: "POST",
            body: JSON.stringify({
                patientId: Number(document.getElementById("ref-patient-id").value),
                externalDoctorId: Number(document.getElementById("ref-ext-doc-id").value),
                reason: document.getElementById("ref-reason").value.trim(),
            }),
        });
        toast(res.message || "Referral created!");
        e.target.reset();
        window.closeModals();
        await loadNursePatientsAndReferrals();
    } catch (err) {
        toast(err.message, "error");
    }
});

// ==================== REPORTS ====================
async function initReports() {
    const dateInput = document.getElementById("report-date");
    if (!dateInput.value) dateInput.value = new Date().toISOString().split("T")[0];
    await loadDailySchedule(dateInput.value);
}

async function loadDailySchedule(date) {
    try {
        const data = await authFetch(`/reports/daily-schedule?date=${date}`);
        const appts = data.appointments || [];
        document.getElementById("report-schedule-tbody").innerHTML = appts.length
            ? appts.map((a) => `
          <tr>
            <td>${a.startTime} – ${a.endTime}</td>
            <td>${a.patientName} (#${a.patientId})</td>
            <td>${a.doctorName || "Unassigned"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No appointments scheduled for ${date}.</td></tr>`;
    } catch (err) {
        toast(err.message, "error");
    }
}

document.getElementById("daily-schedule-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    loadDailySchedule(document.getElementById("report-date").value);
});

document.getElementById("patient-history-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("report-patient-id").value;
    const out = document.getElementById("patient-history-output");
    try {
        const h = await authFetch(`/reports/patient-history/${id}`);
        out.innerHTML = `
      <h3>${h.fullName} (Patient #${h.patientId}) — ${h.isActive ? "Active" : "Inactive"}</h3>
      <p class="mt-sm"><strong>Consultations (${h.consultations.length}):</strong></p>
      <ul>${h.consultations.map((c) => `<li>${new Date(c.consultationDate).toLocaleDateString()}: ${c.complaint}</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-sm"><strong>Medical Records (${h.medicalRecords.length}):</strong></p>
      <ul>${h.medicalRecords.map((m) => `<li>${m.diagnosis} — ${m.treatment}</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-sm"><strong>Prescriptions (${h.prescriptions.length}):</strong></p>
      <ul>${h.prescriptions.map((p) => `<li>${p.medicineName} (${p.dosage})</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-sm"><strong>Referrals (${h.referrals.length}):</strong></p>
      <ul>${h.referrals.map((r) => `<li>To ${r.externalDoctorName}: ${r.reason} [${r.status}]</li>`).join("") || "<li>None</li>"}</ul>`;
    } catch (err) {
        toast(err.message, "error");
        out.innerHTML = `<p class="muted">No report loaded.</p>`;
    }
});

// ==================== ADMIN LOGIC ====================
let cachedUsers = [];

document.getElementById("staff-role")?.addEventListener("change", (e) => {
    document.getElementById("specialty-group").classList.toggle("hidden", e.target.value !== "Doctor");
});

function renderUsersTable() {
    const q = document.getElementById("admin-user-search").value.toLowerCase();
    const filtered = cachedUsers.filter(
        (u) => u.fullName.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    document.getElementById("admin-users-tbody").innerHTML = filtered.length
        ? filtered.map((u) => `
        <tr>
          <td>#${u.userId}</td>
          <td><strong>${u.fullName}</strong></td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td><span class="badge ${u.isActive ? "status-Active" : "status-Inactive"}">${u.isActive ? "Active" : "Inactive"}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.toggleUserStatus(${u.userId}, ${!u.isActive})">
              ${u.isActive ? "Deactivate" : "Activate"}
            </button>
          </td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="muted">No users found.</td></tr>`;
}

document.getElementById("admin-user-search")?.addEventListener("input", renderUsersTable);

async function loadAdminUsers() {
    try {
        cachedUsers = (await authFetch("/admin/users")) || [];
        renderKpis([
            { label: "Total Users", value: cachedUsers.length },
            { label: "Active Accounts", value: cachedUsers.filter((u) => u.isActive).length },
            { label: "Doctors", value: cachedUsers.filter((u) => u.role === "Doctor").length },
            { label: "Nurses", value: cachedUsers.filter((u) => u.role === "Nurse").length },
        ]);
        renderUsersTable();
    } catch (err) {
        toast(err.message, "error");
    }
}

window.toggleUserStatus = async (id, isActive) => {
    try {
        const res = await authFetch(`/admin/users/${id}/status?isActive=${isActive}`, { method: "PUT" });
        toast(res.message || "User status updated.");
        await loadAdminUsers();
    } catch (err) {
        toast(err.message, "error");
    }
};

document.getElementById("create-staff-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const role = document.getElementById("staff-role").value;
        const res = await authFetch("/admin/users", {
            method: "POST",
            body: JSON.stringify({
                fullName: document.getElementById("staff-name").value.trim(),
                email: document.getElementById("staff-email").value.trim(),
                password: document.getElementById("staff-password").value,
                role,
                specialty: role === "Doctor" ? document.getElementById("staff-specialty").value.trim() : null,
            }),
        });
        toast(res.message || "Staff account created!");
        e.target.reset();
        document.getElementById("specialty-group").classList.add("hidden");
        await loadAdminUsers();
    } catch (err) {
        toast(err.message, "error");
    }
});