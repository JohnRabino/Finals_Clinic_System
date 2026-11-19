using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.ExternalDoctors;

public class ExternalDoctorDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(120)]
    public string? Specialization { get; set; }

    [StringLength(200)]
    public string? ClinicOrHospital { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(30)]
    public string? ContactNumber { get; set; }

    [EmailAddress]
    [StringLength(254)]
    public string? Email { get; set; }
}
