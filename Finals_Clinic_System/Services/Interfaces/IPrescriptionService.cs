using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IPrescriptionService
{
    Task<List<Prescription>> GetAllAsync();
    Task<List<Prescription>> GetByPatientIdAsync(int patientId);
    Task<List<Prescription>> GetByDoctorUserIdAsync(int userId);
    Task<Prescription?> GetByIdAsync(int id);
    Task<Prescription?> CreateAsync(CreatePrescriptionDto dto, int? doctorUserId);
    Task<Prescription?> UpdateAsync(int id, UpdatePrescriptionDto dto);
    Task<bool> DeleteAsync(int id);
}
