$file = 'src\pages\PatientDashboard.jsx'
$content = Get-Content $file -Raw

$oldHeader = 'pb-6">' + "`r`n" + '                <div className="flex items-center justify-between">'
$newHeader = 'pb-3">' + "`r`n" + '                <div className="flex items-center justify-between mb-3">'

$content2 = $content -replace [regex]::Escape($oldHeader), $newHeader

# Add language switcher after the closing </div> for the bot info section
$oldEnd = '                    </div>' + "`r`n" + '                </div>' + "`r`n" + '            </header>'
$newEnd = @'
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                title={lang.full}
                                className={`px-3 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all ${selectedLang === lang.code ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                    <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
                        {COMMON_MEDICINES.map(med => (
                            <button
                                key={med.name}
                                onClick={() => handleSend("Tell me about " + med.name + " - uses, dosage and side effects")}
                                className="flex flex-col items-start px-4 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 shrink-0"
                            >
                                <span className="text-[12px] font-black text-slate-800">{med.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{med.use}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>
'@

# Find the specific header section (only in AIAssistantTab which is around line 1490)
# We replace the LAST occurrence of that pattern by splitting carefully
$idx = $content2.LastIndexOf($oldEnd)
if ($idx -ge 0) {
    $content3 = $content2.Substring(0, $idx) + $newEnd + $content2.Substring($idx + $oldEnd.Length)
    $content3 | Set-Content $file -NoNewline
    Write-Host "SUCCESS: Header patched with language switcher and medicine chips!"
} else {
    Write-Host "WARNING: Could not find closing header pattern. No changes made."
    Write-Host "Content length: $($content2.Length)"
}
