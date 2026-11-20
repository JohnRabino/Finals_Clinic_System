using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IPrescriptionRepository _prescriptionRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly IConsultationRepository _consultationRepository;
    private readonly IExternalDoctorRepository _externalDoctorRepository;

    public PrescriptionService(
        IPrescriptionRepository prescriptionRepository,
        IPatientRepository patientRepository,
        IConsultationRepository consultationRepository,
        IExternalDoctorRepository externalDoctorRepository)
    {
        _prescriptionRepository = prescriptionRepository;
        _patientRepository = patientRepository;
        _consultationRepository = consultationRepository;
        _externalDoctorRepository = externalDoctorRepository;
    }

    public Task<List<Prescription>> GetAllAsync() => _prescriptionRepository.GetAllAsync();

    public Task<List<Prescription>> GetByPatientIdAsync(int patientId) =>
        _prescriptionRepository.GetByPatientIdAsync(patientId);

    public Task<List<Prescription>> GetByDoctorUserIdAsync(int userId) =>
        _prescriptionRepository.GetByDoctorUserIdAsync(userId);

    public Task<Prescription?> GetByIdAsync(int id) => _prescriptionRepository.GetByIdAsync(id);

    public async Task<Prescription?> CreateAsync(CreatePrescriptionDto dto, int? doctorUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.MedicineName) ||
            string.IsNullOrWhiteSpace(dto.Dosage) ||
            string.IsNullOrWhiteSpace(dto.Instructions))
            return null;

        var patient = await _patientRepository.GetByIdAsync(dto.PatientId);
        if (patient == null || !patient.IsActive ||
            (patient.UserId.HasValue && (patient.User == null || !patient.User.IsActive)))
            return null;

        var consultation = await _consultationRepository.GetByIdAsync(dto.ConsultationId);
        if (consultation == null || consultation.PatientId != dto.PatientId)
            return null;

        string prescribingDoctorName;

        if (doctorUserId.HasValue)
        {
            if (consultation.Doctor == null ||
                consultation.Doctor.UserId != doctorUserId.Value ||
                !consultation.DoctorReviewedAt.HasValue ||
                dto.ExternalDoctorId.HasValue)
                return null;

            prescribingDoctorName = consultation.Doctor.FullName;
        }
        else if (consultation.Doctor != null)
        {
            if (!consultation.DoctorReviewedAt.HasValue || dto.ExternalDoctorId.HasValue)
                return null;

            prescribingDoctorName = consultation.Doctor.FullName;
        }
        else
        {
            if (!dto.ExternalDoctorId.HasValue)
                return null;

            var externalDoctor = await _externalDoctorRepository.GetByIdAsync(dto.ExternalDoctorId.Value);
            if (externalDoctor == null || !externalDoctor.IsActive)
                return null;

            prescribingDoctorName = externalDoctor.FullName;
        }

        var prescription = new Prescription
        {
            PatientId = consultation.PatientId,
            ConsultationId = consultation.ConsultationId,
            MedicineName = dto.MedicineName.Trim(),
            Dosage = dto.Dosage.Trim(),
            Instructions = dto.Instructions.Trim(),
            PrescribingDoctorName = prescribingDoctorName,
            PrescriptionDate = DateTime.Now
        };

        await _prescriptionRepository.AddAsync(prescription);
        await _prescriptionRepository.SaveAsync();
        return prescription;
    }
    public async Task<Prescription?> UpdateAsync(int id, UpdatePrescriptionDto dto)
    {
        var prescription = await _prescriptionRepository.GetByIdAsync(id);
        if (prescription == null)
            return null;

        if (string.IsNullOrWhiteSpace(dto.MedicineName) ||
            string.IsNullOrWhiteSpace(dto.Dosage) ||
            string.IsNullOrWhiteSpace(dto.Instructions))
            return null;

        prescription.MedicineName = dto.MedicineName.Trim();
        prescription.Dosage = dto.Dosage.Trim();
        prescription.Instructions = dto.Instructions.Trim();

        await _prescriptionRepository.SaveAsync();
        return prescription;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var prescription = await _prescriptionRepository.GetByIdAsync(id);
        if (prescription == null)
            return false;

        _prescriptionRepository.Delete(prescription);
        await _prescriptionRepository.SaveAsync();
        return true;
    }

}
