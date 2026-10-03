import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Coin, TabType } from './types';
import { 
  saveCoinsToStorage, 
  loadSavedDeviceCoins,
  loadSavedDeviceFolders,
  loadSavedDevicePlatforms,
  loadCustomFolders,
  saveCustomFolders,
  renameFolderInCoinsAndStorage,
  deleteFolderInStorage,
  loadCustomPlatforms,
  saveCustomPlatforms,
  renamePlatformInCoinsAndStorage,
  deletePlatformInStorage,
  formatSKU,
  getCoinTitle,
  loadUserCoinsFromStorage,
  saveUserCoinsToStorage,
  rememberSignedInUid,
  loadRememberedSignedInUid,
  loadUserFoldersFromStorage,
  saveUserFoldersToStorage,
  loadUserPlatformsFromStorage,
  saveUserPlatformsToStorage,
  loadUserCoinTombstones,
  saveUserCoinTombstones,
  loadUserPendingMutations,
  enqueueUserPendingMutation,
  markUserCoinPending,
  markUserCoinDeletionPending,
  removeUserPendingMutation,
  recordUserPendingMutationFailure,
  isPendingMutationPayloadValid,
  ensureCatalogNumberCounterInLocalStorage,
  resetCatalogNumberCounterInLocalStorage,
  reserveNextCatalogNumberInLocalStorage
} from './utils/storage';
import { parseImageSideAndBaseName } from './utils/csv';
import { formatCatalogNumber, parseCatalogNumber, renumberCatalogNumbers } from './utils/catalogNumberCounter';
import { findDuplicateCoin } from './utils/importDedup';
import {
  fetchUserCoinSyncSnapshot,
  fetchUserSettings,
  saveCoinToFirestore, 
  deleteCoinFromFirestore, 
  saveUserSettingsToFirestore,
  ensureCatalogNumberCounterForUser,
  saveRenumberedCatalogNumbersForUser,
  reserveNextCatalogNumberForUser
} from './utils/firestoreStorage';
import { useAuth } from './context/AuthContext';
import { auth } from './lib/firebase';
import { createAppleProSubscriptionActions } from './utils/appleProPurchaseDependencies';
import type { AppleProProductId } from './utils/appleProPurchaseCoordinator';
import type { AppleStoreKitProductPresentation } from './utils/appleStoreKit';

import { Header } from './components/Header';
import { ProSubscriptionModal } from './components/ProSubscriptionModal';

const appleProSubscriptionActions = createAppleProSubscriptionActions(async forceRefresh => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('subscription/auth-required');
  return currentUser.getIdToken(forceRefresh);
});
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { CoinList } from './components/CoinList';
import { StatisticsView } from './components/StatisticsView';
import { BackupExportView } from './components/BackupExportView';
import { CoinDetailModal } from './components/CoinDetailModal';
import { CoinFormModal } from './components/CoinFormModal';
import { HelpModal } from './components/HelpModal';
import { DriveMigrationModal } from './components/DriveMigrationModal';
import { CustomFieldsModal } from './components/CustomFieldsModal';
import { loadCustomFields, saveCustomFieldsLocally } from './utils/customFields';
import type { CustomFieldDefinition } from './types';
import { FolderManagerModal } from './components/FolderManagerModal';
import { PlatformManagerModal } from './components/PlatformManagerModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ConfirmDuplicateModal } from './components/ConfirmDuplicateModal';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { AppInfoModal } from './components/AppInfoModal';
import { HeroDownloadModal } from './components/HeroDownloadModal';
import { isAdminUser, setLocalAdmin } from './utils/admin';
import { wakeAiServer } from './utils/aiAssist';
import {
  FREE_COIN_LIMIT,
  StoredProEntitlement,
  canAddCoins,
  clearProEntitlement,
  isProEntitlementActive,
  loadProEntitlement,
  remainingFreeCoins,
  saveProEntitlement,
} from './utils/coinLimit';
import { collectionToKeepOnSignOut } from './utils/signedOutCollection';

const CATALOG_NUMBER_RESET_VERSION = 23;

function catalogNumberResetStorageKey(uid: string): string {
  return `numismatik_catalog_number_reset_v${CATALOG_NUMBER_RESET_VERSION}:${uid}`;
}

