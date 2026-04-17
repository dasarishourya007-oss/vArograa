import React, { createContext, useContext, useState } from 'react';

const AppointmentContext = createContext();

export const useAppointments = () => {
    const context = useContext(AppointmentContext);
    if (!context) {
        throw new Error('useAppointments must be used within an AppointmentProvider');
    }
    return context;
};

export const AppointmentProvider = ({ children }) => {
    const [pendingApprovals, setPendingApprovals] = useState([
        { id: 1, token: 'T-042', name: 'John Peterson', doctor: 'Dr. Sarah Mitchell', time: '10:15 AM', status: 'Waiting', est: '15 min' },
        { id: 2, token: 'T-043', name: 'Emily Blunt', doctor: 'Dr. Michael Chen', time: '10:30 AM', status: 'Waiting', est: '25 min' },
        { id: 3, token: 'T-044', name: 'Robert Downey', doctor: 'Dr. Sarah Mitchell', time: '10:45 AM', status: 'Waiting', est: '40 min' },
    ]);

    const [activeConsultations, setActiveConsultations] = useState([
        { id: 's1', docName: "Dr. Sarah Mitchell", patient: "James Anderson", token: "T-038", duration: 645 },
        { id: 's2', docName: "Dr. Michael Chen", patient: "Sarah Jenkins", token: "T-041", duration: 210 },
        { id: 's3', docName: "Dr. James Wilson", patient: "Robert Fox", token: "T-039", duration: 480 }
    ]);

    const [completedHistory, setCompletedHistory] = useState([
        { id: 'h1', token: 'T-038', name: 'Alice Freeman', doctor: 'Dr. Michael Chen', completedAt: '09:15 AM' },
        { id: 'h2', token: 'T-039', name: 'Bernard Shaw', doctor: 'Dr. Sarah Mitchell', completedAt: '09:30 AM' },
        { id: 'h3', token: 'T-040', name: 'Cynthia Moss', doctor: 'Dr. Michael Chen', completedAt: '09:45 AM' },
        { id: 'h4', token: 'T-041', name: 'David Gandy', doctor: 'Dr. Sarah Mitchell', completedAt: '10:00 AM' },
    ]);

    const approveAppointment = (appointmentId) => {
        const appointment = pendingApprovals.find(a => a.id === appointmentId);
        if (appointment) {
            setPendingApprovals(prev => prev.filter(a => a.id !== appointmentId));
            // Move to active consultations (simulated)
            setActiveConsultations(prev => [
                ...prev,
                {
                    id: `s-${Date.now()}`,
                    docName: appointment.doctor,
                    patient: appointment.name,
                    token: appointment.token,
                    duration: 0
                }
            ]);
        }
    };

    const finalizeConsultation = (sessionId, finalDuration) => {
        const session = activeConsultations.find(s => s.id === sessionId);
        if (session) {
            setActiveConsultations(prev => prev.filter(s => s.id !== sessionId));
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            setCompletedHistory(prev => [
                {
                    id: `h-${Date.now()}`,
                    token: session.token,
                    name: session.patient,
                    doctor: session.docName,
                    completedAt: timeStr
                },
                ...prev
            ]);
        }
    };

    const addPendingAppointment = (appointment) => {
        setPendingApprovals(prev => [...prev, appointment]);
    };

    return (
        <AppointmentContext.Provider value={{
            pendingApprovals,
            activeConsultations,
            completedHistory,
            approveAppointment,
            finalizeConsultation,
            addPendingAppointment
        }}>
            {children}
        </AppointmentContext.Provider>
    );
};
