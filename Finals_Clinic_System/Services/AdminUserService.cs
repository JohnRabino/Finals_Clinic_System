
using Finals_Clinic_System.DTOs.Admin;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Finals_Clinic_System.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IAdminUserRepository _repository;
    private readonly PasswordHasher<User> _hasher = new();

    public AdminUserService(IAdminUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AdminUserDto>> GetAllAsync()
    {
        var users = await _repository.GetAllAsync();

        return users.Select(u => new AdminUserDto
        {
            UserId = u.UserId,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive
        }).ToList();
    }

    public async Task<(bool Success, string Message, AdminUserDto? Data)>
        CreateAsync(CreateStaffAccountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return (false, "All required fields must be filled.", null);
        }

        var role = dto.Role.Trim();

        if (role != "Nurse" && role != "Doctor")
            return (false, "Only Nurse and Doctor accounts can be created.", null);

        if (dto.Password.Length < 8)
            return (false, "Password must be at least 8 characters.", null);

        if (role == "Doctor" && string.IsNullOrWhiteSpace(dto.Specialty))
            return (false, "Doctor specialty is required.", null);

        var email = dto.Email.Trim().ToLowerInvariant();

        if (await _repository.EmailExistsAsync(email))
            return (false, "Email is already registered.", null);

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Role = role,
            IsActive = true
        };

        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        Doctor? doctor = null;

        if (role == "Doctor")
        {
            doctor = new Doctor
            {
                FullName = user.FullName,
                Specialty = dto.Specialty!.Trim(),
                IsActive = true
            };
        }

        await _repository.AddAsync(user, doctor);
        await _repository.SaveChangesAsync();

        var result = new AdminUserDto
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive
        };

        return (true, "Staff account created successfully.", result);
    }

    public async Task<(bool Success, string Message)>
        SetActiveAsync(int id, bool isActive, int currentAdminId)
    {
        var user = await _repository.GetByIdAsync(id);

        if (user == null)
            return (false, "User account not found.");

        if (!isActive && user.UserId == currentAdminId)
            return (false, "You cannot deactivate your own account.");

        if (!isActive && user.Role == "Admin")
        {
            var activeAdmins = await _repository.CountActiveAdminsAsync();

            if (activeAdmins <= 1)
                return (false, "Cannot deactivate the last active Admin.");
        }

        user.IsActive = isActive;

        await _repository.SaveChangesAsync();

        return (true, isActive
            ? "User account activated."
            : "User account deactivated.");
    }
}
