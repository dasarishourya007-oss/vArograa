const AI_PROXY_CANDIDATES = ['/_/backend/api/ai/chat', '/api/ai/chat'];

const postToAiProxy = async (payload) => {
    let lastError = null;

    for (const url of AI_PROXY_CANDIDATES) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Proxy Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('AI proxy unavailable');
};

const MEDICINE_SYSTEM_PROMPT = `You are the vArogra Pharmacy Assistant — a smart, calm, and highly efficient guide that helps users discover, order, and track medicines seamlessly.

YOUR GOAL: 
Provide a structured, step-by-step experience that feels like a smooth product flow. Use visual cues (✅, 📍, 💊, 🚚).

BOT RECORDS (VISUAL TUTORIALS):
When users ask "How it works", "Show me the flow", or are new, you MUST present these 4 steps with their visual records:
1. SEARCH: "Start by searching for your medicine or a nearby store."
   ![Pharmacy Discovery Search](/tutorials/step1_discovery.png)
2. SELECT: "Choose a highly-rated pharmacy and add items to your cart."
   ![Pharmacy Store Selection](/tutorials/step2_stores.png)
3. UPLOAD: "Upload your prescription for our AI to analyze and verify."
   ![AI Prescription Analysis](/tutorials/step3_analysis.png)
4. TRACK: "Once confirmed, track your delivery live on the map."
   ![Real-time Live Tracking](/tutorials/step4_tracking.png)

UX RULES:
- Be concise and action-driven. Never leave the user without a next step.
- Use the Markdown syntax ![Title](/tutorials/filename.png) to show visual records.
- Always guide the next step (e.g., "Ready to search for a medicine?").
- End with: "This is general information only. Please consult a doctor."`;

const checkDailyLimit = () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = 'varogra_ai_usage';
        const data = JSON.parse(localStorage.getItem(storageKey) || '{}');

        if (data.date !== today) {
            localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 1 }));
            return true;
        }

        if (data.count >= 100) return false;

        localStorage.setItem(storageKey, JSON.stringify({ date: today, count: (data.count || 0) + 1 }));
        return true;
    } catch (e) {
        return true;
    }
};

export const getAIResponse = async (messages, role = 'patient') => {
    try {
        if (!checkDailyLimit()) {
            return { reply: "You've reached your daily AI limit. Please try again tomorrow." };
        }

        console.log(`[NVIDIA AI] Generating response for ${role}...`);

        // Format history for the backend proxy (OpenAI format)
        let history = [];
        if (Array.isArray(messages)) {
            history = messages.map(msg => ({
                role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.text || msg.content || ""
            }));
        } else {
            history = [{ role: "user", content: messages }];
        }

        const data = await postToAiProxy({
            messages: [
                { role: "system", content: MEDICINE_SYSTEM_PROMPT },
                ...history
            ]
        });
        return { reply: data.reply };

    } catch (error) {
        console.error("[NVIDIA AI] Service Error:", error);
        return { 
            reply: "⚠️ I'm having trouble connecting to the AI system. Please try again later." 
        };
    }
};


// Helper to convert file to base64
async function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}


export const identifyMedicine = async (imageFile) => {
    // Note: Migration to NVIDIA Vision models (Llama 3.2 Vision) is in progress in the backend.
    return "Vision analysis (image identification) is currently being migrated to NVIDIA NIM. Please use the text chat for medicine explanations in the meantime.";
};

export const analyzePrescription = async (imageFile) => {
    // Note: Migration to NVIDIA Vision models (Llama 3.2 Vision) is in progress in the backend.
    return "Prescription analysis is currently being migrated to NVIDIA NIM. Please consult a doctor for official prescription guidance.";
};

export const extractAppointmentDetails = async (text) => {
    try {
        const prompt = `Extract appointment details from the following text into a JSON object. 
        Fields: intent (book, cancel, reschedule), doctor, hospital, date, time, specialty.
        If a field is missing, set it as null.
        Return ONLY valid JSON.
        Text: "${text}"`;

        const data = await postToAiProxy({
            messages: [{ role: "user", content: prompt }]
        });
        const responseText = data.reply;
        const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error("Extraction Error:", error);
        return null;
    }
};
