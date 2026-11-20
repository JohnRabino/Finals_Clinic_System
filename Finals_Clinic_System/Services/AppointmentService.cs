using System.Data;
using Finals_Clinic_System.Data;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Services;

public class AppointmentService : IAppointmentService
{
    private readonly ClinicDbContext _db;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IClinicTimeSlotRepository _timeSlotRepository;

    public AppointmentService(
        ClinicDbContext db,
        IAppointmentRepository appointmentRepository,
        IClinicTimeSlotRepository timeSlotRepository)
    {
        _db = db;
        _appointmentRepository = appointmentRepository;
        _timeSlotRepository = timeSlotRepository;
    }

    public Task<List<Appointment>> GetAllAsync() => _appointmentRepository.GetAllAsync();

    public Task<List<Appointment>> GetByPatientIdAsync(int patientId) =>
        _appointmentRepository.GetByPatientIdAsync(patientId);

    public Task<Appointment?> GetByIdAsync(int id) =>
        _appointmentRepository.GetByIdAsync(id);

    public async Task<(bool Success, string Message)> CreateAsync(CreateAppointmentDto dto)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (dto.PatientId <= 0 || !await _appointmentRepository.PatientExistsAndActiveAsync(dto.PatientId))
            return (false, "Patient not found or inactive.");

        if (dto.TimeSlotId <= 0)
            return (false, "A valid time slot is required.");

        if (dto.DoctorId.HasValue &&
            !await _appointmentRepository.DoctorExistsAndActiveAsync(dto.DoctorId.Value))
            return (false, "Doctor not found or inactive.");

        var timeSlot = await _timeSlotRepository.GetByIdAsync(dto.TimeSlotId);

        if (timeSlot == null)
            return (false, "Time slot not found.");

        if (!timeSlot.IsAvailable)
            return (false, "Time slot is no longer available.");

        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        if (timeSlot.SlotDate < today ||
            (timeSlot.SlotDate == today && timeSlot.StartTime <= currentTime))
            return (false, "Cannot book an appointment for a past date or time.");

        if (dto.DoctorId.HasValue)
        {
            var hasConflict = await _appointmentRepository.HasDoctorConflictAsync(
                dto.DoctorId.Value,
                timeSlot.SlotDate,
                timeSlot.StartTime,
                timeSlot.EndTime);

            if (hasConflict)
                return (false, "Doctor already has an appointment during this time.");
        }

        var reservedRows = await _timeSlotRepository.TryReserveAsync(timeSlot.TimeSlotId);
        if (reservedRows != 1)
            return (false, "Time slot is no longer available.");

        timeSlot.IsAvailable = false;

        var appointment = new Appointment
        {
            PatientId = dto.PatientId,
            TimeSlotId = dto.TimeSlotId,
            DoctorId = dto.DoctorId,
            Reason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim(),
            Status = "Booked"
        };

        await _appointmentRepository.AddAsync(appointment);
        await _appointmentRepository.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, "Appointment booked successfully.");
    }

    public async Task<(bool Success, string Message)> UpdateStatusAsync(
        int id,
        UpdateAppointmentStatusDto dto)
    {
        var targetStatus = dto.Status?.Trim();

        if (string.IsNullOrWhiteSpace(targetStatus))
            return (false, "Appointment status is required.");

        var canonicalStatus = new[] { "Booked", "Confirmed", "Completed", "Cancelled" }
            .FirstOrDefault(s => s.Equals(targetStatus, StringComparison.OrdinalIgnoreCase));

        if (canonicalStatus == null)
            return (false, "Invalid appointment status.");

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var appointment = await _appointmentRepository.GetByIdAsync(id);

        if (appointment == null)
            return (false, "Appointment not found.");

        var allowed = appointment.Status switch
        {
            "Booked" => canonicalStatus is "Confirmed" or "Cancelled",
            "Confirmed" => canonicalStatus is "Completed" or "Cancelled",
            _ => false
        };

        if (!allowed)
            return (false, $"The transition from {appointment.Status} to {canonicalStatus} is not allowed.");

        if (canonicalStatus == "Cancelled" &&
            await _db.Consultations.AnyAsync(c => c.AppointmentId == id))
        {
            return (false, "An appointment cannot be cancelled after its consultation has been created.");
        }

        if (canonicalStatus == "Completed" &&
            !await _db.Consultations.AnyAsync(c => c.AppointmentId == id && c.TimeOut.HasValue))
        {
            return (false, "Complete the linked consultation before completing this appointment.");
        }

        appointment.Status = canonicalStatus;
        appointment.TimeSlot.IsAvailable = canonicalStatus == "Cancelled";

        await _appointmentRepository.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, $"Appointment status updated to {canonicalStatus}.");
    }

    public async Task<(bool Success, string Message)> CancelOwnAsync(int id, int patientId)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var appointment = await _appointmentRepository.GetByIdAsync(id);

        if (appointment == null || appointment.PatientId != patientId)
            return (false, "Appointment not found.");

        if (appointment.Status is not ("Booked" or "Confirmed"))
            return (false, "Only booked or confirmed appointments can be cancelled.");

        if (await _db.Consultations.AnyAsync(c => c.AppointmentId == id))
            return (false, "An appointment cannot be cancelled after its consultation has been created.");

        appointment.Status = "Cancelled";
        appointment.TimeSlot.IsAvailable = true;

        await _appointmentRepository.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, "Appointment cancelled successfully.");
    }
}