export default function App() {
  const { user, loading } = useAuth();
  const userUid = user?.uid ?? null;
  const isIos = Capacitor.getPlatform() === 'ios';
  const [adminOverride, setAdminOverride] = useState<boolean | null>(null);
  const isAdmin = adminOverride !== null ? adminOverride : isAdminUser(user?.email);

  const [coins, setCoins] = useState<Coin[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modal States
  const [detailCoin, setDetailCoin] = useState<Coin | null>(null);
  const [editCoin, setEditCoin] = useState<Coin | null>(null);
  const [coinToDelete, setCoinToDelete] = useState<Coin | null>(null);
  const [coinToDuplicate, setCoinToDuplicate] = useState<Coin | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isDriveMigrationOpen, setIsDriveMigrationOpen] = useState<boolean>(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState<boolean>(false);
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState<boolean>(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadCustomFields();
  });
  const [isPlatformManagerOpen, setIsPlatformManagerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [proProducts, setProProducts] = useState<AppleStoreKitProductPresentation[]>([]);
  const [isProLoading, setIsProLoading] = useState<boolean>(false);
  const [isProBusy, setIsProBusy] = useState<boolean>(false);
  const [proError, setProError] = useState<string | null>(null);
  const [proNotice, setProNotice] = useState<string | null>(null);
  const [proEntitlement, setProEntitlement] = useState<StoredProEntitlement | null>(null);
  const [importToast, setImportToast] = useState<string | null>(null);
  const [isFetchingWebhooks, setIsFetchingWebhooks] = useState<boolean>(false);
  const webhookImportRunningRef = useRef(false);
  const signedInUidRef = useRef<string | null>(null);
  const coinsRef = useRef(coins);
  const foldersRef = useRef(folders);
  const platformsRef = useRef(platforms);
  coinsRef.current = coins;
  foldersRef.current = folders;
  platformsRef.current = platforms;

  useEffect(() => {
    if (userUid) wakeAiServer();
  }, [userUid]);

  useEffect(() => {
    setProEntitlement(loadProEntitlement(userUid));
    if (!isIos || !userUid) return;
    let cancelled = false;
    const refresh = () => {
      void appleProSubscriptionActions.refresh().then(entitlement => {
        if (cancelled || signedInUidRef.current !== userUid) return;
        if (entitlement?.active) {
          const stored = { productId: entitlement.productId, expiresAt: entitlement.expiresAt };
          saveProEntitlement(userUid, stored);
          setProEntitlement(stored);
        } else {
          clearProEntitlement(userUid);
          setProEntitlement(null);
        }
      }).catch(() => {
        // Offline oder Server nicht erreichbar: zuletzt bestätigtes Abo bleibt bis zum Ablaufdatum gültig.
      });
    };
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userUid, isIos]);

  // Preserve existing inventory numbers while normalizing display names.
  const ensureCoinSKUs = (rawCoins: Coin[]): Coin[] => {
    return rawCoins.map(c => {
      const cleanName = getCoinTitle(c);
      if (cleanName !== c.name) {
        return { ...c, name: cleanName };
      }
      return c;
    });
  };

  const reserveCatalogNumber = async (knownCoins: Coin[]): Promise<string> => {
    if (!userUid) {
      return reserveNextCatalogNumberInLocalStorage(knownCoins, 'guest');
    }
    // Numbers are never reused: the locally persisted counter is a floor that
    // stays put even when the highest numbered coin gets deleted.
    const lastIssuedLocally = ensureCatalogNumberCounterInLocalStorage(knownCoins, userUid);
    const cloudNumber = await reserveNextCatalogNumberForUser(userUid, knownCoins);
    const nextValue = Math.max(parseCatalogNumber(cloudNumber) ?? 0, lastIssuedLocally + 1);
    resetCatalogNumberCounterInLocalStorage(nextValue, userUid);
    return formatCatalogNumber(nextValue);
  };

  const preserveIssuedCatalogNumbers = async (knownCoins: Coin[]): Promise<void> => {
    if (userUid) {
      await ensureCatalogNumberCounterForUser(userUid, knownCoins);
    } else {
      ensureCatalogNumberCounterInLocalStorage(knownCoins, 'guest');
    }
  };

  const assignMissingCatalogNumbers = async (newCoins: Coin[], existingCoins: Coin[]): Promise<Coin[]> => {
    const numberedCoins: Coin[] = [];
    for (const coin of newCoins) {
      if (parseCatalogNumber(coin.catalogNumber) !== null) {
        numberedCoins.push(coin);
        continue;
      }
      const catalogNumber = await reserveCatalogNumber([...existingCoins, ...newCoins, ...numberedCoins]);
      numberedCoins.push({ ...coin, catalogNumber });
    }
    return numberedCoins;
  };

  // Übernimmt Vorschaubild und Foto-Links der gespeicherten Version, solange die Fotos lokal seither unverändert sind.
  const applySavedPhotoFields = (uid: string, original: Coin, saved: Coin | null) => {
    if (!saved || signedInUidRef.current !== uid) return;
    const patch = (coin: Coin): Coin => {
      if (coin.id !== original.id || coin.imageUrl !== original.imageUrl || coin.reverseImageUrl !== original.reverseImageUrl) return coin;
      return {
        ...coin,
        imageUrl: saved.imageUrl,
        reverseImageUrl: saved.reverseImageUrl,
        driveFrontFileId: saved.driveFrontFileId,
        driveBackFileId: saved.driveBackFileId,
        driveFrontDirty: false,
        driveBackDirty: false,
        storageFrontUrl: saved.storageFrontUrl,
        storageBackUrl: saved.storageBackUrl,
      };
    };
    setCoins(previous => {
      const next = previous.map(patch);
      saveUserCoinsToStorage(uid, next);
      return next;
    });
  };

  const persistCoinForUser = async (uid: string, coin: Coin): Promise<void> => {
    const mutation = markUserCoinPending(uid, coin);
    try {
      const saved = await saveCoinToFirestore(uid, coin);
      removeUserPendingMutation(uid, mutation.id);
      applySavedPhotoFields(uid, coin, saved);
    } catch (error) {
      recordUserPendingMutationFailure(uid, mutation.id, error);
      throw error;
    }
  };

  const persistCoinDeletionForUser = async (uid: string, coinId: string): Promise<void> => {
    const mutation = markUserCoinDeletionPending(uid, coinId);
    try {
      await deleteCoinFromFirestore(uid, coinId);
      removeUserPendingMutation(uid, mutation.id);
    } catch (error) {
      recordUserPendingMutationFailure(uid, mutation.id, error);
      throw error;
    }
  };

  const persistSettingsForUser = async (
    uid: string,
    nextFolders: string[],
    nextPlatforms: string[]
  ): Promise<void> => {
    saveUserFoldersToStorage(uid, nextFolders);
    saveUserPlatformsToStorage(uid, nextPlatforms);
    const mutation = enqueueUserPendingMutation(uid, {
      type: 'saveSettings',
      settings: { folders: nextFolders, platforms: nextPlatforms },
    });
    try {
      await saveUserSettingsToFirestore(uid, { folders: nextFolders, platforms: nextPlatforms });
      removeUserPendingMutation(uid, mutation.id);
    } catch (error) {
      recordUserPendingMutationFailure(uid, mutation.id, error);
      throw error;
    }
  };

  const flushPendingMutations = async (uid: string, cloudTombstoneIds: Set<string>): Promise<void> => {
    const pending = loadUserPendingMutations(uid);
    for (const mutation of pending) {
      if (!isPendingMutationPayloadValid(mutation)) {
        recordUserPendingMutationFailure(uid, mutation.id, new Error('Invalid or incomplete pending mutation payload.'));
        continue;
      }
      try {
        if (mutation.type === 'upsertCoin' && mutation.coin) {
          if (cloudTombstoneIds.has(mutation.coin.id)) {
            removeUserPendingMutation(uid, mutation.id);
            continue;
          }
          const saved = await saveCoinToFirestore(uid, mutation.coin);
          applySavedPhotoFields(uid, mutation.coin, saved);
        } else if (mutation.type === 'deleteCoin' && mutation.coinId) {
          await deleteCoinFromFirestore(uid, mutation.coinId);
        } else if (mutation.type === 'saveSettings' && mutation.settings) {
          await saveUserSettingsToFirestore(uid, mutation.settings);
        }
        removeUserPendingMutation(uid, mutation.id);
      } catch (error) {
        recordUserPendingMutationFailure(uid, mutation.id, error);
      }
    }
  };

  // Initial Load & User Auth Sync
  useEffect(() => {
    if (loading) return;

    if (userUid) {
      signedInUidRef.current = userUid;
      rememberSignedInUid(userUid);
      let cancelled = false;
      const localCoins = ensureCoinSKUs(loadUserCoinsFromStorage(userUid));
      const localFolders = loadUserFoldersFromStorage(userUid);
      const localPlatforms = loadUserPlatformsFromStorage(userUid);
      setCoins(localCoins);
      setFolders(localFolders);
      setPlatforms(localPlatforms);

      void (async () => {
        try {
          const [snapshot, settings] = await Promise.all([
            fetchUserCoinSyncSnapshot(userUid),
            fetchUserSettings(userUid),
          ]);
          if (cancelled) return;

          const cloudTombstoneIds = new Set(snapshot.tombstones.map(tombstone => tombstone.coinId));
          const localTombstones = loadUserCoinTombstones(userUid);
          const allTombstoneIds = new Set([
            ...cloudTombstoneIds,
            ...localTombstones.map(tombstone => tombstone.coinId),
          ]);
          const cloudCoins = snapshot.coins.filter(coin => !allTombstoneIds.has(coin.id));
          const pendingUpserts = loadUserPendingMutations(userUid)
            .filter(mutation => mutation.type === 'upsertCoin' && mutation.coin && !allTombstoneIds.has(mutation.coin.id))
            .map(mutation => mutation.coin as Coin);
          const mergedById = new Map(cloudCoins.map(coin => [coin.id, coin]));
          pendingUpserts.forEach(coin => mergedById.set(coin.id, coin));
          let mergedCoins = ensureCoinSKUs(Array.from(mergedById.values()));
          const resetStorageKey = catalogNumberResetStorageKey(userUid);
          const mustResetCatalogNumbers = localStorage.getItem(resetStorageKey) !== 'done';
          if (mustResetCatalogNumbers) {
            const now = new Date().toISOString();
            mergedCoins = renumberCatalogNumbers(mergedCoins).map(coin => ({ ...coin, updatedAt: now }));
            await saveRenumberedCatalogNumbersForUser(userUid, mergedCoins);
            resetCatalogNumberCounterInLocalStorage(mergedCoins.length, userUid);
            saveUserCoinsToStorage(userUid, mergedCoins);
            setCoins(mergedCoins);
            localStorage.setItem(resetStorageKey, 'done');
          } else {
            ensureCatalogNumberCounterInLocalStorage(mergedCoins, userUid);
          }
          if (cancelled) return;

          const cloudTombstones = snapshot.tombstones.map(tombstone => ({
            coinId: tombstone.coinId,
            deletedAt: typeof (tombstone.deletedAt as { toDate?: () => Date } | null)?.toDate === 'function'
              ? (tombstone.deletedAt as { toDate: () => Date }).toDate().toISOString()
              : new Date().toISOString(),
          }));
          const tombstonesById = new Map(localTombstones.map(tombstone => [tombstone.coinId, tombstone]));
          cloudTombstones.forEach(tombstone => tombstonesById.set(tombstone.coinId, tombstone));

          setCoins(mergedCoins);
          saveUserCoinsToStorage(userUid, mergedCoins);
          saveUserCoinTombstones(userUid, Array.from(tombstonesById.values()));

          if (settings.adminMode === true || (settings.customFields && settings.customFields.length > 0)) {
            setLocalAdmin(true);
            setAdminOverride(true);
          }

          if (settings.customFields && settings.customFields.length > 0) {
            setCustomFieldDefs(settings.customFields);
            saveCustomFieldsLocally(settings.customFields);
          }

          const nextFolders = settings.folders ?? localFolders;
          const nextPlatforms = settings.platforms ?? localPlatforms;
          const pendingSettings = loadUserPendingMutations(userUid)
            .filter(mutation => mutation.type === 'saveSettings' && mutation.settings)
            .at(-1)?.settings;
          const effectiveFolders = pendingSettings?.folders ?? nextFolders;
          const effectivePlatforms = pendingSettings?.platforms ?? nextPlatforms;
          setFolders(effectiveFolders);
          setPlatforms(effectivePlatforms);
          saveUserFoldersToStorage(userUid, effectiveFolders);
          saveUserPlatformsToStorage(userUid, effectivePlatforms);

          await flushPendingMutations(userUid, cloudTombstoneIds);
        } catch (error) {
          console.error('Initial UID-scoped cloud sync failed; continuing with local data:', error);
        }
      })();

      return () => { cancelled = true; };
    } else {
      const kept = collectionToKeepOnSignOut({
        previousUid: signedInUidRef.current,
        visible: {
          coins: coinsRef.current,
          folders: foldersRef.current,
          platforms: platformsRef.current,
        },
        account: signedInUidRef.current
          ? {
              coins: loadUserCoinsFromStorage(signedInUidRef.current),
              folders: loadUserFoldersFromStorage(signedInUidRef.current),
              platforms: loadUserPlatformsFromStorage(signedInUidRef.current),
            }
          : { coins: [], folders: [], platforms: [] },
        device: (() => {
          const savedCoins = loadSavedDeviceCoins();
          if (savedCoins) {
            return {
              coins: savedCoins,
              folders: loadSavedDeviceFolders() ?? [],
              platforms: loadSavedDevicePlatforms() ?? [],
            };
          }
          const rememberedUid = loadRememberedSignedInUid();
          if (!rememberedUid) return null;
          return {
            coins: loadUserCoinsFromStorage(rememberedUid),
            folders: loadUserFoldersFromStorage(rememberedUid),
            platforms: loadUserPlatformsFromStorage(rememberedUid),
          };
        })(),
      });
      if (kept.saveOnDevice) {
        saveCoinsToStorage(kept.collection.coins);
        saveCustomFolders(kept.collection.folders);
        saveCustomPlatforms(kept.collection.platforms);
      }
      signedInUidRef.current = null;
      setCoins(ensureCoinSKUs(kept.collection.coins));
      setFolders(kept.collection.folders);
      setPlatforms(kept.collection.platforms);
    }
  }, [userUid, loading]);

  // Polling Make.com Webhook Pending Items
  const handleFetchPendingWebhooks = async (isManual = false) => {
    if (!userUid || webhookImportRunningRef.current) return;
    webhookImportRunningRef.current = true;
    if (isManual) setIsFetchingWebhooks(true);
    try {
      const res = await fetch('/api/webhook/make/pending');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.count > 0 && Array.isArray(data.items)) {
          const newWebhookCoins: Coin[] = data.items.map((item: any) => {
            const rawTitle = (item.name || '').trim();
            const rawBaseName = (item.rawBaseName || '').trim();
            
            const parsedFromTitle = parseImageSideAndBaseName(rawTitle);
            const parsedFromBase = parseImageSideAndBaseName(rawBaseName);
            const computedBaseKey = parsedFromBase.baseKey || parsedFromTitle.baseKey || rawBaseName || rawTitle;

            const isGeneric = !rawTitle || rawTitle === 'TITEL' || rawTitle === 'Münze (Make)' || rawTitle.toLowerCase().startsWith('drive import') || rawTitle.toLowerCase().startsWith('unbenannt');
            const coinName = isGeneric ? 'TITEL' : rawTitle;

            // Determine if item images are front or reverse
            let frontUrl = item.imageUrl || '';
            let reverseUrl = item.reverseImageUrl || '';

            if (parsedFromTitle.isReverse || parsedFromBase.isReverse) {
              if (frontUrl && !reverseUrl) {
                reverseUrl = frontUrl;
                frontUrl = '';
              }
            } else if (parsedFromTitle.isFront || parsedFromBase.isFront) {
              if (reverseUrl && !frontUrl) {
                frontUrl = reverseUrl;
                reverseUrl = '';
              }
            }

            return {
              id: item.id || `make-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              rawBaseName: computedBaseKey.toLowerCase(),
              name: coinName,
              country: item.country || 'Schweiz',
              year: Number(item.year) || new Date().getFullYear(),
              faceValue: item.faceValue || '1',
              currency: item.currency || 'CHF',
              itemType: item.itemType || 'coin',
              material: item.material || 'Silber',
              mintMark: item.mintMark || '',
              condition: item.condition || 'Sehr gut',
              rarity: item.rarity || 'Sehr häufig (Common)',
              purchasePrice: Number(item.purchasePrice) || 0,
              currentValue: Number(item.currentValue) || 0,
              notes: item.notes || '',
              imageUrl: frontUrl,
              reverseImageUrl: reverseUrl,
              storageLocation: item.folder || 'Hauptsammlung',
              salesListings: [],
              catalogNumber: item.catalogNumber ? formatSKU(item.catalogNumber) : '',
              isFavorite: false,
              createdAt: item.createdAt || new Date().toISOString()
            };
          });

          const coinsToSave: Coin[] = [];
          const addedFolders = new Set<string>();
          const updated = [...loadUserCoinsFromStorage(userUid)];

          for (const newCoin of newWebhookCoins) {
              if (newCoin.storageLocation) {
                addedFolders.add(newCoin.storageLocation);
              }

              const cleanNewName = newCoin.name.trim().toLowerCase();
              const cleanBaseName = (newCoin.rawBaseName || '').trim().toLowerCase();
              const isGenericName = cleanNewName === 'titel' || cleanNewName.startsWith('drive import') || cleanNewName.startsWith('münze') || cleanNewName.startsWith('unbenannt');
              
              const existingIdx = updated.findIndex(c => {
                if (newCoin.id && c.id === newCoin.id) return true;

                // 1. Match by computed baseKey (e.g. "mz 00015")
                if (cleanBaseName) {
                  if (c.rawBaseName && parseImageSideAndBaseName(c.rawBaseName).baseKey === cleanBaseName) return true;
                  if (c.name && parseImageSideAndBaseName(c.name).baseKey === cleanBaseName) return true;
                  if (c.imageUrl && parseImageSideAndBaseName(c.imageUrl).baseKey === cleanBaseName) return true;
                  if (c.reverseImageUrl && parseImageSideAndBaseName(c.reverseImageUrl).baseKey === cleanBaseName) return true;
                }

                // 2. Match by exact title if non-generic
                if (!isGenericName) {
                  const cName = c.name.trim().toLowerCase();
                  if (cName === cleanNewName) return true;
                }
                return false;
              });

              if (existingIdx !== -1) {
                // Merge images into existing coin without overwriting or losing reverse
                const existing = updated[existingIdx];
                let front = existing.imageUrl || '';
                let reverse = existing.reverseImageUrl || '';

                if (newCoin.reverseImageUrl) {
                  reverse = newCoin.reverseImageUrl;
                }
                if (newCoin.imageUrl) {
                  if (!front) {
                    front = newCoin.imageUrl;
                  } else if (!reverse && newCoin.imageUrl !== front) {
                    reverse = newCoin.imageUrl;
                  }
                }

                if (front === reverse) reverse = '';

                const mergedCoin: Coin = {
                  ...existing,
                  rawBaseName: existing.rawBaseName || cleanBaseName,
                  imageUrl: front,
                  reverseImageUrl: reverse,
                  notes: existing.notes ? (newCoin.notes && !existing.notes.includes(newCoin.notes) ? `${existing.notes} | ${newCoin.notes}` : existing.notes) : (newCoin.notes || '')
                };
                updated[existingIdx] = mergedCoin;
                coinsToSave.push(mergedCoin);
              } else {
                // Fresh coin - keep front and reverse distinct
                const catalogNumber = parseCatalogNumber(newCoin.catalogNumber) !== null
                  ? newCoin.catalogNumber
                  : await reserveCatalogNumber([...updated, ...newWebhookCoins]);
                const freshCoin: Coin = {
                  ...newCoin,
                  catalogNumber,
                  rawBaseName: cleanBaseName,
                  imageUrl: newCoin.imageUrl || '',
                  reverseImageUrl: (newCoin.reverseImageUrl && newCoin.reverseImageUrl !== newCoin.imageUrl) ? newCoin.reverseImageUrl : ''
                };
                updated.unshift(freshCoin);
                coinsToSave.push(freshCoin);
              }
          }

          const processedUpdated = ensureCoinSKUs(updated);
          saveUserCoinsToStorage(userUid, processedUpdated);
          const locallyStored = loadUserCoinsFromStorage(userUid);
          const localIds = new Set(locallyStored.map(coin => coin.id));
          if (locallyStored.length !== processedUpdated.length || processedUpdated.some(coin => !localIds.has(coin.id))) {
            throw new Error('Webhook import could not be persisted in the UID-scoped local cache.');
          }
          setCoins(processedUpdated);

          const processedById = new Map(processedUpdated.map(coin => [coin.id, coin]));
          const uniqueCoinsToSave = Array.from(new Set(coinsToSave.map(coin => coin.id)))
            .map(coinId => processedById.get(coinId))
            .filter((coin): coin is Coin => Boolean(coin));
          const pendingCoinWrites = uniqueCoinsToSave.map(coin => ({
            coin,
            mutation: markUserCoinPending(userUid, coin),
          }));
          for (const { coin, mutation } of pendingCoinWrites) {
            try {
              const saved = await saveCoinToFirestore(userUid, coin);
              removeUserPendingMutation(userUid, mutation.id);
              applySavedPhotoFields(userUid, coin, saved);
            } catch (error) {
              recordUserPendingMutationFailure(userUid, mutation.id, error);
              const remainsPending = loadUserPendingMutations(userUid).some(item => item.id === mutation.id);
              if (!remainsPending) throw error;
            }
          }

          // Update folders list if new folders exist
          if (addedFolders.size > 0) {
            const currentFolders = loadUserFoldersFromStorage(userUid);
            const currentPlatforms = loadUserPlatformsFromStorage(userUid);
            const merged = Array.from(new Set([...currentFolders, ...Array.from(addedFolders)]));
            setFolders(merged);
            saveUserFoldersToStorage(userUid, merged);
            saveUserPlatformsToStorage(userUid, currentPlatforms);
            const settingsMutation = enqueueUserPendingMutation(userUid, {
              type: 'saveSettings',
              settings: { folders: merged, platforms: currentPlatforms },
            });
            try {
              await saveUserSettingsToFirestore(userUid, { folders: merged, platforms: currentPlatforms });
              removeUserPendingMutation(userUid, settingsMutation.id);
            } catch (error) {
              recordUserPendingMutationFailure(userUid, settingsMutation.id, error);
              const remainsPending = loadUserPendingMutations(userUid).some(item => item.id === settingsMutation.id);
              if (!remainsPending) throw error;
            }
          }

          const clearResponse = await fetch('/api/webhook/make/clear', { method: 'POST' });
          if (!clearResponse.ok) throw new Error(`Webhook queue could not be cleared: HTTP ${clearResponse.status}`);

          setImportToast(`🎉 ${newWebhookCoins.length} Münze(n) via Google Drive Import hinzugefügt!`);
          setTimeout(() => setImportToast(null), 6000);
        } else if (isManual) {
          setImportToast(`ℹ️ Aktuell keine neuen Münzen im Puffer.`);
          setTimeout(() => setImportToast(null), 7000);
        }
      }
    } catch (err) {
      if (isManual) {
        console.error('Error in handleFetchPendingWebhooks:', err);
        setImportToast(`⚠️ Fehler beim Abrufen des Imports.`);
        setTimeout(() => setImportToast(null), 4000);
      }
    } finally {
      if (isManual) setIsFetchingWebhooks(false);
      webhookImportRunningRef.current = false;
    }
  };

  const handleTriggerTestWebhook = async () => {
    setIsFetchingWebhooks(true);
    try {
      const res = await fetch('/api/webhook/make/test', { method: 'POST' });
      if (res.ok) {
        await handleFetchPendingWebhooks(true);
      }
    } catch {
      setImportToast('⚠️ Fehler beim Erstellen der Testmünze.');
    } finally {
      setIsFetchingWebhooks(false);
    }
  };

  useEffect(() => {
    handleFetchPendingWebhooks(false);

    // Auto-poll every 3 seconds so imported coins from Google Drive / Make appear immediately
    const interval = setInterval(() => {
      handleFetchPendingWebhooks(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [userUid]);

  // Sync Local Data to Cloud
  const handleSyncLocalDataToCloud = async () => {
    if (!userUid) return;
    const snapshot = await fetchUserCoinSyncSnapshot(userUid);
    const cloudTombstoneIds = new Set(snapshot.tombstones.map(tombstone => tombstone.coinId));
    await flushPendingMutations(userUid, cloudTombstoneIds);

    const refreshed = await fetchUserCoinSyncSnapshot(userUid);
    const refreshedTombstoneIds = new Set(refreshed.tombstones.map(tombstone => tombstone.coinId));
    const localTombstoneIds = new Set(loadUserCoinTombstones(userUid).map(tombstone => tombstone.coinId));
    const mergedById = new Map(
      refreshed.coins
        .filter(coin => !refreshedTombstoneIds.has(coin.id) && !localTombstoneIds.has(coin.id))
        .map(coin => [coin.id, coin])
    );
    loadUserPendingMutations(userUid)
      .filter(mutation => mutation.type === 'upsertCoin' && mutation.coin
        && !refreshedTombstoneIds.has(mutation.coin.id)
        && !localTombstoneIds.has(mutation.coin.id))
      .forEach(mutation => mergedById.set((mutation.coin as Coin).id, mutation.coin as Coin));
    const processed = ensureCoinSKUs(Array.from(mergedById.values()));
    setCoins(processed);
    saveUserCoinsToStorage(userUid, processed);
  };

  // Sync state to LocalStorage & State
  const updateCoinsState = (newCoins: Coin[]) => {
    const processed = ensureCoinSKUs(newCoins);
    setCoins(processed);
    if (userUid) {
      saveUserCoinsToStorage(userUid, processed);
    } else {
      saveCoinsToStorage(processed);
    }
    const storedFolders = userUid ? loadUserFoldersFromStorage(userUid) : loadCustomFolders(processed);
    const updatedFolders = Array.from(new Set([
      ...storedFolders,
      ...processed.map(coin => coin.storageLocation).filter((value): value is string => Boolean(value && value.trim())),
    ]));
    setFolders(updatedFolders);
    const storedPlatforms = userUid ? loadUserPlatformsFromStorage(userUid) : loadCustomPlatforms(processed);
    const updatedPlatforms = Array.from(new Set([
      ...storedPlatforms,
      ...processed.map(coin => coin.listingPlatform).filter((value): value is string => Boolean(value && value.trim())),
    ]));
    setPlatforms(updatedPlatforms);
  };

  // Folder Management Handlers
  const handleAddFolder = async (folderName: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    if (!folders.includes(trimmed)) {
      const updated = [...folders, trimmed];
      setFolders(updated);
      if (userUid) {
        try {
          await persistSettingsForUser(userUid, updated, platforms);
        } catch (error) {
          console.error('Folder settings write queued for retry:', error);
        }
      } else {
        saveCustomFolders(updated);
      }
    }
  };

  const handleRenameFolder = async (oldName: string, newName: string) => {
    const trimmedName = newName.trim();
    const { updatedCoins, updatedFolders } = userUid
      ? {
          updatedCoins: coins.map(coin => coin.storageLocation === oldName
            ? { ...coin, storageLocation: trimmedName, updatedAt: new Date().toISOString() }
            : coin),
          updatedFolders: Array.from(new Set<string>(folders.map(folder => folder === oldName ? trimmedName : folder))),
        }
      : renameFolderInCoinsAndStorage(oldName, newName, coins, folders);
    setCoins(updatedCoins);
    setFolders(updatedFolders);

    if (userUid) {
      saveUserCoinsToStorage(userUid, updatedCoins);
      try {
        await persistSettingsForUser(userUid, updatedFolders, platforms);
      } catch (error) {
        console.error('Folder settings write queued for retry:', error);
      }
      for (const coin of updatedCoins) {
        if (coin.storageLocation === trimmedName && coins.find(existing => existing.id === coin.id)?.storageLocation === oldName) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Folder coin write queued for retry:', error);
          }
        }
      }
    }

    if (detailCoin && detailCoin.storageLocation === oldName) {
      setDetailCoin({ ...detailCoin, storageLocation: newName.trim() });
    }
    if (editCoin && editCoin.storageLocation === oldName) {
      setEditCoin({ ...editCoin, storageLocation: newName.trim() });
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    const { updatedCoins, updatedFolders } = userUid
      ? {
          updatedCoins: coins.map(coin => coin.storageLocation === folderName
            ? { ...coin, storageLocation: '', updatedAt: new Date().toISOString() }
            : coin),
          updatedFolders: folders.filter(folder => folder !== folderName),
        }
      : deleteFolderInStorage(folderName, coins, folders);
    setCoins(updatedCoins);
    setFolders(updatedFolders);

    if (userUid) {
      saveUserCoinsToStorage(userUid, updatedCoins);
      try {
        await persistSettingsForUser(userUid, updatedFolders, platforms);
      } catch (error) {
        console.error('Folder settings write queued for retry:', error);
      }
      for (const coin of updatedCoins) {
        if (coin.storageLocation === '' && coins.find(existing => existing.id === coin.id)?.storageLocation === folderName) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Folder coin write queued for retry:', error);
          }
        }
      }
    }

    if (detailCoin && detailCoin.storageLocation === folderName) {
      setDetailCoin({ ...detailCoin, storageLocation: '' });
    }
    if (editCoin && editCoin.storageLocation === folderName) {
      setEditCoin({ ...editCoin, storageLocation: '' });
    }
  };

  // Platform Management Handlers
  const handleAddPlatform = async (platformName: string) => {
    const trimmed = platformName.trim();
    if (!trimmed) return;
    if (!platforms.includes(trimmed)) {
      const updated = [...platforms, trimmed];
      setPlatforms(updated);
      if (userUid) {
        try {
          await persistSettingsForUser(userUid, folders, updated);
        } catch (error) {
          console.error('Platform settings write queued for retry:', error);
        }
      } else {
        saveCustomPlatforms(updated);
      }
    }
  };

  const handleRenamePlatform = async (oldName: string, newName: string) => {
    const trimmedName = newName.trim();
    const { updatedCoins, updatedPlatforms } = userUid
      ? {
          updatedCoins: coins.map(coin => coin.listingPlatform === oldName
            ? { ...coin, listingPlatform: trimmedName, updatedAt: new Date().toISOString() }
            : coin),
          updatedPlatforms: Array.from(new Set<string>(platforms.map(platform => platform === oldName ? trimmedName : platform))),
        }
      : renamePlatformInCoinsAndStorage(oldName, newName, coins, platforms);
    setCoins(updatedCoins);
    setPlatforms(updatedPlatforms);

    if (userUid) {
      saveUserCoinsToStorage(userUid, updatedCoins);
      try {
        await persistSettingsForUser(userUid, folders, updatedPlatforms);
      } catch (error) {
        console.error('Platform settings write queued for retry:', error);
      }
      for (const coin of updatedCoins) {
        if (coin.listingPlatform === trimmedName && coins.find(existing => existing.id === coin.id)?.listingPlatform === oldName) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Platform coin write queued for retry:', error);
          }
        }
      }
    }

    if (detailCoin && detailCoin.listingPlatform === oldName) {
      setDetailCoin({ ...detailCoin, listingPlatform: newName.trim() });
    }
    if (editCoin && editCoin.listingPlatform === oldName) {
      setEditCoin({ ...editCoin, listingPlatform: newName.trim() });
    }
  };

  const handleDeletePlatform = async (platformName: string) => {
    const { updatedCoins, updatedPlatforms } = userUid
      ? {
          updatedCoins: coins.map(coin => coin.listingPlatform === platformName
            ? { ...coin, listingPlatform: '', updatedAt: new Date().toISOString() }
            : coin),
          updatedPlatforms: platforms.filter(platform => platform !== platformName),
        }
      : deletePlatformInStorage(platformName, coins, platforms);
    setCoins(updatedCoins);
    setPlatforms(updatedPlatforms);

    if (userUid) {
      saveUserCoinsToStorage(userUid, updatedCoins);
      try {
        await persistSettingsForUser(userUid, folders, updatedPlatforms);
      } catch (error) {
        console.error('Platform settings write queued for retry:', error);
      }
      for (const coin of updatedCoins) {
        if (coin.listingPlatform === '' && coins.find(existing => existing.id === coin.id)?.listingPlatform === platformName) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Platform coin write queued for retry:', error);
          }
        }
      }
    }

    if (detailCoin && detailCoin.listingPlatform === platformName) {
      setDetailCoin({ ...detailCoin, listingPlatform: '' });
    }
    if (editCoin && editCoin.listingPlatform === platformName) {
      setEditCoin({ ...editCoin, listingPlatform: '' });
    }
  };

  const coinLimitContext = {
    enforced: isIos,
    isPro: isProEntitlementActive(proEntitlement),
    isAdmin,
  };

  const showCoinLimitReached = (message: string) => {
    if (user) {
      setProNotice(message);
      void handleOpenProModal();
    } else {
      setImportToast(message);
    }
  };

  const coinLimitMessage = (adding: number) => {
    const remaining = remainingFreeCoins(coins.length, coinLimitContext);
    if (adding <= 1 || remaining === 0) {
      return `Die Gratis-Version speichert bis zu ${FREE_COIN_LIMIT} Münzen. Mit Numismatik Pro können Sie unbegrenzt weitere Münzen erfassen.`;
    }
    return `Sie möchten ${adding} neue Münzen hinzufügen, gratis sind noch ${remaining} möglich (Grenze ${FREE_COIN_LIMIT}). Mit Numismatik Pro gibt es keine Grenze.`;
  };

  const ensureRoomForNewCoins = (adding: number): boolean => {
    if (canAddCoins(coins.length, adding, coinLimitContext)) return true;
    showCoinLimitReached(coinLimitMessage(adding));
    return false;
  };

  const openNewCoinForm = () => {
    if (!ensureRoomForNewCoins(1)) return;
    setEditCoin(null);
    setIsFormModalOpen(true);
  };

  // Add / Edit Coin Handler
  const handleSaveCoin = async (coinData: Omit<Coin, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString();

    if (!coinData.id && !ensureRoomForNewCoins(1)) return;

    if (coinData.id) {
      // Edit existing
      const targetCoin = coins.find(c => c.id === coinData.id);
      const updatedCoin: Coin = {
        ...(targetCoin || {}),
        ...coinData,
        id: coinData.id,
        catalogNumber: targetCoin ? targetCoin.catalogNumber : (coinData.catalogNumber?.trim() || ''),
        updatedAt: now
      } as Coin;
      if (targetCoin && (updatedCoin.imageUrl || '') !== (targetCoin.imageUrl || '')) updatedCoin.driveFrontDirty = true;
      if (targetCoin && (updatedCoin.reverseImageUrl || '') !== (targetCoin.reverseImageUrl || '')) updatedCoin.driveBackDirty = true;

      const updatedList = coins.map(c => c.id === coinData.id ? updatedCoin : c);
      updateCoinsState(updatedList);

      if (userUid) {
        try {
          await persistCoinForUser(userUid, updatedCoin);
        } catch (error) {
          console.error('Coin update queued for retry:', error);
        }
      }
    } else {
      // Add new
      const catalogNumber = await reserveCatalogNumber(coins);
      const newCoin: Coin = {
        ...coinData,
        id: `coin-${Date.now()}`,
        catalogNumber,
        createdAt: now,
        updatedAt: now
      };

      const updatedList = [newCoin, ...coins];
      updateCoinsState(updatedList);

      if (userUid) {
        try {
          await persistCoinForUser(userUid, newCoin);
        } catch (error) {
          console.error('New coin queued for retry:', error);
        }
      }
    }

    setEditCoin(null);
  };

  // Duplicate Coin Handler
  const handleDuplicateCoin = async (sourceCoin: Coin) => {
    if (!ensureRoomForNewCoins(1)) return;
    const now = new Date().toISOString();
    const nextNum = await reserveCatalogNumber(coins);
    const duplicatedCoin: Coin = {
      ...sourceCoin,
      id: `coin-${Date.now()}`,
      catalogNumber: nextNum,
      name: sourceCoin.name.includes('(Kopie)') ? sourceCoin.name : `${sourceCoin.name} (Kopie)`,
      createdAt: now,
      updatedAt: now
    };

    updateCoinsState([duplicatedCoin, ...coins]);
    if (userUid) {
      try {
        await persistCoinForUser(userUid, duplicatedCoin);
      } catch (error) {
        console.error('Duplicated coin queued for retry:', error);
      }
    }
  };

  const handleDuplicateRequest = (sourceCoin: Coin) => {
    if (!ensureRoomForNewCoins(1)) return;
    if (isIos) {
      setCoinToDuplicate(sourceCoin);
      return;
    }
    void handleDuplicateCoin(sourceCoin);
  };

  // Delete Handler
  const handleDeleteCoin = (coinId: string) => {
    const found = coins.find(c => c.id === coinId);
    if (found) {
      setCoinToDelete(found);
    }
  };

  const handleConfirmDeleteCoin = async () => {
    if (!coinToDelete) return;
    const targetId = coinToDelete.id;

    await preserveIssuedCatalogNumbers(coins);
    const updatedList = coins.filter(c => c.id !== targetId);
    updateCoinsState(updatedList);

    if (userUid) {
      try {
        await persistCoinDeletionForUser(userUid, targetId);
      } catch (error) {
        console.error('Coin deletion queued for retry:', error);
      }
    }

    if (detailCoin?.id === targetId) {
      setDetailCoin(null);
    }
    setCoinToDelete(null);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (coinId: string) => {
    const found = coins.find(c => c.id === coinId);
    if (!found) return;

    const updatedCoin = { ...found, isFavorite: !found.isFavorite, updatedAt: new Date().toISOString() };

    const updatedList = coins.map(c => c.id === coinId ? updatedCoin : c);
    updateCoinsState(updatedList);
    if (userUid) {
      try {
        await persistCoinForUser(userUid, updatedCoin);
      } catch (error) {
        console.error('Favorite change queued for retry:', error);
      }
    }

    if (detailCoin?.id === coinId) {
      setDetailCoin(updatedCoin);
    }
  };

  // CSV Import Handler
  const importFitsCoinLimit = (newCoins: Coin[], replaceExisting: boolean): boolean => {
    if (replaceExisting) {
      if (canAddCoins(0, newCoins.length, coinLimitContext)) return true;
      showCoinLimitReached(`Die Gratis-Version speichert bis zu ${FREE_COIN_LIMIT} Münzen, die Datei enthält ${newCoins.length}. Mit Numismatik Pro gibt es keine Grenze.`);
      return false;
    }
    return ensureRoomForNewCoins(newCoins.filter(coin => !findDuplicateCoin(coins, coin)).length);
  };

  const handleImportCoins = async (newCoins: Coin[], replaceExisting: boolean): Promise<boolean> => {
    if (replaceExisting && !importFitsCoinLimit(newCoins, true)) return false;
    if (replaceExisting) await preserveIssuedCatalogNumbers(coins);
    const mergedExisting = new Map<string, Coin>();
    const freshRawCoins: Coin[] = [];
    const mergeCoin = (existing: Coin, nc: Coin): Coin => {
      const updates = Object.fromEntries(Object.entries(nc).filter(([key, value]) =>
        !['id', 'createdAt', 'updatedAt', 'catalogNumber'].includes(key)
        && value !== '' && value !== null && value !== undefined && value !== 0
        && !(Array.isArray(value) && value.length === 0)
      ));
      const merged: Coin = { ...existing, ...updates, id: existing.id, catalogNumber: existing.catalogNumber || nc.catalogNumber };
      if (nc.notes && existing.notes && !existing.notes.includes(nc.notes)) {
        merged.notes = `${existing.notes} | ${nc.notes}`;
      }
      merged.updatedAt = new Date().toISOString();
      return merged;
    };

    if (!replaceExisting) {
      for (const nc of newCoins) {
        const dup = findDuplicateCoin(coins.map(coin => mergedExisting.get(coin.id) ?? coin), nc);
        if (dup) {
          mergedExisting.set(dup.id, mergeCoin(mergedExisting.get(dup.id) ?? dup, nc));
        } else {
          freshRawCoins.push(nc);
        }
      }
      if (!ensureRoomForNewCoins(freshRawCoins.length)) return false;
    }
    const numberedNewCoins = await assignMissingCatalogNumbers(
      replaceExisting ? newCoins : freshRawCoins,
      replaceExisting ? [] : coins,
    );
    const freshCoins = numberedNewCoins;

    if (userUid) {
      if (replaceExisting) {
        const importedIds = new Set(numberedNewCoins.map(coin => coin.id));
        for (const coin of coins) {
          if (!importedIds.has(coin.id)) {
            try {
              await persistCoinDeletionForUser(userUid, coin.id);
            } catch (error) {
              console.error('Replaced coin deletion queued for retry:', error);
            }
          }
        }
        updateCoinsState(numberedNewCoins);
        for (const coin of numberedNewCoins) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Imported coin queued for retry:', error);
          }
        }
      } else {
        const existingIds = new Set(coins.map(coin => coin.id));
        const importedCoins = freshCoins.map(coin => existingIds.has(coin.id)
          ? { ...coin, id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }
          : coin
        );
        const nextCoins = [
          ...coins.map(coin => mergedExisting.get(coin.id) ?? coin),
          ...importedCoins,
        ];
        updateCoinsState(nextCoins);
        for (const coin of mergedExisting.values()) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Merged duplicate queued for retry:', error);
          }
        }
        for (const coin of importedCoins) {
          try {
            await persistCoinForUser(userUid, coin);
          } catch (error) {
            console.error('Imported coin queued for retry:', error);
          }
        }
        if (mergedExisting.size > 0) {
          setImportToast(mergedExisting.size === 1
            ? '1 doppelte Münze erkannt und mit Ihrem Bestand zusammengeführt.'
            : `${mergedExisting.size} doppelte Münzen erkannt und mit Ihrem Bestand zusammengeführt.`);
        }
      }
    } else {
      if (replaceExisting) {
        updateCoinsState(numberedNewCoins);
      } else {
        const existingIds = new Set(coins.map(c => c.id));
        const merged = coins.map(c => mergedExisting.get(c.id) ?? c);
        freshCoins.forEach(nc => {
          if (!existingIds.has(nc.id)) {
            merged.push(nc);
          } else {
            merged.push({ ...nc, id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` });
          }
        });
        updateCoinsState(merged);
        if (mergedExisting.size > 0) {
          setImportToast(mergedExisting.size === 1
            ? '1 doppelte Münze erkannt und mit Ihrem Bestand zusammengeführt.'
            : `${mergedExisting.size} doppelte Münzen erkannt und mit Ihrem Bestand zusammengeführt.`);
        }
      }
    }
    return true;
  };

  // Clear All Coins Handler
  const handleClearAllCoins = async () => {
    await preserveIssuedCatalogNumbers(coins);
    updateCoinsState([]);
    if (userUid) {
      for (const coin of coins) {
        try {
          await persistCoinDeletionForUser(userUid, coin.id);
        } catch (error) {
          console.error('Clear-all deletion queued for retry:', error);
        }
      }
    }
  };

  const handleOpenProModal = async () => {
    setIsProModalOpen(true);
    setProError(null);
    setIsProLoading(true);
    try {
      setProProducts(await appleProSubscriptionActions.listProducts());
    } catch {
      setProError('Die App-Store-Angebote konnten nicht geladen werden.');
    } finally {
      setIsProLoading(false);
    }
  };

  const rememberProEntitlement = (entitlement: { productId: string; expiresAt: string }) => {
    const stored = { productId: entitlement.productId, expiresAt: entitlement.expiresAt };
    if (userUid) saveProEntitlement(userUid, stored);
    setProEntitlement(stored);
    setProNotice(null);
  };

  const handlePurchasePro = async (productId: AppleProProductId) => {
    setIsProBusy(true);
    setProError(null);
    try {
      const entitlement = await appleProSubscriptionActions.purchase(productId);
      if (!entitlement.active) throw new Error('subscription/inactive');
      rememberProEntitlement(entitlement);
      setIsProModalOpen(false);
      setImportToast('Numismatik Pro ist aktiv.');
    } catch {
      setProError('Der Kauf konnte nicht bestätigt werden. Es wurde nichts freigeschaltet.');
    } finally {
      setIsProBusy(false);
    }
  };

  const handleRestorePro = async () => {
    setIsProBusy(true);
    setProError(null);
    try {
      const entitlement = await appleProSubscriptionActions.restore();
      if (!entitlement.active) throw new Error('subscription/inactive');
      rememberProEntitlement(entitlement);
      setIsProModalOpen(false);
      setImportToast('Numismatik Pro wurde wiederhergestellt.');
    } catch {
      setProError('Es konnte kein aktives Numismatik-Pro-Abo wiederhergestellt werden.');
    } finally {
      setIsProBusy(false);
    }
  };

  const handleSaveCustomFields = (fields: CustomFieldDefinition[]) => {
    setCustomFieldDefs(fields);
    saveCustomFieldsLocally(fields);
    const uid = user?.uid;
    if (uid) {
      void saveUserSettingsToFirestore(uid, { folders, platforms, customFields: fields })
        .catch(error => console.error('Eigene Felder konnten nicht in der Cloud gespeichert werden:', error));
    }
  };

  // Total Collection Valuation KPI
  const totalValuation = coins.reduce((acc, c) => acc + (c.currentValue || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#100c0b] text-amber-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-400" aria-label="Anmeldung wird geladen" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-[#1a1412] text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden max-w-full w-full">
      {/* Header */}
      <Header
        totalValue={totalValuation}
        totalCoins={coins.length}
        onOpenAddModal={openNewCoinForm}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenDriveMigration={() => setIsDriveMigrationOpen(true)}
        onOpenCustomFields={isAdmin ? () => setIsCustomFieldsOpen(true) : undefined}
        onOpenFolderManager={() => setIsFolderManagerOpen(true)}
        onOpenPlatformManager={() => setIsPlatformManagerOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
        onOpenHeroModal={() => setIsHeroModalOpen(true)}
        onOpenProModal={isIos && user ? () => { void handleOpenProModal(); } : undefined}
        onManualFetchWebhooks={() => handleFetchPendingWebhooks(true)}
        isFetchingWebhooks={isFetchingWebhooks}
        onClearAllCoins={handleClearAllCoins}
      />

      {importToast && (
        <div className="bg-emerald-800/90 border-b border-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-medium shadow-lg flex flex-wrap items-center justify-center gap-3">
          <span>{importToast}</span>
          <button
            onClick={handleTriggerTestWebhook}
            className="px-2.5 py-1 text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md shadow transition-all"
          >
            🧪 Test-Münze simulieren
          </button>
          <button
            onClick={() => setImportToast(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* Main Container View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 pb-24 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard
            coins={coins}
            onOpenAddModal={openNewCoinForm}
            onNavigateToCollection={() => setActiveTab('collection')}
            onViewDetails={(coin) => setDetailCoin(coin)}
          />
        )}

        {activeTab === 'collection' && (
          <CoinList
            coins={coins}
            onOpenAddModal={openNewCoinForm}
            onViewDetails={(coin) => setDetailCoin(coin)}
            onEdit={(coin) => {
              setEditCoin(coin);
              setIsFormModalOpen(true);
            }}
            onDelete={handleDeleteCoin}
            onToggleFavorite={handleToggleFavorite}
            onDuplicate={handleDuplicateRequest}
            onOpenFolderManager={() => setIsFolderManagerOpen(true)}
            onOpenPlatformManager={() => setIsPlatformManagerOpen(true)}
          />
        )}

        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto space-y-4 bg-[#241c18] border border-[#3e2e26] rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-serif font-bold text-amber-400">
              Münzerfassung starten
            </h2>
            <p className="text-xs text-stone-400">
              Fügen Sie ein neues Münzexemplar mit Erhaltungsgrad, Kaufpreis und Marktwert zu Ihrer Sammlung hinzu.
            </p>
            <button
              onClick={openNewCoinForm}
              className="w-full py-3 text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              + Formular zur Münzerfassung öffnen
            </button>
          </div>
        )}

        {activeTab === 'statistics' && (
          <StatisticsView coins={coins} />
        )}

        {activeTab === 'backup' && (
          <BackupExportView
            coins={coins}
            onImportCoins={(newCoins, replaceExisting) => {
              if (!importFitsCoinLimit(newCoins, replaceExisting)) return false;
              void handleImportCoins(newCoins, replaceExisting);
              return true;
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'add') {
            openNewCoinForm();
          } else {
            setActiveTab(tab);
          }
        }}
        coinCount={coins.length}
      />

      {/* Modals */}
      <ProSubscriptionModal
        isOpen={isProModalOpen}
        products={proProducts}
        loading={isProLoading}
        busy={isProBusy}
        error={proError}
        notice={proNotice}
        onClose={() => { setIsProModalOpen(false); setProNotice(null); }}
        onPurchase={productId => { void handlePurchasePro(productId); }}
        onRestore={() => { void handleRestorePro(); }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSyncLocalData={handleSyncLocalDataToCloud}
        hasLocalCoinsCount={userUid ? loadUserCoinsFromStorage(userUid).length : 0}
      />

      <CustomFieldsModal
        isOpen={isCustomFieldsOpen}
        onClose={() => setIsCustomFieldsOpen(false)}
        fields={customFieldDefs}
        onSave={handleSaveCustomFields}
      />

      <CoinDetailModal
        coin={detailCoin}
        customFieldDefs={isAdmin ? customFieldDefs : []}
        onClose={() => setDetailCoin(null)}
        onEdit={(coin) => {
          setEditCoin(coin);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteCoin}
        onToggleFavorite={handleToggleFavorite}
        onDuplicate={handleDuplicateRequest}
      />

      <CoinFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditCoin(null);
        }}
        onSave={handleSaveCoin}
        initialCoin={editCoin}
        nextCatalogNumber=""
        availableFolders={folders}
        onOpenFolderManager={() => setIsFolderManagerOpen(true)}
        availablePlatforms={platforms}
        onOpenPlatformManager={() => setIsPlatformManagerOpen(true)}
        customFieldDefs={isAdmin ? customFieldDefs : []}
        onOpenCustomFields={isAdmin ? () => setIsCustomFieldsOpen(true) : undefined}
      />

      <FolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        folders={folders}
        coins={coins}
        onAddFolder={handleAddFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
      />

      <PlatformManagerModal
        isOpen={isPlatformManagerOpen}
        onClose={() => setIsPlatformManagerOpen(false)}
        platforms={platforms}
        coins={coins}
        onAddPlatform={handleAddPlatform}
        onRenamePlatform={handleRenamePlatform}
        onDeletePlatform={handleDeletePlatform}
      />

      <HelpModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
      <DriveMigrationModal
        open={isDriveMigrationOpen}
        onClose={() => setIsDriveMigrationOpen(false)}
        coins={coins}
        onCoinUpdated={updatedCoin => {
          setCoins(prev => prev.map(coin => (coin.id === updatedCoin.id ? { ...coin, ...updatedCoin } : coin)));
        }}
      />

      <ConfirmDeleteModal
        isOpen={coinToDelete !== null}
        coin={coinToDelete}
        onClose={() => setCoinToDelete(null)}
        onConfirm={handleConfirmDeleteCoin}
      />

      {isIos && (
        <ConfirmDuplicateModal
          isOpen={coinToDuplicate !== null}
          onClose={() => setCoinToDuplicate(null)}
          onConfirm={() => {
            const sourceCoin = coinToDuplicate;
            setCoinToDuplicate(null);
            if (sourceCoin) void handleDuplicateCoin(sourceCoin);
          }}
        />
      )}

      <AppInfoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onAdminChange={(value) => {
          setAdminOverride(value);
          if (userUid) {
            void saveUserSettingsToFirestore(userUid, { adminMode: value }).catch(() => undefined);
          }
        }}
      />

      <HeroDownloadModal
        isOpen={isHeroModalOpen}
        onClose={() => setIsHeroModalOpen(false)}
      />
    </div>
  );
}
