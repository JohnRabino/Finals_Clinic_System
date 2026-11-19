using Finals_Clinic_System.DTOs;
namespace Finals_Clinic_System.Services.Interfaces;
public interface IDoctorService
{
    Task<List<DoctorDto>> GetActiveAsync();
    Task<DoctorDto?> GetActiveByIdAsync(int id);
    Task<DoctorDto?> GetMyProfileAsync(int userId);
    Task<(bool Success, string Message, DoctorDto? Data)> UpdateAsync(int id, UpdateDoctorDto dto);
}
