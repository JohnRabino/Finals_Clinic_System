
namespace Finals_Clinic_System.DTOs.ExternalDoctors;

public class ExternalDoctorDto
{
    public string FullName { get; set; } = string.Empty;

    public string? Specialization { get; set; }

    public string? ClinicOrHospital { get; set; }

    public string? Address { get; set; }

    public string? ContactNumber { get; set; }

    public string? Email { get; set; }
}
