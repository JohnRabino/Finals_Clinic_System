
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ConsultationService : IConsultationService
{
    private readonly IConsultationRepository _repository;
    private readonly IAppointmentRepository _appointmentRepository;

    public ConsultationService(
        IConsultationRepository repository,
        IAppointmentRepository appointmentRepository)
    {
        _repository = repository;
        _appointmentRepository = appointmentRepository;
    }

    public Task<List<Consultation>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public Task<List<Consultation>> GetByPatientIdAsync(int patientId)
    {
        return _repository.GetByPatientIdAsync(patientId);
    }

    public Task<List<Consultation>> GetByDoctorUserIdAsync(int userId)
    {
        return _repository.GetByDoctorUserIdAsync(userId);
    }

    public async Task<(bool Success, string Message)> CreateAsync(
        CreateConsultationDto dto, int nurseUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Complaint))
            return (false, "Complaint is required.");

        int? doctorId = dto.DoctorId;

        if (dto.AppointmentId.HasValue)
        {
            var appointment = await _appointmentRepository
                .GetByIdAsync(dto.AppointmentId.Value);

            if (appointment == null)
                return (false, "Appointment not found.");

            if (appointment.PatientId != dto.PatientId)
                return (false, "Appointment does not belong to this patient.");

            if (appointment.Status == "Cancelled" ||
                appointment.Status == "Completed")
            {
                return (false, "Cannot create consultation for this appointment.");
            }

            if (appointment.DoctorId.HasValue)
            {
                if (dto.DoctorId.HasValue &&
                    dto.DoctorId != appointment.DoctorId)
                {
                    return (false, "Doctor does not match the appointment assignment.");
                }

                doctorId = appointment.DoctorId;
            }
        }

        var consultation = new Consultation
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            NurseUserId = nurseUserId,
            DoctorId = doctorId,
            ConsultationDate = DateTime.Now,
            TimeIn = TimeOnly.FromDateTime(DateTime.Now),
            Complaint = dto.Complaint,
            BloodPressure = dto.BloodPressure,
            Temperature = dto.Temperature,
            Assessment = dto.Assessment,
            AssistanceProvided = dto.AssistanceProvided,
            Notes = dto.Notes,
            FollowUpInstructions = dto.FollowUpInstructions
        };

        await _repository.AddAsync(consultation);
        await _repository.SaveChangesAsync();

        return (true, "Consultation recorded successfully.");
    }

    public async Task<(bool Success, string Message)> SubmitDoctorAssessmentAsync(
        int id, CreateDoctorAssessmentDto dto, int doctorUserId)
    {
        var consultation = await _repository.GetByIdAsync(id);

        if (consultation == null)
            return (false, "Consultation not found.");

        if (consultation.Doctor == null ||
            consultation.Doctor.UserId != doctorUserId)
        {
            return (false, "You are not assigned to this consultation.");
        }

        if (consultation.TimeOut.HasValue)
            return (false, "Cannot update a completed consultation.");

        if (consultation.DoctorReviewedAt.HasValue)
            return (false, "Doctor assessment has already been submitted.");

        if (string.IsNullOrWhiteSpace(dto.DoctorAssessment))
            return (false, "Doctor assessment is required.");

        consultation.DoctorAssessment = dto.DoctorAssessment;
        consultation.DoctorReviewedAt = DateTime.Now;

        await _repository.SaveChangesAsync();

        return (true, "Doctor assessment submitted successfully.");
    }

    public async Task<(bool Success, string Message)> CompleteAsync(
        int id, CompleteConsultationDto dto)
    {
        var consultation = await _repository.GetByIdAsync(id);

        if (consultation == null)
            return (false, "Consultation not found.");

        if (consultation.TimeOut.HasValue)
            return (false, "Consultation is already completed.");

        consultation.TimeOut = TimeOnly.FromDateTime(DateTime.Now);

        if (!string.IsNullOrWhiteSpace(dto.Notes))
            consultation.Notes = dto.Notes;

        await _repository.SaveChangesAsync();

        return (true, "Consultation completed successfully.");
    }
}
