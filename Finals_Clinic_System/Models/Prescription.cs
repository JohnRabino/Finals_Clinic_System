namespace Finals_Clinic_System.Models;

public class Prescription
{
    public int PrescriptionId { get; set; }

    public int PatientId { get; set; }
    public int ConsultationId { get; set; }

    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;

    public string PrescribingDoctorName { get; set; } = string.Empty;

    public DateTime PrescriptionDate { get; set; } = DateTime.Now;

    public Patient Patient { get; set; } = null!;
    public Consultation Consultation { get; set; } = null!;
}