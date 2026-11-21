const role = AngelicareApp.getRole();
const moduleName = new URLSearchParams(location.search).get("module") || "profile";
const moduleContent = document.getElementById("moduleContent");
const feedback = document.getElementById("workspaceFeedback");
const cache = { patients: [], doctors: [], externalDoctors: [], consultations: [], records: [], prescriptions: [], referrals: [], timeSlots: [], manualLogs: [] };

const moduleInfo = {
    profile: ["My Profile", "View the clinic profile connected to your account."],
    patients: ["Patient Management", "Create, view, update, and deactivate patient profiles."],
    consultations: ["Consultations", "Manage clinic consultations and doctor assessments."],
    records: ["Medical Records", "Review and maintain diagnosis and treatment records."],
    prescriptions: ["Prescriptions", "View and manage patient prescriptions."],
    referrals: ["Referrals", "Manage referrals and encode returned specialist findings."],
    reports: ["Clinic Reports", "View patient history and the daily appointment schedule."],
    operations: ["Clinic Operations", "Manage time slots, external doctors, and walk-in clinic logs."],
    admin: ["Staff Accounts", "Create Nurse and Doctor accounts and manage account access."],
    doctors: ["Doctor Management", "Update active doctor profile information."]
};

const moduleRoles = {
    profile: ["student", "doctor"], patients: ["nurse"], consultations: ["student", "nurse", "doctor"],
    records: ["student", "nurse"], prescriptions: ["student", "nurse", "doctor"], referrals: ["student", "nurse"],
    reports: ["nurse", "admin"], operations: ["nurse"], admin: ["admin"], doctors: ["admin"]
};

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function unwrap(result) {
    const data = AngelicareApp.getData(result);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return data;
}
function rows(result) { const data = unwrap(result); return Array.isArray(data) ? data : []; }
let feedbackTimer;
function message(text, type = "success") {
    feedback.textContent = text;
    feedback.className = `feedback ${type} show`;
    feedback.hidden = false;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.classList.remove("show"); }, 6500);
}
function clearMessage() { feedback.textContent = ""; feedback.className = "feedback"; feedback.hidden = true; }
function fmtDate(value) {
    if (!value) return "-";
    const parts = String(value).split("T")[0].split("-");
    if (parts.length !== 3) return String(value);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}
function fmtDateTime(value) { return value ? new Date(value).toLocaleString() : "-"; }
function fmtTime(value) {
    if (!value) return "-";
    const parts = String(value).split(":");
    const h = Number(parts[0]);
    if (Number.isNaN(h)) return String(value);
    return `${h % 12 || 12}:${parts[1] || "00"} ${h >= 12 ? "PM" : "AM"}`;
}
function pill(value) {
    const name = String(value ?? "Unknown");
    return `<span class="status-pill ${esc(name.toLowerCase())}">${esc(name)}</span>`;
}
function table(headers, data, emptyText = "No records found.") {
    if (!data.length) return `<div class="workspace-empty">${esc(emptyText)}</div>`;
    return `<div class="workspace-table-wrap"><table class="workspace-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${data.join("")}</tbody></table></div>`;
}
function tr(values) { return `<tr>${values.map(v => `<td>${v ?? "-"}</td>`).join("")}</tr>`; }
function action(id, name, label, cls = "") { return `<button type="button" class="table-action ${cls}" data-action="${esc(name)}" data-id="${esc(id)}">${esc(label)}</button>`; }
function panel(title, inner) { return `<section class="workspace-panel"><h2>${title}</h2>${inner}</section>`; }
function field(label, name, type = "text", opts = {}) {
    const required = opts.required ? "required" : "";
    const full = opts.full ? "full" : "";
    const value = opts.value !== undefined ? `value="${esc(opts.value)}"` : "";
    const min = opts.min !== undefined ? `min="${esc(opts.min)}"` : "";
    const max = opts.max !== undefined ? `max="${esc(opts.max)}"` : "";
    const step = opts.step !== undefined ? `step="${esc(opts.step)}"` : "";
    const help = opts.help ? `<small class="field-help">${esc(opts.help)}</small>` : "";
    if (type === "textarea") return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><textarea id="${esc(name)}" name="${esc(name)}" ${required} placeholder="${esc(opts.placeholder || "")}">${esc(opts.value || "")}</textarea>${help}</div>`;
    if (type === "select") return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><select id="${esc(name)}" name="${esc(name)}" ${required}>${opts.options || ""}</select>${help}</div>`;
    return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><input id="${esc(name)}" name="${esc(name)}" type="${esc(type)}" ${value} ${required} ${min} ${max} ${step} placeholder="${esc(opts.placeholder || "")}">${help}</div>`;
}
function selectOptions(items, idKey, labelKey, firstLabel = "Select an option") {
    return `<option value="">${esc(firstLabel)}</option>` + items.map(x => `<option value="${esc(x[idKey])}">${esc(x[labelKey])}</option>`).join("");
}
function form(id, fields, buttonText = "Save") {
    return `<form id="${esc(id)}" class="workspace-form">${fields.join("")}<div class="field full"><button type="submit">${esc(buttonText)}</button></div></form>`;
}
async function api(path, options) { return await AngelicareApp.authFetch(path, options); }
async function loadPatients() { cache.patients = rows(await api("/Patients")); return cache.patients; }
async function loadDoctors() { cache.doctors = rows(await api("/Doctors")); return cache.doctors; }
async function loadExternalDoctors() { cache.externalDoctors = rows(await api("/ExternalDoctors")); return cache.externalDoctors; }
async function loadConsultations() {
    const path = role === "doctor" ? "/Consultations/assigned" : role === "student" ? "/Consultations/my" : "/Consultations";
    cache.consultations = rows(await api(path));
    return cache.consultations;
}
function setTitle() {
    const info = moduleInfo[moduleName];
    document.getElementById("moduleTitle").textContent = info[0];
    document.getElementById("topbarTitle").textContent = info[0];
    document.getElementById("moduleDescription").textContent = info[1];
}

async function renderProfile() {
    const data = unwrap(await api(role === "student" ? "/Patients/me" : "/Doctors/me"));
    const fields = role === "student"
        ? [["Patient ID", data.patientId], ["Full Name", data.fullName], ["User ID", data.userId], ["Status", data.isActive ? "Active" : "Inactive"]]
        : [["Doctor ID", data.doctorId], ["Full Name", data.fullName], ["Specialty", data.specialty], ["User ID", data.userId]];
    moduleContent.innerHTML = panel("Account Information", `<div class="detail-list">${fields.map(x => `<div class="detail-item"><span>${esc(x[0])}</span><strong>${esc(x[1] ?? "-")}</strong></div>`).join("")}</div>`);
}

function renderPatientTable(items) {
    const host = document.getElementById("patientTableHost");
    if (!host) return;

    const searchValue = (document.getElementById("patientSearch")?.value || "").trim().toLowerCase();
    const statusValue = document.getElementById("patientStatusFilter")?.value || "all";
    const filtered = items.filter(patient => {
        const matchesSearch = !searchValue || [
            patient.patientId,
            patient.fullName,
            patient.userId ?? "",
            patient.userId == null ? "walk-in manual" : "student account"
        ].some(value => String(value).toLowerCase().includes(searchValue));
        const matchesStatus = statusValue === "all"
            || (statusValue === "active" && patient.isActive)
            || (statusValue === "inactive" && !patient.isActive);
        return matchesSearch && matchesStatus;
    });

    const tableRows = filtered.map(patient => tr([
        `<span class="patient-id">#${esc(patient.patientId)}</span>`,
        `<span class="patient-name">${esc(patient.fullName)}</span>`,
        patient.userId != null
            ? `<span class="patient-linked-account">Student account <strong>#${esc(patient.userId)}</strong></span>`
            : `<span class="patient-manual-account">Walk-in / manual</span>`,
        pill(patient.isActive ? "Active" : "Inactive"),
        patient.isActive
            ? action(patient.patientId, "patient-deactivate", "Deactivate", "danger")
            : action(patient.patientId, "patient-activate", "Reactivate", "neutral"),
        action(patient.patientId, "patient-edit", "Edit")
    ]));

    const countLabel = filtered.length === items.length
        ? `Showing all ${items.length} patient${items.length === 1 ? "" : "s"}`
        : `Showing ${filtered.length} of ${items.length} patients`;
    host.innerHTML = `<div class="patient-table-meta"><span>${countLabel}</span><span>Patient records are preserved when deactivated.</span></div>`
        + table(["Patient ID", "Full Name", "Linked Account", "Status", "Account Action", "Edit"], tableRows, "No patients match your search or filter.");
}

async function renderPatients() {
    const items = await loadPatients();
    const activeCount = items.filter(patient => patient.isActive).length;
    const inactiveCount = items.length - activeCount;
    const linkedCount = items.filter(patient => patient.userId != null).length;
    const manualCount = items.length - linkedCount;

    const summary = `<section class="patient-summary-grid" aria-label="Patient summary">
        <article class="patient-stat-card"><span class="patient-stat-label">Total patients</span><strong>${items.length}</strong><small>All patient profiles</small></article>
        <article class="patient-stat-card patient-stat-active"><span class="patient-stat-label">Active profiles</span><strong>${activeCount}</strong><small>Available for clinic services</small></article>
        <article class="patient-stat-card patient-stat-inactive"><span class="patient-stat-label">Inactive profiles</span><strong>${inactiveCount}</strong><small>Historical profiles retained</small></article>
        <article class="patient-stat-card patient-stat-linked"><span class="patient-stat-label">Linked student accounts</span><strong>${linkedCount}</strong><small>${manualCount} walk-in / manual profiles</small></article>
    </section>`;

    const createIntro = `<div class="patient-form-intro"><div><strong>Create a patient profile</strong><p>Use this for a walk-in or manually registered patient. Student profiles created through registration are linked to their accounts automatically.</p></div><span class="patient-form-tag">Nurse workspace</span></div>`;
    const createForm = form("patientCreateForm", [field("Full name", "fullName", "text", { required: true, full: true, placeholder: "Enter the patient's full name" })], "Add Patient");

    const toolbar = `<div class="patient-toolbar">
        <label class="patient-search"><span class="patient-search-label">Search patients</span><input id="patientSearch" type="search" placeholder="Search by name, patient ID, or linked account" autocomplete="off"></label>
        <label class="patient-filter"><span class="patient-search-label">Account status</span><select id="patientStatusFilter"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div><div id="patientTableHost"></div>`;

    moduleContent.innerHTML = summary
        + panel("Add Patient", createIntro + createForm)
        + panel("Patient Directory", toolbar);
    renderPatientTable(items);
}

