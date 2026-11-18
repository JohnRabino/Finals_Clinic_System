
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IMedicalRecordRepository
{
    Task<List<MedicalRecord>> GetAllAsync();
    Task<List<MedicalRecord>> GetByPatientIdAsync(int patientId);
    Task<MedicalRecord?> GetByIdAsync(int id);
    Task AddAsync(MedicalRecord record);
    Task SaveChangesAsync();
}
