namespace Finals_Clinic_System.Models;

public class ManualClinicLog
{
    public int ManualLogId { get; set; }

    public int? PatientId { get; set; }

    public string PatientName { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }

    public string Complaint { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public int EncodedByUserId { get; set; }
    public DateTime EncodedAt { get; set; } = DateTime.Now;
}