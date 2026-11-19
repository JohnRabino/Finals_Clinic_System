using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateDoctorAssessmentDto
{
    [Required]
    [StringLength(2000, MinimumLength = 2)]
    public string DoctorAssessment { get; set; } = string.Empty;
}
