import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Landmark, CheckCircle, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';

const PaymentScreen = ({ appointment, onPaymentSuccess, onBack }) => {
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [isProcessing, setIsProcessing] = useState(false);

    const methods = [
        { id: 'upi', name: 'UPI (GPay / PhonePe)', icon: <Smartphone size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'netbanking', name: 'Netbanking', icon: <Landmark size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const handlePayment = () => {
        setIsProcessing(true);
        // Mocking payment gateway delay
        setTimeout(() => {
            setIsProcessing(false);
            onPaymentSuccess();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[4000] bg-slate-50 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black tracking-tight">Checkout</h1>
            </div>

            {/* Appointment Summary */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Appointment Summary</span>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{appointment?.doctor || 'Specialist'}</h2>
                        <p className="text-sm text-slate-500 font-bold">{appointment?.hospital || 'HealthCenter'}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-p-600">Rs.500</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                    <div className="px-3 py-1 bg-slate-100 rounded-full">
                        <span className="text-xs font-bold text-slate-600">{appointment?.slot || '10:30 AM'}</span>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full">
                        <span className="text-xs font-bold text-slate-600">Today</span>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Payment Method</h3>
            <div className="flex flex-col gap-3 mb-8">
                {methods.map((method) => (
                    <motion.button
                        key={method.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all ${selectedMethod === method.id
                            ? 'bg-white border-blue-600 shadow-lg shadow-blue-100'
                            : 'bg-white border-white shadow-sm'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.bg} ${method.color}`}>
                            {method.icon}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{method.name}</span>
                        {selectedMethod === method.id && (
                            <div className="ml-auto w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                <CheckCircle size={14} className="text-white" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-auto">
                <div className="flex items-center justify-center gap-2 mb-4 text-slate-400">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secure 256-bit SSL Encrypted</span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[24px] bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : (
                        <>
                            PAY NOW Rs.500
                            <ExternalLink size={20} />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

export default PaymentScreen;
