
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IMedicalRecordService
{
    Task<List<MedicalRecord>> GetAllAsync();
    Task<List<MedicalRecord>> GetByPatientIdAsync(int patientId);
    Task<(bool Success, string Message)> CreateAsync(CreateMedicalRecordDto dto);
}
