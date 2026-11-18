
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IPrescriptionService
{
    Task<List<Prescription>> GetAllAsync();
    Task<List<Prescription>> GetByPatientIdAsync(int patientId);
    Task<Prescription?> CreateAsync(CreatePrescriptionDto dto, int? doctorUserId);
}
