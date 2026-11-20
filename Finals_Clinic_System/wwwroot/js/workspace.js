const role = AngelicareApp.getRole();
const moduleName = new URLSearchParams(location.search).get("module") || "profile";
const moduleContent = document.getElementById("moduleContent");
const feedback = document.getElementById("workspaceFeedback");
const cache = { patients: [], doctors: [], externalDoctors: [], consultations: [] };

const moduleInfo = {
    profile: ["My Profile", "View the clinic profile connected to your account."],
    patients: ["Patient Management", "Create, view, update, deactivate, and reactivate patient profiles."],
    consultations: ["Consultations", "Manage clinic consultations and doctor assessments."],
    records: ["Medical Records", "Review and maintain diagnosis and treatment records."],
    prescriptions: ["Prescriptions", "View prescriptions and create or update eligible prescriptions."],
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

function rows(result) {
    const data = unwrap(result);
    return Array.isArray(data) ? data : [];
}

function message(text, type = "success") {
    feedback.textContent = text;
    feedback.className = `feedback ${type}`;
    feedback.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearMessage() {
    feedback.textContent = "";
    feedback.className = "feedback";
    feedback.hidden = true;
}

function localDateValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function localDateTimeValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function fmtDate(value) {
    if (!value) return "-";
    const parts = String(value).split("T")[0].split("-");
    if (parts.length !== 3) return String(value);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        .toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(value) {
    return value ? new Date(value).toLocaleString("en-PH") : "-";
}

function fmtTime(value) {
    if (!value) return "-";
    const parts = String(value).split(":");
    const hour = Number(parts[0]);
    if (Number.isNaN(hour)) return String(value);
    return `${hour % 12 || 12}:${parts[1] || "00"} ${hour >= 12 ? "PM" : "AM"}`;
}

function pill(value) {
    const name = String(value ?? "Unknown");
    return `<span class="status-pill ${esc(name.toLowerCase())}">${esc(name)}</span>`;
}

function table(headers, data, emptyText = "No records found.") {
    if (!data.length) return `<div class="workspace-empty">${esc(emptyText)}</div>`;
    return `<div class="workspace-table-wrap"><table class="workspace-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${data.join("")}</tbody></table></div>`;
}

function tr(values) {
    return `<tr>${values.map(value => `<td>${value ?? "-"}</td>`).join("")}</tr>`;
}

function action(id, name, label, cls = "") {
    return `<button type="button" class="table-action ${cls}" data-action="${esc(name)}" data-id="${esc(id)}">${esc(label)}</button>`;
}

function panel(title, inner, extraClass = "") {
    return `<section class="workspace-panel ${extraClass}"><div class="workspace-panel-heading"><h2>${title}</h2></div>${inner}</section>`;
}

function field(label, name, type = "text", opts = {}) {
    const required = opts.required ? "required" : "";
    const full = opts.full ? "full" : "";
    const value = opts.value !== undefined ? `value="${esc(opts.value)}"` : "";
    const min = opts.min !== undefined ? `min="${esc(opts.min)}"` : "";
    const max = opts.max !== undefined ? `max="${esc(opts.max)}"` : "";
    const step = opts.step !== undefined ? `step="${esc(opts.step)}"` : "";
    const readonly = opts.readonly ? "readonly" : "";
    const placeholder = `placeholder="${esc(opts.placeholder || "")}"`;

    if (type === "textarea") {
        return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><textarea id="${esc(name)}" name="${esc(name)}" ${required} ${placeholder}>${esc(opts.value || "")}</textarea>${opts.help ? `<small class="field-help">${esc(opts.help)}</small>` : ""}</div>`;
    }
    if (type === "select") {
        return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><select id="${esc(name)}" name="${esc(name)}" ${required}>${opts.options || ""}</select>${opts.help ? `<small class="field-help">${esc(opts.help)}</small>` : ""}</div>`;
    }
    return `<div class="field ${full}"><label for="${esc(name)}">${esc(label)}</label><input id="${esc(name)}" name="${esc(name)}" type="${esc(type)}" ${value} ${required} ${min} ${max} ${step} ${readonly} ${placeholder}>${opts.help ? `<small class="field-help">${esc(opts.help)}</small>` : ""}</div>`;
}

function selectOptions(items, idKey, labelKey, firstLabel = "Select an option") {
    return `<option value="">${esc(firstLabel)}</option>` + items.map(item =>
        `<option value="${esc(item[idKey])}">${esc(item[labelKey])}</option>`
    ).join("");
}

function form(id, fields, buttonText = "Save") {
    return `<form id="${esc(id)}" class="workspace-form">${fields.join("")}<div class="field full form-submit"><button type="submit">${esc(buttonText)}</button></div></form>`;
}

async function api(path, options) {
    return await AngelicareApp.authFetch(path, options);
}

async function loadPatients() {
    cache.patients = rows(await api("/Patients"));
    return cache.patients;
}

async function loadDoctors() {
    cache.doctors = rows(await api("/Doctors"));
    return cache.doctors;
}

async function loadExternalDoctors() {
    cache.externalDoctors = rows(await api("/ExternalDoctors"));
    return cache.externalDoctors;
}

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
    moduleContent.innerHTML = panel("Account Information", `<div class="detail-list">${fields.map(item => `<div class="detail-item"><span>${esc(item[0])}</span><strong>${esc(item[1] ?? "-")}</strong></div>`).join("")}</div>`);
}

async function renderPatients() {
    const items = await loadPatients();
    const patientRows = items.map(patient => {
        const status = pill(patient.isActive ? "Active" : "Inactive");
        const statusAction = patient.isActive
            ? action(patient.patientId, "patient-deactivate", "Deactivate", "danger")
            : action(patient.patientId, "patient-activate", "Reactivate", "neutral");
        return tr([
            esc(patient.patientId), esc(patient.fullName), esc(patient.userId ?? "Walk-in / manual"),
            status, statusAction, action(patient.patientId, "patient-edit", "Edit")
        ]);
    });

    moduleContent.innerHTML =
        panel("Add Patient", form("patientCreateForm", [
            field("Full name", "fullName", "text", { required: true, full: true, placeholder: "Enter patient's complete name" })
        ], "Add Patient")) +
        panel("Patient List", table(["Patient ID", "Full Name", "Linked User", "Status", "Account Action", "Edit"], patientRows));
}

async function renderConsultations() {
    const items = await loadConsultations();
    let nursePanel = "";

    if (role === "nurse") {
        const patients = (await loadPatients()).filter(patient => patient.isActive);
        const doctors = (await loadDoctors()).filter(doctor => doctor.isActive !== false);
        const patientOptions = selectOptions(patients, "patientId", "fullName", "Select patient");
        const doctorOptions = `<option value="">No doctor assigned</option>` + doctors.map(doctor =>
            `<option value="${esc(doctor.doctorId)}">${esc(doctor.fullName)} — ${esc(doctor.specialty)}</option>`
        ).join("");

        nursePanel = panel("Create Consultation / Walk-in", form("consultationCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: patientOptions }),
            field("Confirmed appointment ID (optional)", "appointmentId", "number", { min: 1, placeholder: "Leave blank for a walk-in" }),
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

    const consultationRows = items.map(consultation => {
        const actions = role === "doctor"
            ? (consultation.doctorReviewedAt ? pill("Reviewed") : action(consultation.consultationId, "consultation-assess", "Submit Assessment"))
            : role === "nurse"
                ? (consultation.timeOut ? pill("Completed") : action(consultation.consultationId, "consultation-complete", "Complete", "neutral"))
                : "-";
        return tr([
            esc(consultation.consultationId), esc(consultation.patientName || `Patient #${consultation.patientId}`),
            esc(fmtDate(consultation.consultationDate)), esc(consultation.complaint),
            esc(consultation.doctorName || "Unassigned"),
            consultation.doctorReviewedAt ? pill("Reviewed") : pill("Pending"), actions
        ]);
    });

    moduleContent.innerHTML = nursePanel + panel("Consultation List", table(
        ["ID", "Patient", "Date", "Complaint", "Doctor", "Doctor Review", "Action"],
        consultationRows
    ));
}

function consultationLabel(consultation) {
    const patientName = consultation.patientName || `Patient #${consultation.patientId}`;
    const date = fmtDate(consultation.consultationDate);
    return `${patientName} — ${date} — ${consultation.complaint || "Clinic visit"}`;
}

function completedConsultationOptions(patientId) {
    const completed = cache.consultations.filter(consultation =>
        consultation.timeOut && (!patientId || Number(consultation.patientId) === Number(patientId))
    );
    return `<option value="">${completed.length ? "Select completed consultation" : "No completed consultation available"}</option>` +
        completed.map(consultation => `<option value="${esc(consultation.consultationId)}">${esc(consultationLabel(consultation))}</option>`).join("");
}

async function renderRecords() {
    const items = rows(await api(role === "student" ? "/MedicalRecords/my" : "/MedicalRecords"));
    let createPanel = "";

    if (role === "nurse") {
        const patients = (await loadPatients()).filter(patient => patient.isActive);
        await loadConsultations();
        const patientOptions = selectOptions(patients, "patientId", "fullName", "Select patient");
        createPanel = panel("Add Medical Record", form("recordCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: patientOptions }),
            field("Completed consultation", "consultationId", "select", { required: true, options: completedConsultationOptions(null), help: "Only completed consultations can be used for a medical record." }),
            field("Diagnosis", "diagnosis", "textarea", { required: true, full: true }),
            field("Treatment", "treatment", "textarea", { required: true, full: true }),
            field("Notes", "notes", "textarea", { full: true })
        ], "Save Medical Record"));
    }

    const recordRows = items.map(record => tr([
        esc(record.recordId), esc(role === "student" ? "My Record" : record.patientName || `Patient #${record.patientId}`),
        esc(record.consultationId), esc(record.diagnosis), esc(record.treatment), esc(fmtDate(record.recordDate)),
        role === "nurse" ? `${action(record.recordId, "record-edit", "Edit")}${action(record.recordId, "record-delete", "Delete", "danger")}` : "-"
    ]));

    moduleContent.innerHTML = createPanel + panel("Medical Record History", table(
        ["Record ID", "Patient", "Consultation", "Diagnosis", "Treatment", "Record Date", "Actions"],
        recordRows
    ));
}

function prescriptionOptionsForPatient(patientId) {
    let consultations = cache.consultations;
    if (role === "doctor") {
        consultations = consultations.filter(consultation => !!consultation.doctorReviewedAt);
    } else if (role === "nurse") {
        consultations = consultations.filter(consultation => !consultation.doctorId || !!consultation.doctorReviewedAt);
    }
    if (patientId) {
        consultations = consultations.filter(consultation => Number(consultation.patientId) === Number(patientId));
    }
    return `<option value="">${consultations.length ? "Select consultation" : "No eligible consultation available"}</option>` +
        consultations.map(consultation => `<option value="${esc(consultation.consultationId)}">${esc(consultationLabel(consultation))}${consultation.doctorReviewedAt ? " — Doctor reviewed" : ""}</option>`).join("");
}

async function renderPrescriptions() {
    const listPath = role === "student" ? "/Prescriptions/my" : role === "doctor" ? "/Prescriptions/assigned" : "/Prescriptions";
    const items = rows(await api(listPath));
    let createPanel = "";

    if (role === "nurse" || role === "doctor") {
        await loadConsultations();
        const fields = [];

        if (role === "nurse") {
            const patients = (await loadPatients()).filter(patient => patient.isActive);
            const external = (await loadExternalDoctors()).filter(doctor => doctor.isActive);
            fields.push(field("Patient", "patientId", "select", {
                required: true,
                options: selectOptions(patients, "patientId", "fullName", "Select patient")
            }));
            fields.push(field("Consultation", "consultationId", "select", {
                required: true,
                options: prescriptionOptionsForPatient(null),
                help: "Choose a consultation for the selected patient. The assigned doctor must submit an assessment first."
            }));
            fields.push(field("External doctor (only when no clinic doctor is assigned)", "externalDoctorId", "select", {
                options: `<option value="">Select external doctor when needed</option>` + external.map(doctor =>
                    `<option value="${esc(doctor.externalDoctorId)}">${esc(doctor.fullName)} — ${esc(doctor.specialization || "Specialist")}</option>`
                ).join(""),
                help: "This is required only when the consultation has no assigned clinic doctor."
            }));
        } else {
            const available = cache.consultations.filter(consultation => !!consultation.doctorReviewedAt);
            fields.push(field("Consultation", "consultationId", "select", {
                required: true,
                options: prescriptionOptionsForPatient(null),
                help: available.length
                    ? "Only your assigned consultations with a submitted doctor assessment are shown."
                    : "No reviewed consultation is assigned to your account yet."
            }));
        }

        fields.push(field("Medicine name", "medicineName", "text", { required: true, placeholder: "Enter medicine name" }));
        fields.push(field("Dosage", "dosage", "text", { required: true, placeholder: "e.g. 500 mg" }));
        fields.push(field("Instructions", "instructions", "textarea", { required: true, full: true, placeholder: "How and when should the medicine be taken?" }));
        createPanel = panel("Create Prescription", form("prescriptionCreateForm", fields, "Save Prescription"));
    }

    const prescriptionRows = items.map(prescription => tr([
        esc(prescription.prescriptionId), esc(prescription.patientName || "My Prescription"),
        esc(prescription.consultationId), esc(prescription.medicineName), esc(prescription.dosage),
        esc(prescription.instructions), esc(prescription.prescribingDoctorName), esc(fmtDate(prescription.prescriptionDate)),
        role === "nurse" ? `${action(prescription.prescriptionId, "prescription-edit", "Edit")}${action(prescription.prescriptionId, "prescription-delete", "Delete", "danger")}` : "-"
    ]));

    moduleContent.innerHTML = createPanel + panel("Prescription List", table(
        ["ID", "Patient", "Consultation", "Medicine", "Dosage", "Instructions", "Prescribed By", "Date", "Actions"],
        prescriptionRows,
        role === "doctor" ? "No prescriptions have been created for your assigned consultations." : "No prescriptions found."
    ));

    updatePrescriptionExternalDoctor();
}

async function renderReferrals() {
    const items = rows(await api(role === "student" ? "/Referrals/my" : "/Referrals"));
    let createPanel = "";

    if (role === "nurse") {
        const patients = (await loadPatients()).filter(patient => patient.isActive);
        const external = (await loadExternalDoctors()).filter(doctor => doctor.isActive);
        createPanel = panel("Create Referral", form("referralCreateForm", [
            field("Patient", "patientId", "select", { required: true, options: selectOptions(patients, "patientId", "fullName", "Select patient") }),
            field("External specialist", "externalDoctorId", "select", { required: true, options: selectOptions(external, "externalDoctorId", "fullName", "Select specialist") }),
            field("Reason", "reason", "textarea", { required: true, full: true }),
            field("Notes", "notes", "textarea", { full: true })
        ], "Create Referral"));
    }

    const referralRows = items.map(referral => tr([
        esc(referral.referralId || "-"), esc(referral.patientName || "My Referral"), esc(referral.externalDoctorName),
        esc(referral.externalDoctorSpecialization), esc(referral.reason), pill(referral.status),
        esc(referral.returnedFindings || "Pending response"), esc(fmtDate(referral.referralDate)),
        role === "nurse" && referral.status !== "Completed" ? action(referral.referralId, "referral-response", "Record Response") : "-"
    ]));

    moduleContent.innerHTML = createPanel + panel("Referral List", table(
        ["ID", "Patient", "Specialist", "Specialty", "Reason", "Status", "Findings", "Date", "Action"],
        referralRows
    ));
}

function historySection(title, items, columns, rowMapper) {
    return `<div class="history-section"><h3>${esc(title)}</h3>${table(columns, (items || []).map(rowMapper), `No ${title.toLowerCase()} found.`)}</div>`;
}

function renderPatientHistory(data) {
    const summary = `<div class="detail-list report-summary">
        <div class="detail-item"><span>Patient ID</span><strong>${esc(data.patientId)}</strong></div>
        <div class="detail-item"><span>Patient Name</span><strong>${esc(data.fullName)}</strong></div>
        <div class="detail-item"><span>Status</span><strong>${data.isActive ? "Active" : "Inactive"}</strong></div>
    </div>`;
    const consultations = historySection("Consultations", data.consultations, ["Date", "Complaint", "Doctor", "Assessment", "Doctor Assessment", "Time Out"], item => tr([
        esc(fmtDateTime(item.consultationDate)), esc(item.complaint), esc(item.doctorName), esc(item.assessment), esc(item.doctorAssessment), esc(item.timeOut ? fmtTime(item.timeOut) : "Not completed")
    ]));
    const records = historySection("Medical Records", data.medicalRecords, ["Date", "Diagnosis", "Treatment", "Doctor", "Notes"], item => tr([
        esc(fmtDate(item.recordDate)), esc(item.diagnosis), esc(item.treatment), esc(item.doctorName), esc(item.notes)
    ]));
    const prescriptions = historySection("Prescriptions", data.prescriptions, ["Date", "Medicine", "Dosage", "Instructions", "Prescribed By"], item => tr([
        esc(fmtDate(item.prescriptionDate)), esc(item.medicineName), esc(item.dosage), esc(item.instructions), esc(item.prescribingDoctorName)
    ]));
    const referrals = historySection("Referrals", data.referrals, ["Date", "Specialist", "Reason", "Status", "Findings", "Diagnosis", "Treatment"], item => tr([
        esc(fmtDate(item.referralDate)), esc(item.externalDoctorName), esc(item.reason), pill(item.status), esc(item.returnedFindings), esc(item.diagnosis), esc(item.treatment)
    ]));
    return summary + consultations + records + prescriptions + referrals;
}

async function renderReports() {
    const patients = role === "nurse" ? (await loadPatients()).filter(patient => patient.isActive) : [];
    const patientSelect = field("Patient", "reportPatientId", "select", {
        required: true,
        options: selectOptions(patients, "patientId", "fullName", "Select patient")
    });
    const scheduleDate = field("Schedule date", "scheduleDate", "date", {
        required: true,
        value: localDateValue()
    });

    moduleContent.innerHTML =
        panel("Patient History", `<form id="patientHistoryForm" class="workspace-form">${patientSelect}<div class="field form-submit"><button type="submit">View Patient History</button></div></form><div id="patientHistoryResult"></div>`) +
        panel("Daily Schedule", `<form id="dailyScheduleForm" class="workspace-form">${scheduleDate}<div class="field form-submit"><button type="submit">View Daily Schedule</button></div></form><div id="dailyScheduleResult"></div>`);
}

async function renderOperations() {
    const [slotsResult, external, logsResult] = await Promise.all([
        api("/ClinicTimeSlots"), loadExternalDoctors(), api("/ManualClinicLogs")
    ]);
    const slots = rows(slotsResult);
    const logs = rows(logsResult);
    const patients = (await loadPatients()).filter(patient => patient.isActive);

    const slotRows = slots.map(slot => tr([
        esc(slot.timeSlotId), esc(fmtDate(slot.slotDate)),
        esc(`${fmtTime(slot.startTime)} - ${fmtTime(slot.endTime)}`),
        pill(slot.isAvailable ? "Available" : "Booked"), esc(slot.appointmentCount)
    ]));
    const externalRows = external.map(doctor => tr([
        esc(doctor.externalDoctorId), esc(doctor.fullName), esc(doctor.specialization), esc(doctor.clinicOrHospital),
        pill(doctor.isActive ? "Active" : "Inactive"), action(doctor.externalDoctorId, "external-edit", "Edit"),
        doctor.isActive ? action(doctor.externalDoctorId, "external-deactivate", "Deactivate", "danger") : "-"
    ]));
    const logRows = logs.map(log => tr([
        esc(log.manualLogId), esc(log.patientName), esc(fmtDateTime(log.visitDate)), esc(log.complaint), esc(log.nurseName)
    ]));

    const slotForm = form("slotCreateForm", [
        field("Date", "slotDate", "date", { required: true, min: localDateValue() }),
        field("Start time", "startTime", "time", { required: true }),
        field("End time", "endTime", "time", { required: true })
    ], "Add Time Slot");

    const externalForm = form("externalCreateForm", [
        field("Full name", "fullName", "text", { required: true }),
        field("Specialization", "specialization", "text"),
        field("Clinic / Hospital", "clinicOrHospital", "text"),
        field("Contact number", "contactNumber", "text"),
        field("Email", "email", "email"),
        field("Address", "address", "textarea", { full: true })
    ], "Add External Doctor");

    const patientOptions = `<option value="">Unregistered / walk-in visitor</option>` + patients.map(patient =>
        `<option value="${esc(patient.patientId)}">${esc(patient.fullName)}</option>`
    ).join("");
    const logForm = form("manualLogCreateForm", [
        field("Registered patient (optional)", "patientId", "select", { options: patientOptions }),
        field("Walk-in visitor name", "patientName", "text", { placeholder: "Required only for an unregistered visitor", help: "When a registered patient is selected, the patient's saved name is used automatically." }),
        field("Visit date and time", "visitDate", "datetime-local", { required: true, value: localDateTimeValue(), max: localDateTimeValue() }),
        field("Complaint", "complaint", "textarea", { required: true, full: true }),
        field("Notes", "notes", "textarea", { full: true })
    ], "Save Clinic Log");

    moduleContent.innerHTML =
        panel("Create Clinic Time Slot", slotForm) +
        panel("Clinic Time Slots", table(["ID", "Date", "Time", "Status", "Appointments"], slotRows, "No clinic time slots have been created.")) +
        panel("Add External Doctor", externalForm) +
        panel("External Doctor Directory", table(["ID", "Name", "Specialty", "Clinic", "Status", "Edit", "Action"], externalRows, "No external doctors found.")) +
        panel("Record Walk-in / Manual Visit", logForm) +
        panel("Manual Clinic Logs", table(["Log ID", "Patient", "Visit Date", "Complaint", "Encoded By"], logRows, "No manual clinic logs have been recorded."));
}

async function renderAdmin() {
    const [usersResult, doctors] = await Promise.all([api("/admin/users"), loadDoctors()]);
    const users = rows(usersResult);
    const userRows = users.map(user => tr([
        esc(user.userId), esc(user.fullName), esc(user.email), esc(user.role),
        pill(user.isActive ? "Active" : "Inactive"),
        action(user.userId, "user-toggle", user.isActive ? "Deactivate" : "Activate", user.isActive ? "danger" : "neutral")
    ]));
    const doctorRows = doctors.map(doctor => tr([
        esc(doctor.doctorId), esc(doctor.fullName), esc(doctor.specialty), action(doctor.doctorId, "doctor-edit", "Edit")
    ]));

    moduleContent.innerHTML =
        panel("Create Staff Account", form("staffCreateForm", [
            field("Full name", "fullName", "text", { required: true }),
            field("Email", "email", "email", { required: true }),
            field("Temporary password", "password", "password", { required: true }),
            field("Role", "role", "select", { required: true, options: "<option value=''>Select role</option><option value='Nurse'>Nurse</option><option value='Doctor'>Doctor</option>" }),
            field("Specialty (Doctors only)", "specialty", "text")
        ], "Create Account")) +
        panel("User Accounts", table(["User ID", "Full Name", "Email", "Role", "Status", "Action"], userRows)) +
        panel("Doctor Profiles", table(["Doctor ID", "Name", "Specialty", "Action"], doctorRows));
}

async function renderDoctors() {
    const doctors = await loadDoctors();
    const body = doctors.map(doctor => tr([
        esc(doctor.doctorId), esc(doctor.fullName), esc(doctor.specialty), esc(doctor.userId), action(doctor.doctorId, "doctor-edit", "Edit")
    ]));
    moduleContent.innerHTML = panel("Active Doctors", table(["Doctor ID", "Full Name", "Specialty", "User ID", "Action"], body));
}

async function renderModule() {
    if (!moduleInfo[moduleName] || !moduleRoles[moduleName].includes(role)) {
        location.href = "/dashboard.html";
        return;
    }
    setTitle();
    clearMessage();
    try {
        const renderers = {
            profile: renderProfile, patients: renderPatients, consultations: renderConsultations,
            records: renderRecords, prescriptions: renderPrescriptions, referrals: renderReferrals,
            reports: renderReports, operations: renderOperations, admin: renderAdmin, doctors: renderDoctors
        };
        await renderers[moduleName]();
    } catch (error) {
        moduleContent.innerHTML = `<div class="workspace-empty">${esc(error.message)}<br><br>Please check the API connection and your account access.</div>`;
    }
}

function readForm(formElement) {
    const data = Object.fromEntries(new FormData(formElement).entries());
    for (const key of Object.keys(data)) {
        if (data[key] === "") data[key] = null;
    }
    return data;
}

function num(value) {
    return value === null ? null : Number(value);
}

function timeWithSeconds(value) {
    if (!value) return value;
    return value.length === 5 ? `${value}:00` : value;
}

function updateRecordConsultations() {
    const patientSelect = document.getElementById("patientId");
    const consultationSelect = document.getElementById("consultationId");
    if (!patientSelect || !consultationSelect || moduleName !== "records") return;
    consultationSelect.innerHTML = completedConsultationOptions(patientSelect.value || null);
}

function updatePrescriptionConsultations() {
    const patientSelect = document.getElementById("patientId");
    const consultationSelect = document.getElementById("consultationId");
    if (!consultationSelect || moduleName !== "prescriptions") return;
    const patientId = role === "nurse" && patientSelect ? patientSelect.value : null;
    consultationSelect.innerHTML = prescriptionOptionsForPatient(patientId);
    updatePrescriptionExternalDoctor();
}

function updatePrescriptionExternalDoctor() {
    const externalSelect = document.getElementById("externalDoctorId");
    const consultationSelect = document.getElementById("consultationId");
    if (!externalSelect || !consultationSelect || role !== "nurse") return;

    const consultation = cache.consultations.find(item => Number(item.consultationId) === Number(consultationSelect.value));
    const needsExternalDoctor = !!consultation && !consultation.doctorId;
    externalSelect.disabled = !needsExternalDoctor;
    externalSelect.required = needsExternalDoctor;
    if (!needsExternalDoctor) externalSelect.value = "";
    const helper = externalSelect.closest(".field")?.querySelector(".field-help");
    if (helper) {
        helper.textContent = !consultation
            ? "Select a consultation first."
            : needsExternalDoctor
                ? "Required because this consultation has no assigned clinic doctor."
                : "Not needed because a clinic doctor is assigned to this consultation.";
    }
}

function updateManualLogPatientName() {
    const patientSelect = document.getElementById("patientId");
    const patientName = document.getElementById("patientName");
    if (!patientSelect || !patientName || moduleName !== "operations") return;
    const patient = cache.patients.find(item => Number(item.patientId) === Number(patientSelect.value));
    if (patient) {
        patientName.value = patient.fullName;
        patientName.readOnly = true;
        patientName.placeholder = "Name loaded from the selected patient";
    } else {
        patientName.readOnly = false;
        patientName.value = "";
        patientName.placeholder = "Enter walk-in visitor name";
    }
}

async function submitForm(event) {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) return;
    const formId = target.id;
    const supportedForms = [
        "patientCreateForm", "consultationCreateForm", "recordCreateForm", "prescriptionCreateForm",
        "referralCreateForm", "patientHistoryForm", "dailyScheduleForm", "slotCreateForm",
        "externalCreateForm", "manualLogCreateForm", "staffCreateForm"
    ];
    if (!supportedForms.includes(formId)) return;

    event.preventDefault();
    clearMessage();
    const values = readForm(target);

    try {
        if (formId === "patientCreateForm") {
            await api("/Patients", { method: "POST", body: { fullName: values.fullName } });
            message("Patient profile created successfully.");
        }

        if (formId === "consultationCreateForm") {
            const body = {
                patientId: num(values.patientId), appointmentId: num(values.appointmentId), doctorId: num(values.doctorId),
                complaint: values.complaint, bloodPressure: values.bloodPressure, temperature: num(values.temperature),
                assessment: values.assessment, assistanceProvided: values.assistanceProvided,
                notes: values.notes, followUpInstructions: values.followUpInstructions
            };
            await api("/Consultations", { method: "POST", body });
            message("Consultation created successfully.");
        }

        if (formId === "recordCreateForm") {
            const consultation = cache.consultations.find(item => Number(item.consultationId) === Number(values.consultationId));
            if (!consultation || !consultation.timeOut) {
                throw new Error("Choose a completed consultation before saving the medical record.");
            }
            if (Number(consultation.patientId) !== Number(values.patientId)) {
                throw new Error("The selected consultation does not belong to this patient.");
            }
            await api("/MedicalRecords", {
                method: "POST",
                body: {
                    patientId: num(values.patientId), consultationId: num(values.consultationId),
                    diagnosis: values.diagnosis, treatment: values.treatment, notes: values.notes
                }
            });
            message("Medical record saved successfully.");
        }

        if (formId === "prescriptionCreateForm") {
            const consultation = cache.consultations.find(item => Number(item.consultationId) === Number(values.consultationId));
            if (!consultation) throw new Error("Select a valid consultation first.");
            if (role === "doctor" && !consultation.doctorReviewedAt) {
                throw new Error("Submit your doctor assessment before creating a prescription.");
            }
            const patientId = role === "doctor" ? consultation.patientId : num(values.patientId);
            if (Number(patientId) !== Number(consultation.patientId)) {
                throw new Error("The selected consultation does not belong to this patient.");
            }
            if (role === "nurse" && !consultation.doctorId && !values.externalDoctorId) {
                throw new Error("Select an external doctor because no clinic doctor is assigned to this consultation.");
            }
            await api("/Prescriptions", {
                method: "POST",
                body: {
                    patientId: Number(patientId), consultationId: num(values.consultationId),
                    medicineName: values.medicineName, dosage: values.dosage,
                    instructions: values.instructions, externalDoctorId: num(values.externalDoctorId)
                }
            });
            message("Prescription saved successfully.");
        }

        if (formId === "referralCreateForm") {
            await api("/Referrals", {
                method: "POST",
                body: {
                    patientId: num(values.patientId), externalDoctorId: num(values.externalDoctorId),
                    reason: values.reason, notes: values.notes
                }
            });
            message("Referral created successfully.");
        }

        if (formId === "patientHistoryForm") {
            const data = unwrap(await api(`/Reports/patient-history/${num(values.reportPatientId)}`));
            document.getElementById("patientHistoryResult").innerHTML = renderPatientHistory(data);
            return;
        }

        if (formId === "dailyScheduleForm") {
            const data = unwrap(await api(`/Reports/daily-schedule?date=${encodeURIComponent(values.scheduleDate)}`));
            const appointments = Array.isArray(data?.appointments) ? data.appointments : Array.isArray(data) ? data : [];
            document.getElementById("dailyScheduleResult").innerHTML = table(
                ["Appointment", "Patient", "Doctor", "Time", "Status", "Reason"],
                appointments.map(appointment => tr([
                    esc(appointment.appointmentId), esc(appointment.patientName), esc(appointment.doctorName || "Unassigned"),
                    esc(`${fmtTime(appointment.startTime)} - ${fmtTime(appointment.endTime)}`),
                    pill(appointment.status), esc(appointment.reason)
                ])),
                "No appointments for this date."
            );
            return;
        }

        if (formId === "slotCreateForm") {
            const startTime = timeWithSeconds(values.startTime);
            const endTime = timeWithSeconds(values.endTime);
            if (endTime <= startTime) throw new Error("End time must be later than start time.");
            await api("/ClinicTimeSlots", {
                method: "POST",
                body: { slotDate: values.slotDate, startTime, endTime }
            });
            message("Clinic time slot added successfully.");
        }

        if (formId === "externalCreateForm") {
            await api("/ExternalDoctors", {
                method: "POST",
                body: {
                    fullName: values.fullName, specialization: values.specialization,
                    clinicOrHospital: values.clinicOrHospital, address: values.address,
                    contactNumber: values.contactNumber, email: values.email
                }
            });
            message("External doctor added successfully.");
        }

        if (formId === "manualLogCreateForm") {
            if (!values.patientId && !String(values.patientName || "").trim()) {
                throw new Error("Enter the walk-in visitor name or select a registered patient.");
            }
            await api("/ManualClinicLogs", {
                method: "POST",
                body: {
                    patientId: num(values.patientId), patientName: values.patientName || "",
                    visitDate: values.visitDate && values.visitDate.length === 16 ? `${values.visitDate}:00` : values.visitDate,
                    complaint: values.complaint, notes: values.notes
                }
            });
            message("Manual clinic log saved successfully.");
        }

        if (formId === "staffCreateForm") {
            await api("/admin/users", {
                method: "POST",
                body: {
                    fullName: values.fullName, email: values.email, password: values.password,
                    role: values.role, specialty: values.specialty
                }
            });
            message("Staff account created successfully.");
        }

        target.reset();
        await renderModule();
    } catch (error) {
        message(error.message, "error");
    }
}

async function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const actionName = button.dataset.action;
    clearMessage();

    try {
        if (actionName === "patient-deactivate") {
            if (!confirm(`Deactivate patient #${id}? The linked student account will also be disabled.`)) return;
            await api(`/Patients/${id}`, { method: "DELETE" });
            message("Patient profile deactivated.");
        }

        if (actionName === "patient-activate") {
            const patient = cache.patients.find(item => Number(item.patientId) === id);
            if (!patient) return;
            if (!confirm(`Reactivate ${patient.fullName}? The linked student account will also be re-enabled.`)) return;
            await api(`/Patients/${id}`, {
                method: "PUT",
                body: { fullName: patient.fullName, isActive: true }
            });
            message("Patient profile reactivated successfully.");
        }

        if (actionName === "patient-edit") {
            const patient = cache.patients.find(item => Number(item.patientId) === id);
            if (!patient) return;
            const fullName = prompt("Update patient name:", patient.fullName);
            if (fullName === null) return;
            await api(`/Patients/${id}`, {
                method: "PUT",
                body: { fullName, isActive: patient.isActive }
            });
            message("Patient profile updated.");
        }

        if (actionName === "consultation-assess") {
            const assessment = prompt("Enter your doctor assessment:");
            if (!assessment || !assessment.trim()) return;
            await api(`/Consultations/${id}/doctor-assessment`, {
                method: "PUT", body: { doctorAssessment: assessment.trim() }
            });
            message("Doctor assessment submitted.");
        }

        if (actionName === "consultation-complete") {
            const notes = prompt("Enter completion notes (optional):", "");
            if (notes === null) return;
            await api(`/Consultations/${id}/complete`, { method: "PUT", body: { notes } });
            message("Consultation completed.");
        }

        if (actionName === "record-edit") {
            const diagnosis = prompt("Update diagnosis:");
            if (diagnosis === null) return;
            const treatment = prompt("Update treatment:");
            if (treatment === null) return;
            const notes = prompt("Update notes (optional):", "");
            if (notes === null) return;
            await api(`/MedicalRecords/${id}`, { method: "PUT", body: { diagnosis, treatment, notes } });
            message("Medical record updated.");
        }

        if (actionName === "record-delete") {
            if (!confirm("Delete this medical record? Use this only to correct an erroneous entry.")) return;
            await api(`/MedicalRecords/${id}`, { method: "DELETE" });
            message("Medical record deleted.");
        }

        if (actionName === "prescription-edit") {
            const items = rows(await api("/Prescriptions"));
            const prescription = items.find(item => Number(item.prescriptionId) === id);
            if (!prescription) return;
            const medicineName = prompt("Medicine name:", prescription.medicineName);
            if (medicineName === null) return;
            const dosage = prompt("Dosage:", prescription.dosage);
            if (dosage === null) return;
            const instructions = prompt("Instructions:", prescription.instructions);
            if (instructions === null) return;
            await api(`/Prescriptions/${id}`, {
                method: "PUT", body: { medicineName, dosage, instructions }
            });
            message("Prescription updated.");
        }

        if (actionName === "prescription-delete") {
            if (!confirm("Delete this prescription entry? Use only to correct an erroneous entry.")) return;
            await api(`/Prescriptions/${id}`, { method: "DELETE" });
            message("Prescription deleted.");
        }

        if (actionName === "referral-response") {
            const returnedFindings = prompt("Returned findings:");
            if (!returnedFindings) return;
            const diagnosis = prompt("External specialist diagnosis:");
            if (!diagnosis) return;
            const treatment = prompt("Recommended treatment:");
            if (!treatment) return;
            const returnedPrescription = prompt("Returned prescription (optional):", "");
            if (returnedPrescription === null) return;
            await api(`/Referrals/${id}/response`, {
                method: "PUT", body: { returnedFindings, diagnosis, treatment, returnedPrescription }
            });
            message("Referral response saved.");
        }

        if (actionName === "external-deactivate") {
            if (!confirm(`Deactivate external doctor #${id}?`)) return;
            await api(`/ExternalDoctors/${id}`, { method: "DELETE" });
            message("External doctor deactivated.");
        }

        if (actionName === "external-edit") {
            const doctor = cache.externalDoctors.find(item => Number(item.externalDoctorId) === id);
            if (!doctor) return;
            const fullName = prompt("Full name:", doctor.fullName); if (fullName === null) return;
            const specialization = prompt("Specialization:", doctor.specialization || ""); if (specialization === null) return;
            const clinicOrHospital = prompt("Clinic / Hospital:", doctor.clinicOrHospital || ""); if (clinicOrHospital === null) return;
            const address = prompt("Address:", doctor.address || ""); if (address === null) return;
            const contactNumber = prompt("Contact number:", doctor.contactNumber || ""); if (contactNumber === null) return;
            const email = prompt("Email:", doctor.email || ""); if (email === null) return;
            await api(`/ExternalDoctors/${id}`, {
                method: "PUT", body: { fullName, specialization, clinicOrHospital, address, contactNumber, email }
            });
            message("External doctor updated.");
        }

        if (actionName === "user-toggle") {
            const users = rows(await api("/admin/users"));
            const user = users.find(item => Number(item.userId) === id);
            if (!user) return;
            const nextStatus = !user.isActive;
            if (!confirm(`${nextStatus ? "Activate" : "Deactivate"} ${user.fullName}?`)) return;
            await api(`/admin/users/${id}/status?isActive=${nextStatus}`, { method: "PUT" });
            message(`User account ${nextStatus ? "activated" : "deactivated"}.`);
        }

        if (actionName === "doctor-edit") {
            const doctor = cache.doctors.find(item => Number(item.doctorId) === id);
            if (!doctor) return;
            const fullName = prompt("Doctor full name:", doctor.fullName); if (fullName === null) return;
            const specialty = prompt("Doctor specialty:", doctor.specialty); if (specialty === null) return;
            await api(`/Doctors/${id}`, { method: "PUT", body: { fullName, specialty } });
            message("Doctor profile updated.");
        }

        await renderModule();
    } catch (error) {
        message(error.message, "error");
    }
}

moduleContent.addEventListener("submit", submitForm);
moduleContent.addEventListener("click", handleAction);
moduleContent.addEventListener("change", event => {
    if (event.target.id === "patientId") {
        updateRecordConsultations();
        updatePrescriptionConsultations();
        updateManualLogPatientName();
    }
    if (event.target.id === "consultationId") updatePrescriptionExternalDoctor();
});

renderModule();
