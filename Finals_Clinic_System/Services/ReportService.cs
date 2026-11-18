using Finals_Clinic_System.DTOs.Reports;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _repository;

    public ReportService(IReportRepository repository)
    {
        _repository = repository;
    }

    public async Task<PatientHistoryDto?> GetPatientHistoryAsync(int patientId)
    {
        var patient = await _repository.GetPatientHistoryAsync(patientId);

        if (patient == null)
            return null;

        return new PatientHistoryDto
        {
            PatientId = patient.PatientId,
            FullName = patient.FullName,
            IsActive = patient.IsActive,

            Consultations = patient.Consultations
                .OrderByDescending(c => c.ConsultationDate)
                .Select(c => new ConsultationHistoryDto
                {
                    ConsultationId = c.ConsultationId,
                    ConsultationDate = c.ConsultationDate,
                    TimeIn = c.TimeIn,
                    TimeOut = c.TimeOut,
                    Complaint = c.Complaint,
                    DoctorName = c.Doctor?.FullName,
                    Assessment = c.Assessment,
                    DoctorAssessment = c.DoctorAssessment,
                    AssistanceProvided = c.AssistanceProvided,
                    Notes = c.Notes,
                    FollowUpInstructions = c.FollowUpInstructions
                }).ToList(),

            MedicalRecords = patient.MedicalRecords
                .OrderByDescending(r => r.RecordDate)
                .Select(r => new MedicalRecordHistoryDto
                {
                    RecordId = r.RecordId,
                    RecordDate = r.RecordDate,
                    Diagnosis = r.Diagnosis,
                    Treatment = r.Treatment,
                    Notes = r.Notes,
                    DoctorName = r.Doctor?.FullName
                }).ToList(),

            Prescriptions = patient.Prescriptions
                .OrderByDescending(p => p.PrescriptionDate)
                .Select(p => new PrescriptionHistoryDto
                {
                    PrescriptionId = p.PrescriptionId,
                    MedicineName = p.MedicineName,
                    Dosage = p.Dosage,
                    Instructions = p.Instructions,
                    PrescribingDoctorName = p.PrescribingDoctorName,
                    PrescriptionDate = p.PrescriptionDate
                }).ToList(),

            Referrals = patient.Referrals
                .OrderByDescending(r => r.ReferralDate)
                .Select(r => new ReferralHistoryDto
                {
                    ReferralId = r.ReferralId,
                    ExternalDoctorName = r.ExternalDoctor.FullName,
                    Reason = r.Reason,
                    Notes = r.Notes,
                    Status = r.Status,
                    ReturnedFindings = r.ReturnedFindings,
                    Diagnosis = r.Diagnosis,
                    Treatment = r.Treatment,
                    ReturnedPrescription = r.ReturnedPrescription,
                    ReferralDate = r.ReferralDate,
                    ResponseDate = r.ResponseDate
                }).ToList()
        };
    }

    public async Task<DailyScheduleDto> GetDailyScheduleAsync(DateOnly date)
    {
        var appointments = await _repository.GetDailyScheduleAsync(date);

        return new DailyScheduleDto
        {
            Date = date,
            Appointments = appointments.Select(a => new AppointmentScheduleDto
            {
                AppointmentId = a.AppointmentId,
                PatientId = a.PatientId,
                PatientName = a.Patient.FullName,
                DoctorId = a.DoctorId,
                DoctorName = a.Doctor?.FullName,
                TimeSlotId = a.TimeSlotId,
                StartTime = a.TimeSlot.StartTime,
                EndTime = a.TimeSlot.EndTime,
                Status = a.Status,
                Reason = a.Reason
            }).ToList()
        };
    }
}