namespace Finals_Clinic_System.Models;

public class Patient
{
    public int PatientId { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }

    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();

    public ICollection<MedicalRecord> MedicalRecords { get; set; }
        = new List<MedicalRecord>();

    public ICollection<Consultation> Consultations { get; set; }
        = new List<Consultation>();

    public ICollection<Prescription> Prescriptions { get; set; }
        = new List<Prescription>();

    public ICollection<Referral> Referrals { get; set; }
        = new List<Referral>();

    public ICollection<ManualClinicLog> ManualClinicLogs { get; set; }
        = new List<ManualClinicLog>();
}