export const hospitals = [
    {
        id: 'hosp-1',
        name: 'Apollo Hospital',
        location: 'Kukatpally, Hyderabad',
        latitude: 17.4849,
        longitude: 78.3884,
        rating: 4.8,
        priceScore: 85,
        image: 'https://images.unsplash.com/photo-1587350859723-9a4f4460c3e1?auto=format&fit=crop&q=80&w=200',
        consultationFees: { online: 500, offline: 800, home: 1200 }
    },
    {
        id: 'hosp-2',
        name: 'Medicover Hospitals',
        location: 'Hitech City, Hyderabad',
        latitude: 17.4435,
        longitude: 78.3772,
        rating: 4.5,
        priceScore: 70,
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200',
        consultationFees: { online: 400, offline: 600, home: 1000 }
    }
];

const sharedMeds = [
    { id: 'c-1', name: 'Paracetamol 500mg', price: 45, category: 'General', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-2', name: 'Amoxicillin Caps', price: 120, category: 'Antibiotics', image: 'https://images.unsplash.com/photo-1471864190281-ad5f9f33d70e?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-3', name: 'Cetirizine 10mg', price: 30, category: 'Allergy', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-4', name: 'Dolo 650', price: 25, category: 'General', image: 'https://images.unsplash.com/photo-1550572017-ed20bb0689f2?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-5', name: 'Ibuprofen Advil', price: 85, category: 'Pain Relief', image: 'https://images.unsplash.com/photo-1550572017-ed20bb0689f2?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-6', name: 'Vitamin C 500mg', price: 65, category: 'Wellness', image: 'https://images.unsplash.com/photo-1626245917106-5858238f4d43?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-7', name: 'Cough Syrup 100ml', price: 90, category: 'Cold & Cough', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200' },
    { id: 'c-8', name: 'Antacid Tablets', price: 40, category: 'Digestion', image: 'https://images.unsplash.com/photo-1550572017-ed20bb0689f2?auto=format&fit=crop&q=80&w=200' }
];

export const medicalStores = [
    {
        id: 'ms-1',
        name: 'vArogra Prime Pharmacy',
        address: '123 Medical Lane, Hitech City, Hyderabad',
        latitude: 17.4435, longitude: 78.3772, rating: 4.9, distance: '0.8 km', priceScore: 92,
        isOpen: true, deliveryTime: '15 mins',
        image: 'https://images.unsplash.com/photo-1586015555751-6397070104a3?auto=format&fit=crop&q=80&w=600',
        inventory: [...sharedMeds]
    },
    {
        id: 'ms-2',
        name: 'Global Med Care',
        address: '45 Vishnu Road, Kondapur, Hyderabad',
        latitude: 17.4622, longitude: 78.3568, rating: 4.6, distance: '2.4 km', priceScore: 78,
        isOpen: true, deliveryTime: '30 mins',
        image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=600',
        inventory: [...sharedMeds.slice(0, 6), { id: 'med-7', name: 'Insulin Pen', price: 850, category: 'Diabetes', image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=200' }]
    },
    {
        id: 'ms-3',
        name: 'Apollo Pharma Hub',
        address: 'Block 4, Jubilee Hills, Hyderabad',
        latitude: 17.4300, longitude: 78.4100, rating: 4.8, distance: '1.2 km', priceScore: 85,
        isOpen: true, deliveryTime: '20 mins',
        image: 'https://images.unsplash.com/photo-1587350859723-9a4f4460c3e1?auto=format&fit=crop&q=80&w=600',
        inventory: [...sharedMeds.slice(0, 4), { id: 'med-8', name: 'BP Monitor Digital', price: 2100, category: 'Diagnostics', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=200' }]
    },
    {
        id: 'ms-4',
        name: 'MedPlus Express',
        address: 'Metro Station, Miyapur, Hyderabad',
        latitude: 17.4933, longitude: 78.3500, rating: 4.4, distance: '3.1 km', priceScore: 95,
        isOpen: true, deliveryTime: '45 mins',
        image: 'https://images.unsplash.com/photo-1502740479091-6358875c8249?auto=format&fit=crop&q=80&w=600',
        inventory: [...sharedMeds.slice(2, 7), { id: 'med-10', name: 'Thermometer', price: 150, category: 'Diagnostics', image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=200' }]
    },
    {
        id: 'ms-5',
        name: 'Wellness24 Pharmacy',
        address: 'City Center, Banjara Hills, Hyderabad',
        latitude: 17.4120, longitude: 78.4430, rating: 4.7, distance: '4.5 km', priceScore: 65,
        isOpen: true, deliveryTime: '60 mins', is24x7: true,
        image: 'https://images.unsplash.com/photo-1534067783941-51c9c23ea34e?auto=format&fit=crop&q=80&w=600',
        inventory: [...sharedMeds.slice(0, 5), { id: 'med-13', name: 'Face Mask N95', price: 45, category: 'Essentials', image: 'https://images.unsplash.com/photo-1584483766114-2cea6fbe7297?auto=format&fit=crop&q=80&w=200' }]
    }
];
