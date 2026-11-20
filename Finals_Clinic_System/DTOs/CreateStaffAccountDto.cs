using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Admin;

public class CreateStaffAccountDto
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
    public string Role { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Specialty { get; set; }
}
