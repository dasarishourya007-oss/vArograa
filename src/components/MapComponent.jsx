import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getDirectionsUrl } from '../utils/geo';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Blue Dot for "You Are Here"
const blueDotIcon = new L.DivIcon({
    className: 'custom-user-marker',
    html: `<div class="user-marker-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

function ClickHandler({ onClick }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        },
    });
    return null;
}

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

const MapComponent = ({
    center = [17.3850, 78.4867],
    zoom = 13,
    markers = [],
    onMapClick,
    onLocationFound,
    interactive = true,
    onMarkerClick,
    userLocation = null, // Passed from global state now
    locationError = null,
    isLocating = false,
    onLocateMe = () => {}
}) => {


    const handleLocateMe = () => {
        if (!('geolocation' in navigator)) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(loc);
                setIsLocating(false);
                if (onLocationFound) onLocationFound(Object.values(loc));
            },
            (error) => {
                setIsLocating(false);
                let msg = 'Unable to retrieve your location.';
                if (error.code === 1) msg = 'Location access denied.';
                else if (error.code === 2) msg = 'Location unavailable.';
                else if (error.code === 3) msg = 'Location request timed out.';
                setLocationError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Internal auto-locate removed to favor AuthContext control


    // Simple grid-based clustering filter for performance if markers are too dense
    const filteredMarkers = React.useMemo(() => {
        if (markers.length < 50) return markers;
        const grid = new Map();
        const cellSize = 0.005; // ~500m
        return markers.filter(m => {
            const key = `${Math.floor(m.position[0]/cellSize)},${Math.floor(m.position[1]/cellSize)}`;
            if (grid.has(key)) return false;
            grid.set(key, true);
            return true;
        });
    }, [markers]);

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />


                <ChangeView center={center} zoom={zoom} />

                {userLocation && (
                    <Marker position={userLocation} icon={blueDotIcon}>
                        <Popup><b style={{ color: '#10b981' }}>You are here</b></Popup>
                    </Marker>
                )}

                {/* Connection Lines (Tracking) */}
                {userLocation && filteredMarkers.map((m, idx) => (
                    <Polyline 
                        key={`line-${idx}`} 
                        positions={[userLocation, m.position]} 
                        pathOptions={{ 
                            color: '#3b82f6', 
                            weight: 2, 
                            dashArray: '5, 10',
                            opacity: 0.5 
                        }} 
                    />
                ))}

                {filteredMarkers.map((m, idx) => {
                    const isPremium = m.rating >= 4.9;
                    const hospitalIcon = new L.DivIcon({
                        className: 'custom-hospital-icon',
                        html: `
                            <div class="marker-bubble ${isPremium ? 'premium-marker' : ''}">
                                <div class="marker-img-wrapper">
                                    <img src="${m.image || 'https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg'}" class="marker-img" />
                                    ${isPremium ? '<div class="premium-star">★</div>' : ''}
                                </div>
                                <div class="marker-info">
                                    <span class="marker-name">${m.title || 'Hospital'}</span>
                                    <div class="marker-meta">
                                        <span class="marker-distance">📍 ${m.distance || 'nearby'}</span>
                                        ${m.rating ? `<span class="marker-rating">⭐ ${m.rating}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `,
                        iconSize: [220, 70],
                        iconAnchor: [35, 70]
                    });

                    return (
                        <Marker
                            key={m.hospitalId || idx}
                            position={m.position}
                            icon={hospitalIcon}
                            eventHandlers={
                                onMarkerClick
                                    ? { click: () => onMarkerClick(m, idx) }
                                    : { click: () => {
                                        const url = getDirectionsUrl({ lat: m.position[0], lng: m.position[1] }, userLocation);
                                        window.open(url, '_blank');
                                    }}
                            }
                        />
                    );
                })}

                {onMapClick && <ClickHandler onClick={onMapClick} />}
            </MapContainer>

            {/* Map Overlays */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onLocateMe}
                    disabled={isLocating}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"

                    title="Locate Me"
                >
                    <div className={`w-5 h-5 flex items-center justify-center ${isLocating ? 'animate-spin' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                            <circle cx="12" cy="12" r="7" />
                            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity={isLocating ? 0.3 : 0.6} />
                        </svg>
                    </div>
                </button>
            </div>

            {locationError && (
                <div className="absolute bottom-4 left-4 right-16 z-[1000]">
                    <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-[11px] font-bold border border-rose-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        {locationError}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapComponent;
