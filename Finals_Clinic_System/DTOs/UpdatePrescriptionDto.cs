using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class UpdatePrescriptionDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string MedicineName { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Dosage { get; set; } = string.Empty;

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Instructions { get; set; } = string.Empty;
}
