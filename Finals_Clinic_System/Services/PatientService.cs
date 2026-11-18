
using Finals_Clinic_System.DTOs.Patients;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _repository;

    public PatientService(IPatientRepository repository)
    {
        _repository = repository;
    }

    public Task<List<Patient>> GetAllAsync() =>
        _repository.GetAllAsync();

    public Task<Patient?> GetByIdAsync(int id) =>
        _repository.GetByIdAsync(id);

    public async Task<Patient?> GetByUserIdAsync(int userId)
    {
        var patient = await _repository.GetByUserIdAsync(userId);

        if (patient == null || !patient.IsActive ||
            patient.User == null || !patient.User.IsActive)
            return null;

        return patient;
    }

    public async Task<(bool Success, string Message, Patient? Data)>
        CreateAsync(PatientCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            return (false, "Student name is required.", null);

        var patient = new Patient
        {
            FullName = dto.FullName.Trim(),
            IsActive = true
        };

        await _repository.AddAsync(patient);
        await _repository.SaveChangesAsync();

        return (true, "Student profile created.", patient);
    }

    public async Task<(bool Success, string Message, Patient? Data)>
        UpdateAsync(int id, PatientUpdateDto dto)
    {
        var patient = await _repository.GetByIdAsync(id);

        if (patient is null)
            return (false, "Patient not found.", null);

        if (string.IsNullOrWhiteSpace(dto.FullName))
            return (false, "Student name is required.", null);

        patient.FullName = dto.FullName.Trim();
        patient.IsActive = dto.IsActive;

        await _repository.SaveChangesAsync();

        return (true, "Student profile updated.", patient);
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var patient = await _repository.GetByIdAsync(id);

        if (patient is null)
            return false;

        patient.IsActive = false;

        await _repository.SaveChangesAsync();

        return true;
    }
}
