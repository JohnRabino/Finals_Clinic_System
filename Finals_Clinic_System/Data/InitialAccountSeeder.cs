using System.ComponentModel.DataAnnotations;
using Finals_Clinic_System.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Data;

public static class InitialAccountSeeder
{
    private static readonly string[] RequiredRoles =
    {
        "Student", "Nurse", "Doctor", "Admin"
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ClinicDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var accounts = configuration
            .GetSection("InitialAccounts")
            .Get<List<InitialAccount>>() ?? new();

        Console.WriteLine($"ACCOUNTS LOADED: {accounts.Count}");
        Console.WriteLine($"DATABASE CONNECTED: {db.Database.GetDbConnection().Database}");
        Console.WriteLine($"USERS BEFORE SEED: {await db.Users.CountAsync()}");

        if (accounts.Count > 0)
        {
            ValidateAccounts(accounts);
        }
        else
        {
            Console.WriteLine("INITIAL ACCOUNTS NOT CONFIGURED. ACCOUNT SEEDING SKIPPED.");
        }

        var hasher = new PasswordHasher<User>();

        await using var transaction = await db.Database.BeginTransactionAsync();

        foreach (var account in accounts)
        {
            var email = account.Email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (account.Role == "Student")
            {
                var studentNumber = account.StudentNumber!.Trim();

                var duplicateStudentNumber = await db.Users.AnyAsync(u =>
                    u.StudentNumber == studentNumber && u.Email != email);

                if (duplicateStudentNumber)
                {
                    throw new InvalidOperationException(
                        $"Student number {studentNumber} is already assigned to another account.");
                }
            }

            if (user == null)
            {
                user = new User
                {
                    FullName = account.FullName.Trim(),
                    Email = email,
                    Role = account.Role,
                    StudentNumber = account.Role == "Student"
                        ? account.StudentNumber!.Trim()
                        : null,
                    IsActive = true
                };

                user.PasswordHash = hasher.HashPassword(user, account.Password);

                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (!string.Equals(user.Role, account.Role, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Role mismatch for seeded account {email}.");
            }

            if (account.Role == "Student")
            {
                var patientExists = await db.Patients
                    .AnyAsync(p => p.UserId == user.UserId);

                if (!patientExists)
                {
                    db.Patients.Add(new Patient
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        IsActive = user.IsActive
                    });
                }
            }

            if (account.Role == "Doctor")
            {
                var doctorExists = await db.Doctors
                    .AnyAsync(d => d.UserId == user.UserId);

                if (!doctorExists)
                {
                    db.Doctors.Add(new Doctor
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Specialty = account.Specialty!.Trim(),
                        IsActive = user.IsActive
                    });
                }
            }
        }

        if (!await db.ClinicTimeSlots.AnyAsync())
        {
            var sampleDate = DateOnly.FromDateTime(DateTime.Today.AddDays(2));

            db.ClinicTimeSlots.AddRange(
                new ClinicTimeSlot
                {
                    SlotDate = sampleDate,
                    StartTime = new TimeOnly(8, 0),
                    EndTime = new TimeOnly(8, 30),
                    IsAvailable = true
                },
                new ClinicTimeSlot
                {
                    SlotDate = sampleDate,
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(9, 30),
                    IsAvailable = true
                },
                new ClinicTimeSlot
                {
                    SlotDate = sampleDate,
                    StartTime = new TimeOnly(10, 0),
                    EndTime = new TimeOnly(10, 30),
                    IsAvailable = true
                });
        }

        var demoDoctor = await db.ExternalDoctors
            .FirstOrDefaultAsync(d => d.Email == "external.specialist.demo@example.com");

        if (demoDoctor != null)
        {
            var hasReferrals = await db.Referrals
                .AnyAsync(r => r.ExternalDoctorId == demoDoctor.ExternalDoctorId);

            if (hasReferrals)
            {
                demoDoctor.IsActive = false;
            }
            else
            {
                db.ExternalDoctors.Remove(demoDoctor);
            }
        }

        var externalDoctors = new List<ExternalDoctor>
        {
            new ExternalDoctor
            {
                FullName = "Dr. Elena Reyes",
                Specialization = "Cardiology",
                ClinicOrHospital = "St. Catherine Medical Center",
                Address = "Quezon City, Philippines",
                ContactNumber = "09000000001",
                Email = "elena.reyes@example.com",
                IsActive = true
            },
            new ExternalDoctor
            {
                FullName = "Dr. Marco Villanueva",
                Specialization = "Orthopedics",
                ClinicOrHospital = "Northview General Hospital",
                Address = "Manila, Philippines",
                ContactNumber = "09000000002",
                Email = "marco.villanueva@example.com",
                IsActive = true
            }
        };

        foreach (var externalDoctor in externalDoctors)
        {
            var existingDoctor = await db.ExternalDoctors
                .FirstOrDefaultAsync(d => d.Email == externalDoctor.Email);

            if (existingDoctor == null)
            {
                db.ExternalDoctors.Add(externalDoctor);
            }
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        Console.WriteLine($"USERS AFTER SEED: {await db.Users.CountAsync()}");
        Console.WriteLine(
            $"AVAILABLE SLOTS AFTER SEED: {await db.ClinicTimeSlots.CountAsync(s => s.IsAvailable)}");
        Console.WriteLine(
            $"ACTIVE EXTERNAL DOCTORS: {await db.ExternalDoctors.CountAsync(d => d.IsActive)}");
    }

    private static void ValidateAccounts(List<InitialAccount> accounts)
    {
        foreach (var role in RequiredRoles)
        {
            if (!accounts.Any(a => a.Role == role))
            {
                throw new InvalidOperationException(
                    $"At least one account with Role '{role}' is required.");
            }
        }

        var emails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var studentNumbers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var emailValidator = new EmailAddressAttribute();

        foreach (var account in accounts)
        {
            if (string.IsNullOrWhiteSpace(account.FullName))
            {
                throw new InvalidOperationException("FullName is required.");
            }

            if (string.IsNullOrWhiteSpace(account.Email) ||
                !emailValidator.IsValid(account.Email.Trim()))
            {
                throw new InvalidOperationException("A valid email is required.");
            }

            if (!emails.Add(account.Email.Trim()))
            {
                throw new InvalidOperationException(
                    $"Duplicate email: {account.Email.Trim()}.");
            }

            if (string.IsNullOrWhiteSpace(account.Password) ||
                account.Password.Length < 8)
            {
                throw new InvalidOperationException(
                    $"A password of at least 8 characters is required for {account.Email}.");
            }

            if (!RequiredRoles.Contains(account.Role, StringComparer.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Invalid role '{account.Role}'.");
            }

            if (account.Role == "Student")
            {
                if (string.IsNullOrWhiteSpace(account.StudentNumber))
                {
                    throw new InvalidOperationException(
                        $"StudentNumber is required for {account.Email}.");
                }

                if (!studentNumbers.Add(account.StudentNumber.Trim()))
                {
                    throw new InvalidOperationException(
                        $"Duplicate student number: {account.StudentNumber}.");
                }
            }

            if (account.Role == "Doctor" &&
                string.IsNullOrWhiteSpace(account.Specialty))
            {
                throw new InvalidOperationException(
                    $"Specialty is required for {account.Email}.");
            }
        }
    }

    public class InitialAccount
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? StudentNumber { get; set; }
        public string? Specialty { get; set; }
    }
}