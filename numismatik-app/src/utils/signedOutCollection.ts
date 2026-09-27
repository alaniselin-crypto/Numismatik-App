export interface DeviceCollection<T> {
  coins: T[];
  folders: string[];
  platforms: string[];
}

export function collectionToKeepOnSignOut<T>(_input: {
  previousUid: string | null;
  visible: DeviceCollection<T>;
  account: DeviceCollection<T>;
  device: DeviceCollection<T> | null;
}): { collection: DeviceCollection<T>; saveOnDevice: boolean } {
  return {
    saveOnDevice: false,
    collection: { coins: [], folders: [], platforms: [] },
  };
}
