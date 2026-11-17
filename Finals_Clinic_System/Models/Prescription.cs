namespace Finals_Clinic_System.Models;

public class Prescription
{
    public int PrescriptionId { get; set; }

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int ConsultationId { get; set; }
    public Consultation Consultation { get; set; } = null!;

    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;

    public string PrescribingDoctorName { get; set; } = string.Empty;

    public DateTime PrescriptionDate { get; set; } = DateTime.Now;
}