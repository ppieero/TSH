import { useState, useRef } from 'react';
import { Audio } from 'expo-av';

export interface RecordingState {
  isRecording: boolean;
  uri: string | null;
  durationMs: number;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    uri: null,
    durationMs: 0,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);

  async function startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setState(s => ({ ...s, isRecording: true, error: null, uri: null }));
    } catch (err) {
      setState(s => ({ ...s, error: 'No se pudo iniciar la grabación' }));
    }
  }

  async function stopRecording(): Promise<string | null> {
    if (!recordingRef.current) return null;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const status = await recordingRef.current.getStatusAsync();
      const uri = recordingRef.current.getURI();
      const durationMs = status.isLoaded ? (status.durationMillis ?? 0) : 0;

      setState(s => ({
        ...s,
        isRecording: false,
        uri: uri ?? null,
        durationMs,
      }));

      return uri ?? null;
    } catch (err) {
      setState(s => ({ ...s, isRecording: false, error: 'Error al detener grabación' }));
      return null;
    } finally {
      recordingRef.current = null;
    }
  }

  return { ...state, startRecording, stopRecording };
}
