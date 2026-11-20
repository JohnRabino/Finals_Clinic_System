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

async function renderPatients() {
    const items = await loadPatients();
    const tableRows = items.map(p => tr([esc(p.patientId), esc(p.fullName), esc(p.userId ?? "Walk-in / manual"), pill(p.isActive ? "Active" : "Inactive"), p.isActive ? action(p.patientId, "patient-deactivate", "Deactivate", "danger") : action(p.patientId, "patient-activate", "Reactivate", "neutral"), action(p.patientId, "patient-edit", "Edit")]));
    moduleContent.innerHTML = panel("Add Patient", form("patientCreateForm", [field("Full name", "fullName", "text", { required: true, full: true })], "Add Patient")) + panel("Patient List", table(["Patient ID", "Full Name", "Linked User", "Status", "Action", "Edit"], tableRows));
}

async function renderConsultations() {
    const items = await loadConsultations();
    let nursePanel = "";
    if (role === "nurse") {
        const patients = (await loadPatients()).filter(p => p.isActive);
        const doctors = (await loadDoctors()).filter(d => d.isActive !== false);
        const appointments = rows(await api("/Appointments")).filter(a => a.status === "Confirmed");
        const appointmentOptions = `<option value="">Walk-in / no appointment</option>` + appointments.map(a => `<option value="${esc(a.appointmentId)}" data-patient="${esc(a.patientId)}" data-doctor="${esc(a.doctorId || "")}">#${esc(a.appointmentId)} — ${esc(a.patientName)} — ${esc(fmtDate(a.slotDate))} ${esc(fmtTime(a.startTime))}</option>`).join("");
        const patientOptions = selectOptions(patients, "patientId", "fullName", "Select patient");
        const doctorOptions = `<option value="">No doctor assigned</option>` + doctors.map(d => `<option value="${esc(d.doctorId)}">${esc(d.fullName)} — ${esc(d.specialty)}</option>`).join("");
        nursePanel = panel("Create Consultation", form("consultationCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: patientOptions }),
            field("Confirmed appointment (optional)", "appointmentId", "select", { options: appointmentOptions, help: "Choose a confirmed booking. The patient and assigned doctor will be filled automatically." }),
            field("Assign doctor (optional)", "doctorId", "select", { options: doctorOptions }),
            field("Complaint", "complaint", "textarea", { required: true, full: true }),
            field("Blood pressure", "bloodPressure", "text", { placeholder: "e.g. 120/80" }),
            field("Temperature (°C)", "temperature", "number", { step: "0.1", min: 25, max: 50 }),
            field("Initial assessment", "assessment", "textarea"),
            field("Assistance provided", "assistanceProvided", "textarea"),
            field("Notes", "notes", "textarea"),
            field("Follow-up instructions", "followUpInstructions", "textarea", { full: true })
        ], "Create Consultation"));
    }
    const body = items.map(c => {
        const reviewed = !!c.doctorReviewedAt;
        const hasDoctor = !!c.doctorId;
        const actionCell = role === "doctor"
            ? (reviewed ? pill("Reviewed") : action(c.consultationId, "consultation-assess", "Submit Assessment"))
            : role === "nurse"
                ? (c.timeOut ? pill("Completed") : action(c.consultationId, "consultation-complete", "Complete", "neutral"))
                : "-";
        const doctorReviewCell = !hasDoctor
            ? `<strong>Not Required</strong><div class="assessment-text">No in-house Doctor assigned</div>`
            : reviewed
                ? `<strong>Reviewed</strong><div class="assessment-text">${esc(c.doctorAssessment || "Assessment saved")}</div>`
                : pill("Pending");
        return tr([esc(c.consultationId), esc(c.patientName || `Patient #${c.patientId}`), esc(fmtDate(c.consultationDate)), esc(c.complaint), esc(c.doctorName || "Unassigned"), doctorReviewCell, actionCell]);
    });
    moduleContent.innerHTML = nursePanel + panel("Consultation List", table(["ID", "Patient", "Date", "Complaint", "Doctor", "Doctor Assessment", "Action"], body, "No consultations found."));
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
    const body = items.map(r => tr([esc(r.recordId), esc(role === "student" ? "My Record" : r.patientName || `Patient #${r.patientId}`), esc(r.consultationId), esc(r.diagnosis), esc(r.treatment), esc(fmtDate(r.recordDate)), role === "nurse" ? `${action(r.recordId, "record-edit", "Edit")}${action(r.recordId, "record-delete", "Delete", "danger")}` : ""]));
    const headers = ["Record ID", "Patient", "Consultation", "Diagnosis", "Treatment", "Record Date"];
    if (role === "nurse") headers.push("Actions");
    moduleContent.innerHTML = createPanel + panel("Medical Record History", table(headers, body));
}

