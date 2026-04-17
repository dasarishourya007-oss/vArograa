export const MOCK_STORES = [
    {
        id: 'ms1',
        name: 'HealthPlus Pharmacy',
        address: '123 Medical Lane, Hitech City, Hyderabad',
        city: 'Hyderabad',
        phoneNumber: '+91 98765 43210',
        deliveryPartner: {
            name: 'Ramesh Kumar',
            phone: '+91 99887 76655',
            photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200',
            rating: 4.9
        },
        distanceKm: 0.8,
        walkingTime: '10 min',
        drivingTime: '3 min',
        costIndicator: '₹₹',
        priceScore: 98,
        rating: 4.8,
        reviewsCount: 1250,
        isOpen: true,
        hasVerifiedBadge: true,
        image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=400',
        inventory: ['Paracetamol', 'Amoxicillin', 'Cetirizine', 'Metformin', 'Omeprazole', 'Aspirin', 'Dolo 650', 'Vicks Vaporub', 'Combiflam'],
        medicines: [
            { name: 'Paracetamol', price: 45 },
            { name: 'Amoxicillin', price: 120 },
            { name: 'Cetirizine', price: 30 },
            { name: 'Dolo 650', price: 25 },
            { name: 'Combiflam', price: 35 }
        ]
    },
    {
        id: 'ms2',
        name: 'Arogra Wellness Center',
        address: '45 Wellness Road, Jubilee Hills, Hyderabad',
        city: 'Hyderabad',
        phoneNumber: '+91 98765 43211',
        deliveryPartner: {
            name: 'Suresh Raina',
            phone: '+91 99887 76656',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
            rating: 4.7
        },
        distanceKm: 2.1,
        walkingTime: '25 min',
        drivingTime: '7 min',
        costIndicator: '₹₹₹',
        priceScore: 85,
        rating: 4.5,
        reviewsCount: 840,
        isOpen: true,
        hasVerifiedBadge: true,
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
        inventory: ['Insulin', 'Atorvastatin', 'Lisinopril', 'Levothyroxine', 'Amlodipine', 'Simvastatin', 'Gliclazide', 'Telmisartan'],
        medicines: [
            { name: 'Insulin', price: 450 },
            { name: 'Atorvastatin', price: 80 },
            { name: 'Telmisartan', price: 95 }
        ]
    },
    {
        id: 'ms3',
        name: 'Budget Meds',
        address: '78 Gachibowli Main Rd, Hyderabad',
        city: 'Hyderabad',
        phoneNumber: '+91 98765 43212',
        deliveryPartner: {
            name: 'Vikram Singh',
            phone: '+91 99887 76657',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
            rating: 4.8
        },
        distanceKm: 1.2,
        walkingTime: '15 min',
        drivingTime: '4 min',
        costIndicator: '₹',
        priceScore: 99,
        rating: 4.2,
        reviewsCount: 2100,
        isOpen: true,
        hasVerifiedBadge: false,
        image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=400',
        inventory: ['Paracetamol', 'Ibuprofen', 'Cetirizine', 'Ranitidine', 'Digoxin', 'Warfarin', 'Pantoprazole', 'Domperidone'],
        medicines: [
            { name: 'Paracetamol', price: 40 },
            { name: 'Ibuprofen', price: 55 },
            { name: 'Pantoprazole', price: 65 }
        ]
    },
    {
        id: 'ms4',
        name: 'City Care Pharmacy',
        address: '12 Kondapur X Roads, Hyderabad',
        city: 'Hyderabad',
        phoneNumber: '+91 98765 43213',
        deliveryPartner: {
            name: 'Anil Gupta',
            phone: '+91 99887 76658',
            photo: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=200',
            rating: 4.6
        },
        distanceKm: 3.5,
        walkingTime: '45 min',
        drivingTime: '12 min',
        costIndicator: '₹₹',
        priceScore: 92,
        rating: 4.6,
        reviewsCount: 320,
        isOpen: false,
        hasVerifiedBadge: true,
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?auto=format&fit=crop&q=80&w=400',
        inventory: ['Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Clarithromycin', 'Erythromycin'],
        medicines: [
            { name: 'Amoxicillin', price: 115 },
            { name: 'Azithromycin', price: 140 }
        ]
    },
    {
        id: 'ms5',
        name: 'Vizag Medicals',
        address: 'Dolphin Area, Visakhapatnam',
        city: 'Visakhapatnam',
        phoneNumber: '+91 98765 43214',
        deliveryPartner: {
            name: 'Prakash Rao',
            phone: '+91 99887 76659',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
            rating: 4.9
        },
        distanceKm: 1.5,
        walkingTime: '18 min',
        drivingTime: '5 min',
        costIndicator: '₹₹',
        priceScore: 95,
        rating: 4.7,
        reviewsCount: 500,
        isOpen: true,
        hasVerifiedBadge: true,
        image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=400',
        inventory: ['Paracetamol', 'Metformin', 'Lisinopril', 'Glibenclamide', 'Amlodipine'],
        medicines: [
            { name: 'Paracetamol', price: 48 },
            { name: 'Metformin', price: 60 }
        ]
    },
    {
        id: 'ms6',
        name: 'Coastal Pharmacy',
        address: 'Beach Road, Visakhapatnam',
        city: 'Visakhapatnam',
        phoneNumber: '+91 98765 43215',
        deliveryPartner: {
            name: 'Sanjeev Kumar',
            phone: '+91 99887 76660',
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
            rating: 4.5
        },
        distanceKm: 2.8,
        walkingTime: '35 min',
        drivingTime: '10 min',
        costIndicator: '₹',
        priceScore: 99,
        rating: 4.4,
        reviewsCount: 300,
        isOpen: true,
        hasVerifiedBadge: false,
        image: 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?auto=format&fit=crop&q=80&w=400',
        inventory: ['Ibuprofen', 'Atorvastatin', 'Paracetamol', 'Cetirizine'],
        medicines: [
            { name: 'Ibuprofen', price: 50 },
            { name: 'Cetirizine', price: 28 }
        ]
    }
];
