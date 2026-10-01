import { fetchAppleAccountToken } from './appleAccountTokenApi';
import { fetchAppleProEntitlement } from './appleProEntitlementApi';
import {
  purchaseApplePro,
  refreshApplePro,
  restoreApplePro,
  type AppleProProductId,
  type AppleProPurchaseCoordinatorDependencies,
} from './appleProPurchaseCoordinator';
import {
  currentAppleProTransaction,
  finishAppleProTransaction,
  listAppleProProducts,
  purchaseAppleProProduct,
  restoreAppleProTransactions,
  type AppleStoreKitProductPresentation,
} from './appleStoreKit';

type AppleProPurchaseAdapters = Omit<
  AppleProPurchaseCoordinatorDependencies,
  'getFirebaseIdToken'
>;

const defaultAdapters: AppleProPurchaseAdapters = {
  requestAccountToken: fetchAppleAccountToken,
  purchase: purchaseAppleProProduct,
  finish: finishAppleProTransaction,
  restore: restoreAppleProTransactions,
  currentEntitlement: currentAppleProTransaction,
  requestEntitlement: fetchAppleProEntitlement,
};

export function createAppleProPurchaseDependencies(
  getFirebaseIdToken: AppleProPurchaseCoordinatorDependencies['getFirebaseIdToken'],
  adapters: AppleProPurchaseAdapters = defaultAdapters,
): AppleProPurchaseCoordinatorDependencies {
  return {
    getFirebaseIdToken,
    ...adapters,
  };
}

type AppleProSubscriptionAdapters = AppleProPurchaseAdapters & {
  listProducts(): Promise<AppleStoreKitProductPresentation[]>;
};

const defaultSubscriptionAdapters: AppleProSubscriptionAdapters = {
  ...defaultAdapters,
  listProducts: listAppleProProducts,
};

export function createAppleProSubscriptionActions(
  getFirebaseIdToken: AppleProPurchaseCoordinatorDependencies['getFirebaseIdToken'],
  adapters: AppleProSubscriptionAdapters = defaultSubscriptionAdapters,
) {
  const dependencies = createAppleProPurchaseDependencies(getFirebaseIdToken, adapters);
  return {
    listProducts: adapters.listProducts,
    purchase: (productId: AppleProProductId) => purchaseApplePro(productId, dependencies),
    restore: () => restoreApplePro(dependencies),
    refresh: () => refreshApplePro(dependencies),
  };
}
