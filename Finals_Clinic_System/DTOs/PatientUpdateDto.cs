
using System.ComponentModel.DataAnnotations;

namespace Finals_Clinic_System.DTOs.Patients;

public class PatientUpdateDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
