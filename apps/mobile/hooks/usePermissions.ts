import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export interface PermissionState {
  granted: boolean;
  canAskAgain: boolean;
  checked: boolean;
}

export function usePermissions() {
  const [micPermission, setMicPermission] = useState<PermissionState>({
    granted: false,
    canAskAgain: true,
    checked: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    const { status, canAskAgain } = await Audio.getPermissionsAsync();
    setMicPermission({
      granted: status === 'granted',
      canAskAgain,
      checked: true,
    });
  }

  async function requestMicPermission(): Promise<boolean> {
    const { status, canAskAgain } = await Audio.requestPermissionsAsync();
    const granted = status === 'granted';
    setMicPermission({ granted, canAskAgain, checked: true });
    return granted;
  }

  return { micPermission, requestMicPermission, checkPermissions };
}
