using Finals_Clinic_System.DTOs.Admin;
namespace Finals_Clinic_System.Services.Interfaces;
public interface IAdminUserService
{
    Task<List<AdminUserDto>> GetAllAsync();
    Task<AdminUserDto?> GetByIdAsync(int id);
    Task<(bool Success, string Message, AdminUserDto? Data)> CreateAsync(CreateStaffAccountDto dto);
    Task<(bool Success, string Message)> SetActiveAsync(int id, bool isActive, int currentAdminId);
}
