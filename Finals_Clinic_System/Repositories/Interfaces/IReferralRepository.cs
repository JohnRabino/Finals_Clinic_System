
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Repositories.Interfaces;

public interface IReferralRepository
{
    Task<List<Referral>> GetAllAsync();
    Task<List<Referral>> GetByPatientIdAsync(int patientId);
    Task<Referral?> GetByIdAsync(int id);
    Task<bool> PatientExistsAsync(int patientId);
    Task<bool> ExternalDoctorExistsAsync(int externalDoctorId);
    Task<bool> ExternalDoctorIsActiveAsync(int externalDoctorId);
    Task AddAsync(Referral referral);
    Task SaveAsync();
}
