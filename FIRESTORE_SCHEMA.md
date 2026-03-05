# vArogra Firestore Database Schema

This document defines the structure of the Firestore database for the vArogra platform.

## 1. Top-Level Collections

| Collection | Description | Linking Key |
|------------|-------------|-------------|
| `users` | Identity and Auth linking | `uid` |
| `patients` | Patient demographics | `patientId` (matches Auth `uid`) |
| `doctors` | Doctor profiles (Single Source of Truth) | `doctorId` (matches Auth `uid`) |
| `hospitals` | Hospital entities | `hospitalId` |
| `pharmacies` | Pharmacy/Medical Store entities | `pharmacyId` |
| `appointments` | Consultations | `appointmentId` |
| `medical_records` | Clinical notes/prescriptions | `recordId` |
| `vitals` | Health metrics (heart rate, BP, etc.) | `vitalId` |
| `sos_requests` | Emergency triggers | `requestId` |
| `medicine_orders` | Pharmacy purchase records | `orderId` |
| `chat_sessions` | Real-time communication | `sessionId` |
| `ai_triage_logs` | AI Symptom checker results | `logId` |
| `notifications` | System alerts | `notificationId` |

---

## 2. Collection Details

### users
*Identity record for all platform users.*
- `uid`: string (Primary Key)
- `name`: string
- `email`: string
- `phone`: string
- `role`: string (`patient` | `doctor` | `hospital_admin` | `pharmacist` | `admin`)
- `createdAt`: timestamp
- `status`: string (`active` | `pending` | `suspended`)

### patients
- `patientId`: string (matches Auth `uid`)
- `name`: string
- `age`: number
- `gender`: string
- `bloodGroup`: string
- `phone`: string
- `address`: string
- `emergencyContact`: map (`name`, `phone`, `relation`)
- `createdAt`: timestamp

### doctors
- `doctorId`: string (matches Auth `uid`)
- `name`: string
- `specialization`: string
- `hospitalId`: string (FK to `hospitals`)
- `licenseNumber`: string
- `experience`: number
- `phone`: string
- `email`: string
- `availability`: map (schedule data)
- `status`: string (`pending` | `approved`)
- `createdAt`: timestamp

### hospitals
- `hospitalId`: string
- `name`: string
- `hospitalCode`: string (Used for doctor registration validation)
- `location`: string/geopoint
- `phone`: string
- `email`: string
- `adminId`: string (FK to `users`)
- `createdAt`: timestamp
- `status`: string

### pharmacies
- `pharmacyId`: string
- `name`: string
- `licenseNumber`: string
- `location`: string/geopoint
- `phone`: string
- `ownerId`: string (FK to `users`)
- `createdAt`: timestamp
- `status`: string

### appointments
- `appointmentId`: string
- `patientId`: string (FK to `patients`)
- `doctorId`: string (FK to `doctors`)
- `hospitalId`: string (FK to `hospitals`)
- `appointmentTime`: timestamp
- `status`: string (`pending` | `confirmed` | `completed` | `cancelled`)
- `createdAt`: timestamp

### medical_records
- `recordId`: string
- `patientId`: string (FK to `patients`)
- `doctorId`: string (FK to `doctors`)
- `diagnosis`: string
- `prescription`: string (text or list)
- `notes`: string
- `createdAt`: timestamp

### vitals
- `vitalId`: string
- `patientId`: string (FK to `patients`)
- `heartRate`: number
- `bloodPressure`: string (e.g., "120/80")
- `temperature`: number
- `oxygenLevel`: number
- `recordedAt`: timestamp

### sos_requests
- `requestId`: string
- `patientId`: string (FK to `patients`)
- `location`: map (`lat`, `lng`, `address`)
- `hospitalId`: string (FK to `hospitals`)
- `status`: string (`pending` | `accepted` | `resolved`)
- `createdAt`: timestamp

### medicine_orders
- `orderId`: string
- `patientId`: string (FK to `patients`)
- `pharmacyId`: string (FK to `pharmacies`)
- `medicines`: list (map: `name`, `quantity`, `price`)
- `totalPrice`: number
- `status`: string (`pending` | `dispensed` | `delivered`)
- `createdAt`: timestamp

### chat_sessions
- `sessionId`: string
- `patientId`: string
- `doctorId`: string
- `startedAt`: timestamp
- `status`: string
- **Subcollection**: `messages`
    - `messageId`: string
    - `senderId`: string
    - `message`: string
    - `timestamp`: timestamp

### ai_triage_logs
- `logId`: string
- `patientId`: string
- `symptoms`: list (strings)
- `aiResponse`: string
- `riskLevel`: string (`low` | `medium` | `high`)
- `createdAt`: timestamp

### notifications
- `notificationId`: string
- `userId`: string
- `title`: string
- `message`: string
- `type`: string (`sos` | `appointment` | `chat`)
- `read`: boolean
- `createdAt`: timestamp
