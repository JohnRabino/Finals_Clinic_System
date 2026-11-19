import { authFetch, showAlert, hideAlert } from "./api.js";

const token = localStorage.getItem("clinic_token");
const user = JSON.parse(localStorage.getItem("clinic_user") || "null");

if (!token || !user) {
    window.location.href = "index.html";
}

document.getElementById("user-name").textContent = user.fullName;
document.getElementById("user-role").textContent = user.role;

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    window.location.href = "index.html";
});

// Role-based screen configuration
const ROLE_VIEWS = {
    Student: [
        { id: "view-student-appointments", label: "Appointments", loader: loadStudentAppointments },
        { id: "view-student-history", label: "My Health Records", loader: loadStudentHealthHistory },
    ],
    Doctor: [
        { id: "view-doctor-consultations", label: "Consultations & Rx", loader: loadDoctorConsultations },
    ],
    Nurse: [
        { id: "view-nurse-appointments", label: "Appointments & Slots", loader: loadNurseAppointments },
        { id: "view-nurse-consultations", label: "Consultations & Dx", loader: loadNurseConsultations },
        { id: "view-nurse-patients", label: "Patients & Referrals", loader: loadNursePatientsAndReferrals },
        { id: "view-reports", label: "Clinic Reports", loader: initReports },
    ],
    Admin: [
        { id: "view-admin-users", label: "User Management", loader: loadAdminUsers },
        { id: "view-reports", label: "Clinic Reports", loader: initReports },
    ],
};

const navContainer = document.getElementById("role-nav");
const allowedViews = ROLE_VIEWS[user.role] || [];

function switchView(viewObj) {
    hideAlert();
    document.querySelectorAll(".view-section").forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

    document.getElementById(viewObj.id)?.classList.remove("hidden");
    document.querySelector(`[data-view="${viewObj.id}"]`)?.classList.add("active");
    if (viewObj.loader) viewObj.loader();
}

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
async function loadAvailableSlots(date = "") {
    const query = date ? `?date=${date}` : "";
    const slots = await authFetch(`/clinictimeslots/available${query}`);
    const select = document.getElementById("appointment-slot");
    select.innerHTML = `<option value="">-- Select an available time slot --</option>`;
    (slots || []).forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.timeSlotId;
        opt.textContent = `${s.slotDate} | ${s.startTime} - ${s.endTime} (Slot #${s.timeSlotId})`;
        select.appendChild(opt);
    });
}

document.getElementById("slot-date-filter")?.addEventListener("change", (e) => {
    loadAvailableSlots(e.target.value);
});

