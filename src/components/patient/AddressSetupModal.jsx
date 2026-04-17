import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, Loader2, Search, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MapComponent from '../MapComponent';
import {
  extractAddressFieldsFromNominatim,
  forwardGeocodeNominatim,
  reverseGeocodeNominatim
} from '../../utils/geocode';

const IN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const buildFullAddress = (form) => {
  const parts = [
    form.house,
    form.area,
    form.landmark && `Landmark: ${form.landmark}`,
    form.city,
    form.mandal,
    form.district,
    form.state,
    form.pincode
  ].filter(Boolean);
  return parts.join(', ');
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">
      {label}
    </span>
    <div className="mt-2">{children}</div>
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 ${
      props.className || ''
    }`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 ${
      props.className || ''
    }`}
  />
);

const AddressSetupModal = ({ isOpen, onClose, onSave, initialAddress }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState('auto'); // auto | manual
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const [mapCenter, setMapCenter] = useState([17.385, 78.4867]);
  const [pin, setPin] = useState(null); // [lat,lng]

  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [form, setForm] = useState(() => ({
    name: initialAddress?.name || user?.name || user?.displayName || '',
    mobile: initialAddress?.mobile || user?.phone || '',
    house: initialAddress?.house || '',
    area: initialAddress?.area || '',
    landmark: initialAddress?.landmark || '',
    pincode: initialAddress?.pincode || '',
    city: initialAddress?.city || '',
    mandal: initialAddress?.mandal || '',
    district: initialAddress?.district || '',
    state: initialAddress?.state || '',
    instructions: initialAddress?.instructions || '',
    makeDefault: initialAddress?.makeDefault ?? true
  }));

  useEffect(() => {
    if (!isOpen) return;
    setGeoError(null);
    setBusy(false);
    setSearchResults([]);

    const lat = initialAddress?.latitude;
    const lng = initialAddress?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      setPin([lat, lng]);
      setMapCenter([lat, lng]);
    }
  }, [isOpen, initialAddress]);

  const canSave = useMemo(() => {
    const hasPin = Array.isArray(pin) && pin.length === 2;
    const name = form.name || user?.name || user?.displayName || '';
    const mobile = form.mobile || user?.phone || '';

    return Boolean(
      name.trim() &&
        mobile.trim() &&
        (form.city.trim() || form.district.trim()) &&
        form.state.trim() &&
        form.pincode.trim() &&
        hasPin
    );
  }, [form, pin, user]);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const detectViaIpFallback = async () => {
    const tryFetch = async (url) => {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`IP location request failed (${res.status})`);
      return res.json();
    };

    try {
      const data = await tryFetch('https://ipapi.co/json/');
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    } catch {
      // try secondary provider
    }

    const data = await tryFetch('https://ipwho.is/');
    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    throw new Error('Unable to determine approximate location from IP.');
  };

  const applyReverseGeocode = async (lat, lng) => {
    const payload = await reverseGeocodeNominatim(lat, lng);
    const fields = extractAddressFieldsFromNominatim(payload);
    updateForm({
      city: fields.city || form.city,
      mandal: fields.mandal || form.mandal,
      district: fields.district || form.district,
      state: fields.state || form.state,
      pincode: fields.pincode || form.pincode
    });
    return fields;
  };

  const detectLocation = async () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported on this device/browser.');
      return;
    }

    const toFriendlyGeoError = (err) => {
      if (!err) return 'Unable to detect your location.';
      if (typeof err.code === 'number') {
        if (err.code === 1) return 'Location permission denied. Please allow location access and try again.';
        if (err.code === 2) return 'Location temporarily unavailable. Try again or use manual entry.';
        if (err.code === 3) return 'Location request timed out. Please retry.';
      }
      return err?.message || 'Unable to detect your location.';
    };

    const getPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    setBusy(true);
    try {
      let lat;
      let lng;
      let usedIpFallback = false;

      try {
        const first = await getPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000
        });
        lat = first.coords.latitude;
        lng = first.coords.longitude;
      } catch {
        try {
          // Retry with lower accuracy and longer timeout for flaky devices/network.
          const second = await getPosition({
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 60000
          });
          lat = second.coords.latitude;
          lng = second.coords.longitude;
        } catch (geoErr) {
          const approx = await detectViaIpFallback();
          lat = approx.lat;
          lng = approx.lng;
          usedIpFallback = true;
          setGeoError(`Using approximate location from network (${lat.toFixed(3)}, ${lng.toFixed(3)}).`);
          if (geoErr?.code === 1) {
            setGeoError('Location permission denied. Using approximate network location instead.');
          }
        }
      }

      setPin([lat, lng]);
      setMapCenter([lat, lng]);

      let fields = {};
      try {
        fields = await applyReverseGeocode(lat, lng);
      } catch {
        if (!usedIpFallback) {
          setGeoError('Location detected, but address lookup failed. You can still save using map/manual fields.');
        }
      }
      
      // Auto-save logic if in GPS tab
      if (tab === 'auto') {
        // We need to ensure name and mobile are ready. 
        // handleSave uses form.name/form.mobile which we pre-filled.
        // We can't call handleSave directly because it's an async function 
        // and we might need a small delay for state updates to settle, 
        // OR we can construct the payload here and call onSave.
        
        const payload = {
          name: (form.name || user?.name || user?.displayName || 'User').trim(),
          mobile: (form.mobile || user?.phone || '0000000000').trim(),
          house: form.house.trim(),
          area: form.area.trim(),
          landmark: form.landmark.trim(),
          pincode: fields.pincode || form.pincode,
          city: fields.city || form.city,
          mandal: fields.mandal || form.mandal,
          district: fields.district || form.district,
          state: fields.state || form.state,
          country: 'India',
          latitude: lat,
          longitude: lng,
          instructions: form.instructions.trim(),
          makeDefault: Boolean(form.makeDefault)
        };
        payload.fullAddress = buildFullAddress(payload);
        
        await onSave(payload);
        onClose();
      }
    } catch (err) {
      setGeoError(toFriendlyGeoError(err));
    } finally {
      setBusy(false);
    }
  };

  const onMapClick = async (latlng) => {
    const lat = latlng.lat;
    const lng = latlng.lng;
    setPin([lat, lng]);
    setMapCenter([lat, lng]);

    setBusy(true);
    try {
      await applyReverseGeocode(lat, lng);
    } catch {
      // ok to continue with manual fields
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearchBusy(true);
    try {
      const results = await forwardGeocodeNominatim(q, { limit: 5 });
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchBusy(false);
    }
  };

  const chooseSearchResult = async (res) => {
    const lat = Number(res?.lat);
    const lng = Number(res?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setPin([lat, lng]);
    setMapCenter([lat, lng]);

    setBusy(true);
    try {
      const fields = extractAddressFieldsFromNominatim(res);
      updateForm({
        city: fields.city || form.city,
        mandal: fields.mandal || form.mandal,
        district: fields.district || form.district,
        state: fields.state || form.state,
        pincode: fields.pincode || form.pincode
      });
    } finally {
      setBusy(false);
      setSearchResults([]);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    const [latitude, longitude] = pin;
    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      house: form.house.trim(),
      area: form.area.trim(),
      landmark: form.landmark.trim(),
      pincode: form.pincode.trim(),
      city: form.city.trim(),
      mandal: form.mandal.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      country: 'India',
      latitude,
      longitude,
      instructions: form.instructions.trim(),
      makeDefault: Boolean(form.makeDefault)
    };

    payload.fullAddress = buildFullAddress(payload);

    setBusy(true);
    try {
      await onSave(payload);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative w-full max-w-3xl bg-white rounded-t-[36px] sm:rounded-[36px] shadow-2xl overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                  Location Setup
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Add your address
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Nearby hospitals will be shown automatically.
                </p>
              </div>
              <button
                onClick={() => !busy && onClose()}
                className="p-2 rounded-2xl bg-slate-100 text-slate-500 active:scale-95"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex gap-2 bg-slate-100 rounded-2xl p-1">
                <button
                  onClick={() => setTab('auto')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                    tab === 'auto' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Use GPS
                </button>
                <button
                  onClick={() => setTab('manual')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                    tab === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Enter Manually
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ maxHeight: '78vh', overflow: 'auto' }}>
              <div className="order-2 lg:order-1">
                {tab === 'auto' && (
                  <div className="bg-slate-50 border border-slate-100 rounded-[28px] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                          <Navigation size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            Automatic location
                          </p>
                          <p className="text-[11px] font-bold text-slate-500">
                            Detect and auto-fill state, district, mandal, city, pincode.
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={busy}
                        onClick={detectLocation}
                        className="px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-200 disabled:opacity-60 active:scale-95"
                      >
                        {busy ? 'Detecting' : 'Detect'}
                      </button>
                    </div>
                    {geoError && (
                      <p className="mt-3 text-[11px] font-bold text-rose-600">{geoError}</p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          State
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-1">
                          {form.state || '--'}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          District
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-1">
                          {form.district || '--'}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Mandal
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-1">
                          {form.mandal || '--'}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl border border-slate-100 p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Pincode
                        </p>
                        <p className="text-xs font-black text-slate-900 mt-1">
                          {form.pincode || '--'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Coordinates
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {pin ? `${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}` : '--'}
                      </p>
                    </div>
                  </div>
                )}

                {tab === 'manual' && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Field label="Name">
                      <Input
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                    </Field>

                    <Field label="Mobile number">
                      <Input
                        value={form.mobile}
                        onChange={(e) => updateForm({ mobile: e.target.value })}
                        placeholder="10-digit mobile"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Flat / House / Building">
                        <Input
                          value={form.house}
                          onChange={(e) => updateForm({ house: e.target.value })}
                          placeholder="e.g., 12-34/A"
                        />
                      </Field>

                      <Field label="Area / Street / Village">
                        <Input
                          value={form.area}
                          onChange={(e) => updateForm({ area: e.target.value })}
                          placeholder="e.g., Kondapur"
                        />
                      </Field>
                    </div>

                    <Field label="Landmark (optional)">
                      <Input
                        value={form.landmark}
                        onChange={(e) => updateForm({ landmark: e.target.value })}
                        placeholder="Near ..."
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Pincode">
                        <Input
                          value={form.pincode}
                          onChange={(e) => updateForm({ pincode: e.target.value })}
                          placeholder="e.g., 500081"
                          inputMode="numeric"
                        />
                      </Field>

                      <Field label="Town / City">
                        <Input
                          value={form.city}
                          onChange={(e) => updateForm({ city: e.target.value })}
                          placeholder="e.g., Hyderabad"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Mandal / Sub-district">
                        <Input
                          value={form.mandal}
                          onChange={(e) => updateForm({ mandal: e.target.value })}
                          placeholder="e.g., Serilingampally"
                        />
                      </Field>

                      <Field label="District">
                        <Input
                          value={form.district}
                          onChange={(e) => updateForm({ district: e.target.value })}
                          placeholder="e.g., Rangareddy"
                        />
                      </Field>
                    </div>

                    <Field label="State">
                      <select
                        value={form.state}
                        onChange={(e) => updateForm({ state: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                      >
                        <option value="">Select state</option>
                        {IN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Delivery / consultation instructions (optional)">
                      <Textarea
                        rows={3}
                        value={form.instructions}
                        onChange={(e) => updateForm({ instructions: e.target.value })}
                        placeholder="e.g., Call before arriving"
                      />
                    </Field>

                    <label className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                      <input
                        type="checkbox"
                        checked={form.makeDefault}
                        onChange={(e) => updateForm({ makeDefault: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-xs font-black text-slate-800">
                        Make this my default address
                      </span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        disabled={!canSave || busy}
                        onClick={handleSave}
                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black tracking-widest uppercase text-xs shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {busy ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        Save Address
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => onClose()}
                        className="px-5 py-4 rounded-2xl bg-slate-100 text-slate-600 font-black tracking-widest uppercase text-xs active:scale-95 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-blue-600" />
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        Add location on map
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={detectLocation}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black tracking-widest uppercase text-slate-700 active:scale-95 disabled:opacity-60"
                    >
                      Use GPS
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                          placeholder="Search area, street, landmark"
                          className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
                        />
                      </div>
                      <button
                        onClick={runSearch}
                        disabled={searchBusy}
                        className="px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-200 disabled:opacity-60 active:scale-95 flex items-center gap-2"
                      >
                        {searchBusy ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        {searchResults.map((r, idx) => (
                          <button
                            key={idx}
                            onClick={() => chooseSearchResult(r)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          >
                            <p className="text-xs font-black text-slate-900 line-clamp-1">
                              {r.display_name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-3" style={{ height: '360px' }}>
                      <MapComponent
                        center={mapCenter}
                        markers={
                          pin
                            ? [
                                {
                                  position: pin,
                                  title: 'Selected location'
                                }
                              ]
                            : []
                        }
                        onMapClick={onMapClick}
                        zoom={15}
                      />
                    </div>

                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Selected
                      </p>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {pin ? `${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}` : 'Tap on the map to drop a pin.'}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1 line-clamp-2">
                        {buildFullAddress(form) || 'Fill address details for better discovery results.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddressSetupModal;
