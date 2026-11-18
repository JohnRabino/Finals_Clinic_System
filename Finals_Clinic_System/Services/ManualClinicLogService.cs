
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ManualClinicLogService : IManualClinicLogService
{
    private readonly IManualClinicLogRepository _repository;

    public ManualClinicLogService(IManualClinicLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ManualClinicLog>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<ManualClinicLog?> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<ManualClinicLog?> CreateAsync(
        CreateManualClinicLogDto dto,
        int nurseUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.PatientName) ||
            string.IsNullOrWhiteSpace(dto.Complaint) ||
            dto.VisitDate == DateTime.MinValue)
        {
            return null;
        }

        if (dto.PatientId.HasValue &&
            !await _repository.PatientExistsAsync(dto.PatientId.Value))
        {
            return null;
        }

        var log = new ManualClinicLog
        {
            PatientId = dto.PatientId,
            PatientName = dto.PatientName,
            VisitDate = dto.VisitDate,
            Complaint = dto.Complaint,
            Notes = dto.Notes,
            EncodedByUserId = nurseUserId,
            EncodedAt = DateTime.Now
        };

        await _repository.AddAsync(log);
        await _repository.SaveAsync();

        return await _repository.GetByIdAsync(log.ManualLogId);
    }
}