async function loadStudentAppointments() {
    try {
        await loadAvailableSlots();
        const list = await authFetch("/appointments/my");
        const tbody = document.getElementById("student-appointments-tbody");
        tbody.innerHTML = list.length
            ? list.map((a) => `
          <tr>
            <td>${a.slotDate} (${a.startTime} - ${a.endTime})</td>
            <td>${a.doctorName || "Any Available"}</td>
            <td>${a.reason || "-"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No appointments booked yet.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

document.getElementById("book-appointment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;

    try {
        const doctorVal = document.getElementById("appointment-doctor-id").value;
        const res = await authFetch("/appointments", {
            method: "POST",
            body: JSON.stringify({
                timeSlotId: Number(document.getElementById("appointment-slot").value),
                doctorId: doctorVal ? Number(doctorVal) : null,
                reason: document.getElementById("appointment-reason").value.trim() || null,
            }),
        });
        showAlert(res.message || "Appointment booked!", "success");
        e.target.reset();
        await loadStudentAppointments();
    } catch (err) {
        // Leaves form intact so the student can pick another slot on double-booking error
        showAlert(err.message, "error");
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

        document.getElementById("student-consultations-tbody").innerHTML = consults.length
            ? consults.map((c) => `
          <tr>
            <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
            <td>${c.complaint}</td>
            <td>${c.assessment || "-"}</td>
            <td>${c.doctorAssessment || "Pending"}</td>
            <td>${c.followUpInstructions || "-"}</td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No consultation records found.</td></tr>`;

        document.getElementById("student-records-tbody").innerHTML = records.length
            ? records.map((r) => `
          <tr>
            <td>${new Date(r.recordDate).toLocaleDateString()}</td>
            <td><strong>${r.diagnosis}</strong></td>
            <td>${r.treatment}</td>
            <td>${r.doctorName || "Clinic Staff"}</td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No medical records found.</td></tr>`;

        const combined = [
            ...rxs.map((p) => `<tr><td>${new Date(p.prescriptionDate).toLocaleDateString()}</td><td>Rx: ${p.medicineName}</td><td>${p.dosage}</td><td>${p.instructions}</td></tr>`),
            ...refs.map((r) => `<tr><td>${new Date(r.referralDate).toLocaleDateString()}</td><td>Ref: ${r.externalDoctorName}</td><td>${r.reason}</td><td><span class="badge status-${r.status}">${r.status}</span></td></tr>`),
        ];
        document.getElementById("student-rx-ref-tbody").innerHTML = combined.length
            ? combined.join("")
            : `<tr><td colspan="4" class="muted">No prescriptions or referrals yet.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

// ==================== DOCTOR LOGIC ====================
async function loadDoctorConsultations() {
    try {
        const list = await authFetch("/consultations/assigned");
        document.getElementById("doctor-consultations-tbody").innerHTML = list.length
            ? list.map((c) => `
          <tr>
            <td>#${c.consultationId} (Pt #${c.patientId})</td>
            <td>${c.patientName || "Patient"}</td>
            <td>${new Date(c.consultationDate).toLocaleDateString()}</td>
            <td><strong>${c.complaint}</strong><br><span class="muted">BP: ${c.bloodPressure || "-"} | Temp: ${c.temperature || "-"}°C</span></td>
            <td>${c.doctorAssessment || '<span class="muted">Awaiting review</span>'}</td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No consultations assigned to you.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

document.getElementById("doctor-assessment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("doc-consult-id").value;
    try {
        const res = await authFetch(`/consultations/${id}/doctor-assessment`, {
            method: "PUT",
            body: JSON.stringify({
                doctorAssessment: document.getElementById("doc-assessment-text").value.trim(),
            }),
        });
        showAlert(res.message || "Assessment submitted!", "success");
        e.target.reset();
        await loadDoctorConsultations();
    } catch (err) {
        showAlert(err.message);
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
        showAlert(res.message || "Prescription created!", "success");
        e.target.reset();
    } catch (err) {
        showAlert(err.message);
    }
});

// ==================== NURSE LOGIC ====================
function renderAppointmentActions(a) {
    if (a.status === "Booked") {
        return `
      <button class="btn btn-success btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Confirmed')">Confirm</button>
      <button class="btn btn-danger btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Cancelled')">Cancel</button>
    `;
    }
    if (a.status === "Confirmed") {
        return `
      <button class="btn btn-primary btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Completed')">Complete</button>
      <button class="btn btn-danger btn-sm" onclick="window.changeApptStatus(${a.appointmentId}, 'Cancelled')">Cancel</button>
    `;
    }
    return `<span class="muted">Finalized</span>`;
}

window.changeApptStatus = async (id, status) => {
    try {
        const res = await authFetch(`/appointments/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
        showAlert(res.message || `Status updated to ${status}`, "success");
        await loadNurseAppointments();
    } catch (err) {
        showAlert(err.message);
    }
};

async function loadNurseAppointments() {
    try {
        const list = await authFetch("/appointments");
        document.getElementById("nurse-appointments-tbody").innerHTML = list.length
            ? list.map((a) => `
          <tr>
            <td>#${a.appointmentId}</td>
            <td>${a.patientName || `Patient #${a.patientId}`}</td>
            <td>${a.slotDate}<br>${a.startTime} - ${a.endTime}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
            <td>${renderAppointmentActions(a)}</td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No appointments found.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
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
        showAlert(res.message || "Time slot created!", "success");
        e.target.reset();
    } catch (err) {
        showAlert(err.message);
    }
});

async function loadNurseConsultations() {
    try {
        const list = await authFetch("/consultations");
        document.getElementById("nurse-consultations-tbody").innerHTML = list.length
            ? list.map((c) => `
          <tr>
            <td>#${c.consultationId}</td>
            <td>${c.patientName || `#${c.patientId}`}</td>
            <td>${c.complaint}</td>
            <td>${c.doctorAssessment || "-"}</td>
            <td>
              ${!c.timeOut
                    ? `<button class="btn btn-primary btn-sm" onclick="window.completeConsult(${c.consultationId})">Complete</button>`
                    : `<span class="badge status-Completed">Completed</span>`}
            </td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No consultations recorded.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

window.completeConsult = async (id) => {
    const notes = prompt("Optional completion notes:") || "";
    try {
        const res = await authFetch(`/consultations/${id}/complete`, {
            method: "PUT",
            body: JSON.stringify({ notes }),
        });
        showAlert(res.message || "Consultation completed!", "success");
        await loadNurseConsultations();
    } catch (err) {
        showAlert(err.message);
    }
};

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
        showAlert(res.message || "Consultation created!", "success");
        e.target.reset();
        await loadNurseConsultations();
    } catch (err) {
        showAlert(err.message);
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
        showAlert(res.message || "Medical record saved!", "success");
        e.target.reset();
    } catch (err) {
        showAlert(err.message);
    }
});

async function loadNursePatientsAndReferrals() {
    try {
        const [patients, referrals] = await Promise.all([
            authFetch("/patients"),
            authFetch("/referrals"),
        ]);

        document.getElementById("nurse-patients-tbody").innerHTML = patients.length
            ? patients.map((p) => `
          <tr>
            <td>#${p.patientId}</td>
            <td>${p.fullName}</td>
            <td><span class="badge ${p.isActive ? "status-Active" : "status-Inactive"}">${p.isActive ? "Active" : "Inactive"}</span></td>
            <td>
              ${p.isActive ? `<button class="btn btn-danger btn-sm" onclick="window.deactivatePatient(${p.patientId})">Deactivate</button>` : "-"}
            </td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No patients found.</td></tr>`;

        document.getElementById("nurse-referrals-tbody").innerHTML = referrals.length
            ? referrals.map((r) => `
          <tr>
            <td>#${r.referralId}</td>
            <td>${r.patientName || `#${r.patientId}`}</td>
            <td>${r.externalDoctorName}</td>
            <td><span class="badge status-${r.status}">${r.status}</span></td>
          </tr>`).join("")
            : `<tr><td colspan="4" class="muted">No referrals found.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

window.deactivatePatient = async (id) => {
    try {
        const res = await authFetch(`/patients/${id}`, { method: "DELETE" });
        showAlert(res.message || "Patient deactivated.", "success");
        await loadNursePatientsAndReferrals();
    } catch (err) {
        showAlert(err.message);
    }
};

document.getElementById("create-patient-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch("/patients", {
            method: "POST",
            body: JSON.stringify({ fullName: document.getElementById("new-patient-name").value.trim() }),
        });
        showAlert(res.message || "Patient added!", "success");
        e.target.reset();
        await loadNursePatientsAndReferrals();
    } catch (err) {
        showAlert(err.message);
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
        showAlert(res.message || "Referral created!", "success");
        e.target.reset();
        await loadNursePatientsAndReferrals();
    } catch (err) {
        showAlert(err.message);
    }
});

// ==================== REPORTS (NURSE & ADMIN) ====================
async function initReports() {
    const dateInput = document.getElementById("report-date");
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
    }
    await loadDailySchedule(dateInput.value);
}

async function loadDailySchedule(date) {
    try {
        const data = await authFetch(`/reports/daily-schedule?date=${date}`);
        const appts = data.appointments || [];
        document.getElementById("report-schedule-tbody").innerHTML = appts.length
            ? appts.map((a) => `
          <tr>
            <td>${a.startTime} - ${a.endTime}</td>
            <td>${a.patientName} (#${a.patientId})</td>
            <td>${a.doctorName || "Unassigned"}</td>
            <td><span class="badge status-${a.status}">${a.status}</span></td>
            <td>${a.reason || "-"}</td>
          </tr>`).join("")
            : `<tr><td colspan="5" class="muted">No appointments scheduled for ${date}.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
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
      <p class="mt-1"><strong>Consultations (${h.consultations.length}):</strong></p>
      <ul>${h.consultations.map((c) => `<li>${new Date(c.consultationDate).toLocaleDateString()}: ${c.complaint} (Dr. ${c.doctorName || "N/A"})</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-1"><strong>Medical Records (${h.medicalRecords.length}):</strong></p>
      <ul>${h.medicalRecords.map((m) => `<li>${m.diagnosis} — ${m.treatment}</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-1"><strong>Prescriptions (${h.prescriptions.length}):</strong></p>
      <ul>${h.prescriptions.map((p) => `<li>${p.medicineName} (${p.dosage})</li>`).join("") || "<li>None</li>"}</ul>
      <p class="mt-1"><strong>Referrals (${h.referrals.length}):</strong></p>
      <ul>${h.referrals.map((r) => `<li>To ${r.externalDoctorName}: ${r.reason} [${r.status}]</li>`).join("") || "<li>None</li>"}</ul>
    `;
    } catch (err) {
        showAlert(err.message);
        out.innerHTML = `<p class="muted">No report loaded.</p>`;
    }
});

// ==================== ADMIN LOGIC ====================
async function loadAdminUsers() {
    try {
        const users = await authFetch("/admin/users");
        document.getElementById("admin-users-tbody").innerHTML = users.length
            ? users.map((u) => `
          <tr>
            <td>#${u.userId}</td>
            <td>${u.fullName}</td>
            <td>${u.email}</td>
            <td><strong>${u.role}</strong></td>
            <td><span class="badge ${u.isActive ? "status-Active" : "status-Inactive"}">${u.isActive ? "Active" : "Inactive"}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="window.toggleUserStatus(${u.userId}, ${!u.isActive})">
                ${u.isActive ? "Deactivate" : "Activate"}
              </button>
            </td>
          </tr>`).join("")
            : `<tr><td colspan="6" class="muted">No users found.</td></tr>`;
    } catch (err) {
        showAlert(err.message);
    }
}

window.toggleUserStatus = async (id, isActive) => {
    try {
        const res = await authFetch(`/admin/users/${id}/status?isActive=${isActive}`, {
            method: "PUT",
        });
        showAlert(res.message || "User status updated.", "success");
        await loadAdminUsers();
    } catch (err) {
        showAlert(err.message);
    }
};

document.getElementById("create-staff-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const role = document.getElementById("staff-role").value;
        const specialty = document.getElementById("staff-specialty").value.trim();

        const res = await authFetch("/admin/users", {
            method: "POST",
            body: JSON.stringify({
                fullName: document.getElementById("staff-name").value.trim(),
                email: document.getElementById("staff-email").value.trim(),
                password: document.getElementById("staff-password").value,
                role,
                specialty: role === "Doctor" ? specialty : null,
            }),
        });
        showAlert(res.message || "Staff account created!", "success");
        e.target.reset();
        await loadAdminUsers();
    } catch (err) {
        showAlert(err.message);
    }
});