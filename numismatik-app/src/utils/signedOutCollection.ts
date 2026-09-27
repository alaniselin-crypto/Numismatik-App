export interface DeviceCollection<T> {
  coins: T[];
  folders: string[];
  platforms: string[];
}

export function collectionToKeepOnSignOut<T>(input: {
  previousUid: string | null;
  visible: DeviceCollection<T>;
  account: DeviceCollection<T>;
  device: DeviceCollection<T> | null;
}): { collection: DeviceCollection<T>; saveOnDevice: boolean } {
  if (input.previousUid) {
    return {
      saveOnDevice: true,
      collection: {
        coins: input.visible.coins.length > 0 ? input.visible.coins : input.account.coins,
        folders: input.visible.folders.length > 0 ? input.visible.folders : input.account.folders,
        platforms: input.visible.platforms.length > 0 ? input.visible.platforms : input.account.platforms,
      },
    };
  }

  if (input.device) {
    return { saveOnDevice: false, collection: input.device };
  }

  return {
    saveOnDevice: false,
    collection: { coins: [], folders: [], platforms: [] },
  };
}
