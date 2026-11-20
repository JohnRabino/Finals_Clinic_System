# ANGELICARE — School Clinic Management System

ANGELICARE is a School Clinic Management System developed using ASP.NET Core Web API, .NET 8, Entity Framework Core, SQL Server, JWT authentication, and a static HTML, CSS, and JavaScript frontend.

It supports student clinic access, nurse-led clinic operations, optional in-house doctor workflows, external doctor referrals, and administrative staff account management.

## Technology Stack

- ASP.NET Core Web API — .NET 8
- Microsoft SQL Server
- Entity Framework Core 8
- JWT Bearer Authentication
- Swagger / Swashbuckle
- HTML, CSS, and vanilla JavaScript
- Visual Studio 2022

## Main Features

### Student
- Student registration and login.
- View personal clinic profile.
- View available clinic time slots.
- Book, view, and cancel eligible appointments.
- View personal consultations, medical records, prescriptions, and referrals.

### Nurse
- Manage patient profiles.
- View appointments and update appointment statuses.
- Create clinic time slots.
- Record consultations, patient observations, assistance, and follow-up instructions.
- Complete consultations.
- Manage medical records.
- Record prescription details from authorized in-house or external doctors.
- Create referrals and record returned specialist findings, diagnosis, treatment, and prescription information.
- Manage external doctor contact records.
- Record manual clinic logs for walk-in visitors.
- View patient history and daily clinic schedules.

### Doctor
- View personal doctor profile.
- View assigned consultations.
- Submit doctor assessments.
- Create prescriptions for eligible consultations after reviewing them.

### Admin
- Create Nurse and Doctor accounts.
- View and manage staff accounts.
- Activate or deactivate staff accounts.
- Manage in-house Doctor profiles through the Staff Accounts module.
- View clinic reports.

## Project Structure

```text
Finals_Clinic_System/
├── Controllers/
├── Data/
│   ├── ClinicDbContext.cs
│   └── InitialAccountSeeder.cs
├── DTOs/
├── Migrations/
├── Models/
├── Repositories/
│   └── Interfaces/
├── Services/
│   └── Interfaces/
├── Properties/
└── wwwroot/
    ├── css/
    ├── js/
    ├── appointments.html
    ├── dashboard.html
    ├── index.html
    └── workspace.html
```

## Prerequisites

Before running the project, install:

1. .NET 8 SDK
2. Microsoft SQL Server Express or another SQL Server instance
3. Visual Studio 2022 with the ASP.NET and web development workload
4. Entity Framework Core CLI (`dotnet-ef`) version 8, when using command-line migrations

The default connection string targets:

```text
Server=localhost\SQLEXPRESS;Database=FinalsClinicDb;Trusted_Connection=True;TrustServerCertificate=True
```

Change the server name when your SQL Server instance is different.

## Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/JohnRabino/Finals_Clinic_System.git
cd Finals_Clinic_System
```

Open `Finals_Clinic_System.sln` in Visual Studio 2022.

### 2. Configure JWT using User Secrets

The project already has a configured `UserSecretsId` in its `.csproj` file.

From the repository root:

```powershell
$project = ".\Finals_Clinic_System\Finals_Clinic_System.csproj"

dotnet user-secrets set "Jwt:Key" "<YOUR_PRIVATE_RANDOM_KEY_AT_LEAST_32_BYTES>" --project $project
```

The JWT key must contain at least 32 bytes when encoded as UTF-8.

**Important:** Never commit JWT keys or account passwords to the repository. Use a newly generated key; do not reuse a previously exposed signing key.

### 3. Configure the database connection

The project already contains a default SQL Server Express connection string.

To override it locally using User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost\SQLEXPRESS;Database=FinalsClinicDb;Trusted_Connection=True;TrustServerCertificate=True" --project $project
```

Replace the SQL Server instance name if necessary.

### 4. Configure initial demo accounts

The `InitialAccountSeeder` reads demo accounts from the `InitialAccounts` configuration section.

For local development, store these values using .NET User Secrets.

Seeder requirements:

- When no `InitialAccounts` section exists, account seeding is skipped.
- When accounts are configured, at least one account for each role is required: `Student`, `Nurse`, `Doctor`, and `Admin`.
- Every account requires a full name, valid email, and password of at least eight characters.
- Student accounts require a unique student number.
- Doctor accounts require a specialty.
- Existing accounts keep their existing password hashes and active status.
- Additional accounts can be configured using indexes such as `4`, `5`, and `6`.

Example configuration for one demo account per role:

