
using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Admin;

public class CreateStaffAccountDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    public string? Specialty { get; set; }
}
