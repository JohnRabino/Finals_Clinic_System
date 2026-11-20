using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateConsultationDto
{
    [Range(1, int.MaxValue)]
    public int PatientId { get; set; }

    [Range(1, int.MaxValue)]
    public int? AppointmentId { get; set; }

    [Range(1, int.MaxValue)]
    public int? DoctorId { get; set; }

    [Required]
    [StringLength(500, MinimumLength = 2)]
    public string Complaint { get; set; } = string.Empty;

    [StringLength(30)]
    public string? BloodPressure { get; set; }

    [Range(typeof(decimal), "25", "50")]
    public decimal? Temperature { get; set; }

    [StringLength(1000)]
    public string? Assessment { get; set; }

    [StringLength(1000)]
    public string? AssistanceProvided { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    [StringLength(1000)]
    public string? FollowUpInstructions { get; set; }
}
