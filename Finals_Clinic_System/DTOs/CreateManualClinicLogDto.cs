using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateManualClinicLogDto
{
    [Range(1, int.MaxValue)]
    public int? PatientId { get; set; }

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string PatientName { get; set; } = string.Empty;

    public DateTime VisitDate { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Complaint { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }
}