function renderConsultationTable(items) {
    const host = document.getElementById("consultationTableHost");
    if (!host) return;

    const searchValue = (document.getElementById("consultationSearch")?.value || "").trim().toLowerCase();
    const statusValue = document.getElementById("consultationStatusFilter")?.value || "all";

    const filtered = items.filter(c => {
        const matchesSearch = !searchValue || [
            c.consultationId,
            c.patientId,
            c.patientName,
            c.complaint,
            c.doctorName,
            c.nurseName,
            c.appointmentId
        ].some(value => String(value ?? "").toLowerCase().includes(searchValue));

        const completed = !!c.timeOut;
        const reviewed = !!c.doctorReviewedAt;
        const matchesStatus = statusValue === "all"
            || (statusValue === "in-progress" && !completed)
            || (statusValue === "completed" && completed)
            || (statusValue === "pending-review" && (!!c.doctorId || !!c.doctorName) && !reviewed)
            || (statusValue === "reviewed" && reviewed)
            || (statusValue === "walk-in" && !c.appointmentId);

        return matchesSearch && matchesStatus;
    });

    const vitals = c => {
        const values = [];
        if (c.bloodPressure) values.push(`<span>BP <strong>${esc(c.bloodPressure)}</strong></span>`);
        if (c.temperature !== null && c.temperature !== undefined && c.temperature !== "") {
            values.push(`<span>Temp <strong>${esc(c.temperature)}°C</strong></span>`);
        }
        return values.length ? `<div class="consultation-vitals">${values.join("")}</div>` : `<span class="consultation-muted">Not recorded</span>`;
    };

    let headers = role === "student"
        ? ["Visit", "Complaint", "Vitals", "Clinic Assessment", "Doctor", "Doctor Assessment", "Status"]
        : role === "doctor"
            ? ["Consultation", "Patient", "Visit date", "Complaint", "Nurse", "Vitals", "Review status", "Action"]
            : ["Consultation", "Patient", "Visit date", "Complaint", "Vitals", "Assigned doctor", "Doctor review", "Visit status", "Action"];
    const body = filtered.map(c => {
        const completed = !!c.timeOut;
        const reviewed = !!c.doctorReviewedAt;
        const hasDoctor = !!c.doctorId || !!c.doctorName;
        const visitStatus = completed ? pill("Completed") : pill("In Progress");
        const doctorReview = !hasDoctor
            ? pill("Not Required")
            : reviewed
                ? `<div class="consultation-review"><span>${pill("Reviewed")}</span><small>${esc(fmtDateTime(c.doctorReviewedAt))}</small></div>`
                : pill("Pending");

        if (role === "student") {
            headers = ["Visit", "Complaint", "Vitals", "Clinic Assessment", "Doctor", "Doctor Assessment", "Status"];
            const clinicAssessment = c.assessment || c.assistanceProvided || "No assessment recorded";
            const doctorAssessment = hasDoctor
                ? (reviewed ? (c.doctorAssessment || "Assessment submitted") : "Awaiting doctor review")
                : "Not required";
            return tr([
                `<div class="consultation-record-id">#${esc(c.consultationId)}</div><strong>${esc(fmtDate(c.consultationDate))}</strong><small class="consultation-table-subtext">${esc(fmtTime(c.timeIn))}${c.timeOut ? ` – ${esc(fmtTime(c.timeOut))}` : " · Ongoing"}</small>`,
                `<span class="consultation-complaint">${esc(c.complaint || "-")}</span>`,
                vitals(c),
                `<span class="consultation-long-text">${esc(clinicAssessment)}</span>`,
                esc(c.doctorName || "No doctor assigned"),
                `<span class="consultation-long-text">${esc(doctorAssessment)}</span>`,
                visitStatus
            ]);
        }

        if (role === "doctor") {
            headers = ["Consultation", "Patient", "Visit date", "Complaint", "Nurse", "Vitals", "Review status", "Action"];
            const reviewAction = reviewed
                ? pill("Reviewed")
                : action(c.consultationId, "consultation-assess", "Submit Assessment");
            return tr([
                `<span class="consultation-record-id">#${esc(c.consultationId)}</span>${c.appointmentId ? `<small class="consultation-table-subtext">Appointment #${esc(c.appointmentId)}</small>` : `<small class="consultation-table-subtext">Walk-in visit</small>`}`,
                `<strong class="consultation-patient-name">${esc(c.patientName || `Patient #${c.patientId}`)}</strong>`,
                `<strong>${esc(fmtDate(c.consultationDate))}</strong><small class="consultation-table-subtext">${esc(fmtTime(c.timeIn))}</small>`,
                `<span class="consultation-complaint">${esc(c.complaint || "-")}</span>`,
                esc(c.nurseName || "Clinic staff"),
                vitals(c),
                `<div class="consultation-review">${doctorReview}${reviewed ? `<small>${esc(fmtDateTime(c.doctorReviewedAt))}</small>` : ""}</div>`,
                reviewAction
            ]);
        }

        headers = ["Consultation", "Patient", "Visit date", "Complaint", "Vitals", "Assigned doctor", "Doctor review", "Visit status", "Action"];
        let actionCell;
        if (completed) {
            actionCell = pill("Completed");
        } else if (hasDoctor && !reviewed) {
            actionCell = `<span class="consultation-awaiting-action">Awaiting doctor assessment</span>`;
        } else {
            actionCell = action(c.consultationId, "consultation-complete", "Complete Visit", "neutral");
        }

        return tr([
            `<span class="consultation-record-id">#${esc(c.consultationId)}</span>${c.appointmentId ? `<small class="consultation-table-subtext">Appointment #${esc(c.appointmentId)}</small>` : `<small class="consultation-table-subtext">Walk-in visit</small>`}`,
            `<strong class="consultation-patient-name">${esc(c.patientName || `Patient #${c.patientId}`)}</strong>`,
            `<strong>${esc(fmtDate(c.consultationDate))}</strong><small class="consultation-table-subtext">In: ${esc(fmtTime(c.timeIn))}${c.timeOut ? ` · Out: ${esc(fmtTime(c.timeOut))}` : ""}</small>`,
            `<span class="consultation-complaint">${esc(c.complaint || "-")}</span>`,
            vitals(c),
            esc(c.doctorName || "No doctor assigned"),
            doctorReview,
            visitStatus,
            actionCell
        ]);
    });

    const countLabel = filtered.length === items.length
        ? `Showing all ${items.length} consultation${items.length === 1 ? "" : "s"}`
        : `Showing ${filtered.length} of ${items.length} consultations`;

    host.innerHTML = `<div class="consultation-table-meta"><span>${countLabel}</span><span>Clinical visit history is retained for patient records.</span></div>`
        + table(headers || ["Consultation"], body, "No consultations match your search or filter.");
}

async function renderConsultations() {
    const items = await loadConsultations();
    const inProgressCount = items.filter(c => !c.timeOut).length;
    const pendingReviewCount = items.filter(c => (!!c.doctorId || !!c.doctorName) && !c.doctorReviewedAt).length;
    const walkInCount = items.filter(c => !c.appointmentId).length;

    const summary = `<section class="consultation-summary-grid" aria-label="Consultation summary">
        <article class="consultation-stat-card"><span class="consultation-stat-label">Total consultations</span><strong>${items.length}</strong><small>Recorded clinic visits</small></article>
        <article class="consultation-stat-card consultation-stat-open"><span class="consultation-stat-label">In progress</span><strong>${inProgressCount}</strong><small>Visits not yet completed</small></article>
        <article class="consultation-stat-card consultation-stat-review"><span class="consultation-stat-label">Awaiting doctor review</span><strong>${pendingReviewCount}</strong><small>Assigned consultations pending assessment</small></article>
        <article class="consultation-stat-card consultation-stat-walkin"><span class="consultation-stat-label">Walk-in visits</span><strong>${walkInCount}</strong><small>Visits without an appointment</small></article>
    </section>`;

    let nursePanel = "";
    if (role === "nurse") {
        const patients = (await loadPatients()).filter(p => p.isActive);
        const doctors = (await loadDoctors()).filter(d => d.isActive !== false);
        const appointments = rows(await api("/Appointments")).filter(a => a.status === "Confirmed");
        const appointmentOptions = `<option value="">Walk-in / no appointment</option>` + appointments.map(a => `<option value="${esc(a.appointmentId)}" data-patient="${esc(a.patientId)}" data-doctor="${esc(a.doctorId || "")}">#${esc(a.appointmentId)} — ${esc(a.patientName)} — ${esc(fmtDate(a.slotDate))} ${esc(fmtTime(a.startTime))}</option>`).join("");
        const patientOptions = selectOptions(patients, "patientId", "fullName", "Select patient");
        const doctorOptions = `<option value="">No doctor assigned</option>` + doctors.map(d => `<option value="${esc(d.doctorId)}">${esc(d.fullName)} — ${esc(d.specialty)}</option>`).join("");
        const createForm = form("consultationCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: patientOptions }),
            field("Confirmed appointment (optional)", "appointmentId", "select", { options: appointmentOptions, help: "Choose a confirmed booking. Patient and assigned doctor will be filled automatically." }),
            field("Assign doctor (optional)", "doctorId", "select", { options: doctorOptions }),
            field("Chief complaint", "complaint", "textarea", { required: true, full: true, placeholder: "Describe the patient's main concern" }),
            field("Blood pressure", "bloodPressure", "text", { placeholder: "e.g. 120/80" }),
            field("Temperature (°C)", "temperature", "number", { step: "0.1", min: 25, max: 50, placeholder: "e.g. 36.5" }),
            field("Initial assessment", "assessment", "textarea", { placeholder: "Initial observations or assessment" }),
            field("Assistance provided", "assistanceProvided", "textarea", { placeholder: "Care or assistance given" }),
            field("Notes", "notes", "textarea", { placeholder: "Additional clinical notes" }),
            field("Follow-up instructions", "followUpInstructions", "textarea", { full: true, placeholder: "Instructions or recommended follow-up" })
        ], "Create Consultation");
        nursePanel = panel("Record a Clinic Visit", `<div class="consultation-form-intro"><div><strong>Start a new consultation</strong><p>Record a walk-in visit or connect the consultation to a confirmed appointment. Clinical details are stored with the patient's history.</p></div><span class="consultation-role-chip">Nurse workspace</span></div>${createForm}`);
    }

    const filterOptions = `<option value="all">All consultations</option>
        <option value="in-progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="pending-review">Awaiting doctor review</option>
        <option value="reviewed">Doctor reviewed</option>
        <option value="walk-in">Walk-in visits</option>`;
    const toolbar = `<div class="consultation-toolbar">
        <label class="consultation-search"><span>Search consultations</span><input id="consultationSearch" type="search" placeholder="Search by patient, visit ID, complaint, or doctor" autocomplete="off"></label>
        <label class="consultation-filter"><span>Visit status</span><select id="consultationStatusFilter">${filterOptions}</select></label>
    </div><div id="consultationTableHost"></div>`;

    const modal = `<dialog id="consultationActionDialog" class="consultation-action-dialog" aria-labelledby="consultationDialogTitle">
        <div class="consultation-dialog-header"><div><span class="workspace-eyebrow">CLINICAL WORKFLOW</span><h2 id="consultationDialogTitle">Consultation action</h2></div><button type="button" class="consultation-dialog-close" data-action="consultation-modal-close" aria-label="Close dialog">×</button></div>
        <form id="consultationAssessForm" class="consultation-dialog-form" hidden>
            <input type="hidden" name="consultationId">
            <p class="consultation-dialog-help">Add the medical assessment for the consultation assigned to you. This action will be recorded under your Doctor account.</p>
            <div class="field"><label for="doctorAssessmentInput">Doctor assessment</label><textarea id="doctorAssessmentInput" name="doctorAssessment" rows="6" minlength="2" maxlength="1000" required placeholder="Enter your assessment and clinical findings"></textarea></div>
            <div class="consultation-dialog-actions"><button type="button" class="table-action neutral" data-action="consultation-modal-close">Cancel</button><button type="submit" class="consultation-dialog-submit">Submit Assessment</button></div>
        </form>
        <form id="consultationCompleteForm" class="consultation-dialog-form" hidden>
            <input type="hidden" name="consultationId">
            <p class="consultation-dialog-help">Add optional completion notes before closing this clinic visit.</p>
            <div class="field"><label for="consultationCompletionNotes">Completion notes</label><textarea id="consultationCompletionNotes" name="notes" rows="5" maxlength="2000" placeholder="Enter any final notes for this visit"></textarea></div>
            <div class="consultation-dialog-actions"><button type="button" class="table-action neutral" data-action="consultation-modal-close">Cancel</button><button type="submit" class="consultation-dialog-submit">Complete Visit</button></div>
        </form>
    </dialog>`;

    moduleContent.innerHTML = summary + nursePanel + panel(
        role === "student" ? "My Consultation History" : role === "doctor" ? "Assigned Consultations" : "Consultation Directory",
        toolbar
    ) + modal;
    renderConsultationTable(items);
}
function renderMedicalRecordTable(items) {
    const host = document.getElementById("recordTableHost");
    if (!host) return;

    const searchValue = (document.getElementById("recordSearch")?.value || "").trim().toLowerCase();
    const dateValue = document.getElementById("recordDateFilter")?.value || "all";
    const now = new Date();
    const filtered = items.filter(record => {
        const searchable = [
            record.recordId,
            record.patientId,
            record.patientName,
            record.consultationId,
            record.appointmentId,
            record.doctorName,
            record.diagnosis,
            record.treatment,
            record.notes
        ].some(value => String(value ?? "").toLowerCase().includes(searchValue));
        const date = record.recordDate ? new Date(record.recordDate) : null;
        const validDate = date && !Number.isNaN(date.getTime());
        const dateMatches = dateValue === "all"
            || (validDate && dateValue === "month" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear())
            || (validDate && dateValue === "year" && date.getFullYear() === now.getFullYear());
        return searchable && dateMatches;
    }).sort((a, b) => new Date(b.recordDate || 0) - new Date(a.recordDate || 0));

    const body = filtered.map(record => {
        const patient = role === "student" ? "My medical history" : record.patientName || `Patient #${record.patientId}`;
        const diagnosis = `<span class="record-cell-text" title="${esc(record.diagnosis)}">${esc(record.diagnosis || "Not provided")}</span>`;
        const treatment = `<span class="record-cell-text" title="${esc(record.treatment)}">${esc(record.treatment || "Not provided")}</span>`;
        const notes = `<span class="record-cell-text record-notes-text" title="${esc(record.notes || "No notes")}">${esc(record.notes || "No notes")}</span>`;
        const values = [
            `<span class="record-id">#${esc(record.recordId)}</span>`,
            ...(role === "nurse" ? [`<span class="record-patient-name">${esc(patient)}</span>`] : []),
            esc(record.consultationId ? `#${record.consultationId}` : "—"),
            diagnosis,
            treatment,
            `<span class="record-doctor-name">${esc(record.doctorName || "Not assigned")}</span>`,
            esc(fmtDate(record.recordDate)),
            notes,
            `<div class="record-row-actions">${action(record.recordId, "record-view", "View", "neutral")}${role === "nurse" ? `${action(record.recordId, "record-edit", "Edit")}${action(record.recordId, "record-delete", "Delete", "danger")}` : ""}</div>`
        ];
        return tr(values);
    });

    const countText = filtered.length === items.length
        ? `Showing all ${items.length} record${items.length === 1 ? "" : "s"}`
        : `Showing ${filtered.length} of ${items.length} records`;
    host.innerHTML = `<div class="record-table-meta"><span>${countText}</span><span>Clinical history is retained for patient care.</span></div>`
        + table(["Record ID", ...(role === "nurse" ? ["Patient"] : []), "Consultation", "Diagnosis", "Treatment", "Doctor", "Record Date", "Notes", "Actions"], body, "No medical records match your search or date filter.");
}

