using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Finals_Clinic_System.Data;
using Finals_Clinic_System.DTOs.Auth;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Services.Interfaces;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

    public async Task<(bool Success, string Message, AuthResponseDto? Data)> RegisterAsync(
        RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return (false, "Name, email, and password are required.", null);
        }

        var email = dto.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(user => user.Email == email))
        {
            return (false, "Email is already registered.", null);
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            Role = "Patient",
            IsActive = true
        };

        user.PasswordHash = _hasher.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return (true, "Registration successful.", BuildResponse(user));
    }

    public async Task<(bool Success, string Message, AuthResponseDto? Data)> LoginAsync(
        LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(
            user => user.Email == email && user.IsActive);

        if (user is null)
        {
            return (false, "Invalid email or password.", null);
        }

        var verification = _hasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            return (false, "Invalid email or password.", null);
        }

        return (true, "Login successful.", BuildResponse(user));
    }

    private AuthResponseDto BuildResponse(User user)
    {
        var keyText = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "JWT key is missing from configuration.");

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
                SecurityAlgorithms.HmacSha256));

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