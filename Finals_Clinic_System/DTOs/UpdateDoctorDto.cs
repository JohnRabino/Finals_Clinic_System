using System.ComponentModel.DataAnnotations;
namespace Finals_Clinic_System.DTOs;
public class UpdateDoctorDto
{
    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string Specialty { get; set; } = string.Empty;
}
