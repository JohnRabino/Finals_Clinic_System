const role = AngelicareApp.getRole();
const moduleName = new URLSearchParams(location.search).get("module") || "profile";
const moduleContent = document.getElementById("moduleContent");
const feedback = document.getElementById("workspaceFeedback");
const cache = { patients: [], doctors: [], externalDoctors: [], consultations: [] };

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
function message(text, type = "success") {
    feedback.textContent = text;
    feedback.className = `feedback ${type}`;
    feedback.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function clearMessage() { feedback.textContent = ""; feedback.className = "feedback"; }
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
    if (type === "textarea") return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><textarea id="${esc(name)}" name="${esc(name)}" ${required} placeholder="${esc(opts.placeholder || "")}">${esc(opts.value || "")}</textarea></div>`;
    if (type === "select") return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><select id="${esc(name)}" name="${esc(name)}" ${required}>${opts.options || ""}</select></div>`;
    return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><input id="${esc(name)}" name="${esc(name)}" type="${esc(type)}" ${value} ${required} ${opts.min !== undefined ? `min="${esc(opts.min)}"` : ""} ${opts.step !== undefined ? `step="${esc(opts.step)}"` : ""} placeholder="${esc(opts.placeholder || "")}"></div>`;
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

async function renderPatients() {
    const items = await loadPatients();
    const tableRows = items.map(p => tr([esc(p.patientId), esc(p.fullName), esc(p.userId ?? "Walk-in / manual"), pill(p.isActive ? "Active" : "Inactive"), p.isActive ? action(p.patientId, "patient-deactivate", "Deactivate", "danger") : "-", action(p.patientId, "patient-edit", "Edit")]));
    moduleContent.innerHTML = panel("Add Patient", form("patientCreateForm", [field("Full name", "fullName", "text", { required: true, full: true })], "Add Patient")) + panel("Patient List", table(["Patient ID", "Full Name", "Linked User", "Status", "Action", "Edit"], tableRows));
}

async function renderConsultations() {
    const items = await loadConsultations();
    let nurseOptions = "";
    if (role === "nurse") {
        const patients = await loadPatients();
        const doctors = await loadDoctors();
        const patientOptions = selectOptions(patients.filter(p => p.isActive), "patientId", "fullName", "Select patient");
        const doctorOptions = `<option value="">No doctor assigned</option>` + doctors.map(d => `<option value="${esc(d.doctorId)}">${esc(d.fullName)} — ${esc(d.specialty)}</option>`).join("");
        nurseOptions = panel("Create Consultation / Walk-in", form("consultationCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: patientOptions }),
            field("Confirmed appointment ID (optional)", "appointmentId", "number", { min: 1, placeholder: "Leave blank for walk-in" }),
            field("Assign doctor (optional)", "doctorId", "select", { options: doctorOptions }),
            field("Complaint", "complaint", "textarea", { required: true, full: true }),
            field("Blood pressure", "bloodPressure", "text", { placeholder: "e.g. 120/80" }),
            field("Temperature (°C)", "temperature", "number", { step: "0.1", min: 0 }),
            field("Initial assessment", "assessment", "textarea"),
            field("Assistance provided", "assistanceProvided", "textarea"),
            field("Notes", "notes", "textarea"),
            field("Follow-up instructions", "followUpInstructions", "textarea", { full: true })
        ], "Create Consultation"));
    }
    const tableRows = items.map(c => {
        const actions = role === "doctor"
            ? (c.doctorAssessment ? "Assessment submitted" : action(c.consultationId, "consultation-assess", "Submit Assessment"))
            : role === "nurse" ? action(c.consultationId, "consultation-complete", "Complete", "neutral") : "-";
        return tr([esc(c.consultationId), esc(c.patientName || `Patient #${c.patientId}`), esc(fmtDate(c.consultationDate)), esc(c.complaint), esc(c.doctorName || "Unassigned"), esc(c.doctorAssessment ? "Reviewed" : "Pending"), actions]);
    });
    moduleContent.innerHTML = nurseOptions + panel("Consultation List", table(["ID", "Patient", "Date", "Complaint", "Doctor", "Doctor Review", "Action"], tableRows));
}

