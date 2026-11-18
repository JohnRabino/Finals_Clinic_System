
namespace Finals_Clinic_System.DTOs.Admin;

public class CreateStaffAccountDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Specialty { get; set; }
}
