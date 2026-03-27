// lib/config.ts

// --- Active Server ---
//export const BACKEND_API_BASE = "https://staging.i-bhd.com/support-api"; // Real Server

// --- Backup / Testing ---
export const BACKEND_API_BASE = "https://hazel-nonpungent-yun.ngrok-free.dev"; // Ngrok

// --- FEATURE FLAGS ---
// Use these to easily turn work-in-progress features on or off without deleting code
export const FEATURE_FLAGS = {
    ENABLE_WHITELIST: false, // Set to true when the backend API is ready
};