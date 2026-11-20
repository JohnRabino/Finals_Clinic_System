import { authFetch, tryEndpoints, hideAlert } from "./api.js";

function parseJwt(t) {
  try {
    const base64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

const token = localStorage.getItem("clinic_token");
if (!token) window.location.href = "index.html";

const claims = parseJwt(token);
const rawUser = JSON.parse(localStorage.getItem("clinic_user") || "{}");
const rawRole =
  rawUser.role ||
  rawUser.Role ||
  claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
  claims.role ||
  "";
const normalizedRole = rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() : "";

const user = {
  userId: rawUser.userId || rawUser.UserId || claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null,
  fullName: rawUser.fullName || rawUser.FullName || rawUser.name || claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || claims.unique_name || "Clinic User",
  email: rawUser.email || rawUser.Email || claims.email || "",
  role: normalizedRole,
};

if (!user.role) {
  localStorage.removeItem("clinic_token");
  localStorage.removeItem("clinic_user");
  window.location.href = "index.html";
}

localStorage.setItem("clinic_user", JSON.stringify(user));
document.getElementById("user-name").textContent = user.fullName;
document.getElementById("user-role").textContent = user.role;

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
  setTimeout(() => el.remove(), 4200);
}

function renderKpis(items) {
  document.getElementById("kpi-strip").innerHTML = items
    .map((k) => `<div class="kpi-card"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div></div>`)
    .join("");
}

window.openModal = (id) => document.getElementById(id)?.classList.remove("hidden");
window.closeModals = () => document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.add("hidden"));

const ROLE_VIEWS = {
  Student: [
    { id: "view-student-appointments", label: "📅 Book & My Appointments", subtitle: "Select an available clinic slot and track booking status", loader: loadStudentAppointments },
    { id: "view-student-history", label: "🩺 Health Profile & Records", subtitle: "View your patient profile, consultations, diagnoses, prescriptions & referrals", loader: loadStudentHealthHistory },
  ],
  Doctor: [
    { id: "view-doctor-consultations", label: "🩺 Assigned Consultations", subtitle: "Review assigned patient consultations and issue prescriptions", loader: loadDoctorConsultations },
  ],
  Nurse: [
    { id: "view-nurse-appointments", label: "📅 Slots & Appointments", subtitle: "Publish clinic schedules and enforce appointment lifecycle transitions", loader: loadNurseAppointments },
    { id: "view-nurse-consultations", label: "📋 Consultations & Records", subtitle: "Manage consultations, medical records, and doctor-authorized prescriptions", loader: loadNurseConsultations },
    { id: "view-nurse-patients", label: "👥 Patients Directory", subtitle: "Search, create, update, and soft-deactivate patient profiles", loader: loadNursePatients },
    { id: "view-nurse-referrals-logs", label: "🏥 Referrals & Clinic Logs", subtitle: "External doctor directory, specialist referrals, and walk-in manual logs", loader: loadNurseReferralsAndLogs },
    { id: "view-reports", label: "📊 Clinic Reports", subtitle: "Daily schedule and consolidated patient history reports", loader: initReports },
  ],
  Admin: [
    { id: "view-admin-users", label: "🛡️ Staff & User Accounts", subtitle: "Create Nurse/Doctor accounts and manage system access", loader: loadAdminUsers },
    { id: "view-reports", label: "📊 Clinic Reports", subtitle: "Daily clinic schedule and consolidated patient history audits", loader: initReports },
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
    toast("Workspace refreshed");
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

// ==================== STUDENT WORKFLOWS ====================
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
  banner.textContent = "Click an available time slot card above to select your schedule.";

  if (!slots.length) {
    grid.innerHTML = `<div class="empty-slot-box"><strong>No available time slots${date ? ` for ${date}` : ""}.</strong><br>A Nurse must publish clinic time slots first under <em>Slots &amp; Appointments</em>, or click <strong>All Dates</strong>.</div>`;
    return;
  }

  grid.innerHTML = slots.map((s) => `
    <button type="button" class="slot-card" data-slot-id="${s.timeSlotId}" data-label="${s.slotDate} (${s.startTime} - ${s.endTime})">
      <span class="slot-date">${s.slotDate}</span>
      <span class="slot-time">${s.startTime} – ${s.endTime}</span>
    </button>`).join("");

  grid.querySelectorAll(".slot-card").forEach((card) => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".slot-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      hiddenInput.value = card.dataset.slotId;
      banner.textContent = `Selected Slot: ${card.dataset.label}`;
      submitBtn.disabled = false;
    });
  });
}

