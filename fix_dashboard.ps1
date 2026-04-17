$f = 'c:\Users\Sreenath\OneDrive\Desktop\v\poiuy\healthlink\src\pages\PatientDashboard.jsx'
$content = Get-Content $f -Raw
# Fix AIAssistantTab truncated part
$target1 = '                analysis={aiAnalysis}
                loading={aiLoading}
            />
        </div>
    );
};'
$replacement1 = '            <AIAnalyzerModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                analysis={aiAnalysis}
                loading={aiLoading}
            />
        </div>
    );
};'

# Fix StoreTab premature closure
$target2 = '        </div>
    );
};'
# We need to find the specific closure at line 1672
# Actually, let's just replace the whole StoreTab chunk to be safe.

$newContent = $content.Replace($target1, $replacement1)
# For target2, it might be ambiguous, so let's be more specific
$target2Specific = '                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};'
# Wait, let's check what it should be.
# It should keep the divs but remove the closure.

$replacement2 = '                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>'

$newContent = $newContent.Replace($target2Specific, $replacement2)

$newContent | Set-Content $f -NoNewline
