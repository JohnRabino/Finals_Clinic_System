namespace Finals_Clinic_System.DTOs;

public class CreateMedicalRecordDto
{
    public int PatientId { get; set; }
    public int ConsultationId { get; set; }

    public string Diagnosis { get; set; } = string.Empty;
    public string Treatment { get; set; } = string.Empty;
    public string? Notes { get; set; }
}