async function renderPrescriptions() {
    const listPath = role === "student"
        ? "/Prescriptions/my"
        : role === "doctor"
            ? "/Prescriptions/assigned"
            : "/Prescriptions";

    const items = rows(await api(listPath));
    let createPanel = "";

    if (role === "nurse" || role === "doctor") {
        const consultations = await loadConsultations();
        const fields = [];

        if (role === "nurse") {
            const patients = (await loadPatients()).filter(p => p.isActive);
            const external = (await loadExternalDoctors()).filter(d => d.isActive);

            fields.push(field("Patient", "patientId", "select", {
                required: true,
                options: selectOptions(patients, "patientId", "fullName", "Select patient")
            }));

            const eligibleConsultations = consultations.filter(c => !c.doctorId || !!c.doctorReviewedAt);
            const consultationOptions = `<option value="">Select consultation</option>` + eligibleConsultations.map(c => {
                const doctorStatus = c.doctorId ? "In-house Doctor reviewed" : "No in-house Doctor — external Doctor required";
                const label = `${c.patientName || `Patient #${c.patientId}`} — ${fmtDate(c.consultationDate)} — ${c.complaint || "Clinic visit"} — ${doctorStatus}`;
                return `<option value="${esc(c.consultationId)}" data-patient="${esc(c.patientId)}" data-doctor="${esc(c.doctorId || "")}">${esc(label)}</option>`;
            }).join("");

            fields.push(field("Consultation", "consultationId", "select", {
                required: true,
                options: consultationOptions,
                help: "In-house Doctor consultations must be reviewed first. If no in-house Doctor is assigned, choose an active External Doctor below."
            }));

            fields.push(field("External Doctor (required only when no in-house Doctor is assigned)", "externalDoctorId", "select", {
                options: `<option value="">Select external Doctor when needed</option>` + external.map(d =>
                    `<option value="${esc(d.externalDoctorId)}">${esc(d.fullName)}${d.specialization ? ` — ${esc(d.specialization)}` : ""}</option>`
                ).join(""),
                help: "External Doctors do not log in. The Nurse records the prescription details given by the External Doctor."
            }));
        } else {
            const reviewed = consultations.filter(c => !!c.doctorReviewedAt && !!c.doctorId);
            const consultationOptions = `<option value="">Select your reviewed consultation</option>` + reviewed.map(c => {
                const label = `${c.patientName || `Patient #${c.patientId}`} — ${fmtDate(c.consultationDate)} — ${c.complaint || "Clinic visit"}`;
                return `<option value="${esc(c.consultationId)}" data-patient="${esc(c.patientId)}">${esc(label)}</option>`;
            }).join("");

            fields.push(field("Reviewed consultation", "consultationId", "select", {
                required: true,
                options: consultationOptions,
                help: reviewed.length
                    ? "Only consultations assigned to you and already reviewed are available. The patient is selected automatically."
                    : "You do not have a reviewed assigned consultation yet. Ask the Nurse to assign a consultation and submit your assessment first."
            }));
        }

        fields.push(field("Medicine name", "medicineName", "text", { required: true, placeholder: "Enter medicine name" }));
        fields.push(field("Dosage", "dosage", "text", { required: true, placeholder: "Enter dosage" }));
        fields.push(field("Instructions", "instructions", "textarea", { required: true, full: true, placeholder: "Enter instructions" }));

        createPanel = panel("Create Prescription", form("prescriptionCreateForm", fields, "Save Prescription"));
    }

    const body = items.map(p => tr([
        esc(p.prescriptionId),
        esc(p.patientName || "My Prescription"),
        esc(p.consultationId),
        esc(p.medicineName),
        esc(p.dosage),
        esc(p.instructions),
        esc(p.prescribingDoctorName),
        esc(fmtDate(p.prescriptionDate)),
        role === "nurse"
            ? `${action(p.prescriptionId, "prescription-edit", "Edit")}${action(p.prescriptionId, "prescription-delete", "Delete", "danger")}`
            : "-"
    ]));

    const headers = ["ID", "Patient", "Consultation", "Medicine", "Dosage", "Instructions", "Prescribed By", "Date"];
    if (role === "nurse") headers.push("Actions");

    moduleContent.innerHTML = createPanel + panel("Prescription List", table(
        headers,
        body,
        role === "doctor"
            ? "No prescriptions have been recorded for your assigned consultations yet."
            : "No prescriptions found."
    ));
}

