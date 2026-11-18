
using Finals_Clinic_System.DTOs;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IClinicTimeSlotRepository _timeSlotRepository;

    public AppointmentService(
        IAppointmentRepository appointmentRepository,
        IClinicTimeSlotRepository timeSlotRepository)
    {
        _appointmentRepository = appointmentRepository;
        _timeSlotRepository = timeSlotRepository;
    }

    public Task<List<Appointment>> GetAllAsync()
    {
        return _appointmentRepository.GetAllAsync();
    }

    public Task<List<Appointment>> GetByPatientIdAsync(int patientId)
    {
        return _appointmentRepository.GetByPatientIdAsync(patientId);
    }

    public async Task<(bool Success, string Message)> CreateAsync(CreateAppointmentDto dto)
    {
        var patientExists = await _appointmentRepository
            .PatientExistsAndActiveAsync(dto.PatientId);

        if (!patientExists)
            return (false, "Patient not found or inactive.");

        if (dto.DoctorId.HasValue)
        {
            var doctorExists = await _appointmentRepository
                .DoctorExistsAndActiveAsync(dto.DoctorId.Value);

            if (!doctorExists)
                return (false, "Doctor not found or inactive.");
        }

        var timeSlot = await _timeSlotRepository.GetByIdAsync(dto.TimeSlotId);

        if (timeSlot == null || !timeSlot.IsAvailable)
            return (false, "Time slot is not available.");

        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        if (timeSlot.SlotDate < today ||
            (timeSlot.SlotDate == today && timeSlot.StartTime <= currentTime))
        {
            return (false, "Cannot book an appointment for a past date or time.");
        }

        if (dto.DoctorId.HasValue)
        {
            var hasConflict = await _appointmentRepository.HasDoctorConflictAsync(
                dto.DoctorId.Value,
                timeSlot.SlotDate,
                timeSlot.StartTime,
                timeSlot.EndTime);

            if (hasConflict)
                return (false, "Doctor already has an appointment during this time.");
        }

        var appointment = new Appointment
        {
            PatientId = dto.PatientId,
            TimeSlotId = dto.TimeSlotId,
            DoctorId = dto.DoctorId,
            Reason = dto.Reason,
            Status = "Booked"
        };

        timeSlot.IsAvailable = false;

        await _appointmentRepository.AddAsync(appointment);
        await _appointmentRepository.SaveChangesAsync();

        return (true, "Appointment booked successfully.");
    }

    public async Task<(bool Success, string Message)> UpdateStatusAsync(
        int id, UpdateAppointmentStatusDto dto)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id);

        if (appointment == null)
            return (false, "Appointment not found.");

        if (dto.Status != "Booked" &&
            dto.Status != "Confirmed" &&
            dto.Status != "Completed" &&
            dto.Status != "Cancelled")
        {
            return (false, "Invalid appointment status.");
        }

        if (appointment.Status == "Completed" ||
            appointment.Status == "Cancelled")
        {
            return (false, "This appointment can no longer be updated.");
        }

        if (dto.Status == "Booked")
            return (false, "Appointment cannot be changed back to Booked.");

        if (dto.Status == "Completed" && appointment.Status != "Confirmed")
            return (false, "Only confirmed appointments can be completed.");

        appointment.Status = dto.Status;

        if (dto.Status == "Cancelled")
            appointment.TimeSlot.IsAvailable = true;
        else
            appointment.TimeSlot.IsAvailable = false;

        await _appointmentRepository.SaveChangesAsync();

        return (true, "Appointment status updated successfully.");
    }
}
