using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Patients;

public class PatientCreateDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;
}
