namespace Finals_Clinic_System.Models;

public class Consultation
{
    public int ConsultationId { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public int NurseUserId { get; set; }

    public DateTime ConsultationDate { get; set; } = DateTime.Now;
    public TimeOnly TimeIn { get; set; }
    public TimeOnly? TimeOut { get; set; }

    public string Complaint { get; set; } = string.Empty;

    public string? BloodPressure { get; set; }
    public decimal? Temperature { get; set; }

    public string? Assessment { get; set; }
    public string? AssistanceProvided { get; set; }
    public string? Notes { get; set; }
    public string? FollowUpInstructions { get; set; }
}