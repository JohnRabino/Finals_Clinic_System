
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IManualClinicLogRepository
{
    Task<List<ManualClinicLog>> GetAllAsync();
    Task<ManualClinicLog?> GetByIdAsync(int id);
    Task<bool> PatientExistsAsync(int patientId);
    Task AddAsync(ManualClinicLog log);
    Task SaveAsync();
}
