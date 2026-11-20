using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreatePrescriptionDto
{
    [Range(1, int.MaxValue)]
    public int PatientId { get; set; }

    [Range(1, int.MaxValue)]
    public int ConsultationId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string MedicineName { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Dosage { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Instructions { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int? ExternalDoctorId { get; set; }
}
