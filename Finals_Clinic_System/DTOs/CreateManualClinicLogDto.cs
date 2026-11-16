namespace Finals_Clinic_System.DTOs;

public class CreateManualClinicLogDto
{
    public int? PatientId { get; set; }

    public string PatientName { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }

    public string Complaint { get; set; } = string.Empty;
    public string? Notes { get; set; }
}