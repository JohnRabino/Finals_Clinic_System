using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateMedicalRecordDto
{
    [Range(1, int.MaxValue)]
    public int PatientId { get; set; }

    [Range(1, int.MaxValue)]
    public int ConsultationId { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Diagnosis { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string Treatment { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }
}