async function renderRecords() {
    const items = rows(await api(role === "student" ? "/MedicalRecords/my" : "/MedicalRecords"));
    cache.records = items;

    const now = new Date();
    const thisMonth = items.filter(record => {
        if (!record.recordDate) return false;
        const date = new Date(record.recordDate);
        return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const withNotes = items.filter(record => String(record.notes || "").trim()).length;
    const involvedDoctors = new Set(items.map(record => record.doctorId ?? record.doctorName).filter(Boolean)).size;
    const summaryItems = [
        ["Total medical records", items.length, "Recorded clinical history", "record-stat-total"],
        ["Added this month", thisMonth, "Records created this month", "record-stat-month"],
        [role === "nurse" ? "Doctors involved" : "Doctors on record", involvedDoctors, "Identified in clinical records", "record-stat-doctor"],
        ["With visit notes", withNotes, "Records with additional notes", "record-stat-notes"]
    ];
    const summary = `<section class="record-summary-grid" aria-label="Medical record summary">${summaryItems.map(item => `<article class="record-stat-card ${item[3]}"><span>${item[0]}</span><strong>${item[1]}</strong><small>${item[2]}</small></article>`).join("")}</section>`;

    let createPanel = "";
    if (role === "nurse") {
        const patients = (await loadPatients()).filter(patient => patient.isActive);
        const consultations = (await loadConsultations()).filter(consultation => Boolean(consultation.timeOut));
        const consultationOptions = `<option value="">Select completed consultation</option>${consultations.map(consultation => `<option value="${esc(consultation.consultationId)}" data-patient-id="${esc(consultation.patientId)}">Visit #${esc(consultation.consultationId)} · ${esc(consultation.complaint || "Clinic visit")}</option>`).join("")}`;
        createPanel = panel("Add Medical Record", `<div class="record-form-intro"><div><strong>Create a patient medical record</strong><p>Link the diagnosis and treatment to a completed consultation. Only active patient profiles and completed visits are available.</p></div><span class="record-role-tag">Nurse workspace</span></div>` + form("recordCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }),
            field("Completed consultation", "consultationId", "select", { required: true, options: consultationOptions, help: "Selecting a consultation will automatically choose its patient." }),
            field("Diagnosis", "diagnosis", "textarea", { required: true, full: true, placeholder: "Enter the confirmed diagnosis" }),
            field("Treatment", "treatment", "textarea", { required: true, full: true, placeholder: "Describe the treatment or care provided" }),
            field("Additional notes", "notes", "textarea", { full: true, placeholder: "Optional clinical notes" })
        ], "Save Medical Record"));
    }

    const toolbar = `<div class="record-toolbar"><label class="record-search"><span>Search medical records</span><input id="recordSearch" type="search" autocomplete="off" placeholder="Search by patient, record ID, diagnosis, treatment, or doctor"></label><label class="record-date-filter"><span>Record date</span><select id="recordDateFilter"><option value="all">All dates</option><option value="month">This month</option><option value="year">This year</option></select></label></div><div id="recordTableHost"></div>`;
    const dialog = `<dialog id="recordActionDialog" class="consultation-action-dialog record-action-dialog" aria-labelledby="recordDialogTitle"><div class="consultation-dialog-header"><div><span class="workspace-eyebrow">CLINICAL RECORD</span><h2 id="recordDialogTitle">Medical record</h2></div><button type="button" class="consultation-dialog-close" data-action="record-modal-close" aria-label="Close dialog">×</button></div><div id="recordViewPane" class="record-view-pane" hidden></div><form id="recordEditForm" class="record-edit-form" hidden><input type="hidden" name="recordId"><p class="consultation-dialog-help">Update the diagnosis, treatment, or notes for this medical record.</p><div class="field"><label for="recordEditDiagnosis">Diagnosis</label><textarea id="recordEditDiagnosis" name="diagnosis" rows="3" minlength="2" maxlength="1000" required></textarea></div><div class="field"><label for="recordEditTreatment">Treatment</label><textarea id="recordEditTreatment" name="treatment" rows="4" minlength="2" maxlength="2000" required></textarea></div><div class="field"><label for="recordEditNotes">Additional notes</label><textarea id="recordEditNotes" name="notes" rows="3" maxlength="2000"></textarea></div><div class="consultation-dialog-actions"><button type="button" class="table-action neutral" data-action="record-modal-close">Cancel</button><button type="submit" class="consultation-dialog-submit">Save Changes</button></div></form><div id="recordViewActions" class="consultation-dialog-actions" hidden><button type="button" class="table-action neutral" data-action="record-modal-close">Close</button></div></dialog>`;

    moduleContent.innerHTML = summary + createPanel + panel(role === "student" ? "My Medical History" : "Medical Record Directory", toolbar) + dialog;
    renderMedicalRecordTable(items);
}

function renderPrescriptionTable(items) {
    const host = document.getElementById("prescriptionTableHost");
    if (!host) return;
    const searchValue = (document.getElementById("prescriptionSearch")?.value || "").trim().toLowerCase();
    const dateFilter = document.getElementById("prescriptionDateFilter")?.value || "all";
    const now = new Date();
    const filtered = items.filter(item => {
        const searchable = [item.prescriptionId, item.patientName, item.consultationId, item.medicineName, item.dosage, item.instructions, item.prescribingDoctorName];
        const matchesSearch = !searchValue || searchable.some(value => String(value ?? "").toLowerCase().includes(searchValue));
        const date = item.prescriptionDate ? new Date(item.prescriptionDate) : null;
        const matchesDate = dateFilter === "all" || (date && dateFilter === "month" && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) || (date && dateFilter === "year" && date.getFullYear() === now.getFullYear());
        return matchesSearch && matchesDate;
    });
    const body = filtered.map(item => tr([
        `<span class="clinical-record-id">#${esc(item.prescriptionId)}</span>`,
        `<strong class="clinical-primary-text">${esc(role === "student" ? "My prescription" : item.patientName || `Patient #${item.patientId}`)}</strong>`,
        esc(`#${item.consultationId}`),
        `<strong class="clinical-primary-text">${esc(item.medicineName)}</strong>`,
        esc(item.dosage),
        `<span class="clinical-provider">${esc(item.prescribingDoctorName || "Not specified")}</span>`,
        esc(fmtDate(item.prescriptionDate)),
        `${action(item.prescriptionId, "prescription-view", "View")}${role === "nurse" ? action(item.prescriptionId, "prescription-edit", "Edit") + action(item.prescriptionId, "prescription-delete", "Delete", "danger") : ""}`
    ]));
    const count = filtered.length === items.length ? `Showing all ${items.length} prescription${items.length === 1 ? "" : "s"}` : `Showing ${filtered.length} of ${items.length} prescriptions`;
    host.innerHTML = `<div class="clinical-table-meta"><span>${count}</span><span>Prescription history is linked to its consultation.</span></div>` + table(["Prescription", "Patient", "Consultation", "Medicine", "Dosage", "Prescribed By", "Date", "Actions"], body, "No prescriptions match your search or date filter.");
}

async function renderPrescriptions() {
    const listPath = role === "student" ? "/Prescriptions/my" : role === "doctor" ? "/Prescriptions/assigned" : "/Prescriptions";
    cache.prescriptions = rows(await api(listPath));
    const items = cache.prescriptions;
    let createPanel = "";

    if (role === "nurse" || role === "doctor") {
        const consultations = await loadConsultations();
        const fields = [];
        if (role === "nurse") {
            const patients = (await loadPatients()).filter(p => p.isActive);
            const external = (await loadExternalDoctors()).filter(d => d.isActive);
            fields.push(field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }));
            const eligibleConsultations = consultations.filter(c => !c.doctorId || !!c.doctorReviewedAt);
            const consultationOptions = `<option value="">Select consultation</option>` + eligibleConsultations.map(c => {
                const doctorStatus = c.doctorId ? "In-house Doctor reviewed" : "No in-house Doctor — external Doctor required";
                const label = `${c.patientName || `Patient #${c.patientId}`} — ${fmtDate(c.consultationDate)} — ${c.complaint || "Clinic visit"} — ${doctorStatus}`;
                return `<option value="${esc(c.consultationId)}" data-patient="${esc(c.patientId)}" data-doctor="${esc(c.doctorId || "")}">${esc(label)}</option>`;
            }).join("");
            fields.push(field("Consultation", "consultationId", "select", { required: true, options: consultationOptions, help: "In-house Doctor consultations must be reviewed first. For walk-in consultations without an assigned Doctor, select an active External Doctor." }));
            fields.push(field("External Doctor", "externalDoctorId", "select", { options: `<option value="">Select external Doctor when needed</option>` + external.map(d => `<option value="${esc(d.externalDoctorId)}">${esc(d.fullName)}${d.specialization ? ` — ${esc(d.specialization)}` : ""}</option>`).join(""), help: "Required only when the consultation has no in-house Doctor." }));
        } else {
            const reviewed = consultations.filter(c => !!c.doctorReviewedAt && !!c.doctorId);
            const consultationOptions = `<option value="">Select your reviewed consultation</option>` + reviewed.map(c => {
                const label = `${c.patientName || `Patient #${c.patientId}`} — ${fmtDate(c.consultationDate)} — ${c.complaint || "Clinic visit"}`;
                return `<option value="${esc(c.consultationId)}" data-patient="${esc(c.patientId)}">${esc(label)}</option>`;
            }).join("");
            fields.push(field("Reviewed consultation", "consultationId", "select", { required: true, options: consultationOptions, help: reviewed.length ? "Only consultations assigned to you and already reviewed are available." : "You do not have a reviewed assigned consultation yet. Ask the Nurse to assign a consultation and submit your assessment first." }));
        }
        fields.push(field("Medicine name", "medicineName", "text", { required: true, placeholder: "Enter medicine name" }));
        fields.push(field("Dosage", "dosage", "text", { required: true, placeholder: "Enter dosage" }));
        fields.push(field("Instructions", "instructions", "textarea", { required: true, full: true, placeholder: "Enter dosage instructions and frequency" }));
        createPanel = panel("Create Prescription", `<div class="clinical-form-intro"><strong>Prescription details</strong><span>Record medicine instructions for an eligible consultation.</span></div>${form("prescriptionCreateForm", fields, "Save Prescription")}`);
    }

    const now = new Date();
    const currentMonth = items.filter(item => {
        const date = item.prescriptionDate ? new Date(item.prescriptionDate) : null;
        return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
    const patientCount = new Set(items.map(item => item.patientId).filter(value => value != null)).size;
    const medicineCount = new Set(items.map(item => String(item.medicineName || "").trim().toLowerCase()).filter(Boolean)).size;
    const summary = `<section class="clinical-summary-grid" aria-label="Prescription summary">
        <article class="clinical-summary-card"><span>Total prescriptions</span><strong>${items.length}</strong><small>Recorded medicine entries</small></article>
        <article class="clinical-summary-card accent-green"><span>Added this month</span><strong>${currentMonth}</strong><small>Prescriptions dated this month</small></article>
        <article class="clinical-summary-card accent-blue"><span>Patients covered</span><strong>${patientCount || (role === "student" && items.length ? 1 : 0)}</strong><small>Unique patient records</small></article>
        <article class="clinical-summary-card accent-violet"><span>Medicines recorded</span><strong>${medicineCount}</strong><small>Distinct medicine names</small></article>
    </section>`;
    const toolbar = `<div class="clinical-filter-toolbar"><label><span>Search prescriptions</span><input id="prescriptionSearch" type="search" autocomplete="off" placeholder="Search by patient, medicine, consultation, or prescriber"></label><label class="clinical-filter-select"><span>Prescription date</span><select id="prescriptionDateFilter"><option value="all">All dates</option><option value="month">This month</option><option value="year">This year</option></select></label></div><div id="prescriptionTableHost"></div>`;
    const dialog = `<dialog id="prescriptionDialog" class="consultation-action-dialog clinical-record-dialog" aria-labelledby="prescriptionDialogTitle"><div class="consultation-dialog-header"><div><span class="workspace-eyebrow">MEDICATION DETAILS</span><h2 id="prescriptionDialogTitle">Prescription</h2></div><button type="button" class="consultation-dialog-close" data-action="prescription-modal-close" aria-label="Close dialog">×</button></div><div id="prescriptionViewPane" class="record-view-pane" hidden></div><form id="prescriptionEditForm" class="record-edit-form" hidden><input type="hidden" name="prescriptionId"><p class="consultation-dialog-help">Update the medicine details for this prescription entry.</p><div class="field"><label for="prescriptionEditMedicine">Medicine name</label><input id="prescriptionEditMedicine" name="medicineName" maxlength="150" required></div><div class="field"><label for="prescriptionEditDosage">Dosage</label><input id="prescriptionEditDosage" name="dosage" maxlength="100" required></div><div class="field"><label for="prescriptionEditInstructions">Instructions</label><textarea id="prescriptionEditInstructions" name="instructions" rows="4" maxlength="1000" required></textarea></div><div class="consultation-dialog-actions"><button type="button" class="table-action neutral" data-action="prescription-modal-close">Cancel</button><button type="submit" class="consultation-dialog-submit">Save Changes</button></div></form><div id="prescriptionViewActions" class="consultation-dialog-actions" hidden><button type="button" class="table-action neutral" data-action="prescription-modal-close">Close</button></div></dialog>`;
    moduleContent.innerHTML = summary + createPanel + panel(role === "student" ? "My Prescriptions" : "Prescription Directory", toolbar) + dialog;
    renderPrescriptionTable(items);
}

function renderReferralTable(items) {
    const host = document.getElementById("referralTableHost");
    if (!host) return;
    const searchValue = (document.getElementById("referralSearch")?.value || "").trim().toLowerCase();
    const statusValue = document.getElementById("referralStatusFilter")?.value || "all";
    const filtered = items.filter(item => {
        const searchable = [item.referralId, item.patientName, item.externalDoctorName, item.externalDoctorSpecialization, item.reason, item.notes, item.returnedFindings, item.diagnosis, item.treatment, item.returnedPrescription];
        const matchesSearch = !searchValue || searchable.some(value => String(value ?? "").toLowerCase().includes(searchValue));
        const matchesStatus = statusValue === "all" || String(item.status || "pending").toLowerCase() === statusValue;
        return matchesSearch && matchesStatus;
    });
    const body = filtered.map(item => tr([
        `<span class="clinical-record-id">#${esc(item.referralId)}</span>`,
        `<strong class="clinical-primary-text">${esc(role === "student" ? "My referral" : item.patientName || `Patient #${item.patientId}`)}</strong>`,
        `<span class="clinical-specialist-name">${esc(item.externalDoctorName || "External specialist")}</span><small class="clinical-subtext">${esc(item.externalDoctorSpecialization || "Specialization not listed")}</small>`,
        esc(item.reason),
        pill(item.status || "Pending"),
        esc(fmtDate(item.referralDate)),
        item.status === "Completed" ? `<span class="clinical-response-complete">Response recorded</span>` : `<span class="clinical-response-pending">Awaiting specialist response</span>`,
        `${action(item.referralId, "referral-view", "View")}${role === "nurse" && item.status !== "Completed" ? action(item.referralId, "referral-response", "Record Response", "neutral") : ""}`
    ]));
    const count = filtered.length === items.length ? `Showing all ${items.length} referral${items.length === 1 ? "" : "s"}` : `Showing ${filtered.length} of ${items.length} referrals`;
    host.innerHTML = `<div class="clinical-table-meta"><span>${count}</span><span>Referral responses are retained in the patient history.</span></div>` + table(["Referral", "Patient", "External Specialist", "Reason", "Status", "Date Created", "Response", "Actions"], body, "No referrals match your search or status filter.");
}

async function renderReferrals() {
    cache.referrals = rows(await api(role === "student" ? "/Referrals/my" : "/Referrals"));
    const items = cache.referrals;
    let createPanel = "";
    if (role === "nurse") {
        const patients = (await loadPatients()).filter(p => p.isActive);
        const external = (await loadExternalDoctors()).filter(d => d.isActive);
        const referralFields = [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }),
            field("External specialist", "externalDoctorId", "select", { required: true, options: selectOptions(external, "externalDoctorId", "fullName", "Select specialist") }),
            field("Reason for referral", "reason", "textarea", { required: true, full: true, placeholder: "Describe why the patient needs external specialist care" }),
            field("Additional notes", "notes", "textarea", { full: true, placeholder: "Optional details for the receiving specialist" })
        ];
        createPanel = panel("Create Referral", `<div class="clinical-form-intro"><strong>Refer a patient to an external specialist</strong><span>Select an active patient and external doctor, then document the referral reason.</span></div>${form("referralCreateForm", referralFields, "Create Referral")}`);
    }
    const pendingCount = items.filter(item => String(item.status || "pending").toLowerCase() === "pending").length;
    const completedCount = items.filter(item => String(item.status || "").toLowerCase() === "completed").length;
    const specialistCount = new Set(items.map(item => item.externalDoctorId).filter(value => value != null)).size;
    const summary = `<section class="clinical-summary-grid" aria-label="Referral summary">
        <article class="clinical-summary-card"><span>Total referrals</span><strong>${items.length}</strong><small>Referral records</small></article>
        <article class="clinical-summary-card accent-amber"><span>Pending responses</span><strong>${pendingCount}</strong><small>Awaiting specialist findings</small></article>
        <article class="clinical-summary-card accent-green"><span>Completed referrals</span><strong>${completedCount}</strong><small>Responses recorded</small></article>
        <article class="clinical-summary-card accent-violet"><span>Specialists involved</span><strong>${specialistCount}</strong><small>External referral contacts</small></article>
    </section>`;
    const toolbar = `<div class="clinical-filter-toolbar"><label><span>Search referrals</span><input id="referralSearch" type="search" autocomplete="off" placeholder="Search by patient, specialist, referral ID, or reason"></label><label class="clinical-filter-select"><span>Referral status</span><select id="referralStatusFilter"><option value="all">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option></select></label></div><div id="referralTableHost"></div>`;
    const dialog = `<dialog id="referralDialog" class="consultation-action-dialog clinical-record-dialog" aria-labelledby="referralDialogTitle"><div class="consultation-dialog-header"><div><span class="workspace-eyebrow">SPECIALIST REFERRAL</span><h2 id="referralDialogTitle">Referral details</h2></div><button type="button" class="consultation-dialog-close" data-action="referral-modal-close" aria-label="Close dialog">×</button></div><div id="referralViewPane" class="record-view-pane" hidden></div><form id="referralResponseForm" class="record-edit-form" hidden><input type="hidden" name="referralId"><p class="consultation-dialog-help">Encode the findings returned by the external specialist. Findings, diagnosis, and treatment are required to complete the referral.</p><div class="field"><label for="referralReturnedFindings">Returned findings</label><textarea id="referralReturnedFindings" name="returnedFindings" rows="3" maxlength="2000" required></textarea></div><div class="field"><label for="referralDiagnosis">Specialist diagnosis</label><textarea id="referralDiagnosis" name="diagnosis" rows="3" maxlength="1000" required></textarea></div><div class="field"><label for="referralTreatment">Recommended treatment</label><textarea id="referralTreatment" name="treatment" rows="3" maxlength="2000" required></textarea></div><div class="field"><label for="referralReturnedPrescription">Returned prescription (optional)</label><textarea id="referralReturnedPrescription" name="returnedPrescription" rows="2" maxlength="1000"></textarea></div><div class="consultation-dialog-actions"><button type="button" class="table-action neutral" data-action="referral-modal-close">Cancel</button><button type="submit" class="consultation-dialog-submit">Save Specialist Response</button></div></form><div id="referralViewActions" class="consultation-dialog-actions" hidden><button type="button" class="table-action neutral" data-action="referral-modal-close">Close</button></div></dialog>`;
    moduleContent.innerHTML = summary + createPanel + panel(role === "student" ? "My Referrals" : "Referral Directory", toolbar) + dialog;
    renderReferralTable(items);
}