async function renderRecords() {
    const items = rows(await api(role === "student" ? "/MedicalRecords/my" : "/MedicalRecords"));
    let createPanel = "";
    if (role === "nurse") {
        const patients = await loadPatients();
        const consultations = await loadConsultations();
        createPanel = panel("Add Medical Record", form("recordCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }),
            field("Consultation", "consultationId", "select", { required: true, options: selectOptions(consultations, "consultationId", "complaint", "Select consultation") }),
            field("Diagnosis", "diagnosis", "textarea", { required: true, full: true }),
            field("Treatment", "treatment", "textarea", { required: true, full: true }),
            field("Notes", "notes", "textarea", { full: true })
        ], "Save Medical Record"));
    }
    const body = items.map(r => tr([esc(r.recordId), esc(role === "student" ? "My Record" : r.patientName || `Patient #${r.patientId}`), esc(r.consultationId), esc(r.diagnosis), esc(r.treatment), esc(fmtDate(r.recordDate)), role === "nurse" ? `${action(r.recordId, "record-edit", "Edit")}${action(r.recordId, "record-delete", "Delete", "danger")}` : "-"]));
    moduleContent.innerHTML = createPanel + panel("Medical Record History", table(["Record ID", "Patient", "Consultation", "Diagnosis", "Treatment", "Record Date", "Actions"], body));
}

