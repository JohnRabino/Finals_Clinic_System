using Finals_Clinic_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Finals_Clinic_System.Data;

public class ClinicDbContext : DbContext
{
    public ClinicDbContext(DbContextOptions<ClinicDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<ExternalDoctor> ExternalDoctors => Set<ExternalDoctor>();

    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ClinicTimeSlot> ClinicTimeSlots => Set<ClinicTimeSlot>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<ManualClinicLog> ManualClinicLogs => Set<ManualClinicLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasMaxLength(30);

        modelBuilder.Entity<User>()
            .Property(u => u.StudentNumber)
            .HasMaxLength(30);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.StudentNumber)
            .IsUnique()
            .HasFilter("[StudentNumber] IS NOT NULL");

        modelBuilder.Entity<Patient>()
            .HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<Patient>(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Patient)
            .WithMany(p => p.Appointments)
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Doctor)
            .WithMany(d => d.Appointments)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.TimeSlot)
            .WithMany(t => t.Appointments)
            .HasForeignKey(a => a.TimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .Property(a => a.Status)
            .HasMaxLength(20);

        modelBuilder.Entity<Consultation>()
            .HasOne(c => c.Patient)
            .WithMany(p => p.Consultations)
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Consultation>()
            .HasOne(c => c.Appointment)
            .WithMany()
            .HasForeignKey(c => c.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Consultation>()
            .HasOne(c => c.Nurse)
            .WithMany()
            .HasForeignKey(c => c.NurseUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicalRecord>()
            .HasOne(r => r.Patient)
            .WithMany(p => p.MedicalRecords)
            .HasForeignKey(r => r.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicalRecord>()
            .HasOne(r => r.Consultation)
            .WithMany(c => c.MedicalRecords)
            .HasForeignKey(r => r.ConsultationId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicalRecord>()
            .HasOne(r => r.Doctor)
            .WithMany(d => d.MedicalRecords)
            .HasForeignKey(r => r.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MedicalRecord>()
            .HasOne(r => r.Appointment)
            .WithMany()
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Prescription>()
            .HasOne(p => p.Patient)
            .WithMany(p => p.Prescriptions)
            .HasForeignKey(p => p.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Prescription>()
            .HasOne(p => p.Consultation)
            .WithMany(c => c.Prescriptions)
            .HasForeignKey(p => p.ConsultationId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Referral>()
            .HasOne(r => r.Patient)
            .WithMany(p => p.Referrals)
            .HasForeignKey(r => r.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Referral>()
            .HasOne(r => r.ExternalDoctor)
            .WithMany(d => d.Referrals)
            .HasForeignKey(r => r.ExternalDoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Referral>()
            .Property(r => r.Status)
            .HasMaxLength(20);

        modelBuilder.Entity<ManualClinicLog>()
            .HasOne(m => m.Patient)
            .WithMany(p => p.ManualClinicLogs)
            .HasForeignKey(m => m.PatientId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ManualClinicLog>()
            .HasOne(m => m.EncodedByUser)
            .WithMany()
            .HasForeignKey(m => m.EncodedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}