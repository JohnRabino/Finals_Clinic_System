namespace Finals_Clinic_System.Models;

public class MedicalRecord
{
    public int RecordId { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int ConsultationId { get; set; }

    public string Diagnosis { get; set; } = string.Empty;
    public string Treatment { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public DateTime RecordDate { get; set; } = DateTime.Now;
}