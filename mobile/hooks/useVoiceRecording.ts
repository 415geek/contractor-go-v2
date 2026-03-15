import { useCallback, useRef, useState } from "react";
import { Audio } from "expo-av";

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recording = useRef<Audio.Recording | null>(null);
  const interval = useRef<ReturnType<typeof setInterval>>();

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = rec;
      setIsRecording(true);
      setDuration(0);
      interval.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      console.error("startRecording", e);
      throw e;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recording.current) return null;
    try {
      setIsRecording(false);
      if (interval.current) clearInterval(interval.current);
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      return uri;
    } catch (e) {
      console.error("stopRecording", e);
      return null;
    }
  }, []);

  return { isRecording, duration, startRecording, stopRecording };
}
