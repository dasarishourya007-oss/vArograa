
// c:/Users/Sreenath/OneDrive/Desktop/v/poiuy/healthlink/scratch/test-ai.js
// Run with: node scratch/test-ai.js

const GEMINI_API_KEY = 'AIzaSyDYSovKeJOuHeYTjIXF2zXESWHV6qahSJA';

async function testAI(version, model) {
    const URL = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`\nTesting ${model} on ${version}...`);
    
    const requestBody = {
        contents: [
            { role: "user", parts: [{ text: "Hello, who are you?" }] }
        ]
    };
    
    // Add system instruction only for v1beta as v1 might not support it in the same structure
    if (version === 'v1beta') {
        requestBody.systemInstruction = {
            parts: [{ text: "You are vArogra AI assistant." }]
        };
    }

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        console.log("Status:", response.status);
        
        if (!response.ok) {
            const body = await response.text();
            console.error("Error Body:", body);
            return false;
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            console.log("SUCCESS! Response:", data.candidates[0].content.parts[0].text);
            return true;
        } else {
            console.log("FAILED! Unexpected format:", JSON.stringify(data).slice(0, 100));
            return false;
        }
    } catch (e) {
        console.error("Connection Failed:", e.message);
        return false;
    }
}

async function runTests() {
    // Try these combinations
    const tests = [
        { v: 'v1beta', m: 'gemini-1.5-flash-latest' },
        { v: 'v1beta', m: 'gemini-1.5-flash' },
        { v: 'v1', m: 'gemini-1.5-flash' },
        { v: 'v1beta', m: 'gemini-2.0-flash-exp' }
    ];
    
    for (const t of tests) {
        const ok = await testAI(t.v, t.m);
        if (ok) {
            console.log(`\n>>> RECOMMENDED: ${t.m} on ${t.v} works!`);
            break;
        }
    }
}

runTests();