function renderPatientHistory(data) {
    const consultations = Array.isArray(data.consultations) ? data.consultations : [];
    const records = Array.isArray(data.medicalRecords) ? data.medicalRecords : [];
    const prescriptions = Array.isArray(data.prescriptions) ? data.prescriptions : [];
    const referrals = Array.isArray(data.referrals) ? data.referrals : [];
    const statusText = data.isActive ? "Active patient" : "Inactive patient";
    const summary = `<section class="report-patient-summary">
        <div class="report-patient-heading"><div><span class="report-kicker">PATIENT OVERVIEW</span><h3>${esc(data.fullName || "Patient")}</h3><p>Patient record #${esc(data.patientId ?? "-")}</p></div>${pill(statusText)}</div>
        <div class="report-stat-grid">
            <article><span>Consultations</span><strong>${consultations.length}</strong></article>
            <article><span>Medical records</span><strong>${records.length}</strong></article>
            <article><span>Prescriptions</span><strong>${prescriptions.length}</strong></article>
            <article><span>Referrals</span><strong>${referrals.length}</strong></article>
        </div>
    </section>`;
    const section = (eyebrow, title, headers, items, map, emptyText) => `<section class="report-history-section"><div class="report-section-heading"><div><span class="report-kicker">${eyebrow}</span><h3>${title}</h3></div><span class="report-count">${items.length} ${items.length === 1 ? "record" : "records"}</span></div>${table(headers, items.map(map), emptyText)}</section>`;
    return `<div class="report-history-result">${summary}
        ${section("CLINICAL VISITS", "Consultations", ["Date", "Complaint", "Doctor", "Nurse assessment", "Doctor assessment", "Time out"], consultations, x => tr([esc(fmtDateTime(x.consultationDate)), esc(x.complaint), esc(x.doctorName || "Not assigned"), esc(x.assessment), esc(x.doctorAssessment), esc(x.timeOut ? fmtTime(x.timeOut) : "Not completed")]), "No consultations recorded for this patient.")}
        ${section("PATIENT FILE", "Medical Records", ["Date", "Diagnosis", "Treatment", "Doctor", "Notes"], records, x => tr([esc(fmtDate(x.recordDate)), esc(x.diagnosis), esc(x.treatment), esc(x.doctorName || "Not assigned"), esc(x.notes)]), "No medical records found for this patient.")}
        ${section("MEDICATION HISTORY", "Prescriptions", ["Date", "Medicine", "Dosage", "Instructions", "Prescribed by"], prescriptions, x => tr([esc(fmtDate(x.prescriptionDate)), esc(x.medicineName), esc(x.dosage), esc(x.instructions), esc(x.prescribingDoctorName)]), "No prescriptions found for this patient.")}
        ${section("SPECIALIST CARE", "Referrals", ["Date", "Specialist", "Reason", "Status", "Findings", "Diagnosis", "Treatment", "Returned prescription"], referrals, x => tr([esc(fmtDate(x.referralDate)), esc(x.externalDoctorName), esc(x.reason), pill(x.status), esc(x.returnedFindings), esc(x.diagnosis), esc(x.treatment), esc(x.returnedPrescription)]), "No referrals found for this patient.")}
    </div>`;
}

