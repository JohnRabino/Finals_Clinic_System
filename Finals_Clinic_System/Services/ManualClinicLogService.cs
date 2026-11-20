
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ManualClinicLogService : IManualClinicLogService
{
    private readonly IManualClinicLogRepository _repository;
    private readonly IPatientRepository _patientRepository;

    public ManualClinicLogService(
        IManualClinicLogRepository repository,
        IPatientRepository patientRepository)
    {
        _repository = repository;
        _patientRepository = patientRepository;
    }

    public Task<List<ManualClinicLog>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public Task<ManualClinicLog?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public async Task<ManualClinicLog?> CreateAsync(
        CreateManualClinicLogDto dto,
        int nurseUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Complaint) ||
            dto.VisitDate == DateTime.MinValue ||
            dto.VisitDate > DateTime.Now)
        {
            return null;
        }

        Patient? registeredPatient = null;
        if (dto.PatientId.HasValue)
        {
            registeredPatient = await _patientRepository.GetByIdAsync(dto.PatientId.Value);
            if (registeredPatient == null || !registeredPatient.IsActive ||
                (registeredPatient.UserId.HasValue &&
                 (registeredPatient.User == null || !registeredPatient.User.IsActive)))
            {
                return null;
            }
        }
        else if (string.IsNullOrWhiteSpace(dto.PatientName))
        {
            return null;
        }

        var patientName = registeredPatient?.FullName ?? dto.PatientName?.Trim() ?? string.Empty;
        var log = new ManualClinicLog
        {
            PatientId = registeredPatient?.PatientId,
            PatientName = patientName,
            VisitDate = dto.VisitDate,
            Complaint = dto.Complaint.Trim(),
            Notes = dto.Notes,
            EncodedByUserId = nurseUserId,
            EncodedAt = DateTime.Now
        };

        await _repository.AddAsync(log);
        await _repository.SaveAsync();

        return await _repository.GetByIdAsync(log.ManualLogId);
    }
}
