
namespace Finals_Clinic_System.DTOs;

public class UpdateReferralResponseDto
{
    public string ReturnedFindings { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Treatment { get; set; } = string.Empty;
    public string? ReturnedPrescription { get; set; }
}