function renderDailySchedule(data, items, selectedDate) {
    const appointments = Array.isArray(items) ? items : [];
    const countStatus = status => appointments.filter(item => String(item.status || "").toLowerCase() === status).length;
    const confirmed = countStatus("confirmed");
    const completed = countStatus("completed");
    const cancelled = countStatus("cancelled");
    const rowsMarkup = appointments.map(item => tr([
        `<span class="report-record-id">#${esc(item.appointmentId)}</span>`,
        `<strong>${esc(item.patientName || `Patient #${item.patientId}`)}</strong>`,
        esc(item.doctorName || "Unassigned"),
        esc(`${fmtTime(item.startTime)} – ${fmtTime(item.endTime)}`),
        pill(item.status),
        esc(item.reason || "-")
    ]));
    return `<div class="report-daily-result">
        <div class="report-result-heading"><div><span class="report-kicker">DAILY CLINIC OPERATIONS</span><h3>Schedule for ${esc(fmtDate(selectedDate || data.date))}</h3><p>${appointments.length} appointment${appointments.length === 1 ? "" : "s"} scheduled for this date.</p></div><span class="report-result-date">${esc(fmtDate(selectedDate || data.date))}</span></div>
        <div class="report-stat-grid report-stat-grid-compact">
            <article><span>Total appointments</span><strong>${appointments.length}</strong></article>
            <article><span>Confirmed</span><strong>${confirmed}</strong></article>
            <article><span>Completed</span><strong>${completed}</strong></article>
            <article><span>Cancelled</span><strong>${cancelled}</strong></article>
        </div>
        ${table(["Appointment", "Patient", "Doctor", "Time", "Status", "Reason"], rowsMarkup, "No appointments are scheduled for this date.")}
    </div>`;
}

async function renderReports() {
    const patients = (role === "nurse" || role === "admin") ? (await loadPatients()) : [];
    const patientSelect = field("Patient", "reportPatientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select a patient") });
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const historyPanel = panel("Patient History Report", `<div class="report-form-intro"><div><strong>Review a patient's complete clinic history</strong><p>Generate a consolidated view of consultations, medical records, prescriptions, and referrals.</p></div><span class="report-panel-tag">PATIENT RECORD</span></div><form id="patientHistoryForm" class="report-form"><div class="report-form-control">${patientSelect}</div><button type="submit" class="report-submit-button">Generate Patient History</button></form><div id="patientHistoryResult" class="report-result-host"></div>`);
    const schedulePanel = panel("Daily Schedule Report", `<div class="report-form-intro"><div><strong>Review appointments for a selected date</strong><p>View patient bookings, assigned doctors, scheduled times, and appointment status.</p></div><span class="report-panel-tag">CLINIC SCHEDULE</span></div><form id="dailyScheduleForm" class="report-form"><div class="report-form-control">${field("Schedule date", "scheduleDate", "date", { required: true, value: todayValue })}</div><button type="submit" class="report-submit-button">Generate Daily Schedule</button></form><div id="dailyScheduleResult" class="report-result-host"></div>`);
    moduleContent.innerHTML = `<section class="reports-intro"><span class="report-kicker">CLINIC INSIGHTS</span><h2>Reports & Patient Insights</h2><p>Generate patient history and daily clinic schedules using the latest records available in the system.</p></section><div class="reports-grid">${historyPanel}${schedulePanel}</div>`;
}

function renderTimeSlotTable(items) {
    const host = document.getElementById("timeSlotTableHost");
    if (!host) return;
    const query = (document.getElementById("timeSlotSearch")?.value || "").trim().toLowerCase();
    const status = document.getElementById("timeSlotStatusFilter")?.value || "all";
    const filtered = items.filter(slot => {
        const searchable = [slot.timeSlotId, slot.slotDate, slot.startTime, slot.endTime].some(value => String(value ?? "").toLowerCase().includes(query));
        const matchesStatus = status === "all" || (status === "available" && slot.isAvailable) || (status === "booked" && !slot.isAvailable);
        return searchable && matchesStatus;
    });
    const body = filtered.map(slot => tr([
        `<span class="operations-record-id">#${esc(slot.timeSlotId)}</span>`,
        `<strong>${esc(fmtDate(slot.slotDate))}</strong>`,
        esc(`${fmtTime(slot.startTime)} – ${fmtTime(slot.endTime)}`),
        pill(slot.isAvailable ? "Available" : "Booked"),
        esc(slot.appointmentCount ?? 0)
    ]));
    const count = filtered.length === items.length ? `Showing all ${items.length} time slots` : `Showing ${filtered.length} of ${items.length} time slots`;
    host.innerHTML = `<div class="operations-table-meta"><span>${count}</span><span>Time slots are reserved through appointment bookings.</span></div>${table(["Slot ID", "Date", "Time", "Availability", "Appointments"], body, "No time slots match your search or filter.")}`;
}

function renderExternalDoctorTable(items) {
    const host = document.getElementById("externalDoctorTableHost");
    if (!host) return;
    const query = (document.getElementById("externalDoctorSearch")?.value || "").trim().toLowerCase();
    const status = document.getElementById("externalDoctorStatusFilter")?.value || "all";
    const filtered = items.filter(doctor => {
        const searchable = [doctor.externalDoctorId, doctor.fullName, doctor.specialization, doctor.clinicOrHospital, doctor.contactNumber, doctor.email].some(value => String(value ?? "").toLowerCase().includes(query));
        const matchesStatus = status === "all" || (status === "active" && doctor.isActive) || (status === "inactive" && !doctor.isActive);
        return searchable && matchesStatus;
    });
    const body = filtered.map(doctor => tr([
        `<span class="operations-record-id">#${esc(doctor.externalDoctorId)}</span>`,
        `<strong class="operations-primary-text">${esc(doctor.fullName)}</strong><small class="operations-subtext">${esc(doctor.email || "No email provided")}</small>`,
        esc(doctor.specialization || "Not specified"),
        esc(doctor.clinicOrHospital || "Not specified"),
        pill(doctor.isActive ? "Active" : "Inactive"),
        `<div class="operations-row-actions">${action(doctor.externalDoctorId, "external-edit", "Edit")}${doctor.isActive ? action(doctor.externalDoctorId, "external-deactivate", "Deactivate", "danger") : ""}</div>`
    ]));
    const count = filtered.length === items.length ? `Showing all ${items.length} external doctors` : `Showing ${filtered.length} of ${items.length} external doctors`;
    host.innerHTML = `<div class="operations-table-meta"><span>${count}</span><span>External doctors are referral contacts and do not need system accounts.</span></div>${table(["Contact", "Full name", "Specialization", "Clinic / hospital", "Status", "Actions"], body, "No external doctors match your search or filter.")}`;
}

