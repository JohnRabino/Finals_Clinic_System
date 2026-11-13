using Finals_Clinic_System.Models;
namespace Finals_Clinic_System.Repositories.Interfaces;
public interface IMedicalRecordRepository
{
    Task&lt;List&lt;MedicalRecord&gt;&gt; GetAllAsync();
    Task&lt;MedicalRecord?&gt; GetByIdAsync(int id);
    Task&lt;List&lt;MedicalRecord&gt;&gt; GetPatientHistoryAsync(int patientId);
    Task AddAsync(MedicalRecord record);
    void Remove(MedicalRecord record);
    Task SaveChangesAsync();
}
