
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IManualClinicLogService
{
    Task<List<ManualClinicLog>> GetAllAsync();
    Task<ManualClinicLog?> GetByIdAsync(int id);
    Task<ManualClinicLog?> CreateAsync(CreateManualClinicLogDto dto, int nurseUserId);
}

