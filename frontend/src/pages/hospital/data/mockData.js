export const MOCK_DOCTORS = [
    { id: 1, name: "Dr. Sarah Mitchell", specialization: "Cardiology", status: "Available", hours: "09:00 - 17:00", activeConsultation: null },
    { id: 2, name: "Dr. James Wilson", specialization: "Pediatrics", status: "In Consultation", hours: "08:00 - 16:00", activeConsultation: { patient: "Leo Das", start: "09:45" } },
    { id: 3, name: "Dr. Elena Rodriguez", specialization: "Orthopedics", status: "On Break", hours: "10:00 - 18:00", activeConsultation: null },
    { id: 4, name: "Dr. Michael Chen", specialization: "General Medicine", status: "Available", hours: "09:00 - 17:00", activeConsultation: null },
    { id: 5, name: "Dr. Priya Sharma", specialization: "Neurology", status: "Off Duty", hours: "12:00 - 20:00", activeConsultation: null },
];

export const MOCK_QUEUES = {
    1: { current: "Emma Watson", waiting: ["John Doe", "Alice Smith"], total: 12 },
    2: { current: "Leo Das", waiting: ["Bob Brown", "Charlie Davis", "Eve White"], total: 18 },
    3: { current: null, waiting: ["Grace Hall", "Hank Hill"], total: 8 },
    4: { current: "Ivy League", waiting: ["Jack Frost"], total: 15 },
    5: { current: null, waiting: [], total: 0 },
};

export const MOCK_BLOOD_BANK = [
    { type: "A+", stock: 45, status: "Normal", needed: false },
    { type: "A-", stock: 8, status: "Critical", needed: true },
    { type: "B+", stock: 32, status: "Normal", needed: false },
    { type: "B-", stock: 12, status: "Low", needed: true },
    { type: "O+", stock: 65, status: "Normal", needed: false },
    { type: "O-", stock: 4, status: "Critical", needed: true },
    { type: "AB+", stock: 15, status: "Low", needed: false },
    { type: "AB-", stock: 2, status: "Critical", needed: true },
];

export const MOCK_SCHEDULE = {
    "08:00": 2, "09:00": 4, "10:00": 5, "11:00": 5, "12:00": 3,
    "13:00": 2, "14:00": 4, "15:00": 5, "16:00": 4, "17:00": 2,
};

export const MOCK_WARDS = [
    { id: "W1", name: "Intensive Care Unit (ICU)", totalBeds: 10, occupied: 4, type: "Critical Care" },
    { id: "W2", name: "General Medicine Ward", totalBeds: 25, occupied: 12, type: "General" },
    { id: "W3", name: "Pediatric Ward", totalBeds: 15, occupied: 8, type: "Pediatrics" },
    { id: "W4", name: "Surgical Ward", totalBeds: 10, occupied: 5, type: "Surgery" },
    { id: "W5", name: "Maternity Ward", totalBeds: 12, occupied: 6, type: "Maternity" }
];

