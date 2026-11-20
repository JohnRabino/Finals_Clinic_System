
using Finals_Clinic_System.DTOs.ExternalDoctors;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ExternalDoctorService : IExternalDoctorService
{
    private readonly IExternalDoctorRepository _repository;

    public ExternalDoctorService(IExternalDoctorRepository repository)
    {
        _repository = repository;
    }

    public Task<List<ExternalDoctor>> GetAllAsync() =>
        _repository.GetAllAsync();

    public Task<ExternalDoctor?> GetByIdAsync(int id) =>
        _repository.GetByIdAsync(id);

    public async Task<(bool Success, string Message, ExternalDoctor? Data)>
        CreateAsync(ExternalDoctorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            return (false, "Doctor name is required.", null);

        var doctor = new ExternalDoctor
        {
            FullName = dto.FullName.Trim(),
            Specialization = dto.Specialization?.Trim(),
            ClinicOrHospital = dto.ClinicOrHospital?.Trim(),
            Address = dto.Address?.Trim(),
            ContactNumber = dto.ContactNumber?.Trim(),
            Email = dto.Email?.Trim().ToLowerInvariant(),
            IsActive = true
        };

        await _repository.AddAsync(doctor);
        await _repository.SaveChangesAsync();

        return (true, "External doctor contact created.", doctor);
    }

    public async Task<(bool Success, string Message, ExternalDoctor? Data)>
        UpdateAsync(int id, ExternalDoctorDto dto)
    {
        var doctor = await _repository.GetByIdAsync(id);

        if (doctor is null)
            return (false, "External doctor not found.", null);

        if (string.IsNullOrWhiteSpace(dto.FullName))
            return (false, "Doctor name is required.", null);

        doctor.FullName = dto.FullName.Trim();
        doctor.Specialization = dto.Specialization?.Trim();
        doctor.ClinicOrHospital = dto.ClinicOrHospital?.Trim();
        doctor.Address = dto.Address?.Trim();
        doctor.ContactNumber = dto.ContactNumber?.Trim();
        doctor.Email = dto.Email?.Trim().ToLowerInvariant();

        await _repository.SaveChangesAsync();

        return (true, "External doctor contact updated.", doctor);
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var doctor = await _repository.GetByIdAsync(id);

        if (doctor is null)
            return false;

        doctor.IsActive = false;

        await _repository.SaveChangesAsync();

        return true;
    }
}
