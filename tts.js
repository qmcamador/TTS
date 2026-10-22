import { Platform } from "react-native";
import * as Speech from "expo-speech";

let currentUtteranceId = 0;

export function stopSpeaking() {
  currentUtteranceId++;
  Speech.stop();

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.speechSynthesis
  ) {
    window.speechSynthesis.cancel();
  }
}

export async function speakWord(entry, { useAudioFiles = false } = {}) {
  stopSpeaking();

  if (!entry || !entry.word) {
    throw new Error("A valid word entry is required.");
  }

  const word = String(entry.word).toLowerCase();

  // --- WEB PLATFORM LOGIC ---
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      throw new Error("Speech synthesis is not supported by this browser.");
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "fil-PH";
    utterance.rate = 0.6; // Slightly slower rate helps phonetics
    utterance.pitch = 1;

    // Try to find a Filipino or Tagalog voice in the browser
    const voices = window.speechSynthesis.getVoices();
    const tagalogVoice = voices.find(
      (v) => v.lang.includes("fil") || v.lang.includes("tl")
    );

    if (tagalogVoice) {
      utterance.voice = tagalogVoice;
    }

    window.speechSynthesis.speak(utterance);
    return "plain";
  }

  // --- MOBILE (EXPO) PLATFORM LOGIC ---
  try {
    const availableVoices = await Speech.getAvailableVoicesAsync();
    const tagalogVoice = availableVoices.find(
      (v) => v.language.includes("fil") || v.language.includes("tl")
    );

    const speechOptions = {
      language: "fil-PH",
      rate: 0.6, // Slower rate for clearer syllable spacing
      pitch: 1,
    };

    if (tagalogVoice) {
      speechOptions.voice = tagalogVoice.identifier;
    }

    await Speech.speak(word, speechOptions);
  } catch (e) {
    // Fallback if voice fetching fails
    await Speech.speak(word, {
      language: "fil-PH",
      rate: 0.6,
      pitch: 1,
    });
  }

  return "plain";
}