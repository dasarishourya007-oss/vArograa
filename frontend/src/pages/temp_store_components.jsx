
const StoreCard = ({ store, viewMode, index }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className={`group bg-white rounded-[28px] overflow-hidden border border-slate-50 shadow-sm hover:shadow-lg transition-all duration-300 ${viewMode === 'grid' ? 'flex flex-col' : 'flex'}`}
        >
            <div className={`relative ${viewMode === 'grid' ? 'w-full h-32' : 'w-32 h-32'} shrink-0`}>
                <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 left-2 z-10">
                    {store.hasVerifiedBadge && (
                        <div className="bg-[#00B4A6] text-white p-1 rounded-lg shadow-lg">
                            <ShieldCheck size={14} />
                        </div>
                    )}
                </div>
                {!store.isOpen && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30">Closed</span>
                    </div>
                )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-black text-main leading-tight group-hover:text-p-600 transition-colors ${viewMode === 'grid' ? 'text-sm line-clamp-1' : 'text-base'}`}>{store.name}</h4>
                    {viewMode === 'list' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg shrink-0">
                            <Star size={10} fill="#f59e0b" className="text-amber-500" />
                            <span className="text-[10px] font-black text-amber-600">{store.rating}</span>
                        </div>
                    )}
                </div>
                
                <p className="text-[10px] font-bold text-muted line-clamp-1 mb-3">{store.address}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <Navigation size={12} className="text-p-500" />
                        <span className="text-[10px] font-extrabold text-[#1e2937]">{store.distanceKm} km</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className={`text-[11px] font-black ${store.costIndicator === '₹' ? 'text-emerald-600' : store.costIndicator === '₹₹' ? 'text-amber-500' : 'text-blue-600'}`}>
                        {store.costIndicator}
                    </span>
                    {store.isOpen && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Open</span>
                            </div>
                        </>
                    )}
                </div>
                
                {viewMode === 'list' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                        <button className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Directions</button>
                        <button className="flex-1 py-2.5 rounded-xl bg-p-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-p-100 active:scale-95 transition-all">Select Store</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const RecommendedStoreCard = ({ store, type, meds }) => {
    return (
        <div className={`p-4 rounded-3xl border ${type === 'primary' ? 'bg-[#0077B6]/5 border-[#0077B6]/20' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'primary' ? 'bg-[#0077B6] text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {type === 'primary' ? <Zap size={16} fill="white" /> : <Star size={16} />}
                    </div>
                    <div>
                        <h6 className="text-[13px] font-black text-main">{store.name}</h6>
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-muted">{store.distanceKm} km away</span>
                             <div className="w-1 h-1 rounded-full bg-slate-300" />
                             <span className="text-[9px] font-bold text-muted">{store.costIndicator}</span>
                        </div>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${type === 'primary' ? 'bg-[#0077B6]/10 text-[#0077B6]' : 'bg-slate-200 text-slate-600'}`}>
                    {type === 'primary' ? 'Best Match' : 'Alternative'}
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-3">
                {meds.map((med, i) => {
                    const available = store.inventory.some(item => item.toLowerCase().includes(med.toLowerCase()));
                    return (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${available ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100 opacity-60'}`}>
                            {available ? <CheckCircle size={10} /> : <X size={10} />}
                            {med}
                        </div>
                    );
                })}
            </div>
             <button className={`w-full mt-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'primary' ? 'bg-[#0077B6] text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-100 text-slate-600'}`}>
                {type === 'primary' ? 'Select Best Store' : 'Select Alternative'}
            </button>
        </div>
    );
};

