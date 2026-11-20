using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _repository;

    public DoctorService(IDoctorRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<DoctorDto>> GetActiveAsync()
    {
        var doctors = await _repository.GetActiveAsync();

        return doctors.Select(ToDto).ToList();
    }

    public async Task<DoctorDto?> GetActiveByIdAsync(int id)
    {
        var doctor = await _repository.GetActiveByIdAsync(id);
        return doctor == null ? null : ToDto(doctor);
    }

    public async Task<DoctorDto?> GetMyProfileAsync(int userId)
    {
        var doctor = await _repository.GetActiveByUserIdAsync(userId);
        return doctor == null ? null : ToDto(doctor);
    }

    public async Task<(bool Success, string Message, DoctorDto? Data)> UpdateAsync(int id, UpdateDoctorDto dto)
    {
        var doctor = await _repository.GetByIdForUpdateAsync(id);
        if (doctor == null)
            return (false, "Doctor not found.", null);

        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Specialty))
            return (false, "Doctor name and specialty are required.", null);

        doctor.FullName = dto.FullName.Trim();
        doctor.Specialty = dto.Specialty.Trim();
        doctor.User.FullName = doctor.FullName;
        await _repository.SaveChangesAsync();

        return (true, "Doctor profile updated successfully.", ToDto(doctor));
    }

    private static DoctorDto ToDto(Finals_Clinic_System.Models.Doctor doctor)
    {
        return new DoctorDto
        {
            DoctorId = doctor.DoctorId,
            UserId = doctor.UserId,
            FullName = doctor.FullName,
            Specialty = doctor.Specialty
        };
    }
}
