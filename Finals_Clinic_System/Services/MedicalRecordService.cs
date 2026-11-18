
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly IMedicalRecordRepository _repository;
    private readonly IConsultationRepository _consultationRepository;

    public MedicalRecordService(
        IMedicalRecordRepository repository,
        IConsultationRepository consultationRepository)
    {
        _repository = repository;
        _consultationRepository = consultationRepository;
    }

    public Task<List<MedicalRecord>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public Task<List<MedicalRecord>> GetByPatientIdAsync(int patientId)
    {
        return _repository.GetByPatientIdAsync(patientId);
    }

    public async Task<(bool Success, string Message)> CreateAsync(
        CreateMedicalRecordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Diagnosis))
            return (false, "Diagnosis is required.");

        if (string.IsNullOrWhiteSpace(dto.Treatment))
            return (false, "Treatment is required.");

        var consultation = await _consultationRepository.GetByIdAsync(
            dto.ConsultationId);

        if (consultation == null)
            return (false, "Consultation not found.");

        if (consultation.PatientId != dto.PatientId)
            return (false, "Consultation does not belong to this patient.");

        var record = new MedicalRecord
        {
            PatientId = consultation.PatientId,
            ConsultationId = consultation.ConsultationId,
            DoctorId = consultation.DoctorId,
            AppointmentId = consultation.AppointmentId,
            Diagnosis = dto.Diagnosis,
            Treatment = dto.Treatment,
            Notes = dto.Notes,
            RecordDate = DateTime.Now
        };

        await _repository.AddAsync(record);
        await _repository.SaveChangesAsync();

        return (true, "Medical record created successfully.");
    }
}
