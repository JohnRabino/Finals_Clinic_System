namespace Finals_Clinic_System.DTOs.Reports;

public class PatientHistoryDto
{
    public int PatientId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public List<ConsultationHistoryDto> Consultations { get; set; } = new();
    public List<MedicalRecordHistoryDto> MedicalRecords { get; set; } = new();
    public List<PrescriptionHistoryDto> Prescriptions { get; set; } = new();
    public List<ReferralHistoryDto> Referrals { get; set; } = new();
}

public class ConsultationHistoryDto
{
    public int ConsultationId { get; set; }
    public DateTime ConsultationDate { get; set; }
    public TimeOnly TimeIn { get; set; }
    public TimeOnly? TimeOut { get; set; }
    public string Complaint { get; set; } = string.Empty;
    public string? DoctorName { get; set; }
    public string? Assessment { get; set; }
    public string? DoctorAssessment { get; set; }
    public string? AssistanceProvided { get; set; }
    public string? Notes { get; set; }
    public string? FollowUpInstructions { get; set; }
}

public class MedicalRecordHistoryDto
{
    public int RecordId { get; set; }
    public DateTime RecordDate { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string Treatment { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? DoctorName { get; set; }
}

public class PrescriptionHistoryDto
{
    public int PrescriptionId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string PrescribingDoctorName { get; set; } = string.Empty;
    public DateTime PrescriptionDate { get; set; }
}

public class ReferralHistoryDto
{
    public int ReferralId { get; set; }
    public string ExternalDoctorName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ReturnedFindings { get; set; }
    public string? Diagnosis { get; set; }
    public string? Treatment { get; set; }
    public string? ReturnedPrescription { get; set; }
    public DateTime ReferralDate { get; set; }
    public DateTime? ResponseDate { get; set; }
}