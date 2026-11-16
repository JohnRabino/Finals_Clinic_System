namespace Finals_Clinic_System.DTOs;

public class CreateConsultationDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }

    public string Complaint { get; set; } = string.Empty;

    public string? BloodPressure { get; set; }
    public decimal? Temperature { get; set; }

    public string? Assessment { get; set; }
    public string? AssistanceProvided { get; set; }
    public string? Notes { get; set; }
    public string? FollowUpInstructions { get; set; }
}
