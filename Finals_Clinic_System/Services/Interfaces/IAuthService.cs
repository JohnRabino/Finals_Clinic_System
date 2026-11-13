using Finals_Clinic_System.DTOs.Auth;
namespace Finals_Clinic_System.Services.Interfaces;
public interface IAuthService
{
    Task&lt;(bool Success, string Message, AuthResponseDto? Data)&gt; RegisterAsync(RegisterDto dto);
    Task&lt;(bool Success, string Message, AuthResponseDto? Data)&gt; LoginAsync(LoginDto dto);
}