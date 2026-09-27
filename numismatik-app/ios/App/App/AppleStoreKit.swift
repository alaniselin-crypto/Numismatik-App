import Foundation
import Capacitor
import StoreKit

/**
 * Native StoreKit 2 bridge used by the Pro subscription flow.
 *
 * JS side (src/utils/appleStoreKit.ts) registers the plugin as "AppleStoreKit"
 * and expects:
 *  - getProducts() -> { products: [{ productId, displayName, displayPrice }] }
 *  - purchase({ productId, appAccountToken }) -> { signedTransaction, transactionId }
 *  - finish({ transactionId }) -> void
 *  - restore() -> { signedTransaction }
 */
@objc(AppleStoreKitPlugin)
public class AppleStoreKit: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleStoreKitPlugin"
    public let jsName = "AppleStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    private static let productIds = [
        "com.alaniselin.numisma.pro.monthly",
        "com.alaniselin.numisma.pro.yearly",
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: Self.productIds)
                let payload: [[String: String]] = products.map { product in
                    [
                        "productId": product.id,
                        "displayName": product.displayName,
                        "displayPrice": product.displayPrice,
                    ]
                }
                call.resolve(["products": payload])
            } catch {
                call.reject("Products could not be loaded", "storekit/products-failed", error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), Self.productIds.contains(productId) else {
            call.reject("Unknown product", "storekit/unknown-product")
            return
        }
        let appAccountTokenString = call.getString("appAccountToken") ?? ""

        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product not available", "storekit/product-missing")
                    return
                }

                var options: Set<Product.PurchaseOption> = []
                if let uuid = UUID(uuidString: appAccountTokenString) {
                    options.insert(.appAccountToken(uuid))
                }

                let result = try await product.purchase(options: options)
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        call.resolve([
                            "signedTransaction": verification.jwsRepresentation,
                            "transactionId": String(transaction.id),
                        ])
                    case .unverified:
                        call.reject("Purchase could not be verified", "storekit/unverified")
                    }
                case .userCancelled:
                    call.reject("Purchase cancelled", "storekit/user-cancelled")
                case .pending:
                    call.reject("Purchase is pending approval", "storekit/pending")
                @unknown default:
                    call.reject("Unknown purchase result", "storekit/unknown-result")
                }
            } catch {
                call.reject("Purchase failed", "storekit/purchase-failed", error)
            }
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let transactionIdString = call.getString("transactionId"),
              UInt64(transactionIdString) != nil else {
            call.reject("Invalid transaction id", "storekit/invalid-transaction-id")
            return
        }
        Task {
            var finished = false
            for await result in Transaction.unfinished {
                if case .verified(let transaction) = result,
                   String(transaction.id) == transactionIdString {
                    await transaction.finish()
                    finished = true
                    break
                }
            }
            // Not found among unfinished transactions: already finished or no
            // longer tracked. Resolve anyway so the web layer does not retry.
            _ = finished
            call.resolve()
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                if let signedTransaction = await Self.latestEntitlementJws() {
                    call.resolve(["signedTransaction": signedTransaction])
                } else {
                    call.reject("No previous purchase found", "storekit/no-entitlement")
                }
            } catch {
                call.reject("Restore failed", "storekit/restore-failed", error)
            }
        }
    }

    private static func latestEntitlementJws() async -> String? {
        var latest: (date: Date, jws: String)?
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result,
                  productIds.contains(transaction.productID) else {
                continue
            }
            if latest == nil || transaction.purchaseDate > latest!.date {
                latest = (transaction.purchaseDate, result.jwsRepresentation)
            }
        }
        return latest?.jws
    }
}
