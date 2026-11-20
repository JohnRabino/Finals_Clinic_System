using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateManualClinicLogDto
{
    [Range(1, int.MaxValue)]
    public int? PatientId { get; set; }

    [StringLength(120)]
    public string? PatientName { get; set; }

    public DateTime VisitDate { get; set; }

    [Required]
    [StringLength(1000, MinimumLength = 2)]
    public string Complaint { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Notes { get; set; }
}