document.getElementById("slot-date-filter")?.addEventListener("change", (e) => loadAvailableSlots(e.target.value));
document.getElementById("clear-slot-filter")?.addEventListener("click", () => {
  document.getElementById("slot-date-filter").value = "";
  loadAvailableSlots("");
});

window.cancelStudentAppt = async (id) => {
  try {
    const res = await authFetch(`/appointments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "Cancelled" }),
    });
    toast(res.message || "Appointment cancelled and slot released.");
    await loadStudentAppointments();
  } catch (err) {
    toast(err.message, "error");
  }
};

function renderStudentAppointmentsTable() {
  const filter = document.getElementById("student-appt-filter").value;
  const filtered = filter === "ALL" ? cachedStudentAppts : cachedStudentAppts.filter((a) => a.status === filter);
  document.getElementById("student-appointments-tbody").innerHTML = filtered.length
    ? filtered.map((a) => `
        <tr>
          <td><strong>${a.slotDate}</strong><br><span class="muted">${a.startTime} – ${a.endTime}</span></td>
          <td>${a.doctorName || "Any Available"}</td>
          <td>${a.reason || "-"}</td>
          <td><span class="badge status-${a.status}">${a.status}</span></td>
          <td>${a.status === "Booked" ? `<button class="btn btn-danger btn-sm" onclick="window.cancelStudentAppt(${a.appointmentId})">Cancel</button>` : `<span class="muted">—</span>`}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="muted">No appointments found.</td></tr>`;
}

document.getElementById("student-appt-filter")?.addEventListener("change", renderStudentAppointmentsTable);

async function loadStudentAppointments() {
  try {
    await loadAvailableSlots(document.getElementById("slot-date-filter").value);
    cachedStudentAppts = (await authFetch("/appointments/my")) || [];
    renderKpis([
      { label: "Total Bookings", value: cachedStudentAppts.length },
      { label: "Booked / Confirmed", value: cachedStudentAppts.filter((a) => a.status === "Booked" || a.status === "Confirmed").length },
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
  if (!slotId) return toast("Select a time slot card first.", "error");

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
    const [profile, consults, records, rxs, refs] = await Promise.all([
      tryEndpoints(["/patients/me", "/patients/my"]).catch(() => null),
      authFetch("/consultations/my"),
      authFetch("/medicalrecords/my"),
      authFetch("/prescriptions/my"),
      authFetch("/referrals/my"),
    ]);

    document.getElementById("student-profile-box").innerHTML = profile
      ? `<div class="profile-item"><span class="muted">Full Name</span><br><strong>${profile.fullName}</strong></div>
         <div class="profile-item"><span class="muted">Student Number</span><br><strong>${profile.studentNumber || "Linked Account"}</strong></div>
         <div class="profile-item"><span class="muted">Patient ID</span><br><strong>#${profile.patientId}</strong></div>
         <div class="profile-item"><span class="muted">Status</span><br><span class="badge ${profile.isActive ? "status-Active" : "status-Inactive"}">${profile.isActive ? "Active" : "Inactive"}</span></div>`
      : `<div class="profile-item"><strong>${user.fullName}</strong> (${user.email})</div>`;

    renderKpis([
      { label: "Consultations", value: consults.length },
      { label: "Medical Records", value: records.length },
      { label: "Prescriptions", value: rxs.length },
      { label: "Referrals", value: refs.length },
    ]);

    document.getElementById("student-consultations-tbody").innerHTML = consults.length
      ? consults.map((c) => `
          <tr>
            <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
            <td>${c.complaint}</td>
            <td>${c.assessment || "-"}</td>
            <td>${c.doctorAssessment || '<span class="muted">Pending Doctor Review</span>'}</td>
            <td>${c.timeOut ? '<span class="badge status-Completed">Completed</span>' : '<span class="badge status-Booked">In Progress</span>'}</td>
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

// ==================== DOCTOR WORKFLOWS ====================
let cachedDoctorConsults = [];

window.openDoctorReview = (consultId, patientName) => {
  document.getElementById("doc-consult-id").value = consultId;
  document.getElementById("modal-doc-title").textContent = `Review Consultation #${consultId} — ${patientName}`;
  window.openModal("modal-doctor-review");
};

window.openRxModal = (consultId, patientId, patientName, requirePrescriberId = false) => {
  document.getElementById("doc-rx-consult-id").value = consultId;
  document.getElementById("doc-rx-patient-id").value = patientId;
  document.getElementById("doc-rx-prescriber-group").classList.toggle("hidden", !requirePrescriberId);
  document.getElementById("doc-rx-doctor-id").required = requirePrescriberId;
  document.getElementById("modal-rx-title").textContent = `Prescription for ${patientName} (Consult #${consultId})`;
  window.openModal("modal-doctor-rx");
};

function renderDoctorTable() {
  const q = document.getElementById("doctor-search").value.toLowerCase();
  const st = document.getElementById("doctor-status-filter").value;
  const filtered = cachedDoctorConsults.filter((c) => {
    const matchText = (c.patientName || "").toLowerCase().includes(q) || (c.complaint || "").toLowerCase().includes(q);
    const matchStatus = st === "ALL" || (st === "PENDING" && !c.doctorAssessment) || (st === "REVIEWED" && !!c.doctorAssessment);
    return matchText && matchStatus;
  });

  document.getElementById("doctor-consultations-tbody").innerHTML = filtered.length
    ? filtered.map((c) => `
        <tr>
          <td>#${c.consultationId}</td>
          <td><strong>${c.patientName || `Patient #${c.patientId}`}</strong></td>
          <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
          <td><strong>${c.complaint}</strong><br><span class="muted">BP: ${c.bloodPressure || "-"} | Temp: ${c.temperature || "-"}°C</span></td>
          <td>${c.assessment || "-"}</td>
          <td>${c.doctorAssessment || '<span class="badge status-Pending">Awaiting Review</span>'}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="window.openDoctorReview(${c.consultationId}, '${(c.patientName || "Patient").replace(/'/g, "")}')">Assess</button>
            <button class="btn btn-gold btn-sm" onclick="window.openRxModal(${c.consultationId}, ${c.patientId}, '${(c.patientName || "Patient").replace(/'/g, "")}', false)">+ Rx</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="7" class="muted">No assigned consultations match this filter.</td></tr>`;
}

document.getElementById("doctor-search")?.addEventListener("input", renderDoctorTable);
document.getElementById("doctor-status-filter")?.addEventListener("change", renderDoctorTable);

async function loadDoctorConsultations() {
  try {
    cachedDoctorConsults = (await authFetch("/consultations/assigned")) || [];
    renderKpis([
      { label: "Assigned Consultations", value: cachedDoctorConsults.length },
      { label: "Awaiting Assessment", value: cachedDoctorConsults.filter((c) => !c.doctorAssessment).length },
      { label: "Assessed Cases", value: cachedDoctorConsults.filter((c) => !!c.doctorAssessment).length },
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
    toast(res.message || "Medical assessment submitted!");
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
    const docIdVal = document.getElementById("doc-rx-doctor-id").value;
    const payload = {
      patientId: Number(document.getElementById("doc-rx-patient-id").value),
      consultationId: Number(document.getElementById("doc-rx-consult-id").value),
      medicineName: document.getElementById("doc-rx-med").value.trim(),
      dosage: document.getElementById("doc-rx-dosage").value.trim(),
      instructions: document.getElementById("doc-rx-instructions").value.trim(),
    };
    if (docIdVal) payload.doctorId = Number(docIdVal);

    const res = await authFetch("/prescriptions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    toast(res.message || "Prescription saved!");
    e.target.reset();
    window.closeModals();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ==================== NURSE WORKFLOWS ====================
let cachedNurseAppts = [];

window.startConsultFromAppt = (apptId, patientId, doctorId, patientName) => {
  document.getElementById("cons-appt-id").value = apptId;
  document.getElementById("cons-patient-id").value = patientId;
  document.getElementById("cons-doctor-id").value = doctorId || "";
  document.getElementById("modal-cons-title").textContent = `Consultation for ${patientName} (Appt #${apptId})`;
  window.openModal("modal-new-consultation");
};

window.openWalkInConsult = () => {
  document.getElementById("create-consultation-form").reset();
  document.getElementById("modal-cons-title").textContent = "New Walk-In Consultation";
  window.openModal("modal-new-consultation");
};

window.changeApptStatus = async (id, status) => {
  try {
    const res = await authFetch(`/appointments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    toast(res.message || `Appointment marked as ${status}`);
    await loadNurseAppointments();
  } catch (err) {
    toast(err.message, "error");
  }
};

function renderNurseApptsTable() {
  const q = document.getElementById("nurse-appt-search").value.toLowerCase();
  const st = document.getElementById("nurse-appt-filter").value;
  const filtered = cachedNurseAppts.filter(
    (a) => (a.patientName || "").toLowerCase().includes(q) && (st === "ALL" || a.status === st)
  );

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
            <td>${a.doctorName || "Unassigned"}</td>
            <td>${a.reason || "-"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
            <td>${actions}</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="7" class="muted">No appointments match this filter.</td></tr>`;
}

document.getElementById("nurse-appt-search")?.addEventListener("input", renderNurseApptsTable);
document.getElementById("nurse-appt-filter")?.addEventListener("change", renderNurseApptsTable);

async function loadNurseAppointments() {
  try {
    const [appts, slots] = await Promise.all([
      authFetch("/appointments"),
      authFetch("/clinictimeslots/available").catch(() => []),
    ]);
    cachedNurseAppts = appts || [];
    renderKpis([
      { label: "Total Appointments", value: cachedNurseAppts.length },
      { label: "Booked (Pending)", value: cachedNurseAppts.filter((a) => a.status === "Booked").length },
      { label: "Confirmed Queue", value: cachedNurseAppts.filter((a) => a.status === "Confirmed").length },
      { label: "Open Time Slots", value: slots.length },
    ]);

    document.getElementById("nurse-slots-list").innerHTML = slots.length
      ? slots.map((s) => `<div class="mini-slot-item"><strong>${s.slotDate}</strong><span>${s.startTime} – ${s.endTime}</span></div>`).join("")
      : `<span class="muted">No open slots published yet.</span>`;

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
    toast(res.message || "Clinic time slot published!");
    e.target.reset();
    await loadNurseAppointments();
  } catch (err) {
    toast(err.message, "error");
  }
});

window.openRecordModal = (consultId, patientId, patientName) => {
  document.getElementById("rec-consult-id").value = consultId;
  document.getElementById("rec-patient-id").value = patientId;
  document.getElementById("modal-rec-title").textContent = `Medical Record for ${patientName} (Consult #${consultId})`;
  window.openModal("modal-new-record");
};

window.completeConsult = async (id) => {
  try {
    const res = await authFetch(`/consultations/${id}/complete`, {
      method: "PUT",
      body: JSON.stringify({ notes: "Completed via ClinicCare Nurse Portal" }),
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
            <td>${c.assessment || "-"}</td>
            <td>${c.doctorAssessment || '<span class="muted">Pending / None</span>'}</td>
            <td>${c.timeOut ? '<span class="badge status-Completed">Completed</span>' : '<span class="badge status-Booked">In Progress</span>'}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="window.openRecordModal(${c.consultationId}, ${c.patientId}, '${(c.patientName || "Patient").replace(/'/g, "")}')">+ Record</button>
              <button class="btn btn-gold btn-sm" onclick="window.openRxModal(${c.consultationId}, ${c.patientId}, '${(c.patientName || "Patient").replace(/'/g, "")}', true)">+ Rx</button>
              ${!c.timeOut ? `<button class="btn btn-success btn-sm" onclick="window.completeConsult(${c.consultationId})">Complete</button>` : ""}
            </td>
          </tr>`).join("")
      : `<tr><td colspan="7" class="muted">No consultations recorded yet.</td></tr>`;
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
    toast(res.message || "Consultation saved!");
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

// Patients Directory
let cachedPatients = [];

window.openEditPatient = (id, name, studentNo) => {
  document.getElementById("edit-patient-id").value = id;
  document.getElementById("edit-patient-name").value = name;
  document.getElementById("edit-patient-student-no").value = studentNo || "";
  window.openModal("modal-edit-patient");
};

window.deactivatePatient = async (id) => {
  try {
    const res = await authFetch(`/patients/${id}`, { method: "DELETE" });
    toast(res.message || "Patient profile deactivated.");
    await loadNursePatients();
  } catch (err) {
    toast(err.message, "error");
  }
};

function renderPatientsTable() {
  const q = document.getElementById("nurse-patient-search").value.toLowerCase();
  const st = document.getElementById("nurse-patient-status-filter").value;
  const filtered = cachedPatients.filter((p) => {
    const matchText = (p.fullName || "").toLowerCase().includes(q) || (p.studentNumber || "").toLowerCase().includes(q);
    const matchStatus = st === "ALL" || (st === "ACTIVE" && p.isActive) || (st === "INACTIVE" && !p.isActive);
    return matchText && matchStatus;
  });

  document.getElementById("nurse-patients-tbody").innerHTML = filtered.length
    ? filtered.map((p) => `
        <tr>
          <td>#${p.patientId}</td>
          <td><strong>${p.fullName}</strong></td>
          <td>${p.studentNumber || "-"}</td>
          <td>${p.userId ? `User #${p.userId}` : '<span class="muted">Walk-In / Manual</span>'}</td>
          <td><span class="badge ${p.isActive ? "status-Active" : "status-Inactive"}">${p.isActive ? "Active" : "Inactive"}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.openEditPatient(${p.patientId}, '${(p.fullName || "").replace(/'/g, "")}', '${p.studentNumber || ""}')">Edit</button>
            ${p.isActive ? `<button class="btn btn-danger btn-sm" onclick="window.deactivatePatient(${p.patientId})">Deactivate</button>` : ""}
          </td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="muted">No patients match your search.</td></tr>`;
}

document.getElementById("nurse-patient-search")?.addEventListener("input", renderPatientsTable);
document.getElementById("nurse-patient-status-filter")?.addEventListener("change", renderPatientsTable);

async function loadNursePatients() {
  try {
    cachedPatients = (await authFetch("/patients")) || [];
    renderPatientsTable();
  } catch (err) {
    toast(err.message, "error");
  }
}

document.getElementById("create-patient-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const studentNo = document.getElementById("new-patient-student-no").value.trim();
    const res = await authFetch("/patients", {
      method: "POST",
      body: JSON.stringify({
        fullName: document.getElementById("new-patient-name").value.trim(),
        studentNumber: studentNo || null,
      }),
    });
    toast(res.message || "Patient registered!");
    e.target.reset();
    await loadNursePatients();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("edit-patient-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-patient-id").value;
  try {
    const studentNo = document.getElementById("edit-patient-student-no").value.trim();
    const res = await authFetch(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        fullName: document.getElementById("edit-patient-name").value.trim(),
        studentNumber: studentNo || null,
      }),
    });
    toast(res.message || "Patient updated!");
    window.closeModals();
    await loadNursePatients();
  } catch (err) {
    toast(err.message, "error");
  }
});

// Referrals, External Doctors & Manual Clinic Logs
window.openReferralModal = () => window.openModal("modal-new-referral");

async function loadNurseReferralsAndLogs() {
  try {
    const [referrals, extDocs, patients, logs] = await Promise.all([
      authFetch("/referrals").catch(() => []),
      tryEndpoints(["/externaldoctors", "/external-doctors"]).catch(() => []),
      authFetch("/patients").catch(() => []),
      tryEndpoints(["/manualcliniclogs", "/manual-clinic-logs"]).catch(() => []),
    ]);

    document.getElementById("nurse-referrals-tbody").innerHTML = referrals.length
      ? referrals.map((r) => `
          <tr>
            <td>#${r.referralId}</td>
            <td>${r.patientName || `Patient #${r.patientId}`}</td>
            <td>${r.externalDoctorName || `ExtDoc #${r.externalDoctorId}`}</td>
            <td>${r.reason}</td>
            <td><span class="badge status-${r.status}">${r.status}</span></td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="muted">No referrals recorded.</td></tr>`;

    document.getElementById("external-doctors-tbody").innerHTML = extDocs.length
      ? extDocs.map((d) => `
          <tr>
            <td>#${d.externalDoctorId}</td>
            <td><strong>${d.fullName || d.name}</strong></td>
            <td>${d.specialty || "-"}</td>
            <td>${d.hospitalOrClinic || d.clinicName || "-"} ${d.contactNumber ? `(${d.contactNumber})` : ""}</td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="muted">No external doctors in directory yet.</td></tr>`;

    const patientSelect = document.getElementById("log-patient-select");
    patientSelect.innerHTML = `<option value="">-- Optional: Link to Patient --</option>` +
      patients.map((p) => `<option value="${p.patientId}">#${p.patientId} — ${p.fullName}</option>`).join("");

    document.getElementById("clinic-logs-tbody").innerHTML = logs.length
      ? logs.map((l) => `
          <tr>
            <td>#${l.manualClinicLogId || l.logId || "-"}</td>
            <td>${l.logDate || l.createdAt ? new Date(l.logDate || l.createdAt).toLocaleString() : "Today"}</td>
            <td>${l.patientName || (l.patientId ? `Patient #${l.patientId}` : "Walk-In / General")}</td>
            <td>${l.activity || l.notes || l.description}</td>
            <td>${l.encodedByName || user.fullName}</td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="muted">No manual clinic logs recorded yet.</td></tr>`;
  } catch (err) {
    toast(err.message, "error");
  }
}

document.getElementById("create-ext-doc-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await tryEndpoints(["/externaldoctors", "/external-doctors"], {
      method: "POST",
      body: JSON.stringify({
        fullName: document.getElementById("ext-doc-name").value.trim(),
        specialty: document.getElementById("ext-doc-specialty").value.trim(),
        hospitalOrClinic: document.getElementById("ext-doc-facility").value.trim() || null,
        contactNumber: document.getElementById("ext-doc-contact").value.trim() || null,
      }),
    });
    toast(res?.message || "External doctor added!");
    e.target.reset();
    window.closeModals();
    await loadNurseReferralsAndLogs();
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
    toast(res.message || "Referral submitted!");
    e.target.reset();
    window.closeModals();
    await loadNurseReferralsAndLogs();
  } catch (err) {
    toast(err.message, "error");
  }
});

document.getElementById("create-clinic-log-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const pVal = document.getElementById("log-patient-select").value;
    const text = document.getElementById("log-activity").value.trim();
    const res = await tryEndpoints(["/manualcliniclogs", "/manual-clinic-logs"], {
      method: "POST",
      body: JSON.stringify({
        patientId: pVal ? Number(pVal) : null,
        activity: text,
        notes: text,
      }),
    });
    toast(res?.message || "Manual clinic log recorded!");
    e.target.reset();
    await loadNurseReferralsAndLogs();
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
            <td><strong>${a.patientName}</strong> (#${a.patientId})</td>
            <td>${a.doctorName || "Unassigned"}</td>
            <td>${a.reason || "-"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="muted">No appointments scheduled for ${date}.</td></tr>`;
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
    out.innerHTML = `<p class="muted">No patient history loaded.</p>`;
  }
});

// ==================== ADMIN WORKFLOWS ====================
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
      { label: "Total Accounts", value: cachedUsers.length },
      { label: "Active Users", value: cachedUsers.filter((u) => u.isActive).length },
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

