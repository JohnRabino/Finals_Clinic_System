namespace Finals_Clinic_System.Models;

public class ExternalDoctor
{
    public int ExternalDoctorId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public string? ClinicOrHospital { get; set; }
    public string? Address { get; set; }
    public string? ContactNumber { get; set; }
    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Referral> Referrals { get; set; }
        = new List<Referral>();
}