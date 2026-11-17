using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IConsultationRepository
{
    Task<List<Consultation>> GetAllAsync();
    Task<List<Consultation>> GetByPatientIdAsync(int patientId);
    Task<Consultation?> GetByIdAsync(int id);
    Task AddAsync(Consultation consultation);
    Task SaveChangesAsync();
}