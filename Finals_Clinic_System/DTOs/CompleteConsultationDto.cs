using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CompleteConsultationDto
{
    [StringLength(2000)]
    public string? Notes { get; set; }
}
