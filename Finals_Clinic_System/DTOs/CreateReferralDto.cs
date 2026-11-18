
namespace Finals_Clinic_System.DTOs;

public class CreateReferralDto
{
    public int PatientId { get; set; }
    public int ExternalDoctorId { get; set; }

    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
