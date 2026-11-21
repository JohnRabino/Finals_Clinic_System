const role = AngelicareApp.getRole();
const bookingPanel = document.getElementById("bookingPanel");
const bookingForm = document.getElementById("bookingForm");
const availableSlot = document.getElementById("availableSlot");
const appointmentDoctor = document.getElementById("appointmentDoctor");
const appointmentReason = document.getElementById("appointmentReason");
const bookButton = document.getElementById("bookButton");
const appointmentsTable = document.getElementById("appointmentsTable");
const appointmentsTableBody = document.getElementById("appointmentsTableBody");
const appointmentsTableWrapper = document.getElementById("appointmentsTableWrapper");
const appointmentsLoading = document.getElementById("appointmentsLoading");
const appointmentsEmpty = document.getElementById("appointmentsEmpty");
const appointmentsSearch = document.getElementById("appointmentsSearch");
const appointmentStatusFilter = document.getElementById("appointmentStatusFilter");
const appointmentsResultCount = document.getElementById("appointmentsResultCount");
const feedbackId = "appointmentFeedback";

let appointmentRecords = [];

function arrayOf(result) {
    const data = AngelicareApp.getData(result);
    return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

function formatDate(value) {
    if (!value) return "-";
    const [year, month, day] = String(value).split("T")[0].split("-");
    return year && month && day
        ? new Date(+year, +month - 1, +day).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
        : String(value);
}

function formatTime(value) {
    if (!value) return "-";
    const [hourText, minuteText = "00"] = String(value).split(":");
    const hour = Number(hourText);
    if (Number.isNaN(hour)) return String(value);
    return `${hour % 12 || 12}:${minuteText.slice(0, 2)} ${hour >= 12 ? "PM" : "AM"}`;
}

function normalizedStatus(value) {
    return String(value || "unknown").trim().toLowerCase();
}

function makeCell(value, className = "") {
    const td = document.createElement("td");
    td.textContent = value === null || value === undefined || value === "" ? "-" : value;
    if (className) td.className = className;
    return td;
}

function statusCell(status) {
    const td = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `appointment-status-badge status-${normalizedStatus(status)}`;
    badge.textContent = status || "Unknown";
    td.appendChild(badge);
    return td;
}

function actionButton(label, className, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = `action-button ${className}`;
    button.addEventListener("click", handler);
    return button;
}

function actionsCell(appointment) {
    const td = document.createElement("td");
    td.className = "appointment-actions-cell";

    const status = normalizedStatus(appointment.status);
    const id = appointment.appointmentId;

    if (role === "nurse") {
        if (status === "booked") {
            td.append(
                actionButton("Confirm", "confirm-button", () => updateStatus(id, "Confirmed")),
                actionButton("Cancel", "cancel-button", () => updateStatus(id, "Cancelled"))
            );
        } else if (status === "confirmed") {
            td.append(
                actionButton("Complete", "complete-button", () => updateStatus(id, "Completed")),
                actionButton("Cancel", "cancel-button", () => updateStatus(id, "Cancelled"))
            );
        } else {
            td.textContent = "No action";
        }
    } else if (role === "student" && (status === "booked" || status === "confirmed")) {
        td.appendChild(actionButton("Cancel booking", "cancel-button", () => cancelOwnAppointment(id)));
    } else {
        td.textContent = "No action";
    }

    return td;
}

function updateSummary(items) {
    const counts = {
        total: items.length,
        booked: items.filter(item => normalizedStatus(item.status) === "booked").length,
        confirmed: items.filter(item => normalizedStatus(item.status) === "confirmed").length,
        completed: items.filter(item => normalizedStatus(item.status) === "completed").length
    };

    document.getElementById("appointmentTotalCount").textContent = counts.total;
    document.getElementById("appointmentBookedCount").textContent = counts.booked;
    document.getElementById("appointmentConfirmedCount").textContent = counts.confirmed;
    document.getElementById("appointmentCompletedCount").textContent = counts.completed;
    document.getElementById("appointmentTotalNote").textContent = role === "student"
        ? "Your recorded bookings"
        : "All recorded clinic bookings";
}

function filteredAppointments() {
    const searchTerm = (appointmentsSearch?.value || "").trim().toLowerCase();
    const selectedStatus = appointmentStatusFilter?.value || "all";

    return appointmentRecords.filter(appointment => {
        const status = normalizedStatus(appointment.status);
        if (selectedStatus !== "all" && status !== selectedStatus) return false;

        if (!searchTerm) return true;
        const searchableText = [
            appointment.appointmentId,
            appointment.patientName,
            appointment.doctorName,
            appointment.slotDate,
            formatDate(appointment.slotDate),
            appointment.status,
            appointment.reason
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });
}

function renderAppointments() {
    const items = filteredAppointments();
    appointmentsTableBody.replaceChildren();

    items.forEach(appointment => {
        const row = document.createElement("tr");
        const patientLabel = role === "student" ? "My booking" : (appointment.patientName || "Patient");
        const timeLabel = `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`;

        row.append(
            makeCell(`#${appointment.appointmentId}`, "appointment-id-cell"),
            makeCell(patientLabel),
            makeCell(formatDate(appointment.slotDate)),
            makeCell(timeLabel),
            makeCell(appointment.doctorName || "No doctor assigned"),
            statusCell(appointment.status),
            actionsCell(appointment)
        );
        appointmentsTableBody.appendChild(row);
    });

    appointmentsLoading.hidden = true;
    appointmentsEmpty.hidden = items.length > 0;
    appointmentsTableWrapper.hidden = items.length === 0;
    appointmentsTable.hidden = items.length === 0;

    if (appointmentRecords.length === 0) {
        appointmentsEmpty.textContent = role === "student"
            ? "You do not have any appointments yet. Book an available time slot above to get started."
            : "No clinic appointments have been recorded yet.";
    } else if (items.length === 0) {
        appointmentsEmpty.textContent = "No appointments match your search or selected status.";
    }

    appointmentsResultCount.textContent = items.length === appointmentRecords.length
        ? `Showing ${items.length} ${items.length === 1 ? "appointment" : "appointments"}`
        : `Showing ${items.length} of ${appointmentRecords.length} appointments`;
}

async function loadAppointments() {
    appointmentsLoading.hidden = false;
    appointmentsEmpty.hidden = true;
    appointmentsTableWrapper.hidden = true;
    appointmentsResultCount.textContent = "Loading records...";

    try {
        const result = await AngelicareApp.authFetch(role === "student" ? "/Appointments/my" : "/Appointments");
        appointmentRecords = arrayOf(result);
        updateSummary(appointmentRecords);
        renderAppointments();
    } catch (error) {
        appointmentsLoading.hidden = true;
        appointmentsTableWrapper.hidden = true;
        appointmentsEmpty.hidden = false;
        appointmentsEmpty.textContent = error.message;
        appointmentsResultCount.textContent = "Unable to load records";
        ["appointmentTotalCount", "appointmentBookedCount", "appointmentConfirmedCount", "appointmentCompletedCount"]
            .forEach(id => { document.getElementById(id).textContent = "—"; });
    }
}

async function loadAvailableSlots() {
    availableSlot.replaceChildren(new Option("Loading available slots...", ""));
    bookButton.disabled = true;

    try {
        const result = await AngelicareApp.authFetch("/ClinicTimeSlots/available");
        const slots = arrayOf(result);
        availableSlot.replaceChildren(new Option(
            slots.length ? "Select an available time slot" : "No available future slots",
            ""
        ));

        slots.forEach(slot => {
            availableSlot.add(new Option(
                `${formatDate(slot.slotDate)} · ${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`,
                String(slot.timeSlotId)
            ));
        });

        bookButton.disabled = slots.length === 0;
    } catch (error) {
        availableSlot.replaceChildren(new Option("Unable to load slots — refresh the page", ""));
        AngelicareApp.showFeedback(feedbackId, error.message, "error");
    }
}

async function loadDoctors() {
    try {
        const result = await AngelicareApp.authFetch("/Doctors");
        const doctors = arrayOf(result);
        appointmentDoctor.replaceChildren(new Option("No specific doctor", ""));
        doctors.forEach(doctor => {
            appointmentDoctor.add(new Option(
                `${doctor.fullName} — ${doctor.specialty}`,
                String(doctor.doctorId)
            ));
        });
    } catch (error) {
        AngelicareApp.showFeedback(feedbackId, error.message, "error");
    }
}

async function bookAppointment(event) {
    event.preventDefault();
    AngelicareApp.hideFeedback(feedbackId);

    const timeSlotId = Number(availableSlot.value);
    const reason = appointmentReason.value.trim();
    const doctorId = appointmentDoctor.value ? Number(appointmentDoctor.value) : null;

    if (!timeSlotId || !reason) {
        AngelicareApp.showFeedback(feedbackId, "Select a time slot and enter the reason for your visit.", "error");
        return;
    }

    bookButton.disabled = true;
    bookButton.textContent = "Booking appointment...";

    try {
        await AngelicareApp.authFetch("/Appointments", {
            method: "POST",
            body: { timeSlotId, doctorId, reason }
        });
        bookingForm.reset();
        AngelicareApp.showFeedback(feedbackId, "Your appointment has been booked successfully.", "success");
        await Promise.all([loadAvailableSlots(), loadAppointments()]);
    } catch (error) {
        AngelicareApp.showFeedback(feedbackId, error.message, "error");
        await loadAvailableSlots();
    } finally {
        bookButton.textContent = "Book appointment";
    }
}

async function updateStatus(id, status) {
    if (!confirm(`Change appointment #${id} to ${status}?`)) return;

    try {
        await AngelicareApp.authFetch(`/Appointments/${id}/status`, {
            method: "PUT",
            body: { status }
        });
        AngelicareApp.showFeedback(feedbackId, `Appointment #${id} updated to ${status}.`, "success");
        await Promise.all([loadAppointments(), loadAvailableSlots()]);
    } catch (error) {
        AngelicareApp.showFeedback(feedbackId, error.message, "error");
    }
}

async function cancelOwnAppointment(id) {
    if (!confirm(`Cancel your appointment #${id}?`)) return;

    try {
        await AngelicareApp.authFetch(`/Appointments/${id}/cancel`, { method: "PUT" });
        AngelicareApp.showFeedback(feedbackId, "Your appointment has been cancelled.", "success");
        await Promise.all([loadAppointments(), loadAvailableSlots()]);
    } catch (error) {
        AngelicareApp.showFeedback(feedbackId, error.message, "error");
    }
}

async function initialize() {
    if (role !== "student" && role !== "nurse") {
        window.location.href = "/dashboard.html";
        return;
    }

    if (role === "nurse") {
        bookingPanel.hidden = true;
        document.getElementById("appointmentPageTitle").textContent = "Appointment Management";
        document.getElementById("appointmentPageDescription").textContent = "Review clinic bookings, confirm visits, and keep the daily schedule moving.";
        document.getElementById("appointmentsRecordsTitle").textContent = "Clinic appointment records";
        document.getElementById("appointmentsRecordsDescription").textContent = "Search patient bookings and manage each appointment's valid next action.";
        document.getElementById("appointmentTotalNote").textContent = "All clinic bookings";
    } else {
        document.getElementById("appointmentPageTitle").textContent = "My Appointments";
        document.getElementById("appointmentPageDescription").textContent = "Book an available clinic slot and keep track of your upcoming visits.";
        document.getElementById("appointmentsRecordsTitle").textContent = "My appointment history";
        document.getElementById("appointmentsRecordsDescription").textContent = "View your bookings and cancel an appointment when it is still eligible.";
        document.getElementById("appointmentTotalNote").textContent = "Your recorded bookings";
        bookingForm.addEventListener("submit", bookAppointment);
        await Promise.all([loadAvailableSlots(), loadDoctors()]);
    }

    appointmentsSearch.addEventListener("input", renderAppointments);
    appointmentStatusFilter.addEventListener("change", renderAppointments);
    await loadAppointments();
}

initialize();