function renderManualLogTable(items) {
    const host = document.getElementById("manualLogTableHost");
    if (!host) return;
    const query = (document.getElementById("manualLogSearch")?.value || "").trim().toLowerCase();
    const dateFilter = document.getElementById("manualLogDateFilter")?.value || "all";
    const now = new Date();
    const filtered = items.filter(log => {
        const searchable = [log.manualLogId, log.patientName, log.patientId, log.complaint, log.notes, log.nurseName].some(value => String(value ?? "").toLowerCase().includes(query));
        const date = log.visitDate ? new Date(log.visitDate) : null;
        const matchesDate = dateFilter === "all" || (date && !Number.isNaN(date.getTime()) && (dateFilter === "today" ? date.toDateString() === now.toDateString() : date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()));
        return searchable && matchesDate;
    });
    const body = filtered.map(log => tr([
        `<span class="operations-record-id">#${esc(log.manualLogId)}</span>`,
        `<strong class="operations-primary-text">${esc(log.patientName || "Walk-in visitor")}</strong><small class="operations-subtext">${log.patientId ? `Patient #${esc(log.patientId)}` : "Unregistered visitor"}</small>`,
        esc(fmtDateTime(log.visitDate)),
        `<span class="operations-long-text">${esc(log.complaint || "-")}</span>`,
        esc(log.nurseName || "-"),
        `<span class="operations-long-text">${esc(log.notes || "-")}</span>`
    ]));
    const count = filtered.length === items.length ? `Showing all ${items.length} clinic logs` : `Showing ${filtered.length} of ${items.length} clinic logs`;
    host.innerHTML = `<div class="operations-table-meta"><span>${count}</span><span>Walk-in history remains available for clinic reference.</span></div>${table(["Log ID", "Patient / visitor", "Visit date", "Complaint", "Encoded by", "Notes"], body, "No manual clinic logs match your search or date filter.")}`;
}

function updateManualLogPatientName() {
    const patientSelect = document.getElementById("patientId");
    const nameInput = document.getElementById("patientName");
    if (!patientSelect || !nameInput || moduleName !== "operations") return;
    const patient = cache.patients.find(p => Number(p.patientId) === Number(patientSelect.value));
    nameInput.value = patient ? patient.fullName : "";
    nameInput.readOnly = !!patient;
    nameInput.placeholder = patient ? "Loaded from selected patient" : "Required for an unregistered visitor";
}

async function renderOperations() {
    const [slotsResult, external, logsResult] = await Promise.all([api("/ClinicTimeSlots"), loadExternalDoctors(), api("/ManualClinicLogs")]);
    cache.timeSlots = rows(slotsResult);
    cache.manualLogs = rows(logsResult);
    const slots = cache.timeSlots;
    const logs = cache.manualLogs;
    const patients = (await loadPatients()).filter(patient => patient.isActive);
    const activeDoctors = external.filter(doctor => doctor.isActive).length;
    const availableSlots = slots.filter(slot => slot.isAvailable).length;
    const bookedSlots = slots.length - availableSlots;
    const today = new Date();
    const todayLogs = logs.filter(log => log.visitDate && new Date(log.visitDate).toDateString() === today.toDateString()).length;
    const pad = value => String(value).padStart(2, "0");
    const maxDateTime = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(today.getHours())}:${pad(today.getMinutes())}`;
    const summary = `<section class="operations-summary-grid" aria-label="Clinic operations summary">
        <article class="operations-stat-card"><span>Total time slots</span><strong>${slots.length}</strong><small>Clinic schedule entries</small></article>
        <article class="operations-stat-card operations-stat-available"><span>Available slots</span><strong>${availableSlots}</strong><small>Open for appointment booking</small></article>
        <article class="operations-stat-card operations-stat-doctors"><span>Active external doctors</span><strong>${activeDoctors}</strong><small>Referral contacts available</small></article>
        <article class="operations-stat-card operations-stat-logs"><span>Walk-in logs today</span><strong>${todayLogs}</strong><small>${logs.length} total manual clinic logs</small></article>
    </section>`;
    const slotForm = form("slotCreateForm", [
        field("Slot date", "slotDate", "date", { required: true, min: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}` }),
        field("Start time", "startTime", "time", { required: true }),
        field("End time", "endTime", "time", { required: true })
    ], "Create Time Slot");
    const externalForm = form("externalCreateForm", [
        field("Full name", "fullName", "text", { required: true, placeholder: "Enter specialist's full name" }),
        field("Specialization", "specialization", "text", { placeholder: "e.g. Dermatology" }),
        field("Clinic / hospital", "clinicOrHospital", "text", { placeholder: "Clinic or hospital name" }),
        field("Contact number", "contactNumber", "tel", { placeholder: "Contact number" }),
        field("Email address", "email", "email", { placeholder: "name@example.com" }),
        field("Address", "address", "textarea", { full: true, placeholder: "Clinic address" })
    ], "Add External Doctor");
    const patientOptions = `<option value="">Unregistered / walk-in visitor</option>` + patients.map(patient => `<option value="${esc(patient.patientId)}">${esc(patient.fullName)}</option>`).join("");
    const logForm = form("manualLogCreateForm", [
        field("Registered patient (optional)", "patientId", "select", { options: patientOptions, help: "Choose a patient profile when one exists." }),
        field("Walk-in visitor name", "patientName", "text", { placeholder: "Required for an unregistered visitor" }),
        field("Visit date and time", "visitDate", "datetime-local", { required: true, max: maxDateTime, value: maxDateTime, help: "Future visits cannot be recorded as manual clinic logs." }),
        field("Complaint", "complaint", "textarea", { required: true, full: true, placeholder: "Describe the visitor's concern" }),
        field("Notes", "notes", "textarea", { full: true, placeholder: "Additional clinic notes" })
    ], "Save Clinic Log");
    const slotPanel = panel("Clinic Time Slots", `<div class="operations-section-intro"><div><strong>Build the clinic schedule</strong><p>Create appointment slots and monitor which times are still available.</p></div><span class="operations-panel-tag">SCHEDULING</span></div><div class="operations-create-form">${slotForm}</div><div class="operations-toolbar"><label><span>Search time slots</span><input id="timeSlotSearch" type="search" autocomplete="off" placeholder="Search by slot ID, date, or time"></label><label><span>Availability</span><select id="timeSlotStatusFilter"><option value="all">All slots</option><option value="available">Available</option><option value="booked">Booked</option></select></label></div><div id="timeSlotTableHost"></div>`);
    const externalPanel = panel("External Doctor Directory", `<div class="operations-section-intro"><div><strong>Maintain referral contacts</strong><p>Keep specialist contact details available when a patient needs an external referral.</p></div><span class="operations-panel-tag">REFERRAL NETWORK</span></div><div class="operations-create-form">${externalForm}</div><div class="operations-toolbar"><label><span>Search external doctors</span><input id="externalDoctorSearch" type="search" autocomplete="off" placeholder="Search name, specialty, clinic, or contact"></label><label><span>Account status</span><select id="externalDoctorStatusFilter"><option value="all">All contacts</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><div id="externalDoctorTableHost"></div>`);
    const logsPanel = panel("Walk-in & Manual Clinic Logs", `<div class="operations-section-intro"><div><strong>Document clinic visits</strong><p>Record visits that are not represented by an online appointment, including unregistered visitors.</p></div><span class="operations-panel-tag">VISIT DOCUMENTATION</span></div><div class="operations-create-form">${logForm}</div><div class="operations-toolbar"><label><span>Search clinic logs</span><input id="manualLogSearch" type="search" autocomplete="off" placeholder="Search visitor, complaint, nurse, or log ID"></label><label><span>Visit date</span><select id="manualLogDateFilter"><option value="all">All dates</option><option value="today">Today</option><option value="month">This month</option></select></label></div><div id="manualLogTableHost"></div>`);
    moduleContent.innerHTML = summary + `<div class="operations-stack">${slotPanel}${externalPanel}${logsPanel}</div>`;
    updateManualLogPatientName();
    renderTimeSlotTable(slots);
    renderExternalDoctorTable(external);
    renderManualLogTable(logs);
}

async function renderAdmin() {
    const [users, doctors] = await Promise.all([api("/admin/users"), loadDoctors()]);
    const userRows = rows(users).map(u => tr([esc(u.userId), esc(u.fullName), esc(u.email), esc(u.role), pill(u.isActive ? "Active" : "Inactive"), action(u.userId, "user-toggle", u.isActive ? "Deactivate" : "Activate", u.isActive ? "danger" : "neutral")]));
    const doctorRows = doctors.map(d => tr([esc(d.doctorId), esc(d.fullName), esc(d.specialty), action(d.doctorId, "doctor-edit", "Edit")]));
    moduleContent.innerHTML = panel("Create Staff Account", form("staffCreateForm", [field("Full name", "fullName", "text", { required: true }), field("Email", "email", "email", { required: true }), field("Temporary password", "password", "password", { required: true }), field("Role", "role", "select", { required: true, options: "<option value=''>Select role</option><option value='Nurse'>Nurse</option><option value='Doctor'>Doctor</option>" }), field("Specialty (Doctors only)", "specialty")], "Create Account")) + panel("User Accounts", table(["User ID", "Full Name", "Email", "Role", "Status", "Action"], userRows)) + panel("Doctor Profiles", table(["Doctor ID", "Name", "Specialty", "Action"], doctorRows));
}

async function renderDoctors() {
    const doctors = await loadDoctors();
    const body = doctors.map(d => tr([esc(d.doctorId), esc(d.fullName), esc(d.specialty), esc(d.userId), action(d.doctorId, "doctor-edit", "Edit")]));
    moduleContent.innerHTML = panel("Active Doctors", table(["Doctor ID", "Full Name", "Specialty", "User ID", "Action"], body));
}

async function renderModule() {
    if (!moduleInfo[moduleName] || !moduleRoles[moduleName].includes(role)) { location.href = "/dashboard.html"; return; }
    setTitle();
    try {
        const renderers = { profile: renderProfile, patients: renderPatients, consultations: renderConsultations, records: renderRecords, prescriptions: renderPrescriptions, referrals: renderReferrals, reports: renderReports, operations: renderOperations, admin: renderAdmin, doctors: renderDoctors };
        await renderers[moduleName]();
    } catch (error) {
        moduleContent.innerHTML = `<div class="workspace-empty">${esc(error.message)}<br><br>Check that the API is running and your account has access to this module.</div>`;
    }
}

