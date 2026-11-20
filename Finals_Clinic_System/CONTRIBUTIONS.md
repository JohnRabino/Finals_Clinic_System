# ANGELICARE — Project Contributions

This document summarizes the contributions reflected in the repository's development branches and commit history for the ANGELICARE School Clinic Management System.

## Contributors and Main Areas of Work

| Contributor | Development branch / commit history | Main areas reflected in commits |
|---|---|---|
| **John Rabino** | `JMNR`, followed by additional work in the combined `LKC` history | Initial repository and ASP.NET project setup; authentication and JWT flow; login and student-registration DTOs and services; `Program.cs` and dependency configuration; initial `ClinicDbContext` and migration; foundational User, Patient, Doctor, Appointment, and MedicalRecord models; consultation service and repository work; patient and appointment service/repository updates; ReportsController and report DTO work; later API integration, configuration, and seeder updates. |
| **Lyniel Ranches** | `LIPR`, followed by additional work in the combined `LKC` history | Patient-management and External Doctor feature work; patient and external-doctor controllers, services, repositories, interfaces, models, and DTOs; report repository, service, and interface work; updates to referral, prescription, medical-record, manual-clinic-log, and consultation service logic; related database context, model snapshot, and migration updates. |
| **Lhanz Carlos** | `LKC` | Clinic-workflow feature work, including appointment and clinic-time-slot repositories and interfaces; consultation, prescription, referral, and manual-clinic-log models and DTOs; supporting repository implementations and interfaces; consultation, medical-record, prescription, referral, and clinic-time-slot API/controller work; doctor-assessment and clinic-feature migration work. |

## Collaboration and Integration

The final codebase combines work from the contributors' development branches. Some files were subsequently modified by more than one contributor as the branches were integrated and the system was refined.

- The areas above describe the main work reflected in the original branch and commit history; they do not mean a feature was implemented exclusively by one person.
- Shared models, database configuration, migrations, services, repositories, controllers, and DTOs received follow-up changes during integration.
- The `LKC` branch history contains commits authored by all three contributors, including integration and refinement work.
- The team combined the `JMNR`, `LIPR`, and `LKC` work into the finalization branch, `LKC_FINALIZATION`, which was merged into `master` through Pull Request #1.
- Commit counts are not used as a percentage, score, or ranking of individual contribution.

## Basis of This Summary

This summary was prepared from the repository's `JMNR`, `LIPR`, and `LKC` branch histories, including commit authors and commit messages, and from the files present in the merged project.

It is a summary of the work represented by Git history, not an independent measurement of time spent or effort.

For an academic submission that requires exact task-by-task ownership, all team members should review this document together and confirm that it also reflects work completed outside Git commits, such as planning, design discussions, testing, documentation, and presentation preparation.
