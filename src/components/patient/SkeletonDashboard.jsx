import React from 'react';
import { motion } from 'framer-motion';

const Shimmer = () => (
    <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            zIndex: 1
        }}
    />
);

const SkeletonItem = ({ width, height, borderRadius = '16px', className = '' }) => (
    <div 
        className={className}
        style={{ 
            width, height, borderRadius, 
            backgroundColor: '#e2e8f0', 
            position: 'relative', 
            overflow: 'hidden' 
        }}
    >
        <Shimmer />
    </div>
);

const SkeletonDashboard = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1.5rem 1.5rem 6rem' }}>
            {/* Header Skeleton */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <SkeletonItem width="56px" height="56px" borderRadius="18px" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <SkeletonItem width="120px" height="20px" borderRadius="4px" />
                        <SkeletonItem width="80px" height="12px" borderRadius="4px" />
                    </div>
                </div>
                <SkeletonItem width="40px" height="40px" borderRadius="12px" />
            </div>

            {/* Carousel Skeleton */}
            <SkeletonItem width="100%" height="160px" borderRadius="32px" className="mb-8" />

            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <SkeletonItem width="100%" height="70px" borderRadius="20px" />
                        <SkeletonItem width="40px" height="8px" borderRadius="2px" />
                    </div>
                ))}
            </div>

            {/* Featured Section Skeleton */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <SkeletonItem width="140px" height="24px" borderRadius="4px" />
                    <SkeletonItem width="60px" height="16px" borderRadius="4px" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <SkeletonItem width="80px" height="80px" borderRadius="16px" />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                                <SkeletonItem width="60%" height="16px" borderRadius="4px" />
                                <SkeletonItem width="40%" height="12px" borderRadius="4px" />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <SkeletonItem width="30px" height="12px" borderRadius="4px" />
                                    <SkeletonItem width="30px" height="12px" borderRadius="4px" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Nav Skeleton */}
            <div style={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, 
                height: '80px', background: 'white', borderTop: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 1.5rem', zIndex: 50
            }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <SkeletonItem key={i} width="32px" height="32px" borderRadius="10px" />
                ))}
            </div>
        </div>
    );
};

export default SkeletonDashboard;
