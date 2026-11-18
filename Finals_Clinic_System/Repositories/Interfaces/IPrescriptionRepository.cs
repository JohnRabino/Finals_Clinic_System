
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetAllAsync();
    Task<List<Prescription>> GetByPatientIdAsync(int patientId);
    Task<List<Prescription>> GetByConsultationIdAsync(int consultationId);
    Task<Prescription?> GetByIdAsync(int id);
    Task AddAsync(Prescription prescription);
    Task SaveAsync();
}
