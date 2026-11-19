
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class ReferralService : IReferralService
{
    private readonly IReferralRepository _referralRepository;

    public ReferralService(IReferralRepository referralRepository)
    {
        _referralRepository = referralRepository;
    }

    public Task<List<Referral>> GetAllAsync()
    {
        return _referralRepository.GetAllAsync();
    }

    public Task<List<Referral>> GetByPatientIdAsync(int patientId)
    {
        return _referralRepository.GetByPatientIdAsync(patientId);
    }

    public Task<Referral?> GetByIdAsync(int id)
    {
        return _referralRepository.GetByIdAsync(id);
    }

    public async Task<Referral?> CreateAsync(CreateReferralDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return null;

        if (!await _referralRepository.PatientExistsAsync(dto.PatientId))
            return null;

        if (!await _referralRepository.ExternalDoctorIsActiveAsync(dto.ExternalDoctorId))
            return null;

        var referral = new Referral
        {
            PatientId = dto.PatientId,
            ExternalDoctorId = dto.ExternalDoctorId,
            Reason = dto.Reason.Trim(),
            Notes = dto.Notes?.Trim(),
            Status = "Pending",
            ReferralDate = DateTime.Now
        };

        await _referralRepository.AddAsync(referral);
        await _referralRepository.SaveAsync();

        return await _referralRepository.GetByIdAsync(referral.ReferralId);
    }

    public async Task<Referral?> UpdateResponseAsync(
        int id,
        UpdateReferralResponseDto dto)
    {
        var referral = await _referralRepository.GetByIdAsync(id);

        if (referral == null || referral.Status == "Completed")
            return null;

        if (string.IsNullOrWhiteSpace(dto.ReturnedFindings) ||
            string.IsNullOrWhiteSpace(dto.Diagnosis) ||
            string.IsNullOrWhiteSpace(dto.Treatment))
        {
            return null;
        }

        referral.ReturnedFindings = dto.ReturnedFindings;
        referral.Diagnosis = dto.Diagnosis;
        referral.Treatment = dto.Treatment;
        referral.ReturnedPrescription = dto.ReturnedPrescription;
        referral.ResponseDate = DateTime.Now;
        referral.Status = "Completed";

        await _referralRepository.SaveAsync();

        return referral;
    }
}
