
using Finals_Clinic_System.DTOs.ExternalDoctors;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IExternalDoctorService
{
    Task<List<ExternalDoctor>> GetAllAsync();

    Task<ExternalDoctor?> GetByIdAsync(int id);

    Task<(bool Success, string Message, ExternalDoctor? Data)>
        CreateAsync(ExternalDoctorDto dto);

    Task<(bool Success, string Message, ExternalDoctor? Data)>
        UpdateAsync(int id, ExternalDoctorDto dto);

    Task<bool> DeactivateAsync(int id);
}