export const MOCK_PATIENTS = [
    { 
        id: "PX-101", 
        name: "John Doe", 
        email: "john.doe@email.com", 
        phone: "+1 555-0101", 
        guardian: "Jane Doe (Spouse)",
        joinedDate: "2025-11-12",
        dischargedDate: "2025-11-20",
        treatment: "Acute Appendectomy",
        consultedDoctor: "Dr. Elena Rodriguez",
        amountPaid: 4500,
        status: "Discharged"
    },
    { 
        id: "PX-102", 
        name: "Alice Smith", 
        email: "alice.s@provider.net", 
        phone: "+1 555-0102", 
        guardian: "Robert Smith (Father)",
        joinedDate: "2025-12-05",
        dischargedDate: "2025-12-15",
        treatment: "Pneumonia Recovery",
        consultedDoctor: "Dr. Michael Chen",
        amountPaid: 3200,
        status: "Discharged"
    },
    { 
        id: "PX-103", 
        name: "Michael Brown", 
        email: "mbrown88@gmail.com", 
        phone: "+1 555-0103", 
        guardian: "Sarah Brown (Mother)",
        joinedDate: "2026-01-10",
        dischargedDate: "2026-01-18",
        treatment: "Fractured Tibia Surgery",
        consultedDoctor: "Dr. Elena Rodriguez",
        amountPaid: 5800,
        status: "Discharged"
    },
    { 
        id: "PX-104", 
        name: "Emily Davis", 
        email: "emily.davis@corp.com", 
        phone: "+1 555-0104", 
        guardian: "Mark Davis (Husband)",
        joinedDate: "2026-01-25",
        dischargedDate: "2026-02-02",
        treatment: "Maternity Care",
        consultedDoctor: "Dr. Sarah Mitchell",
        amountPaid: 4200,
        status: "Discharged"
    },
    { 
        id: "PX-105", 
        name: "David Wilson", 
        email: "dwilson@outlook.com", 
        phone: "+1 555-0105", 
        guardian: "Karen Wilson (Sister)",
        joinedDate: "2026-02-10",
        dischargedDate: "2026-02-15",
        treatment: "Severe Migraine Observation",
        consultedDoctor: "Dr. Priya Sharma",
        amountPaid: 1500,
        status: "Discharged"
    },
    { 
        id: "PX-106", 
        name: "Sophia Martinez", 
        email: "sophia.m@edu.org", 
        phone: "+1 555-0106", 
        guardian: "Carlos Martinez (Father)",
        joinedDate: "2026-02-18",
        dischargedDate: null,
        treatment: "Type 1 Diabetes Stabilization",
        consultedDoctor: "Dr. Michael Chen",
        ward: "General Medicine Ward",
        bed: "B-204",
        amountPaid: 2100,
        status: "Admitted"
    },
    { 
        id: "PX-107", 
        name: "James Taylor", 
        email: "jtaylor@tech.com", 
        phone: "+1 555-0107", 
        guardian: "Linda Taylor (Mother)",
        joinedDate: "2026-02-20",
        dischargedDate: null,
        treatment: "Post-Cardiac Monitoring",
        consultedDoctor: "Dr. Sarah Mitchell",
        ward: "Intensive Care Unit (ICU)",
        bed: "ICU-102",
        amountPaid: 8500,
        status: "Admitted"
    },
    { 
        id: "PX-108", 
        name: "Emma Wilson", 
        email: "emma.w@gmail.com", 
        phone: "+1 555-0108", 
        guardian: "Sarah Wilson (Mother)",
        joinedDate: "2026-02-22",
        dischargedDate: null,
        treatment: "Severe Respiratory Distress",
        consultedDoctor: "Dr. Michael Chen",
        ward: "Intensive Care Unit (ICU)",
        bed: "ICU-105",
        amountPaid: 12000,
        status: "Admitted"
    },
    { 
        id: "PX-109", 
        name: "Robert Miller", 
        email: "r.miller@corp.com", 
        phone: "+1 555-0109", 
        guardian: "Nancy Miller (Wife)",
        joinedDate: "2026-02-23",
        dischargedDate: null,
        treatment: "Post-Surgical Observation",
        consultedDoctor: "Dr. Elena Rodriguez",
        ward: "Intensive Care Unit (ICU)",
        bed: "ICU-108",
        amountPaid: 9500,
        status: "Admitted"
    },
    { 
        id: "PX-110", 
        name: "Olivia Brown", 
        email: "obrown@edu.org", 
        phone: "+1 555-0110", 
        guardian: "Mark Brown (Father)",
        joinedDate: "2026-02-24",
        dischargedDate: null,
        treatment: "Neurological Monitoring",
        consultedDoctor: "Dr. Priya Sharma",
        ward: "Intensive Care Unit (ICU)",
        bed: "ICU-110",
        amountPaid: 7200,
        status: "Admitted"
    },
    { 
        id: "PX-111", 
        name: "William Davis", 
        email: "w.davis@outlook.com", 
        phone: "+1 555-0111", 
        guardian: "Helen Davis (Sister)",
        joinedDate: "2026-02-15",
        dischargedDate: null,
        treatment: "Chronic Kidney Disease Mgmt",
        consultedDoctor: "Dr. Michael Chen",
        ward: "General Medicine Ward",
        bed: "B-205",
        amountPaid: 3400,
        status: "Admitted"
    },
    // General Medicine Ward (Remaining 10)
    { id: "PX-112", name: "Lucas Garcia", email: "lucas.g@mail.com", phone: "+1 555-0112", guardian: "Maria Garcia (Wife)", joinedDate: "2026-02-10", treatment: "Hypertension Monitoring", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-206", amountPaid: 1200, status: "Admitted" },
    { id: "PX-113", name: "Isabella Yang", email: "i.yang@tech.com", phone: "+1 555-0113", guardian: "Kevin Yang (Husband)", joinedDate: "2026-02-12", treatment: "Severe Allergy Treatment", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-207", amountPaid: 1800, status: "Admitted" },
    { id: "PX-114", name: "Ethan Hunt", email: "ethan.h@imf.org", phone: "+1 555-0114", guardian: "Julia Hunt (Wife)", joinedDate: "2026-02-14", treatment: "Physical Therapy", consultedDoctor: "Dr. Elena Rodriguez", ward: "General Medicine Ward", bed: "B-208", amountPaid: 2500, status: "Admitted" },
    { id: "PX-115", name: "Mia Thompson", email: "mia.t@edu.com", phone: "+1 555-0115", guardian: "George Thompson (Father)", joinedDate: "2026-02-16", treatment: "Vitamin Deficiency", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-209", amountPaid: 900, status: "Admitted" },
    { id: "PX-116", name: "Noah Clark", email: "n.clark@corp.net", phone: "+1 555-0116", guardian: "Anna Clark (Mother)", joinedDate: "2026-02-17", treatment: "Migraine Protocol", consultedDoctor: "Dr. Priya Sharma", ward: "General Medicine Ward", bed: "B-210", amountPaid: 1400, status: "Admitted" },
    { id: "PX-117", name: "Ava White", email: "ava.w@provider.net", phone: "+1 555-0117", guardian: "John White (Brother)", joinedDate: "2026-02-19", treatment: "General Observation", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-211", amountPaid: 1100, status: "Admitted" },
    { id: "PX-118", name: "Liam Scott", email: "lscot@outlook.com", phone: "+1 555-0118", guardian: "Susan Scott (Wife)", joinedDate: "2026-02-21", treatment: "Diabetes Management", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-212", amountPaid: 3200, status: "Admitted" },
    { id: "PX-119", name: "Charlotte Green", email: "c.green@gmail.com", phone: "+1 555-0119", guardian: "Ben Green (Husband)", joinedDate: "2026-02-22", treatment: "Anemia Treatment", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-213", amountPaid: 1600, status: "Admitted" },
    { id: "PX-120", name: "Benjamin Lee", email: "ben.lee@tech.com", phone: "+1 555-0120", guardian: "Joyce Lee (Mother)", joinedDate: "2026-02-23", treatment: "Asthma Stabilization", consultedDoctor: "Dr. Sarah Mitchell", ward: "General Medicine Ward", bed: "B-214", amountPaid: 2100, status: "Admitted" },
    { id: "PX-121", name: "Amelia Adams", email: "a.adams@corp.com", phone: "+1 555-0121", guardian: "Peter Adams (Father)", joinedDate: "2026-02-24", treatment: "Digestive Issues", consultedDoctor: "Dr. Michael Chen", ward: "General Medicine Ward", bed: "B-215", amountPaid: 1300, status: "Admitted" },

    // Pediatric Ward (8)
    { id: "PX-P01", name: "Leo Das", email: "leo.d@kidmail.com", phone: "+1 555-0901", guardian: "Vijay Das (Father)", joinedDate: "2026-02-20", treatment: "Pediatric Fever", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-301", amountPaid: 800, status: "Admitted" },
    { id: "PX-P02", name: "Emma Watson", email: "emma.w@kidmail.com", phone: "+1 555-0902", guardian: "Hermione Watson (Mother)", joinedDate: "2026-02-21", treatment: "Tonsillitis Recovery", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-302", amountPaid: 1200, status: "Admitted" },
    { id: "PX-P03", name: "Alice Smith Jr", email: "alice.jr@kidmail.com", phone: "+1 555-0903", guardian: "Alice Smith (Mother)", joinedDate: "2026-02-22", treatment: "Broken Arm Setting", consultedDoctor: "Dr. Elena Rodriguez", ward: "Pediatric Ward", bed: "P-303", amountPaid: 2500, status: "Admitted" },
    { id: "PX-P04", name: "Charlie Bucket", email: "charlie.b@kidmail.com", phone: "+1 555-0904", guardian: "Grandpa Joe (Grandfather)", joinedDate: "2026-02-23", treatment: "Nutritional Support", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-304", amountPaid: 600, status: "Admitted" },
    { id: "PX-P05", name: "Matilda Wormwood", email: "matilda.w@kidmail.com", phone: "+1 555-0905", guardian: "Miss Honey (Guardian)", joinedDate: "2026-02-24", treatment: "Ophthalmic Checkup", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-305", amountPaid: 450, status: "Admitted" },
    { id: "PX-P06", name: "Harry Potter", email: "harry.p@kidmail.com", phone: "+1 555-0906", guardian: "Albus Dumbledore (Guardian)", joinedDate: "2026-02-25", treatment: "Scar Treatment", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-306", amountPaid: 3200, status: "Admitted" },
    { id: "PX-P07", name: "Lucy Pevensie", email: "lucy.p@kidmail.com", phone: "+1 555-0907", guardian: "Peter Pevensie (Brother)", joinedDate: "2026-02-18", treatment: "Severe Cold", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-307", amountPaid: 700, status: "Admitted" },
    { id: "PX-P08", name: "Kevin McCallister", email: "kevin.m@kidmail.com", phone: "+1 555-0908", guardian: "Kate McCallister (Mother)", joinedDate: "2026-02-19", treatment: "Minor Burn Care", consultedDoctor: "Dr. James Wilson", ward: "Pediatric Ward", bed: "P-308", amountPaid: 950, status: "Admitted" },

    // Surgical Ward (5)
    { id: "PX-S01", name: "T'Challa Udaku", email: "tchalla@wakanda.gov", phone: "+1 555-0701", guardian: "Shuri (Sister)", joinedDate: "2026-02-21", treatment: "Advanced Limb Repair", consultedDoctor: "Dr. Elena Rodriguez", ward: "Surgical Ward", bed: "S-401", amountPaid: 45000, status: "Admitted" },
    { id: "PX-S02", name: "Steve Rogers", email: "cap@avengers.com", phone: "+1 555-0702", guardian: "Bucky Barnes (Friend)", joinedDate: "2026-02-22", treatment: "Shoulder Reconstruction", consultedDoctor: "Dr. Elena Rodriguez", ward: "Surgical Ward", bed: "S-402", amountPaid: 15000, status: "Admitted" },
    { id: "PX-S03", name: "Bruce Banner", email: "hulk@gamma.edu", phone: "+1 555-0703", guardian: "Tony Stark (Friend)", joinedDate: "2026-02-23", treatment: "Gamma Radiation Burn", consultedDoctor: "Dr. Michael Chen", ward: "Surgical Ward", bed: "S-403", amountPaid: 22000, status: "Admitted" },
    { id: "PX-S04", name: "Natasha Romanoff", email: "nat@spy.net", phone: "+1 555-0704", guardian: "Clint Barton (Friend)", joinedDate: "2026-02-24", treatment: "Abdominal Surgery", consultedDoctor: "Dr. Elena Rodriguez", ward: "Surgical Ward", bed: "S-404", amountPaid: 18000, status: "Admitted" },
    { id: "PX-S05", name: "Thor Odinson", email: "thor@asgard.com", phone: "+1 555-0705", guardian: "Loki (Brother)", joinedDate: "2026-02-25", treatment: "Hammer Injury", consultedDoctor: "Dr. Elena Rodriguez", ward: "Surgical Ward", bed: "S-405", amountPaid: 5000, status: "Admitted" },

    // Maternity Ward (6)
    { id: "PX-M01", name: "Mary Jane Watson", email: "mj@dailybugle.com", phone: "+1 555-0601", guardian: "Peter Parker (Husband)", joinedDate: "2026-02-21", treatment: "Prenatal Observation", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-501", amountPaid: 5000, status: "Admitted" },
    { id: "PX-M02", name: "Lois Lane", email: "lois@dailyplanet.com", phone: "+1 555-0602", guardian: "Clark Kent (Husband)", joinedDate: "2026-02-22", treatment: "Post-Delivery Care", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-502", amountPaid: 7500, status: "Admitted" },
    { id: "PX-M03", name: "Pepper Potts", email: "pepper@starkinc.com", phone: "+1 555-0603", guardian: "Tony Stark (Husband)", joinedDate: "2026-02-23", treatment: "Prenatal Vitamins", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-503", amountPaid: 12000, status: "Admitted" },
    { id: "PX-M04", name: "Padme Amidala", email: "senator@naboo.gov", phone: "+1 555-0604", guardian: "Anakin Skywalker (Husband)", joinedDate: "2026-02-24", treatment: "Maternity Monitoring", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-504", amountPaid: 9000, status: "Admitted" },
    { id: "PX-M05", name: "Wanda Maximoff", email: "scarlet@witch.net", phone: "+1 555-0605", guardian: "Vision (Husband)", joinedDate: "2026-02-25", treatment: "Ultra-Sound Care", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-505", amountPaid: 6500, status: "Admitted" },
    { id: "PX-M06", name: "Diana Prince", email: "diana@themyscira.com", phone: "+1 555-0606", guardian: "Steve Trevor (Friend)", joinedDate: "2026-02-20", treatment: "General Maternity", consultedDoctor: "Dr. Sarah Mitchell", ward: "Maternity Ward", bed: "M-506", amountPaid: 4200, status: "Admitted" }
];