function readForm(formElement) {
    const data = Object.fromEntries(new FormData(formElement).entries());
    for (const key of Object.keys(data)) if (data[key] === "") data[key] = null;
    return data;
}
function num(value) { return value === null ? null : Number(value); }
async function submitForm(event) {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) return;
    const f = target.id;
    if (!["patientCreateForm", "consultationCreateForm", "consultationAssessForm", "consultationCompleteForm", "recordCreateForm", "recordEditForm", "prescriptionCreateForm", "prescriptionEditForm", "referralCreateForm", "referralResponseForm", "patientHistoryForm", "dailyScheduleForm", "slotCreateForm", "externalCreateForm", "manualLogCreateForm", "staffCreateForm"].includes(f)) return;
    event.preventDefault(); clearMessage();
    const v = readForm(target);
    try {
        if (f === "patientCreateForm") {
            await api("/Patients", { method: "POST", body: { fullName: v.fullName } }); message("Patient profile created.");
        }
        if (f === "consultationCreateForm") {
            const body = { patientId: num(v.patientId), appointmentId: num(v.appointmentId), doctorId: num(v.doctorId), complaint: v.complaint, bloodPressure: v.bloodPressure, temperature: num(v.temperature), assessment: v.assessment, assistanceProvided: v.assistanceProvided, notes: v.notes, followUpInstructions: v.followUpInstructions };
            await api("/Consultations", { method: "POST", body }); message("Consultation created.");
        }
        if (f === "consultationAssessForm") {
            await api(`/Consultations/${num(v.consultationId)}/doctor-assessment`, {
                method: "PUT",
                body: { doctorAssessment: v.doctorAssessment }
            });
            message("Doctor assessment submitted successfully.");
        }
        if (f === "consultationCompleteForm") {
            await api(`/Consultations/${num(v.consultationId)}/complete`, {
                method: "PUT",
                body: { notes: v.notes }
            });
            message("Consultation completed successfully.");
        }
        if (f === "recordCreateForm") {
            await api("/MedicalRecords", { method: "POST", body: { patientId: num(v.patientId), consultationId: num(v.consultationId), diagnosis: v.diagnosis, treatment: v.treatment, notes: v.notes } }); message("Medical record saved.");
        }
        if (f === "recordEditForm") {
            await api(`/MedicalRecords/${num(v.recordId)}`, { method: "PUT", body: { diagnosis: v.diagnosis, treatment: v.treatment, notes: v.notes } });
            message("Medical record updated successfully.");
        }
        if (f === "prescriptionCreateForm") {
            const consultation = cache.consultations.find(c => Number(c.consultationId) === Number(v.consultationId));
            if (!consultation) throw new Error("Select a valid consultation.");

            let patientId;
            if (role === "doctor") {
                if (!consultation.doctorReviewedAt || !consultation.doctorId) {
                    throw new Error("You can only prescribe for a consultation assigned to you and already reviewed by you.");
                }
                patientId = consultation.patientId;
            } else {
                patientId = num(v.patientId);
                if (Number(consultation.patientId) !== Number(patientId)) {
                    throw new Error("The selected consultation does not belong to the selected patient.");
                }
                if (consultation.doctorId && !consultation.doctorReviewedAt) {
                    throw new Error("The assigned in-house Doctor must submit an assessment before a Nurse can record a prescription.");
                }
                if (!consultation.doctorId && !v.externalDoctorId) {
                    throw new Error("Select an active External Doctor because no in-house Doctor is assigned to this consultation.");
                }
                if (consultation.doctorId && v.externalDoctorId) {
                    throw new Error("Do not select an External Doctor when an in-house Doctor is already assigned.");
                }
            }

            await api("/Prescriptions", {
                method: "POST",
                body: {
                    patientId: Number(patientId),
                    consultationId: num(v.consultationId),
                    medicineName: v.medicineName,
                    dosage: v.dosage,
                    instructions: v.instructions,
                    externalDoctorId: role === "nurse" ? num(v.externalDoctorId) : null
                }
            });
            message("Prescription created successfully.");
        }
        if (f === "prescriptionEditForm") {
            await api(`/Prescriptions/${num(v.prescriptionId)}`, { method: "PUT", body: { medicineName: v.medicineName, dosage: v.dosage, instructions: v.instructions } });
            message("Prescription updated successfully.");
        }
        if (f === "referralCreateForm") {
            await api("/Referrals", { method: "POST", body: { patientId: num(v.patientId), externalDoctorId: num(v.externalDoctorId), reason: v.reason, notes: v.notes } }); message("Referral created.");
        }
        if (f === "referralResponseForm") {
            await api(`/Referrals/${num(v.referralId)}/response`, { method: "PUT", body: { returnedFindings: v.returnedFindings, diagnosis: v.diagnosis, treatment: v.treatment, returnedPrescription: v.returnedPrescription } });
            message("Referral response saved successfully.");
        }
        if (f === "patientHistoryForm") {
            const resultHost = document.getElementById("patientHistoryResult");
            resultHost.innerHTML = `<div class="report-loading-state">Loading patient history...</div>`;
            const data = unwrap(await api(`/Reports/patient-history/${num(v.reportPatientId)}`));
            resultHost.innerHTML = renderPatientHistory(data);
            return;
        }
        if (f === "dailyScheduleForm") {
            const resultHost = document.getElementById("dailyScheduleResult");
            resultHost.innerHTML = `<div class="report-loading-state">Loading daily schedule...</div>`;
            const data = unwrap(await api(`/Reports/daily-schedule?date=${encodeURIComponent(v.scheduleDate)}`));
            const items = Array.isArray(data?.appointments) ? data.appointments : Array.isArray(data) ? data : [];
            resultHost.innerHTML = renderDailySchedule(data, items, v.scheduleDate);
            return;
        }
        if (f === "slotCreateForm") {
            const toTimeOnlyJson = value => {
                if (!value) return "";
                return value.length === 5 ? `${value}:00` : value;
            };
            const startTime = toTimeOnlyJson(v.startTime);
            const endTime = toTimeOnlyJson(v.endTime);

            if (!v.slotDate || !startTime || !endTime) {
                throw new Error("Enter the slot date, start time, and end time.");
            }
            if (endTime <= startTime) {
                throw new Error("End time must be later than start time.");
            }

            await api("/ClinicTimeSlots", {
                method: "POST",
                body: { slotDate: v.slotDate, startTime, endTime }
            });
            message("Clinic time slot created successfully.");
        }
        if (f === "externalCreateForm") {
            await api("/ExternalDoctors", { method: "POST", body: { fullName: v.fullName, specialization: v.specialization, clinicOrHospital: v.clinicOrHospital, address: v.address, contactNumber: v.contactNumber, email: v.email } }); message("External doctor added.");
        }
        if (f === "manualLogCreateForm") {
            await api("/ManualClinicLogs", { method: "POST", body: { patientId: num(v.patientId), patientName: v.patientName, visitDate: v.visitDate, complaint: v.complaint, notes: v.notes } }); message("Manual clinic log saved.");
        }
        if (f === "staffCreateForm") {
            await api("/admin/users", { method: "POST", body: { fullName: v.fullName, email: v.email, password: v.password, role: v.role, specialty: v.specialty } }); message("Staff account created.");
        }
        const parentDialog = target.closest("dialog");
        if (parentDialog?.open) parentDialog.close();
        target.reset();
        await renderModule();
    } catch (error) { message(error.message, "error"); }
}

