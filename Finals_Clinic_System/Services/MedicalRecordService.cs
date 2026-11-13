using Finals_Clinic_System.DTOs.MedicalRecords;
using Finals_Clinic_System.Models;
using Finals_Clinic_System.Repositories.Interfaces;
using Finals_Clinic_System.Services.Interfaces;

namespace Finals_Clinic_System.Services;

public class MedicalRecordService : IMedicalRecordService
{
	private readonly IMedicalRecordRepository _records;
	private readonly IPatientRepository _patients;
	private readonly IDoctorRepository _doctors;
	private readonly IAppointmentRepository _appointments;

	public MedicalRecordService(
		IMedicalRecordRepository records,
		IPatientRepository patients,
		IDoctorRepository doctors,
		IAppointmentRepository appointments)
	{
		_records = records;
		_patients = patients;
		_doctors = doctors;
		_appointments = appointments;
	}

	public Task<List<MedicalRecord>> GetAllAsync() =>
		_records.GetAllAsync();

	public Task<MedicalRecord?> GetByIdAsync(int id) =>
		_records.GetByIdAsync(id);

	public Task<List<MedicalRecord>> GetPatientHistoryAsync(int patientId) =>
		_records.GetPatientHistoryAsync(patientId);

	public async Task<(bool Success, string Message, MedicalRecord? Data)> CreateAsync(
		MedicalRecordCreateDto dto)
	{
		if (string.IsNullOrWhiteSpace(dto.Diagnosis) ||
			string.IsNullOrWhiteSpace(dto.Treatment))
		{
			return (false, "Diagnosis and treatment are required.", null);
		}

		if (await _patients.GetByIdAsync(dto.PatientId) is null)
		{
			return (false, "Patient was not found.", null);
		}

		if (await _doctors.GetByIdAsync(dto.DoctorId) is null)
		{
			return (false, "Doctor was not found.", null);
		}

		if (dto.AppointmentId.HasValue)
		{
			var appointment = await _appointments.GetByIdAsync(
				dto.AppointmentId.Value);

			if (appointment is null)
			{
				return (false, "Appointment was not found.", null);
			}

			if (appointment.PatientId != dto.PatientId ||
				appointment.DoctorId != dto.DoctorId)
			{
				return (
					false,
					"Appointment, patient, and doctor do not match.",
					null);
			}
		}

		var record = new MedicalRecord
		{
			PatientId = dto.PatientId,
			DoctorId = dto.DoctorId,
			AppointmentId = dto.AppointmentId,
			Diagnosis = dto.Diagnosis.Trim(),
			Treatment = dto.Treatment.Trim(),
			Notes = dto.Notes,
			RecordDate = DateTime.UtcNow
		};

		await _records.AddAsync(record);
		await _records.SaveChangesAsync();

		return (true, "Medical record created successfully.", record);
	}

	public async Task<(bool Success, string Message, MedicalRecord? Data)> UpdateAsync(
		int id,
		MedicalRecordUpdateDto dto)
	{
		var record = await _records.GetByIdAsync(id);

		if (record is null)
		{
			return (false, "Medical record was not found.", null);
		}

		if (string.IsNullOrWhiteSpace(dto.Diagnosis) ||
			string.IsNullOrWhiteSpace(dto.Treatment))
		{
			return (false, "Diagnosis and treatment are required.", null);
		}

		record.Diagnosis = dto.Diagnosis.Trim();
		record.Treatment = dto.Treatment.Trim();
		record.Notes = dto.Notes;

		await _records.SaveChangesAsync();

		return (true, "Medical record updated successfully.", record);
	}
}