async function renderReferrals() {
    const items = rows(await api(role === "student" ? "/Referrals/my" : "/Referrals"));
    let createPanel = "";
    if (role === "nurse") {
        const patients = (await loadPatients()).filter(p => p.isActive);
        const external = (await loadExternalDoctors()).filter(d => d.isActive);
        createPanel = panel("Create Referral", form("referralCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }),
            field("External specialist", "externalDoctorId", "select", { required: true, options: selectOptions(external, "externalDoctorId", "fullName", "Select specialist") }),
            field("Reason", "reason", "textarea", { required: true, full: true }), field("Notes", "notes", "textarea", { full: true })
        ], "Create Referral"));
    }
    const body = items.map(r => tr([esc(r.referralId || "-"), esc(r.patientName || "My Referral"), esc(r.externalDoctorName), esc(r.reason), pill(r.status), esc(r.returnedFindings || "Pending"), esc(r.diagnosis || "-"), esc(r.treatment || "-"), esc(r.returnedPrescription || "-"), role === "nurse" && r.status !== "Completed" ? action(r.referralId, "referral-response", "Record Response") : pill(r.status === "Completed" ? "Response saved" : "-")]));
    moduleContent.innerHTML = createPanel + panel("Referral List", table(["ID", "Patient", "Specialist", "Reason", "Status", "Returned Findings", "Diagnosis", "Treatment", "Returned Prescription", "Action"], body));
}

