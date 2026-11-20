using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Patients;

public class PatientUpdateDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
