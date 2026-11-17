using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ConsultationService : IConsultationService
{
    private readonly IConsultationRepository _repository;

    public ConsultationService(IConsultationRepository repository)
    {
        _repository = repository;
    }

    public Task<List<Consultation>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public Task<List<Consultation>> GetByPatientIdAsync(int patientId)
    {
        return _repository.GetByPatientIdAsync(patientId);
    }

    public async Task<(bool Success, string Message)> CreateAsync(
        CreateConsultationDto dto, int nurseUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Complaint))
            return (false, "Complaint is required.");

        var consultation = new Consultation
        {
            PatientId = dto.PatientId,
            AppointmentId = dto.AppointmentId,
            NurseUserId = nurseUserId,
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