function renderPatientHistory(data) {
    const summary = `<div class="detail-list"><div class="detail-item"><span>Patient ID</span><strong>${esc(data.patientId)}</strong></div><div class="detail-item"><span>Full Name</span><strong>${esc(data.fullName)}</strong></div><div class="detail-item"><span>Status</span><strong>${data.isActive ? "Active" : "Inactive"}</strong></div></div>`;
    const section = (title, headers, items, map) => `<div class="history-section"><h3>${title}</h3>${table(headers, (items || []).map(map), `No ${title.toLowerCase()} found.`)}`;
    return summary + section("Consultations", ["Date", "Complaint", "Doctor", "Nurse Assessment", "Doctor Assessment", "Time Out"], data.consultations, x => tr([esc(fmtDateTime(x.consultationDate)), esc(x.complaint), esc(x.doctorName), esc(x.assessment), esc(x.doctorAssessment), esc(x.timeOut ? fmtTime(x.timeOut) : "Not completed")])) + section("Medical Records", ["Date", "Diagnosis", "Treatment", "Notes"], data.medicalRecords, x => tr([esc(fmtDate(x.recordDate)), esc(x.diagnosis), esc(x.treatment), esc(x.notes)])) + section("Prescriptions", ["Date", "Medicine", "Dosage", "Instructions", "Prescribed By"], data.prescriptions, x => tr([esc(fmtDate(x.prescriptionDate)), esc(x.medicineName), esc(x.dosage), esc(x.instructions), esc(x.prescribingDoctorName)])) + section("Referrals", ["Date", "Specialist", "Reason", "Status", "Findings", "Diagnosis", "Treatment", "Returned Prescription"], data.referrals, x => tr([esc(fmtDate(x.referralDate)), esc(x.externalDoctorName), esc(x.reason), pill(x.status), esc(x.returnedFindings), esc(x.diagnosis), esc(x.treatment), esc(x.returnedPrescription)]));
}
async function renderReports() {
    const patients = (role === "nurse" || role === "admin") ? (await loadPatients()) : [];
    const patientSelect = field("Patient", "reportPatientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") });
    moduleContent.innerHTML = panel("Patient History", `<form id="patientHistoryForm" class="workspace-form">${patientSelect}<div class="field"><label>&nbsp;</label><button type="submit">View Patient History</button></div></form><div id="patientHistoryResult"></div>`) + panel("Daily Schedule", `<form id="dailyScheduleForm" class="workspace-form">${field("Schedule date", "scheduleDate", "date", { required: true, value: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` })() })}<div class="field"><label>&nbsp;</label><button type="submit">View Daily Schedule</button></div></form><div id="dailyScheduleResult"></div>`);
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
    const slots = rows(slotsResult), logs = rows(logsResult), patients = (await loadPatients()).filter(p => p.isActive);
    const slotRows = slots.map(s => tr([esc(s.timeSlotId), esc(fmtDate(s.slotDate)), esc(`${fmtTime(s.startTime)} - ${fmtTime(s.endTime)}`), pill(s.isAvailable ? "Available" : "Booked"), esc(s.appointmentCount)]));
    const externalRows = external.map(d => tr([esc(d.externalDoctorId), esc(d.fullName), esc(d.specialization), esc(d.clinicOrHospital), pill(d.isActive ? "Active" : "Inactive"), action(d.externalDoctorId, "external-edit", "Edit"), d.isActive ? action(d.externalDoctorId, "external-deactivate", "Deactivate", "danger") : pill("Inactive")]));
    const logRows = logs.map(l => tr([esc(l.manualLogId), esc(l.patientName), esc(fmtDateTime(l.visitDate)), esc(l.complaint), esc(l.nurseName)]));
    const now = new Date(), pad = n => String(n).padStart(2, "0"), maxDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const slotForm = form("slotCreateForm", [field("Date", "slotDate", "date", { required: true, min: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` }), field("Start time", "startTime", "time", { required: true }), field("End time", "endTime", "time", { required: true })], "Add Time Slot");
    const externalForm = form("externalCreateForm", [field("Full name", "fullName", "text", { required: true }), field("Specialization", "specialization"), field("Clinic / Hospital", "clinicOrHospital"), field("Contact number", "contactNumber"), field("Email", "email", "email"), field("Address", "address", "textarea", { full: true })], "Add External Doctor");
    const patientOptions = `<option value="">Unregistered / walk-in visitor</option>` + patients.map(p => `<option value="${esc(p.patientId)}">${esc(p.fullName)}</option>`).join("");
    const logForm = form("manualLogCreateForm", [field("Registered patient (optional)", "patientId", "select", { options: patientOptions }), field("Walk-in visitor name", "patientName", "text", { placeholder: "Required for an unregistered visitor" }), field("Visit date and time", "visitDate", "datetime-local", { required: true, max: maxDateTime, value: maxDateTime, help: "Use the actual visit date and time. Future visits cannot be recorded as manual clinic logs." }), field("Complaint", "complaint", "textarea", { required: true, full: true }), field("Notes", "notes", "textarea", { full: true })], "Save Clinic Log");
    moduleContent.innerHTML = panel("Create Clinic Time Slot", slotForm) + panel("Clinic Time Slots", table(["ID", "Date", "Time", "Status", "Appointments"], slotRows, "No clinic time slots found.")) + panel("Add External Doctor", externalForm) + panel("External Doctor Directory", table(["ID", "Name", "Specialty", "Clinic", "Status", "Edit", "Action"], externalRows)) + panel("Record Walk-in / Manual Visit", logForm) + panel("Manual Clinic Logs", table(["Log ID", "Patient", "Visit Date", "Complaint", "Encoded By"], logRows));
    updateManualLogPatientName();
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
        if (f === "referralCreateForm") {
            await api("/Referrals", { method: "POST", body: { patientId: num(v.patientId), externalDoctorId: num(v.externalDoctorId), reason: v.reason, notes: v.notes } }); message("Referral created.");
        }
        if (f === "patientHistoryForm") {
            const data = unwrap(await api(`/Reports/patient-history/${num(v.reportPatientId)}`));
            document.getElementById("patientHistoryResult").innerHTML = renderPatientHistory(data);
            return;
        }
        if (f === "dailyScheduleForm") {
            const data = unwrap(await api(`/Reports/daily-schedule?date=${encodeURIComponent(v.scheduleDate)}`));
            const items = Array.isArray(data?.appointments) ? data.appointments : Array.isArray(data) ? data : [];
            document.getElementById("dailyScheduleResult").innerHTML = table(["Appointment", "Patient", "Doctor", "Time", "Status", "Reason"], items.map(a => tr([esc(a.appointmentId), esc(a.patientName), esc(a.doctorName || "Unassigned"), esc(`${fmtTime(a.startTime)} - ${fmtTime(a.endTime)}`), pill(a.status), esc(a.reason)])), "No appointments for this date.");
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
            if (!confirm("Delete this prescription entry? Use this only to correct an erroneous entry.")) return;
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
document.getElementById("moduleContent").addEventListener("change", event => {
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