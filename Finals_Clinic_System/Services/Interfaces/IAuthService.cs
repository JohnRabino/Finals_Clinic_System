using Finals_Clinic_System.DTOs.Auth;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IAuthService
{
    Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterDto dto);
    Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginDto dto);
}
