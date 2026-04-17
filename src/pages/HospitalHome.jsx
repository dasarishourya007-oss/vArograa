import React from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

const HospitalHome = () => {
  return (
    <div className="hospital-home">
      <Header title="Hospital Dashboard" />
      <main className="p-4">
        <h1 className="text-2xl font-bold">Welcome to the Hospital Dashboard</h1>
        <p className="mt-4">Here you can manage appointments, view patient details, and more.</p>
        {/* Add more sections as needed */}
      </main>
      <BottomNav />
    </div>
  );
};

export default HospitalHome;