async function renderPrescriptions() {
    const items = rows(await api(role === "student" ? "/Prescriptions/my" : "/Prescriptions"));
    let createPanel = "";
    if (role === "nurse" || role === "doctor") {
        const patients = role === "nurse" ? await loadPatients() : [];
        const consultations = await loadConsultations();
        const external = role === "nurse" ? await loadExternalDoctors() : [];
        createPanel = panel("Create Prescription", form("prescriptionCreateForm", [
            ...(role === "nurse" ? [field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") })] : [field("Patient ID", "patientId", "number", { required: true, min: 1 })]),
            field("Consultation", "consultationId", "select", { required: true, options: selectOptions(consultations, "consultationId", "complaint", "Select consultation") }),
            field("Medicine name", "medicineName", "text", { required: true }),
            field("Dosage", "dosage", "text", { required: true }),
            field("Instructions", "instructions", "textarea", { required: true, full: true }),
            ...(role === "nurse" ? [field("External doctor (optional)", "externalDoctorId", "select", { options: `<option value="">None</option>` + external.filter(x => x.isActive).map(x => `<option value="${esc(x.externalDoctorId)}">${esc(x.fullName)}</option>`).join("") })] : [])
        ], "Save Prescription"));
    }
    const body = items.map(p => tr([esc(p.prescriptionId), esc(p.patientName || "My Prescription"), esc(p.consultationId), esc(p.medicineName), esc(p.dosage), esc(p.instructions), esc(p.prescribingDoctorName), esc(fmtDate(p.prescriptionDate)), role === "nurse" ? `${action(p.prescriptionId, "prescription-edit", "Edit")}${action(p.prescriptionId, "prescription-delete", "Delete", "danger")}` : "-"]));
    moduleContent.innerHTML = createPanel + panel("Prescription List", table(["ID", "Patient", "Consultation", "Medicine", "Dosage", "Instructions", "Prescribed By", "Date", "Actions"], body));
}

async function renderReferrals() {
    const items = rows(await api(role === "student" ? "/Referrals/my" : "/Referrals"));
    let createPanel = "";
    if (role === "nurse") {
        const patients = await loadPatients();
        const external = await loadExternalDoctors();
        const activeExternal = external.filter(x => x.isActive);
        createPanel = panel("Create Referral", form("referralCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients.filter(p => p.isActive), "patientId", "fullName", "Select patient") }),
            field("External specialist", "externalDoctorId", "select", { required: true, options: selectOptions(activeExternal, "externalDoctorId", "fullName", "Select specialist") }),
            field("Reason", "reason", "textarea", { required: true, full: true }),
            field("Notes", "notes", "textarea", { full: true })
        ], "Create Referral"));
    }
    const body = items.map(r => tr([esc(r.referralId || "-"), esc(r.patientName || "My Referral"), esc(r.externalDoctorName), esc(r.externalDoctorSpecialization), esc(r.reason), pill(r.status), esc(r.returnedFindings || "Pending response"), esc(fmtDate(r.referralDate)), role === "nurse" && r.status !== "Completed" ? action(r.referralId, "referral-response", "Record Response") : "-"]));
    moduleContent.innerHTML = createPanel + panel("Referral List", table(["ID", "Patient", "Specialist", "Specialty", "Reason", "Status", "Findings", "Date", "Action"], body));
}

async function renderReports() {
    const patients = role === "nurse" ? await loadPatients() : [];
    const patientSelect = role === "nurse" ? field("Patient", "reportPatientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }) : field("Patient ID", "reportPatientId", "number", { required: true, min: 1 });
    moduleContent.innerHTML = panel("Patient History", `<form id="patientHistoryForm" class="workspace-form">${patientSelect}<div class="field"><label>&nbsp;</label><button type="submit">View Patient History</button></div></form><div id="patientHistoryResult"></div>`) + panel("Daily Schedule", `<form id="dailyScheduleForm" class="workspace-form">${field("Schedule date", "scheduleDate", "date", { required: true, value: new Date().toISOString().slice(0, 10) })}<div class="field"><label>&nbsp;</label><button type="submit">View Daily Schedule</button></div></form><div id="dailyScheduleResult"></div>`);
}

async function renderOperations() {
    const [slots, external, logs] = await Promise.all([api("/ClinicTimeSlots"), loadExternalDoctors(), api("/ManualClinicLogs")]);
    const slotRows = rows(slots).map(s => tr([esc(s.timeSlotId), esc(fmtDate(s.slotDate)), esc(`${fmtTime(s.startTime)} - ${fmtTime(s.endTime)}`), pill(s.isAvailable ? "Available" : "Booked"), esc(s.appointmentCount)]));
    const externalRows = external.map(d => tr([esc(d.externalDoctorId), esc(d.fullName), esc(d.specialization), esc(d.clinicOrHospital), pill(d.isActive ? "Active" : "Inactive"), action(d.externalDoctorId, "external-edit", "Edit"), d.isActive ? action(d.externalDoctorId, "external-deactivate", "Deactivate", "danger") : "-"]));
    const patients = await loadPatients();
    const logRows = rows(logs).map(l => tr([esc(l.manualLogId), esc(l.patientName), esc(fmtDateTime(l.visitDate)), esc(l.complaint), esc(l.nurseName)]));
    const slotForm = form("slotCreateForm", [field("Date", "slotDate", "date", { required: true }), field("Start time", "startTime", "time", { required: true }), field("End time", "endTime", "time", { required: true })], "Add Time Slot");
    const externalForm = form("externalCreateForm", [field("Full name", "fullName", "text", { required: true }), field("Specialization", "specialization"), field("Clinic / Hospital", "clinicOrHospital"), field("Contact number", "contactNumber"), field("Email", "email", "email"), field("Address", "address", "textarea", { full: true })], "Add External Doctor");
    const logForm = form("manualLogCreateForm", [field("Patient (optional)", "patientId", "select", { options: `<option value="">Unregistered / walk-in visitor</option>` + patients.filter(p => p.isActive).map(p => `<option value="${esc(p.patientId)}">${esc(p.fullName)}</option>`).join("") }), field("Patient name", "patientName", "text", { required: true }), field("Visit date and time", "visitDate", "datetime-local", { required: true }), field("Complaint", "complaint", "textarea", { required: true, full: true }), field("Notes", "notes", "textarea", { full: true })], "Save Clinic Log");
    moduleContent.innerHTML = panel("Create Clinic Time Slot", slotForm) + panel("Clinic Time Slots", table(["ID", "Date", "Time", "Status", "Appointments"], slotRows)) + panel("Add External Doctor", externalForm) + panel("External Doctor Directory", table(["ID", "Name", "Specialty", "Clinic", "Status", "Edit", "Action"], externalRows)) + panel("Record Walk-in / Manual Visit", logForm) + panel("Manual Clinic Logs", table(["Log ID", "Patient", "Visit Date", "Complaint", "Encoded By"], logRows));
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
    if (!["patientCreateForm", "consultationCreateForm", "recordCreateForm", "prescriptionCreateForm", "referralCreateForm", "patientHistoryForm", "dailyScheduleForm", "slotCreateForm", "externalCreateForm", "manualLogCreateForm", "staffCreateForm"].includes(f)) return;
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
        if (f === "recordCreateForm") {
            await api("/MedicalRecords", { method: "POST", body: { patientId: num(v.patientId), consultationId: num(v.consultationId), diagnosis: v.diagnosis, treatment: v.treatment, notes: v.notes } }); message("Medical record saved.");
        }
        if (f === "prescriptionCreateForm") {
            await api("/Prescriptions", { method: "POST", body: { patientId: num(v.patientId), consultationId: num(v.consultationId), medicineName: v.medicineName, dosage: v.dosage, instructions: v.instructions, externalDoctorId: num(v.externalDoctorId) } }); message("Prescription saved.");
        }
        if (f === "referralCreateForm") {
            await api("/Referrals", { method: "POST", body: { patientId: num(v.patientId), externalDoctorId: num(v.externalDoctorId), reason: v.reason, notes: v.notes } }); message("Referral created.");
        }
        if (f === "patientHistoryForm") {
            const data = unwrap(await api(`/Reports/patient-history/${num(v.reportPatientId)}`));
            document.getElementById("patientHistoryResult").innerHTML = `<div class="report-pre">${esc(JSON.stringify(data, null, 2))}</div>`;
            return;
        }
        if (f === "dailyScheduleForm") {
            const data = unwrap(await api(`/Reports/daily-schedule?date=${encodeURIComponent(v.scheduleDate)}`));
            const items = Array.isArray(data?.appointments) ? data.appointments : Array.isArray(data) ? data : [];
            document.getElementById("dailyScheduleResult").innerHTML = table(["Appointment", "Patient", "Doctor", "Time", "Status", "Reason"], items.map(a => tr([esc(a.appointmentId), esc(a.patientName), esc(a.doctorName || "Unassigned"), esc(`${fmtTime(a.startTime)} - ${fmtTime(a.endTime)}`), pill(a.status), esc(a.reason)])), "No appointments for this date.");
            return;
        }
        if (f === "slotCreateForm") {
            await api("/ClinicTimeSlots", { method: "POST", body: { slotDate: v.slotDate, startTime: v.startTime, endTime: v.endTime } }); message("Clinic time slot added.");
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
        target.reset();
        await renderModule();
    } catch (error) { message(error.message, "error"); }
}

async function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id), actionName = button.dataset.action;
    clearMessage();
    try {
        if (actionName === "patient-deactivate") {
            if (!confirm(`Deactivate patient #${id}?`)) return;
            await api(`/Patients/${id}`, { method: "DELETE" }); message("Patient profile deactivated.");
        }
        if (actionName === "patient-edit") {
            const patient = cache.patients.find(p => p.patientId === id); if (!patient) return;
            const fullName = prompt("Update patient name:", patient.fullName); if (fullName === null) return;
            await api(`/Patients/${id}`, { method: "PUT", body: { fullName, isActive: patient.isActive } }); message("Patient profile updated.");
        }
        if (actionName === "consultation-assess") {
            const assessment = prompt("Enter your doctor assessment:"); if (!assessment || !assessment.trim()) return;
            await api(`/Consultations/${id}/doctor-assessment`, { method: "PUT", body: { doctorAssessment: assessment.trim() } }); message("Doctor assessment submitted.");
        }
        if (actionName === "consultation-complete") {
            const notes = prompt("Enter completion notes (optional):", ""); if (notes === null) return;
            await api(`/Consultations/${id}/complete`, { method: "PUT", body: { notes } }); message("Consultation completed.");
        }
        if (actionName === "record-edit") {
            const diagnosis = prompt("Update diagnosis:"); if (diagnosis === null) return;
            const treatment = prompt("Update treatment:"); if (treatment === null) return;
            const notes = prompt("Update notes (optional):", ""); if (notes === null) return;
            await api(`/MedicalRecords/${id}`, { method: "PUT", body: { diagnosis, treatment, notes } }); message("Medical record updated.");
        }
        if (actionName === "record-delete") {
            if (!confirm("Delete this medical record? Use this only to correct an erroneous entry.")) return;
            await api(`/MedicalRecords/${id}`, { method: "DELETE" }); message("Medical record deleted.");
        }
        if (actionName === "prescription-edit") {
            const items = rows(await api("/Prescriptions")); const p = items.find(x => x.prescriptionId === id); if (!p) return;
            const medicineName = prompt("Medicine name:", p.medicineName); if (medicineName === null) return;
            const dosage = prompt("Dosage:", p.dosage); if (dosage === null) return;
            const instructions = prompt("Instructions:", p.instructions); if (instructions === null) return;
            await api(`/Prescriptions/${id}`, { method: "PUT", body: { medicineName, dosage, instructions } }); message("Prescription updated.");
        }
        if (actionName === "prescription-delete") {
            if (!confirm("Delete this prescription entry? Use only to correct an erroneous entry.")) return;
            await api(`/Prescriptions/${id}`, { method: "DELETE" }); message("Prescription deleted.");
        }
        if (actionName === "referral-response") {
            const returnedFindings = prompt("Returned findings:"); if (!returnedFindings) return;
            const diagnosis = prompt("External specialist diagnosis:"); if (!diagnosis) return;
            const treatment = prompt("Recommended treatment:"); if (!treatment) return;
            const returnedPrescription = prompt("Returned prescription (optional):", ""); if (returnedPrescription === null) return;
            await api(`/Referrals/${id}/response`, { method: "PUT", body: { returnedFindings, diagnosis, treatment, returnedPrescription } }); message("Referral response saved.");
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
renderModule();
