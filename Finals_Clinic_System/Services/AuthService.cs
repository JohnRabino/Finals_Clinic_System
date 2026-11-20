using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Finals_Clinic_System.Data;
using Finals_Clinic_System.DTOs.Auth;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Finals_Clinic_System.Services;

public class AuthService : IAuthService
{
    private readonly ClinicDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(ClinicDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }


    public async Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.StudentNumber) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return (false, "All fields are required.", null);
        }

        if (dto.Password.Length < 8)
            return (false, "Password must be at least 8 characters.", null);

        var email = dto.Email.Trim().ToLowerInvariant();
        var studentNumber = dto.StudentNumber.Trim();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return (false, "Email is already registered.", null);

        if (await _db.Users.AnyAsync(u => u.StudentNumber == studentNumber))
            return (false, "Student Number is already registered.", null);

        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var user = new User
            {
                FullName = dto.FullName.Trim(),
                StudentNumber = studentNumber,
                Email = email,
                Role = "Student",
                IsActive = true
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var patient = new Patient
            {
                UserId = user.UserId,
                FullName = user.FullName,
                IsActive = true
            };

            _db.Patients.Add(patient);
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();

            return (true, "Registration successful.", BuildResponse(user));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Email == email && u.IsActive
        );

        if (user is null)
            return (false, "Invalid email or password.", null);

        var verification = _hasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password
        );

        if (verification == PasswordVerificationResult.Failed)
            return (false, "Invalid email or password.", null);

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _hasher.HashPassword(user, dto.Password);
            await _db.SaveChangesAsync();
        }

        return (true, "Login successful.", BuildResponse(user));
    }

    private AuthResponseDto BuildResponse(User user)
    {
        var keyText = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key is missing from configuration.");

        var issuer = _configuration["Jwt:Issuer"] ?? "FinalsClinicSystem";
        var audience = _configuration["Jwt:Audience"] ?? "FinalsClinicSystemUsers";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyText));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(3),
            signingCredentials: new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            )
        );

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}