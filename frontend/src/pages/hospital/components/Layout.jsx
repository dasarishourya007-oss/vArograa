import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/global.css';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="hospital-dashboard-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                backgroundColor: 'transparent',
                marginLeft: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                transition: 'var(--transition)'
            }}>
                <div style={{
                    padding: '2.5rem 3.5rem',
                    maxWidth: '1800px', // Wider for "Web Page" format
                    width: '100%',
                    margin: '0 auto',
                    position: 'relative',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2.5rem' // Ensure healthy gap between header and content
                }}>
                    <Header />
                    <div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={window.location.pathname}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Ambient Background Glows */}
                <div style={{
                    position: 'fixed',
                    top: '-10%',
                    right: '-5%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'fixed',
                    bottom: '-10%',
                    left: '10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, var(--teal-glow) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
            </main>
        </div>
    );
};

export default Layout;
