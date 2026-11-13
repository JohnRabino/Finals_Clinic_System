using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IMedicalRecordRepository
{
    Task<List<MedicalRecord>> GetAllAsync();

    Task<MedicalRecord?> GetByIdAsync(int id);

    Task<List<MedicalRecord>> GetPatientHistoryAsync(int patientId);

    Task AddAsync(MedicalRecord record);

    void Remove(MedicalRecord record);

    Task SaveChangesAsync();
}
