
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;

namespace Finals_Clinic_System.Services.Interfaces;

public interface IReferralService
{
    Task<List<Referral>> GetAllAsync();
    Task<List<Referral>> GetByPatientIdAsync(int patientId);
    Task<Referral?> CreateAsync(CreateReferralDto dto);
    Task<Referral?> UpdateResponseAsync(int id, UpdateReferralResponseDto dto);
}
