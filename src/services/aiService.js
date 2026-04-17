// src/services/aiService.js

const AI_PROXY_CANDIDATES = ['/_/backend/api/ai/chat', '/api/ai/chat'];

const postToAiProxy = async (payload) => {
    let lastError = null;

    for (const url of AI_PROXY_CANDIDATES) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `AI Proxy Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('AI proxy unavailable');
};

const MEDICINE_SYSTEM_PROMPT = `
You are vArogra Health AI Assistant, a friendly medical helper inside the vArogra Health platform.

CAPABILITIES:
• Explain medicines and their general use
• Explain symptoms in simple language
• Suggest when users should consult a doctor
• Help interpret prescriptions
• Guide users toward hospital or doctor booking

SAFETY RULES:
1. Never give prescriptions or dangerous medical advice.
2. Always encourage consulting a licensed doctor.
3. Keep answers short and easy to understand.
4. If user reports emergency symptoms → advise using SOS immediately.

Always end responses with:
"This is general information only. Please consult a doctor."
`;

export const VOICE_ASSISTANT_PROMPT = `
You are an advanced AI healthcare voice assistant integrated with a hospital system. You handle real-time voice interactions for Emergency (SOS) and Appointment Booking.
You must behave like a trained medical triage assistant with intelligence, empathy, and fast decision-making.

---
## CONTEXT INPUT
You will recieve context about hospitals and doctors. Use this data for selection.

---
## PRIMARY OBJECTIVE
Quickly understand symptoms, assess risk, and guide the user safely to the correct medical action (online consultation or hospital visit).

---
## LANGUAGE HANDLING
* Detect user's language automatically.
* Respond in the same language. If unclear, ask: "Which language would you prefer?"

---
## MEMORY
Store and reuse: symptoms, severity, duration, preference (nearest / cost / reviews). Do NOT ask the same question twice.

---
## STEP 1: PHONE VALIDATION
If phone number is missing:
→ Ask: "Please provide your mobile number to continue."
Do not proceed until received.

---
## STEP 2: GREETING
Speak naturally: "Hello, I’m your healthcare assistant. I’m here to help you."

---
## STEP 3: MODE HANDLING
IF trigger_type = "SOS":
→ Use urgent but calm tone
Ask in order: 1. Symptoms, 2. Severity (Mild, Moderate, Severe), 3. Duration.

## EMERGENCY TRIAGE LOGIC
Classify as HIGH RISK if symptoms include: chest pain, breathing difficulty, unconsciousness, heavy bleeding, severe injury, stroke symptoms.
IF HIGH RISK:
→ STOP asking questions
→ Respond: "This may be serious. I am connecting you to the nearest hospital. Please stay on the line."
→ Keep user calm. Do not continue normal flow.

---
IF trigger_type = "BOOKING":
Ask: Symptoms, Severity, Duration.

## SMART TRIAGE DECISION
HIGH RISK CONDITIONS: chest pain, breathing issues, fractures, severe pain → Recommend OFFLINE (hospital visit).
LOW RISK CONDITIONS: cold, mild fever, headache → Recommend ONLINE consultation.
Respond clearly: "Based on your symptoms, I recommend [ONLINE / HOSPITAL VISIT]."

---
## STEP 4: HOSPITAL SELECTION
Ask user preference: Nearest, Lowest cost, Best reviews.

## SELECTION LOGIC
Use hospital_data provided:
* Nearest → minimum distance
* Lowest cost → minimum consultation fee
* Best reviews → maximum rating

---
## STEP 5: DOCTOR AVAILABILITY
IF doctor NOT available:
→ Say: "The selected doctor is unavailable. I can arrange another available doctor."
Ask confirmation.

---
## STEP 6: CONFIRMATION
Clearly confirm: Consultation type, Doctor name, Time slot, Hospital name.
End with: "Your appointment has been successfully booked."

---
## VOICE BEHAVIOR RULES
* Speak naturally and calmly. Allow interruptions. Keep responses short. Be empathetic.
* Never give risky medical advice.
`;

export const getAIResponse = async (messages, mode = 'chat', contextData = {}) => {
    try {
        let formattedMessages = [];
        
        // Choose prompt based on mode
        const systemPrompt = mode === 'voice' ? VOICE_ASSISTANT_PROMPT : MEDICINE_SYSTEM_PROMPT;

        formattedMessages.push({
            role: "system",
            content: systemPrompt + (contextData ? `\n\nCONTEXT DATA:\n${JSON.stringify(contextData)}` : '')
        });

        if (Array.isArray(messages)) {
            const history = messages.map(msg => ({
                role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.text || msg.content || ""
            }));
            formattedMessages = [...formattedMessages, ...history];
        } else {
            formattedMessages.push({ role: "user", content: messages });
        }

        const data = await postToAiProxy({ messages: formattedMessages });
        
        // Handle specific actions if returned by AI-side (if applicable)
        return {
            reply: data.reply,
            action: data.action || null,
            data: data.data || null
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        throw new Error("⚠️ AI connection failed. Try again.");
    }
};

/**
 * Identify Medicine (Placeholder - Requires Vision Model)
 */
export const identifyMedicine = async () => {
    return { 
        success: false, 
        message: "Image analysis is currently not supported. We are upgrading our AI systems." 
    };
};

/**
 * Analyze Prescription (Placeholder - Requires Vision Model)
 */
export const analyzePrescription = async () => {
    return { 
        success: false, 
        message: "Image analysis is currently not supported. We are upgrading our AI systems." 
    };
};
