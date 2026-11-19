using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class UpdateReferralResponseDto
{
    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string ReturnedFindings { get; set; } = string.Empty;

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Diagnosis { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string Treatment { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? ReturnedPrescription { get; set; }
}
