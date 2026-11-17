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
        var timeSlot = await _timeSlotRepository.GetByIdAsync(dto.TimeSlotId);

        if (timeSlot == null || !timeSlot.IsAvailable)
            return (false, "Time slot is not available.");

        if (timeSlot.SlotDate < DateOnly.FromDateTime(DateTime.Today))
            return (false, "Cannot book an appointment for a past date.");

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
            dto.Status != "Completed" &&
            dto.Status != "Cancelled")
        {
            return (false, "Invalid appointment status.");
        }

        if (appointment.Status == "Cancelled")
            return (false, "This appointment is already cancelled.");

        appointment.Status = dto.Status;

        if (dto.Status == "Cancelled")
        {
            appointment.TimeSlot.IsAvailable = true;
        }
        else
        {
            appointment.TimeSlot.IsAvailable = false;
        }

        await _appointmentRepository.SaveChangesAsync();

        return (true, "Appointment status updated successfully.");
    }
}