using Finals_Clinic_System.Data;
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Finals_Clinic_System.Services;

public class ConsultationService : IConsultationService
{
    private readonly ClinicDbContext _db;
    private readonly IConsultationRepository _repository;
    private readonly IAppointmentRepository _appointmentRepository;

    public ConsultationService(
        ClinicDbContext db,
        IConsultationRepository repository,
        IAppointmentRepository appointmentRepository)
    {
        _db = db;
        _repository = repository;
        _appointmentRepository = appointmentRepository;
    }

    public Task<List<Consultation>> GetAllAsync() => _repository.GetAllAsync();

    public Task<List<Consultation>> GetByPatientIdAsync(int patientId) =>
        _repository.GetByPatientIdAsync(patientId);

    public Task<List<Consultation>> GetByDoctorUserIdAsync(int userId) =>
        _repository.GetByDoctorUserIdAsync(userId);

    public Task<Consultation?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<(bool Success, string Message)> CreateAsync(
        CreateConsultationDto dto,
        int nurseUserId)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        if (dto.PatientId <= 0 || string.IsNullOrWhiteSpace(dto.Complaint))
            return (false, "A valid patient and complaint are required.");

        int? doctorId = dto.DoctorId;

        if (dto.AppointmentId.HasValue)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(dto.AppointmentId.Value);

            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.PatientId != dto.PatientId)
                return (false, "Appointment does not belong to this patient.");

            if (appointment.Status != "Confirmed")
                return (false, "A consultation can only be created for a confirmed appointment.");

            if (await _repository.HasAppointmentConsultationAsync(dto.AppointmentId.Value))
                return (false, "A consultation already exists for this appointment.");

            if (appointment.DoctorId.HasValue)
            {
                if (dto.DoctorId.HasValue && dto.DoctorId != appointment.DoctorId)
                    return (false, "Doctor does not match the appointment assignment.");

                doctorId = appointment.DoctorId;
            }
        }

        if (!await _appointmentRepository.PatientExistsAndActiveAsync(dto.PatientId))
            return (false, "Patient not found or inactive.");

        if (doctorId.HasValue &&
            !await _appointmentRepository.DoctorExistsAndActiveAsync(doctorId.Value))
            return (false, "Doctor not found or inactive.");

        var now = DateTime.Now;
        var consultation = new Consultation
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            NurseUserId = nurseUserId,
            DoctorId = doctorId,
            ConsultationDate = now,
            TimeIn = TimeOnly.FromDateTime(now),
            Complaint = dto.Complaint.Trim(),
            BloodPressure = dto.BloodPressure?.Trim(),
            Temperature = dto.Temperature,
            Assessment = dto.Assessment?.Trim(),
            AssistanceProvided = dto.AssistanceProvided?.Trim(),
            Notes = dto.Notes?.Trim(),
            FollowUpInstructions = dto.FollowUpInstructions?.Trim()
        };

        await _repository.AddAsync(consultation);
        await _repository.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, "Consultation recorded successfully.");
    }

    public async Task<(bool Success, string Message)> SubmitDoctorAssessmentAsync(
        int id,
        CreateDoctorAssessmentDto dto,
        int doctorUserId)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var consultation = await _repository.GetByIdAsync(id);

        if (consultation == null)
            return (false, "Consultation not found.");

        if (consultation.Doctor == null || consultation.Doctor.UserId != doctorUserId)
            return (false, "You are not assigned to this consultation.");

        if (consultation.TimeOut.HasValue)
            return (false, "Cannot update a completed consultation.");

        if (consultation.DoctorReviewedAt.HasValue)
            return (false, "Doctor assessment has already been submitted.");

        if (string.IsNullOrWhiteSpace(dto.DoctorAssessment))
            return (false, "Doctor assessment is required.");

        consultation.DoctorAssessment = dto.DoctorAssessment.Trim();
        consultation.DoctorReviewedAt = DateTime.Now;

        await _repository.SaveChangesAsync();
        await transaction.CommitAsync();
        return (true, "Doctor assessment submitted successfully.");
    }

    public async Task<(bool Success, string Message)> CompleteAsync(
        int id,
        CompleteConsultationDto dto)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var consultation = await _repository.GetByIdAsync(id);

        if (consultation == null)
            return (false, "Consultation not found.");

        if (consultation.TimeOut.HasValue)
            return (false, "Consultation is already completed.");

        if (consultation.DoctorId.HasValue && !consultation.DoctorReviewedAt.HasValue)
            return (false, "Doctor assessment is required before completing this consultation.");

        if (consultation.Appointment != null)
        {
            if (consultation.Appointment.Status != "Confirmed")
                return (false, "The linked appointment must still be confirmed before completing the consultation.");

            consultation.Appointment.Status = "Completed";
            consultation.Appointment.TimeSlot.IsAvailable = false;
        }

        consultation.TimeOut = TimeOnly.FromDateTime(DateTime.Now);

        if (!string.IsNullOrWhiteSpace(dto.Notes))
            consultation.Notes = dto.Notes.Trim();

        await _repository.SaveChangesAsync();
        await transaction.CommitAsync();
        return (true, "Consultation completed successfully.");
    }
}