async function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const actionName = button.dataset.action;
    if (actionName === "consultation-modal-close") {
        document.getElementById("consultationActionDialog")?.close();
        return;
    }
    if (actionName === "record-modal-close") {
        document.getElementById("recordActionDialog")?.close();
        return;
    }
    if (actionName === "prescription-modal-close") {
        document.getElementById("prescriptionDialog")?.close();
        return;
    }
    if (actionName === "referral-modal-close") {
        document.getElementById("referralDialog")?.close();
        return;
    }
    const id = Number(button.dataset.id);
    clearMessage();
    try {
        if (actionName === "consultation-assess" || actionName === "consultation-complete") {
            const consultation = cache.consultations.find(c => Number(c.consultationId) === id);
            if (!consultation) throw new Error("Consultation details are no longer available. Refresh the page and try again.");
            const dialog = document.getElementById("consultationActionDialog");
            const assessForm = document.getElementById("consultationAssessForm");
            const completeForm = document.getElementById("consultationCompleteForm");
            if (!dialog || !assessForm || !completeForm) return;

            if (actionName === "consultation-assess") {
                assessForm.hidden = false;
                completeForm.hidden = true;
                assessForm.elements.consultationId.value = id;
                document.getElementById("consultationDialogTitle").textContent = `Doctor Assessment · Consultation #${id}`;
                document.getElementById("doctorAssessmentInput").value = consultation.doctorAssessment || "";
                dialog.showModal();
                return;
            }

            assessForm.hidden = true;
            completeForm.hidden = false;
            completeForm.elements.consultationId.value = id;
            document.getElementById("consultationDialogTitle").textContent = `Complete Visit · Consultation #${id}`;
            document.getElementById("consultationCompletionNotes").value = "";
            dialog.showModal();
            return;
        }
        if (actionName === "patient-deactivate") {
            if (!confirm(`Deactivate patient #${id}?`)) return;
            await api(`/Patients/${id}`, { method: "DELETE" }); message("Patient profile deactivated.");
        }
        if (actionName === "patient-activate") {
            const patient = cache.patients.find(p => Number(p.patientId) === id); if (!patient) return;
            if (!confirm(`Reactivate ${patient.fullName}?`)) return;
            await api(`/Patients/${id}`, { method: "PUT", body: { fullName: patient.fullName, isActive: true } });
            message("Patient reactivated successfully.");
        }
        if (actionName === "patient-edit") {
            const patient = cache.patients.find(p => p.patientId === id); if (!patient) return;
            const fullName = prompt("Update patient name:", patient.fullName); if (fullName === null) return;
            await api(`/Patients/${id}`, { method: "PUT", body: { fullName, isActive: patient.isActive } }); message("Patient profile updated.");
        }
        if (actionName === "record-view" || actionName === "record-edit") {
            const record = cache.records.find(item => Number(item.recordId) === id);
            if (!record) throw new Error("Medical record details are no longer available. Refresh the page and try again.");
            const dialog = document.getElementById("recordActionDialog");
            const viewPane = document.getElementById("recordViewPane");
            const editForm = document.getElementById("recordEditForm");
            const viewActions = document.getElementById("recordViewActions");
            if (!dialog || !viewPane || !editForm || !viewActions) return;

            if (actionName === "record-view") {
                editForm.hidden = true;
                viewPane.hidden = false;
                viewActions.hidden = false;
                document.getElementById("recordDialogTitle").textContent = `Medical Record #${id}`;
                const details = [
                    ["Patient", role === "student" ? "My medical history" : record.patientName || `Patient #${record.patientId}`],
                    ["Consultation", record.consultationId ? `#${record.consultationId}` : "Not linked"],
                    ["Appointment", record.appointmentId ? `#${record.appointmentId}` : "Not linked"],
                    ["Doctor", record.doctorName || "Not assigned"],
                    ["Record date", fmtDateTime(record.recordDate)],
                    ["Diagnosis", record.diagnosis || "Not provided"],
                    ["Treatment", record.treatment || "Not provided"],
                    ["Additional notes", record.notes || "No additional notes"]
                ];
                viewPane.innerHTML = `<div class="detail-list record-detail-list">${details.map(item => `<div class="detail-item"><span>${esc(item[0])}</span><strong>${esc(item[1])}</strong></div>`).join("")}</div>`;
                dialog.showModal();
                return;
            }

            viewPane.hidden = true;
            viewActions.hidden = true;
            editForm.hidden = false;
            document.getElementById("recordDialogTitle").textContent = `Edit Medical Record #${id}`;
            editForm.elements.namedItem("recordId").value = id;
            document.getElementById("recordEditDiagnosis").value = record.diagnosis || "";
            document.getElementById("recordEditTreatment").value = record.treatment || "";
            document.getElementById("recordEditNotes").value = record.notes || "";
            dialog.showModal();
            return;
        }
        if (actionName === "record-delete") {
            if (!confirm("Delete this medical record? Use this only to correct an erroneous entry.")) return;
            await api(`/MedicalRecords/${id}`, { method: "DELETE" }); message("Medical record deleted.");
        }
        if (actionName === "prescription-view" || actionName === "prescription-edit") {
            const prescription = cache.prescriptions.find(item => Number(item.prescriptionId) === id);
            if (!prescription) throw new Error("Prescription details are no longer available. Refresh the page and try again.");
            const dialog = document.getElementById("prescriptionDialog");
            const viewPane = document.getElementById("prescriptionViewPane");
            const editForm = document.getElementById("prescriptionEditForm");
            const viewActions = document.getElementById("prescriptionViewActions");
            if (!dialog || !viewPane || !editForm || !viewActions) return;
            if (actionName === "prescription-view") {
                editForm.hidden = true;
                viewPane.hidden = false;
                viewActions.hidden = false;
                document.getElementById("prescriptionDialogTitle").textContent = `Prescription #${id}`;
                const details = [
                    ["Patient", role === "student" ? "My prescription" : prescription.patientName || `Patient #${prescription.patientId}`],
                    ["Consultation", `#${prescription.consultationId}`],
                    ["Medicine", prescription.medicineName],
                    ["Dosage", prescription.dosage],
                    ["Instructions", prescription.instructions],
                    ["Prescribed by", prescription.prescribingDoctorName],
                    ["Prescription date", fmtDateTime(prescription.prescriptionDate)]
                ];
                viewPane.innerHTML = `<div class="detail-list record-detail-list">${details.map(item => `<div class="detail-item"><span>${esc(item[0])}</span><strong>${esc(item[1] || "-")}</strong></div>`).join("")}</div>`;
                dialog.showModal();
                return;
            }
            viewPane.hidden = true;
            viewActions.hidden = true;
            editForm.hidden = false;
            document.getElementById("prescriptionDialogTitle").textContent = `Edit Prescription #${id}`;
            editForm.elements.namedItem("prescriptionId").value = id;
            document.getElementById("prescriptionEditMedicine").value = prescription.medicineName || "";
            document.getElementById("prescriptionEditDosage").value = prescription.dosage || "";
            document.getElementById("prescriptionEditInstructions").value = prescription.instructions || "";
            dialog.showModal();
            return;
        }
        if (actionName === "prescription-delete") {
            if (!confirm("Delete this prescription entry? Use this only to correct an erroneous entry.")) return;
            await api(`/Prescriptions/${id}`, { method: "DELETE" }); message("Prescription deleted.");
        }
        if (actionName === "referral-view" || actionName === "referral-response") {
            const referral = cache.referrals.find(item => Number(item.referralId) === id);
            if (!referral) throw new Error("Referral details are no longer available. Refresh the page and try again.");
            const dialog = document.getElementById("referralDialog");
            const viewPane = document.getElementById("referralViewPane");
            const responseForm = document.getElementById("referralResponseForm");
            const viewActions = document.getElementById("referralViewActions");
            if (!dialog || !viewPane || !responseForm || !viewActions) return;
            if (actionName === "referral-view") {
                responseForm.hidden = true;
                viewPane.hidden = false;
                viewActions.hidden = false;
                document.getElementById("referralDialogTitle").textContent = `Referral #${id}`;
                const details = [
                    ["Patient", role === "student" ? "My referral" : referral.patientName || `Patient #${referral.patientId}`],
                    ["External specialist", referral.externalDoctorName],
                    ["Specialization", referral.externalDoctorSpecialization],
                    ["Reason", referral.reason],
                    ["Notes", referral.notes],
                    ["Status", referral.status],
                    ["Referral date", fmtDateTime(referral.referralDate)],
                    ["Returned findings", referral.returnedFindings],
                    ["Diagnosis", referral.diagnosis],
                    ["Treatment", referral.treatment],
                    ["Returned prescription", referral.returnedPrescription],
                    ["Response date", referral.responseDate ? fmtDateTime(referral.responseDate) : "Awaiting response"]
                ];
                viewPane.innerHTML = `<div class="detail-list record-detail-list">${details.map(item => `<div class="detail-item"><span>${esc(item[0])}</span><strong>${esc(item[1] || "-")}</strong></div>`).join("")}</div>`;
                dialog.showModal();
                return;
            }
            if (String(referral.status || "").toLowerCase() === "completed") {
                message("This referral response has already been recorded.", "error");
                return;
            }
            viewPane.hidden = true;
            viewActions.hidden = true;
            responseForm.hidden = false;
            document.getElementById("referralDialogTitle").textContent = `Record Specialist Response · #${id}`;
            responseForm.elements.namedItem("referralId").value = id;
            document.getElementById("referralReturnedFindings").value = referral.returnedFindings || "";
            document.getElementById("referralDiagnosis").value = referral.diagnosis || "";
            document.getElementById("referralTreatment").value = referral.treatment || "";
            document.getElementById("referralReturnedPrescription").value = referral.returnedPrescription || "";
            dialog.showModal();
            return;
        }
        if (actionName === "external-deactivate") {
            if (!confirm(`Deactivate external doctor #${id}?`)) return;
            await api(`/ExternalDoctors/${id}`, { method: "DELETE" }); message("External doctor deactivated.");
        }
        if (actionName === "external-edit") {
            const current = cache.externalDoctors.find(x => x.externalDoctorId === id); if (!current) return;
            const fullName = prompt("Full name:", current.fullName); if (fullName === null) return;
            const specialization = prompt("Specialization:", current.specialization || ""); if (specialization === null) return;
            const clinicOrHospital = prompt("Clinic / Hospital:", current.clinicOrHospital || ""); if (clinicOrHospital === null) return;
            const address = prompt("Address:", current.address || ""); if (address === null) return;
            const contactNumber = prompt("Contact number:", current.contactNumber || ""); if (contactNumber === null) return;
            const email = prompt("Email:", current.email || ""); if (email === null) return;
            await api(`/ExternalDoctors/${id}`, { method: "PUT", body: { fullName, specialization, clinicOrHospital, address, contactNumber, email } }); message("External doctor updated.");
        }
        if (actionName === "user-toggle") {
            const users = rows(await api("/admin/users")); const u = users.find(x => x.userId === id); if (!u) return;
            const next = !u.isActive; if (!confirm(`${next ? "Activate" : "Deactivate"} ${u.fullName}?`)) return;
            await api(`/admin/users/${id}/status?isActive=${next}`, { method: "PUT" }); message(`User account ${next ? "activated" : "deactivated"}.`);
        }
        if (actionName === "doctor-edit") {
            const d = cache.doctors.find(x => x.doctorId === id); if (!d) return;
            const fullName = prompt("Doctor full name:", d.fullName); if (fullName === null) return;
            const specialty = prompt("Doctor specialty:", d.specialty); if (specialty === null) return;
            await api(`/Doctors/${id}`, { method: "PUT", body: { fullName, specialty } }); message("Doctor profile updated.");
        }
        await renderModule();
    } catch (error) { message(error.message, "error"); }
}

document.getElementById("moduleContent").addEventListener("submit", submitForm);
document.getElementById("moduleContent").addEventListener("click", handleAction);
document.getElementById("moduleContent").addEventListener("input", event => {
    if (event.target.id === "consultationSearch" && moduleName === "consultations") {
        renderConsultationTable(cache.consultations);
        const search = document.getElementById("consultationSearch");
        if (search) {
            search.focus();
            search.setSelectionRange(search.value.length, search.value.length);
        }
    }
    if (event.target.id === "patientSearch" && moduleName === "patients") {
        renderPatientTable(cache.patients);
        const search = document.getElementById("patientSearch");
        if (search) {
            search.focus();
            search.setSelectionRange(search.value.length, search.value.length);
        }
    }
    if (event.target.id === "recordSearch" && moduleName === "records") {
        renderMedicalRecordTable(cache.records);
        const search = document.getElementById("recordSearch");
        if (search) {
            search.focus();
            search.setSelectionRange(search.value.length, search.value.length);
        }
    }
    if (event.target.id === "prescriptionSearch" && moduleName === "prescriptions") {
        renderPrescriptionTable(cache.prescriptions);
        const search = document.getElementById("prescriptionSearch");
        if (search) {
            search.focus();
            search.setSelectionRange(search.value.length, search.value.length);
        }
    }
    if (event.target.id === "referralSearch" && moduleName === "referrals") {
        renderReferralTable(cache.referrals);
        const search = document.getElementById("referralSearch");
        if (search) {
            search.focus();
            search.setSelectionRange(search.value.length, search.value.length);
        }
    }
    if (event.target.id === "timeSlotSearch" && moduleName === "operations") renderTimeSlotTable(cache.timeSlots);
    if (event.target.id === "externalDoctorSearch" && moduleName === "operations") renderExternalDoctorTable(cache.externalDoctors);
    if (event.target.id === "manualLogSearch" && moduleName === "operations") renderManualLogTable(cache.manualLogs);
});
document.getElementById("moduleContent").addEventListener("change", event => {
    if (event.target.id === "consultationStatusFilter" && moduleName === "consultations") {
        renderConsultationTable(cache.consultations);
    }
    if (event.target.id === "patientStatusFilter" && moduleName === "patients") {
        renderPatientTable(cache.patients);
    }
    if (event.target.id === "recordDateFilter" && moduleName === "records") {
        renderMedicalRecordTable(cache.records);
    }
    if (event.target.id === "prescriptionDateFilter" && moduleName === "prescriptions") {
        renderPrescriptionTable(cache.prescriptions);
    }
    if (event.target.id === "referralStatusFilter" && moduleName === "referrals") {
        renderReferralTable(cache.referrals);
    }
    if (event.target.id === "timeSlotStatusFilter" && moduleName === "operations") renderTimeSlotTable(cache.timeSlots);
    if (event.target.id === "externalDoctorStatusFilter" && moduleName === "operations") renderExternalDoctorTable(cache.externalDoctors);
    if (event.target.id === "manualLogDateFilter" && moduleName === "operations") renderManualLogTable(cache.manualLogs);
    if (event.target.id === "consultationId" && moduleName === "records" && role === "nurse") {
        const option = event.target.selectedOptions[0];
        const patientSelect = document.getElementById("patientId");
        if (option?.dataset.patientId && patientSelect) patientSelect.value = option.dataset.patientId;
    }
    if (event.target.id === "patientId" && moduleName === "records" && role === "nurse") {
        const consultationSelect = document.getElementById("consultationId");
        if (consultationSelect) consultationSelect.value = "";
    }
    if (event.target.id === "appointmentId") {
        const option = event.target.selectedOptions[0];
        const patientSelect = document.getElementById("patientId");
        const doctorSelect = document.getElementById("doctorId");
        if (option && option.value && patientSelect) {
            patientSelect.value = option.dataset.patient || "";
            if (doctorSelect) doctorSelect.value = option.dataset.doctor || "";
        }
    }
    if (event.target.id === "patientId" && moduleName === "operations") updateManualLogPatientName();
    if (event.target.id === "consultationId" && moduleName === "prescriptions" && role === "nurse") {
        const option = event.target.selectedOptions[0];
        const patientSelect = document.getElementById("patientId");
        const externalDoctorSelect = document.getElementById("externalDoctorId");
        if (option && option.value && patientSelect && option.dataset.patient) {
            patientSelect.value = option.dataset.patient;
        }
        if (externalDoctorSelect) {
            const hasInHouseDoctor = !!(option && option.value && option.dataset.doctor);
            externalDoctorSelect.disabled = hasInHouseDoctor || !option || !option.value;
            externalDoctorSelect.required = !!(option && option.value && !hasInHouseDoctor);
            if (hasInHouseDoctor || !option || !option.value) externalDoctorSelect.value = "";
        }
    }
});
renderModule(); 