const AIAnalyzerModal = ({ isOpen, onClose, analysis, loading }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                <div className="p-8 pb-4 border-b border-slate-100 flex justify-between items-center bg-p-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-p-600 flex items-center justify-center">
                            <Bot className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-main leading-tight">{t('ai_prescription_analyzer')}</h3>
                            <p className="text-[10px] font-bold text-p-600 uppercase tracking-widest">{t('varogra_smart_brain')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 text-muted">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-p-100 border-t-p-600 rounded-full animate-spin mb-6" />
                            <p className="font-bold text-main animate-pulse">{t('analyzing_prescription')}</p>
                            <p className="text-xs text-muted mt-2">{t('identifying_medicines_instructions')}</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {analysis}
                            </div>
                            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 flex gap-4">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <p className="text-[11px] font-bold text-amber-800 leading-snug">
                                    {t('informational_only_disclaimer')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-main text-white font-black text-sm shadow-xl active:scale-95 transition-transform"
                    >
                        {t('got_it_thanks')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const StoreTab = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [storeSearch, setStoreSearch] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [showMap, setShowMap] = useState(false);
    
    const [maxDistance, setMaxDistance] = useState(10); 
    const [costFilter, setCostFilter] = useState('all'); 
    const [onlyOpen, setOnlyOpen] = useState(false);
    const [minRating, setMinRating] = useState(0);

    const [showPrescriptionPanel, setShowPrescriptionPanel] = useState(false);
    const [prescriptionText, setPrescriptionText] = useState('');
    const [priority, setPriority] = useState('nearest'); 
    const [recommendation, setRecommendation] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredStores = useMemo(() => {
        return MOCK_STORES.filter(store => {
            const matchesSearch = store.name.toLowerCase().includes(storeSearch.toLowerCase()) || 
                                 store.address.toLowerCase().includes(storeSearch.toLowerCase());
            const matchesDistance = store.distanceKm <= maxDistance;
            const matchesRating = store.rating >= minRating;
            const matchesOpen = !onlyOpen || store.isOpen;
            
            let matchesCost = true;
            if (costFilter === 'Budget Friendly') matchesCost = store.costIndicator === '₹';
            if (costFilter === 'Premium') matchesCost = store.costIndicator === '₹₹₹';
            
            return matchesSearch && matchesDistance && matchesRating && matchesOpen && matchesCost;
        });
    }, [storeSearch, maxDistance, minRating, onlyOpen, costFilter]);

    const findBestMatch = () => {
        if (!prescriptionText.trim()) return;
        setIsAnalyzing(true);
        setRecommendation(null);
        
        setTimeout(() => {
            const meds = prescriptionText.toLowerCase().split(/[, \n]+/).filter(m => m.length > 2);
            
            const scoredStores = MOCK_STORES.map(store => {
                const availableMeds = meds.filter(med => 
                    store.inventory.some(item => item.toLowerCase().includes(med))
                );
                const matchCount = availableMeds.length;
                
                let score = matchCount * 10;
                if (priority === 'nearest') score += (10 - store.distanceKm) * 2;
                if (priority === 'lowest_cost') {
                    if (store.costIndicator === '₹') score += 15;
                    if (store.costIndicator === '₹₹') score += 10;
                    if (store.costIndicator === '₹₹₹') score += 5;
                }
                
                return { ...store, matchCount, totalMeds: meds.length, availableMeds, score };
            }).sort((a, b) => b.score - a.score);

            setRecommendation({
                primary: scoredStores[0],
                secondary: scoredStores[1],
                reasoning: `Recommended because it stocks ${scoredStores[0].matchCount} out of ${meds.length} prescribed medicines and is just ${scoredStores[0].distanceKm} km away.`,
                meds: meds
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="pb-32 bg-[#F8FAFC]">
            <div className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100 px-5 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Medical Store</h1>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-p-600 transition-colors"
                        >
                            {viewMode === 'list' ? <LayoutGrid size={20} /> : <List size={20} />}
                        </button>
                        <button 
                            onClick={() => setShowMap(!showMap)}
                            className={`p-2 rounded-xl transition-all ${showMap ? 'bg-p-600 text-white shadow-lg shadow-p-200' : 'bg-slate-50 text-slate-400'}`}
                        >
                            <MapPin size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search stores or medicines..."
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-p-500/20 transition-all placeholder:text-slate-300"
                    />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-5 px-5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shrink-0">
                        <Navigation size={14} className="text-p-600" />
                        <select 
                            value={maxDistance} 
                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                            className="bg-transparent border-none text-[12px] font-black uppercase tracking-wider outline-none"
                        >
                            <option value={1}>&lt; 1 km</option>
                            <option value={3}>1-3 km</option>
                            <option value={5}>3-5 km</option>
                            <option value={10}>5+ km</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shrink-0">
                        <DollarSign size={14} className="text-emerald-500" />
                        <select 
                            value={costFilter} 
                            onChange={(e) => setCostFilter(e.target.value)}
                            className="bg-transparent border-none text-[12px] font-black uppercase tracking-wider outline-none"
                        >
                            <option value="all">Any Cost</option>
                            <option value="Budget Friendly">Budget Friendly</option>
                            <option value="Premium">Premium</option>
                        </select>
                    </div>

                    <button 
                        onClick={() => setOnlyOpen(!onlyOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all shrink-0 ${onlyOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}
                    >
                        <Clock size={14} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Open Now</span>
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shrink-0">
                        <Star size={14} className="text-amber-400" />
                        <select 
                            value={minRating} 
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="bg-transparent border-none text-[12px] font-black uppercase tracking-wider outline-none"
                        >
                            <option value={0}>Any Rating</option>
                            <option value={3}>3★ & Above</option>
                            <option value={4}>4★ & Above</option>
                            <option value={4.5}>4.5★ & Above</option>
                        </select>
                    </div>
                </div>

                {(onlyOpen || minRating > 0 || costFilter !== 'all' || maxDistance < 10) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {maxDistance < 10 && (
                            <div className="px-3 py-1 bg-p-50 text-p-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-p-100">
                                &lt; {maxDistance}km
                                <X size={10} onClick={() => setMaxDistance(10)} className="cursor-pointer" />
                            </div>
                        )}
                        {costFilter !== 'all' && (
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                                {costFilter}
                                <X size={10} onClick={() => setCostFilter('all')} className="cursor-pointer" />
                            </div>
                        )}
                        {onlyOpen && (
                            <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                Open Now
                                <X size={10} onClick={() => setOnlyOpen(false)} className="cursor-pointer" />
                            </div>
                        )}
                        {minRating > 0 && (
                            <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100">
                                {minRating}★+
                                <X size={10} onClick={() => setMinRating(0)} className="cursor-pointer" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="px-5 pt-6">
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPrescriptionPanel(!showPrescriptionPanel)}
                    className="w-full mb-8 p-6 bg-gradient-to-r from-[#0077B6] to-[#00B4A6] rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-blue-200 group overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <Bot size={20} className="text-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">vArogra Smart Matching</span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Find Best Store for My Prescription</h3>
                        <p className="text-[11px] font-bold opacity-70 mt-1">AI-powered recommendation based on cost & distance</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-p-600 transition-all">
                        <ChevronRight size={24} />
                    </div>
                </motion.button>

                <AnimatePresence>
                    {showPrescriptionPanel && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-sm font-black text-main uppercase tracking-widest mb-4">Paste Prescription Details</h4>
                                <textarea 
                                    className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-p-500/20 mb-6 placeholder:text-slate-300"
                                    placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg..."
                                    value={prescriptionText}
                                    onChange={(e) => setPrescriptionText(e.target.value)}
                                />
                                
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioritize</p>
                                        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                            <button 
                                                onClick={() => setPriority('nearest')}
                                                className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${priority === 'nearest' ? 'bg-white text-p-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                Nearest
                                            </button>
                                            <button 
                                                onClick={() => setPriority('lowest_cost')}
                                                className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${priority === 'lowest_cost' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                Lowest Cost
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={findBestMatch}
                                    disabled={!prescriptionText.trim() || isAnalyzing}
                                    className="w-full py-4 rounded-2xl bg-[#0f172a] text-white font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                                >
                                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={18} fill="white" />}
                                    Find Best Match
                                </button>

                                <AnimatePresence>
                                    {recommendation && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-8 pt-8 border-t border-slate-50"
                                        >
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4 items-start mb-6">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-emerald-800 leading-snug">{recommendation.reasoning}</p>
                                                </div>
                                            </div>

                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Recommended Stores</h5>
                                            <div className="space-y-4">
                                                <RecommendedStoreCard store={recommendation.primary} type="primary" meds={recommendation.meds} />
                                                <RecommendedStoreCard store={recommendation.secondary} type="secondary" meds={recommendation.meds} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {showMap && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm relative h-[300px] bg-slate-100"
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center opacity-40">
                                <Map size={48} className="mx-auto mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Map View Placeholder</p>
                                <p className="text-[10px] font-medium max-w-[200px] mt-1 mx-auto">Showing pins for {filteredStores.length} stores nearby</p>
                            </div>
                        </div>
                        {filteredStores.map((store, i) => (
                            <motion.div 
                                key={store.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="absolute p-1 bg-white rounded-full shadow-lg border-2 border-p-600"
                                style={{ 
                                    left: `${30 + (i * 12) % 60}%`, 
                                    top: `${20 + (i * 15) % 60}%`
                                }}
                            >
                                <div className="w-2 h-2 rounded-full bg-p-600" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="text-lg font-black text-main tracking-tight">
                        {filteredStores.length} Nearby Stores
                    </h3>
                    <div className="flex gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorted by {priority === 'nearest' ? 'Distance' : 'Match Score'}</span>
                    </div>
                </div>

                <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {(filteredStores.length > 0 ? (
                         filteredStores.sort((a, b) => a.distanceKm - b.distanceKm).map((store, index) => (
                            <StoreCard key={store.id} store={store} viewMode={viewMode} index={index} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                            <Package size={48} className="mx-auto mb-4 text-slate-100" />
                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No matching stores found</p>
                            <button onClick={() => {
                                setStoreSearch('');
                                setMaxDistance(10);
                                setCostFilter('all');
                                setOnlyOpen(false);
                                setMinRating(0);
                            }} className="text-p-600 text-[10px] font-black uppercase tracking-widest mt-4">Clear All Filters</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
