
using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs;

public class CreateDoctorAssessmentDto
{
    [Required]
    public string DoctorAssessment { get; set; } = string.Empty;
}
