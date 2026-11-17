namespace Finals_Clinic_System.Models;

public class Referral
{
    public int ReferralId { get; set; }

    public int PatientId { get; set; }
    public int ExternalDoctorId { get; set; }

    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime ReferralDate { get; set; } = DateTime.Now;

    public Patient Patient { get; set; } = null!;
    public ExternalDoctor ExternalDoctor { get; set; } = null!;
}