using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateReferralDto
{
    [Range(1, int.MaxValue)]
    public int PatientId { get; set; }

    [Range(1, int.MaxValue)]
    public int ExternalDoctorId { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Reason { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }
}
