
using Finals_Clinic_System.DTOs.Patients;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IPatientService
{
    Task<List<Patient>> GetAllAsync();

    Task<Patient?> GetByIdAsync(int id);

    Task<Patient?> GetByUserIdAsync(int userId);

    Task<(bool Success, string Message, Patient? Data)>
        CreateAsync(PatientCreateDto dto);

    Task<(bool Success, string Message, Patient? Data)>
        UpdateAsync(int id, PatientUpdateDto dto);

    Task<bool> DeactivateAsync(int id);
}
