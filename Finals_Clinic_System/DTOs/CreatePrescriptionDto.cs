namespace Finals_Clinic_System.DTOs;

public class CreatePrescriptionDto
{
    public int PatientId { get; set; }
    public int ConsultationId { get; set; }

    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;

}