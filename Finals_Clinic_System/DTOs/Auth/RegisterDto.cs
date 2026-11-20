using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string StudentNumber { get; set; } = string.Empty;
}
