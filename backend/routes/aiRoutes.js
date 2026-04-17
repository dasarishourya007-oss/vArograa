import express from 'express';
import axios from 'axios';

const router = express.Router();

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-70b-instruct";

const getLastUserMessage = (messages = []) => {
    const lastUserMessage = [...messages].reverse().find((message) => message?.role === 'user');
    return String(lastUserMessage?.content || '').trim();
};

const buildFallbackReply = (messages = []) => {
    const userText = getLastUserMessage(messages).toLowerCase();

    if (!userText) {
        return "I'm here to help with symptoms, medicines, appointments, and when to seek care. This is general information only. Please consult a doctor.";
    }

    if (/(hi|hello|hey|good morning|good evening)\b/.test(userText)) {
        return "Hello. Tell me your symptoms, medicine question, or booking need, and I will guide you step by step. This is general information only. Please consult a doctor.";
    }

    if (/(chest pain|breathing|shortness of breath|unconscious|stroke|severe bleeding|seizure)/.test(userText)) {
        return "These symptoms may be serious. Please use SOS or go to the nearest hospital immediately. This is general information only. Please consult a doctor.";
    }

    if (/(fever|temperature)/.test(userText)) {
        return "For fever, rest, drink fluids, and monitor your temperature. If fever is high, lasts more than 2 to 3 days, or comes with breathing trouble, weakness, or confusion, seek medical care quickly. This is general information only. Please consult a doctor.";
    }

    if (/(cold|cough|sore throat|flu)/.test(userText)) {
        return "For cough, cold, or sore throat, rest, hydration, and steam inhalation may help. If symptoms worsen, breathing becomes difficult, or fever stays high, book a doctor visit. This is general information only. Please consult a doctor.";
    }

    if (/(headache|migraine)/.test(userText)) {
        return "For headache, rest, hydration, and avoiding bright screens may help. If it is severe, sudden, repeated, or comes with vomiting, weakness, or vision changes, seek urgent care. This is general information only. Please consult a doctor.";
    }

    if (/(stomach|abdomen|vomit|vomiting|diarrhea|loose motion)/.test(userText)) {
        return "For stomach pain, vomiting, or diarrhea, focus on hydration and light food. If there is severe pain, blood, dehydration, or symptoms continue, see a doctor soon. This is general information only. Please consult a doctor.";
    }

    if (/(medicine|tablet|dose|dosage|prescription|drug)/.test(userText)) {
        return "I can give general medicine guidance, but not prescribe treatment. Share the medicine name and what you want to know, such as use, timing, or common precautions. This is general information only. Please consult a doctor.";
    }

    if (/(appointment|book|doctor|hospital)/.test(userText)) {
        return "I can help you prepare for booking. Tell me the specialty, symptoms, preferred hospital area, and whether you want online or offline consultation. This is general information only. Please consult a doctor.";
    }

    return "I can help with symptoms, medicines, hospital booking, and when to seek urgent care. Tell me a little more about your problem and I will guide you. This is general information only. Please consult a doctor.";
};

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid request: 'messages' array is required." });
        }

        if (!process.env.NVIDIA_API_KEY) {
            return res.json({
                reply: buildFallbackReply(messages),
                source: 'fallback'
            });
        }

        const response = await axios.post(NVIDIA_API_URL, {
            model: MODEL,
            messages: messages,
            temperature: 0.7,
            top_p: 1,
            max_tokens: 512
        }, {
            headers: {
                Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 15000
        });

        res.json({
            reply: response.data.choices?.[0]?.message?.content || buildFallbackReply(messages),
            source: 'nvidia'
        });

    } catch (error) {
        console.error("FULL ERROR:", error.response?.data || error.message);
        const status = Number(error.response?.status || 0);

        if (status === 401 || status === 403) {
            return res.json({
                reply: buildFallbackReply(req.body?.messages || []),
                source: 'fallback',
                warning: 'Upstream AI authentication failed'
            });
        }

        res.status(500).json({
            error: "AI Service failed",
            details: error.response?.data || error.message
        });
    }
});

export default router;
