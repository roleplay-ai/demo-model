// ElevenLabs Configuration
// Replace these with your actual ElevenLabs agent and voice IDs

export const ELEVENLABS_CONFIG = {
    // Your ElevenLabs agent ID - get this from your ElevenLabs dashboard
    AGENT_ID: "your-agent-id-here",

    // Voice IDs for different genders
    VOICES: {
        female: "your-female-voice-id-here", // Replace with actual female voice ID
        male: "your-male-voice-id-here",     // Replace with actual male voice ID
    },

    // Default voice ID if no gender is selected
    DEFAULT_VOICE: "your-default-voice-id-here",
}

// Instructions:
// 1. Go to your ElevenLabs dashboard
// 2. Create an agent for your coaching scenarios
// 3. Copy the agent ID and replace "your-agent-id-here"
// 4. Choose voice IDs for male and female coaches
// 5. Replace the voice IDs in the VOICES object above
// 6. Update the import in app/page.tsx to use this config

