
using Finals_Clinic_System.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Data;

public class InitialAccountSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ClinicDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var accounts = config.GetSection("InitialAccounts").Get<List<InitialAccount>>() ?? new();

        Console.WriteLine($"ACCOUNTS LOADED: {accounts.Count}");
        Console.WriteLine($"DATABASE CONNECTED: {db.Database.GetDbConnection().Database}");
        Console.WriteLine($"USERS BEFORE SEED: {await db.Users.CountAsync()}");

        var hasher = new PasswordHasher<User>();

        foreach (var account in accounts)
        {
            var email = account.Email.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(account.Password))
                throw new Exception($"Missing password for {email}.");

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                if (account.Role == "Student" &&
                    await db.Users.AnyAsync(u => u.StudentNumber == account.StudentNumber))
                {
                    throw new Exception("Student number already exists.");
                }

                user = new User
                {
                    FullName = account.FullName,
                    Email = email,
                    Role = account.Role,
                    StudentNumber = account.StudentNumber,
                    IsActive = true
                };

                user.PasswordHash = hasher.HashPassword(user, account.Password);

                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (user.Role != account.Role)
            {
                throw new Exception($"Role mismatch for {email}.");
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
                        IsActive = true
                    });
                }
            }


            if (account.Role == "Doctor")
            {
                if (string.IsNullOrWhiteSpace(account.Specialty))
                    throw new Exception($"Missing specialty for {email}.");

                var doctorExists = await db.Doctors
                    .AnyAsync(d => d.UserId == user.UserId);

                if (!doctorExists)
                {
                    db.Doctors.Add(new Doctor
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Specialty = account.Specialty.Trim(),
                        IsActive = true
                    });
                }
            }

        }

        await db.SaveChangesAsync();
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
