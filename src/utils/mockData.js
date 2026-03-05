export const hospitals = [
    {
        id: 'h1',
        name: 'City Care Hospital',
        address: 'Madhapur, Hyderabad',
        distance: '2.5 km',
        rating: 4.5,
        isOpen: true,
        hasEmergency: true,
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b9af923?auto=format&fit=crop&q=80&w=500',
        costRange: '₹500 - ₹45,000',
        facilities: ['X-Ray', 'Diagnostic Lab', '24/7 Pharmacy', 'Emergency Care', 'ICU'],
        bloodAvailability: { 'A+': 'Available', 'B+': 'Low Stock', 'O+': 'Available', 'AB+': 'Check' },
        doctors: [
            {
                id: 'd1',
                name: 'Dr. Sarah Smith',
                specialty: 'Cardiologist',
                experience: 12,
                image: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=500',
                consultingTime: '15-20 mins',
                fees: { online: 500, offline: 800 },
                hospitals: ['City Care Hospital', 'St. Mary\'s Clinic'],
                rating: 4.8,
                reviewsCount: 124,
                reviews: [
                    { id: 1, user: 'Rahul V.', rating: 5, comment: 'Excellent doctor, very patient and explained everything clearly.', date: '2 days ago' },
                    { id: 2, user: 'Anita S.', rating: 4, comment: 'Good experience, but the waiting time was a bit long.', date: '1 week ago' },
                    { id: 21, user: 'Vikram J.', rating: 5, comment: 'The best cardiologist in the city. Very professional.', date: '3 days ago' }
                ],
                status: 'Available',
                availability: {
                    busy: ['11:00 AM', '04:00 PM'],
                    available: ['09:00 AM', '10:00 AM', '12:00 PM', '05:00 PM', '06:00 PM']
                }
            },
            {
                id: 'd2',
                name: 'Dr. John Doe',
                specialty: 'General Physician',
                experience: 8,
                image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=500',
                consultingTime: '10-15 mins',
                fees: { online: 300, offline: 500 },
                hospitals: ['City Care Hospital'],
                rating: 4.5,
                reviewsCount: 89,
                reviews: [
                    { id: 3, user: 'Amit K.', rating: 5, comment: 'Very professional. Highly recommended for general checkups.', date: '3 days ago' }
                ],
                status: 'In Appointment',
                availability: {
                    busy: ['09:00 AM', '10:00 AM', '11:00 AM'],
                    available: ['12:00 PM', '04:00 PM', '05:00 PM', '06:00 PM']
                }
            }
        ]
    },
    {
        id: 'h2',
        name: 'Sunshine Medical Center',
        address: 'Gachibowli, Hyderabad',
        distance: '4.2 km',
        rating: 4.2,
        isOpen: true,
        hasEmergency: false,
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=500',
        costRange: '₹300 - ₹30,000',
        facilities: ['Pathology Lab', 'Pharmacy', 'Physiotherapy', 'Outpatient Dept'],
        bloodAvailability: { 'A-': 'Available', 'B-': 'Check', 'O-': 'Unavailable' },
        doctors: [
            {
                id: 'd3',
                name: 'Dr. Emily Brown',
                specialty: 'Pediatrician',
                experience: 15,
                image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=500',
                consultingTime: '20-30 mins',
                fees: { online: 600, offline: 1000 },
                hospitals: ['Sunshine Medical Center', 'Children\'s Hope'],
                rating: 4.9,
                reviewsCount: 210,
                reviews: [
                    { id: 4, user: 'Priya M.', rating: 5, comment: 'She is great with kids! My son felt very comfortable.', date: '5 days ago' }
                ],
                status: 'Available',
                availability: {
                    busy: [],
                    available: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '05:00 PM']
                }
            }
        ]
    },
    {
        id: 'h3',
        name: 'Green Valley Clinic',
        address: 'Jubilee Hills, Hyderabad',
        distance: '6.0 km',
        rating: 4.8,
        isOpen: false,
        hasEmergency: true,
        image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=500',
        costRange: '₹400 - ₹25,000',
        facilities: ['Eye Care Unit', 'Optical Shop', 'Laser Surgery', 'Consultation'],
        bloodAvailability: {},
        doctors: [
            {
                id: 'd4',
                name: 'Dr. Michael Chen',
                specialty: 'Ophthalmologist',
                experience: 10,
                image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=500',
                consultingTime: '15-20 mins',
                fees: { online: 400, offline: 700 },
                hospitals: ['Green Valley Clinic', 'Eye Tech'],
                rating: 4.7,
                reviewsCount: 56,
                reviews: [
                    { id: 5, user: 'Suresh L.', rating: 4, comment: 'Accurate diagnosis and very helpful staff.', date: '1 month ago' }
                ],
                status: 'Available',
                availability: {
                    busy: ['02:00 PM'],
                    available: ['09:00 AM', '10:00 AM', '01:00 PM', '03:00 PM']
                }
            }
        ]
    },
    {
        id: 'h4',
        name: 'Apollo Spectra',
        address: 'Kondapur, Hyderabad',
        distance: '1.2 km',
        rating: 4.6,
        isOpen: true,
        hasEmergency: true,
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0674c6c?auto=format&fit=crop&q=80&w=500',
        costRange: '₹800 - ₹1,50,000',
        facilities: ['Advanced Imaging', 'Modular OT', 'Cardiac Unit', 'Emergency', 'Blood Bank'],
        bloodAvailability: { 'A+': 'Available', 'B+': 'Available', 'O+': 'Available', 'O-': 'Rare Stock' },
        doctors: [
            {
                id: 'd5',
                name: 'Dr. Robert Wilson',
                specialty: 'General Physician',
                experience: 20,
                image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=500',
                consultingTime: '20-25 mins',
                fees: { online: 500, offline: 900 },
                hospitals: ['Apollo Spectra', 'City Hospital'],
                rating: 4.8,
                reviewsCount: 340,
                reviews: [
                    { id: 6, user: 'Vikram T.', rating: 5, comment: 'A veteran in the field. Extremely knowledgeable.', date: '2 weeks ago' }
                ],
                status: 'Available',
                availability: {
                    busy: [],
                    available: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM']
                }
            }
        ]
    },
    {
        id: 'h5',
        name: 'Local Community Health',
        address: 'Miyapur, Hyderabad',
        distance: '3.8 km',
        rating: 4.0,
        isOpen: true,
        hasEmergency: false,
        image: 'https://images.unsplash.com/photo-1519494083224-7236dacc6f02?auto=format&fit=crop&q=80&w=500',
        costRange: '₹100 - ₹5,000',
        facilities: ['Primary Care', 'Vaccination', 'Basic Diagnostics', 'Maternal Health'],
        bloodAvailability: { 'Any': 'Request only' },
        doctors: [
            {
                id: 'rmp1',
                name: 'Rahul Kumar (RMP)',
                specialty: 'RMP Doctor',
                experience: 5,
                image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=500',
                fees: { online: 100, offline: 200 },
                hospitals: ['Local Community Health'],
                rating: 3.9,
                reviewsCount: 45,
                reviews: [],
                status: 'Available',
                availability: {
                    busy: [],
                    available: ['08:00 AM', '09:00 AM', '10:00 AM', '05:00 PM']
                }
            }
        ]
    }
];
export const medicalStores = [
    {
        id: 's1',
        name: 'Apollo Pharmacy',
        address: 'Hitech City, Hyderabad',
        distance: '0.8 km',
        rating: 4.8,
        isOpen: true,
        image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=500',
        deliveryTime: '20-30 mins',
        priceScore: 85, // Higher = better price/value
        deliveryFee: 20
    },
    {
        id: 's2',
        name: 'MedPlus',
        address: 'Kondapur, Hyderabad',
        distance: '1.5 km',
        rating: 4.5,
        isOpen: true,
        image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=500',
        deliveryTime: '15-25 mins',
        priceScore: 92,
        deliveryFee: 15
    },
    {
        id: 's3',
        name: 'Wellness Forever',
        address: 'Madhapur, Hyderabad',
        distance: '2.1 km',
        rating: 4.7,
        isOpen: true,
        image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=500',
        deliveryTime: '30-40 mins',
        priceScore: 78,
        deliveryFee: 40
    },
    {
        id: 's4',
        name: 'Local Generic Store',
        address: 'Miyapur, Hyderabad',
        distance: '3.5 km',
        rating: 4.0,
        isOpen: false,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=500',
        deliveryTime: '45-55 mins',
        priceScore: 98,
        deliveryFee: 10
    }
];
