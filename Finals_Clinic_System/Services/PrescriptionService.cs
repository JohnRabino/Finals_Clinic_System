
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

    public PrescriptionService(
        IPrescriptionRepository prescriptionRepository,
        IPatientRepository patientRepository,
        IConsultationRepository consultationRepository)
    {
        _prescriptionRepository = prescriptionRepository;
        _patientRepository = patientRepository;
        _consultationRepository = consultationRepository;
    }

    public async Task<List<Prescription>> GetAllAsync()
    {
        return await _prescriptionRepository.GetAllAsync();
    }

    public async Task<List<Prescription>> GetByPatientIdAsync(int patientId)
    {
        return await _prescriptionRepository.GetByPatientIdAsync(patientId);
    }

    public async Task<Prescription?> CreateAsync(CreatePrescriptionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MedicineName) ||
            string.IsNullOrWhiteSpace(dto.Dosage) ||
            string.IsNullOrWhiteSpace(dto.PrescribingDoctorName))
        {
            return null;
        }

        var patient = await _patientRepository.GetByIdAsync(dto.PatientId);

        if (patient == null)
            return null;

        var consultation = await _consultationRepository.GetByIdAsync(dto.ConsultationId);

        if (consultation == null || consultation.PatientId != dto.PatientId)
            return null;

        var prescription = new Prescription
        {
            PatientId = dto.PatientId,
            ConsultationId = dto.ConsultationId,
            MedicineName = dto.MedicineName,
            Dosage = dto.Dosage,
            Instructions = dto.Instructions,
            PrescribingDoctorName = dto.PrescribingDoctorName,
            PrescriptionDate = DateTime.Now
        };

        await _prescriptionRepository.AddAsync(prescription);
        await _prescriptionRepository.SaveAsync();

        return prescription;
    }
}
