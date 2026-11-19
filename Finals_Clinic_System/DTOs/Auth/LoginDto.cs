using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Auth;

public class LoginDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
