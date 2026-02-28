"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type Theme = "dark" | "light";

type WakeWordSensitivity = "low" | "medium" | "high";

interface VoiceState {
  voiceEnabled: boolean;
  ttsEnabled: boolean;
  wakeWordSensitivity: WakeWordSensitivity;
}

interface VynthenContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  voice: VoiceState;
  setVoice: (voice: VoiceState) => void;
}

const VynthenContext = createContext<VynthenContextValue | null>(null);

const THEME_KEY = "vynthen-theme";
const VOICE_KEY = "vynthen-voice-settings";

export const VynthenProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [voice, setVoiceState] = useState<VoiceState>({
    voiceEnabled: true,
    ttsEnabled: true,
    wakeWordSensitivity: "medium"
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    }
    const storedVoice = window.localStorage.getItem(VOICE_KEY);
    if (storedVoice) {
      try {
        const parsed = JSON.parse(storedVoice) as VoiceState;
        setVoiceState((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VOICE_KEY, JSON.stringify(voice));
  }, [voice]);

  const value = useMemo<VynthenContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      voice,
      setVoice: setVoiceState
    }),
    [theme, voice]
  );

  return (
    <VynthenContext.Provider value={value}>{children}</VynthenContext.Provider>
  );
};

export function useVynthen(): VynthenContextValue {
  const ctx = useContext(VynthenContext);
  if (!ctx) {
    throw new Error("useVynthen must be used within VynthenProvider");
  }
  return ctx;
}