```powershell
# Student
dotnet user-secrets set "InitialAccounts:0:FullName" "Demo Student" --project $project
dotnet user-secrets set "InitialAccounts:0:Email" "student.demo@example.com" --project $project
dotnet user-secrets set "InitialAccounts:0:Password" "<STUDENT_DEMO_PASSWORD>" --project $project
dotnet user-secrets set "InitialAccounts:0:Role" "Student" --project $project
dotnet user-secrets set "InitialAccounts:0:StudentNumber" "DEMO-0001" --project $project

# Nurse
dotnet user-secrets set "InitialAccounts:1:FullName" "Demo Nurse" --project $project
dotnet user-secrets set "InitialAccounts:1:Email" "nurse.demo@example.com" --project $project
dotnet user-secrets set "InitialAccounts:1:Password" "<NURSE_DEMO_PASSWORD>" --project $project
dotnet user-secrets set "InitialAccounts:1:Role" "Nurse" --project $project

# Doctor
dotnet user-secrets set "InitialAccounts:2:FullName" "Demo Doctor" --project $project
dotnet user-secrets set "InitialAccounts:2:Email" "doctor.demo@example.com" --project $project
dotnet user-secrets set "InitialAccounts:2:Password" "<DOCTOR_DEMO_PASSWORD>" --project $project
dotnet user-secrets set "InitialAccounts:2:Role" "Doctor" --project $project
dotnet user-secrets set "InitialAccounts:2:Specialty" "General Practitioner" --project $project

# Admin
dotnet user-secrets set "InitialAccounts:3:FullName" "Demo Administrator" --project $project
dotnet user-secrets set "InitialAccounts:3:Email" "admin.demo@example.com" --project $project
dotnet user-secrets set "InitialAccounts:3:Password" "<ADMIN_DEMO_PASSWORD>" --project $project
dotnet user-secrets set "InitialAccounts:3:Role" "Admin" --project $project
```

The example login emails and passwords above become usable only after configuring them in User Secrets and running the application against the database.

**Demo account credential policy:** Passwords are intentionally not stored in this README or in the Git repository. Use the passwords configured locally through User Secrets.

### 5. Apply Entity Framework migrations

The application does not automatically apply database migrations during startup.

Install the EF Core CLI tool if it is not installed:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.0
```

From the repository root, update the database:

```powershell
dotnet ef database update --project .\Finals_Clinic_System\Finals_Clinic_System.csproj --startup-project .\Finals_Clinic_System\Finals_Clinic_System.csproj
```

Alternatively, in Visual Studio Package Manager Console, select `Finals_Clinic_System` as the Default Project and run:

```powershell
Update-Database
```

The project includes these migrations:

1. `InitialCreate`
2. `AddExternalDoctor`
3. `AddStudentNumber`
4. `AddClinicFeatures`
5. `AddDoctorAssessment`
6. `AddRefferalResponse`

Keep all migration files and `ClinicDbContextModelSnapshot.cs` together. Do not delete migration history to resolve database problems.

### 6. Build and run

From the repository root:

```powershell
dotnet build
dotnet run --project .\Finals_Clinic_System\Finals_Clinic_System.csproj
```

The configured launch profile uses:

| Resource | URL |
|---|---|
| Application / Frontend | `http://localhost:5001` |
| Swagger UI | `http://localhost:5001/swagger` |

Swagger is enabled in the Development environment.

The frontend is served directly from the `wwwroot` folder by ASP.NET Core. No separate frontend development server is required.

## Authentication and API Testing

1. Run the application in Development.
2. Open `http://localhost:5001/swagger`.
3. Register a Student using `POST /api/Auth/register`, or log in using `POST /api/Auth/login`.
4. Copy the JWT token returned after successful login.
5. Select **Authorize** in Swagger and provide the Bearer token.
6. Test endpoints using an account with the required role.

Student registration creates Student accounts only. Nurse, Doctor, and Admin accounts are provisioned through the Admin staff-account workflow or initial demo account configuration.

## Role Access Overview

| Feature | Student | Nurse | Doctor | Admin |
|---|---|---|---|---|
| Own profile | Yes | — | Yes | — |
| Own appointments | Yes | — | — | — |
| Manage appointments | — | Yes | — | — |
| Available clinic time slots | Authenticated | Yes | Authenticated | Authenticated |
| Create time slots | — | Yes | — | — |
| Patient profiles | — | Manage | — | View |
| Consultations | Own records | Manage | Assigned cases | — |
| Medical records | Own records | Manage | — | — |
| Prescriptions | Own records | Manage / record authorized details | Prescribe after review | — |
| Referrals | Own records | Manage | — | — |
| External doctors | — | Manage | — | — |
| Manual clinic logs | — | Manage | — | — |
| Staff accounts | — | — | — | Manage |
| Doctor profiles | — | — | Own profile | Manage in Staff Accounts |
| Reports | — | View | — | View |

API authorization attributes determine actual access. This table provides a high-level overview of the available role workflows.

## Seeder Behavior

At application startup, `InitialAccountSeeder`:

- Reads configured accounts from User Secrets.
- Creates configured accounts that do not already exist.
- Does not reset existing account passwords or reactivate accounts.
- Creates a linked Patient profile for a seeded Student if one is missing.
- Creates a linked Doctor profile for a seeded Doctor if one is missing.
- Adds sample clinic time slots when the time-slot table is empty.
- Adds two sample external doctor records when they do not already exist.
- Removes the legacy demo external doctor only when it has no referrals; otherwise, it deactivates the record.

Apply the database migrations before running the application and its seeder.

## Security Notes

- Never commit JWT keys, passwords, or private configuration.
- Use .NET User Secrets for local secrets.
- Use a newly generated JWT signing key.
- Demo accounts are for local testing only.
- Do not publish real student health information or clinic records in screenshots or sample databases.
- Review application security, database access, backups, and privacy safeguards before any production deployment.
