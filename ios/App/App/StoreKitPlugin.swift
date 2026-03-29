import Foundation
import Capacitor
import StoreKit
import UIKit
import SwiftUI

@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncCurrentEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentManageSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentPaywall", returnType: CAPPluginReturnPromise)
    ]

    private let manager = SubscriptionManager.shared
    private weak var paywallController: UIViewController?

    public override func load() {
        super.load()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let productIds = call.getArray("productIds", String.self) ?? []

        Task {
            do {
                try await manager.loadProducts()
                let products = productIds.compactMap { productId in
                    manager.productsById[productId]
                }
                let orderedProducts = productIds.compactMap { requestedId in
                    products.first(where: { $0.id == requestedId })
                }

                call.resolve([
                    "products": orderedProducts.map(serializeProduct)
                ])
            } catch {
                call.reject("Não foi possível carregar os produtos da App Store: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("productId é obrigatório")
            return
        }

        let appAccountToken = call.getString("appAccountToken")

        Task {
            do {
                let outcome = try await manager.purchase(
                    productId: productId,
                    appAccountToken: appAccountToken.flatMap(UUID.init(uuidString:))
                )

                switch outcome {
                case .purchased(let transaction):
                    call.resolve([
                        "status": "purchased",
                        "transaction": serializeTransaction(transaction)
                    ])
                case .pending:
                    call.resolve(["status": "pending"])
                case .cancelled:
                    call.resolve(["status": "cancelled"])
                }
            } catch {
                call.reject("Não foi possível concluir a compra: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                let transactions = try await manager.restorePurchases()
                call.resolve([
                    "transactions": transactions.map(serializeTransaction)
                ])
            } catch {
                call.reject("Não foi possível restaurar as compras: \(error.localizedDescription)")
            }
        }
    }

    @objc func syncCurrentEntitlements(_ call: CAPPluginCall) {
        Task {
            do {
                try await manager.refreshSubscriptionStatus()
                call.resolve([
                    "transactions": manager.activeTransactions.map(serializeTransaction)
                ])
            } catch {
                call.reject("Não foi possível sincronizar as compras ativas: \(error.localizedDescription)")
            }
        }
    }

    @objc func presentManageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let url = URL(string: "https://apps.apple.com/account/subscriptions") else {
                call.reject("Não foi possível abrir a tela de assinaturas")
                return
            }

            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Não foi possível abrir a tela de assinaturas")
                }
            }
        }
    }

    @objc func presentPaywall(_ call: CAPPluginCall) {
        let appAccountToken = call.getString("appAccountToken").flatMap(UUID.init(uuidString:))

        Task { @MainActor in
            let view = SubscriptionPaywallView(
                manager: manager,
                appAccountToken: appAccountToken,
                onCompleted: { [weak self] transaction in
                    if let transaction {
                        self?.notifyListeners("transactionUpdate", data: [
                            "transaction": self?.serializeTransaction(transaction) ?? [:]
                        ])
                    }
                    self?.paywallController?.dismiss(animated: true)
                },
                onClose: { [weak self] in
                    self?.paywallController?.dismiss(animated: true)
                }
            )

            let hostingController = UIHostingController(rootView: view)
            paywallController = hostingController
            hostingController.modalPresentationStyle = .formSheet

            guard let viewController = bridge?.viewController else {
                call.reject("Não foi possível abrir o paywall nativo")
                return
            }

            viewController.present(hostingController, animated: true) {
                call.resolve()
            }
        }
    }

    private func serializeProduct(_ product: Product) -> JSObject {
        var object: JSObject = [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice,
            "type": serializeProductType(product.type)
        ]

        if let subscription = product.subscription {
            object["subscriptionPeriodUnit"] = serializeSubscriptionUnit(subscription.subscriptionPeriod.unit)
            object["subscriptionPeriodValue"] = subscription.subscriptionPeriod.value
        }

        return object
    }

    private func serializeTransaction(_ transaction: Transaction) -> JSObject {
        var object: JSObject = [
            "productId": transaction.productID,
            "transactionId": String(transaction.id),
            "originalTransactionId": String(transaction.originalID),
            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
            "signedTransactionInfo": transaction.jwsRepresentation
        ]

        if let expirationDate = transaction.expirationDate {
            object["expirationDate"] = ISO8601DateFormatter().string(from: expirationDate)
        }

        if let revocationDate = transaction.revocationDate {
            object["revocationDate"] = ISO8601DateFormatter().string(from: revocationDate)
        }

        return object
    }

    private func serializeProductType(_ type: Product.ProductType) -> String {
        switch type {
        case .consumable:
            return "consumable"
        case .nonConsumable:
            return "nonConsumable"
        case .nonRenewable:
            return "nonRenewable"
        case .autoRenewable:
            return "autoRenewable"
        default:
            return "unknown"
        }
    }

    private func serializeSubscriptionUnit(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day:
            return "day"
        case .week:
            return "week"
        case .month:
            return "month"
        case .year:
            return "year"
        @unknown default:
            return "unknown"
        }
    }
}
