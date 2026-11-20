using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IClinicTimeSlotService
{
    Task<List<ClinicTimeSlot>> GetAvailableAsync(DateOnly? date);
    Task<List<ClinicTimeSlot>> GetAllAsync();
    Task<ClinicTimeSlot?> GetByIdAsync(int id);
    Task<(bool Success, string Message)> CreateAsync(CreateClinicTimeSlotDto dto);
}
