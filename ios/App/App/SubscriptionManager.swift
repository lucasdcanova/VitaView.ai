import Foundation
import Combine
import StoreKit

enum VitaPlanTier: String, CaseIterable {
    case pro
    case team
    case business
    case hospitais

    var displayName: String {
        switch self {
        case .pro:
            return "Vita Pro"
        case .team:
            return "Vita Team"
        case .business:
            return "Vita Business"
        case .hospitais:
            return "Hospitais"
        }
    }
}

enum VitaBillingCycle: String, CaseIterable {
    case monthly
    case semiannual
    case annual

    var displayName: String {
        switch self {
        case .monthly:
            return "Mensal"
        case .semiannual:
            return "Semestral"
        case .annual:
            return "Anual"
        }
    }
}

enum VitaPlanAccessLevel: Int {
    case none = 0
    case pro = 1
    case team = 2
    case business = 3
    case hospitais = 4
}

enum VitaPurchaseOutcome {
    case purchased(Transaction)
    case pending
    case cancelled
}

@MainActor
final class SubscriptionManager: ObservableObject {
    static let shared = SubscriptionManager()

    private static let productMap: [VitaPlanTier: [VitaBillingCycle: String]] = [
        .pro: [
            .monthly: "br.com.lucascanova.vitaview.vita_pro.monthly",
            .semiannual: "br.com.lucascanova.vitaview.vita_pro.semiannual",
            .annual: "br.com.lucascanova.vitaview.vita_pro.annual",
        ],
        .team: [
            .monthly: "br.com.lucascanova.vitaview.vita_team.monthly",
            .semiannual: "br.com.lucascanova.vitaview.vita_team.semiannual",
            .annual: "br.com.lucascanova.vitaview.vita_team.annual",
        ],
        .business: [
            .monthly: "br.com.lucascanova.vitaview.vita_business.monthly",
            .semiannual: "br.com.lucascanova.vitaview.vita_business.semiannual",
            .annual: "br.com.lucascanova.vitaview.vita_business.annual",
        ],
        .hospitais: [
            .monthly: "br.com.lucascanova.vitaview.hospitais.monthly",
        ],
    ]

    @Published private(set) var productsById: [String: Product] = [:]
    @Published private(set) var activeTransactions: [Transaction] = []
    @Published private(set) var activePlanTier: VitaPlanTier?
    @Published private(set) var accessLevel: VitaPlanAccessLevel = .none
    @Published private(set) var isLoadingProducts = false
    @Published private(set) var isProcessingPurchase = false
    @Published private(set) var lastErrorMessage: String?

    private var updatesTask: Task<Void, Never>?

    private init() {
        updatesTask = observeTransactionUpdates()
    }

    deinit {
        updatesTask?.cancel()
    }

    var allProductIds: [String] {
        Self.productMap
            .values
            .flatMap { $0.values }
            .sorted()
    }

    func product(for tier: VitaPlanTier, cycle: VitaBillingCycle) -> Product? {
        guard let productId = Self.productMap[tier]?[cycle] else {
            return nil
        }

        return productsById[productId]
    }

    func loadProducts() async throws {
        isLoadingProducts = true
        defer { isLoadingProducts = false }

        do {
            let products = try await Product.products(for: allProductIds)
            productsById = Dictionary(uniqueKeysWithValues: products.map { ($0.id, $0) })
            lastErrorMessage = nil
        } catch {
            lastErrorMessage = error.localizedDescription
            throw error
        }
    }

    func purchase(productId: String, appAccountToken: UUID? = nil) async throws -> VitaPurchaseOutcome {
        guard let product = productsById[productId] ?? (try await Product.products(for: [productId]).first) else {
            throw NSError(domain: "SubscriptionManager", code: 404, userInfo: [
                NSLocalizedDescriptionKey: "Produto não encontrado na App Store."
            ])
        }

        isProcessingPurchase = true
        defer { isProcessingPurchase = false }

        let result: Product.PurchaseResult
        if let appAccountToken {
            result = try await product.purchase(options: [.appAccountToken(appAccountToken)])
        } else {
            result = try await product.purchase()
        }

        switch result {
        case .success(let verification):
            let transaction = try requireVerified(verification)
            await transaction.finish()
            try await refreshSubscriptionStatus()
            return .purchased(transaction)
        case .pending:
            return .pending
        case .userCancelled:
            return .cancelled
        @unknown default:
            return .cancelled
        }
    }

    func restorePurchases() async throws -> [Transaction] {
        try await AppStore.sync()
        try await refreshSubscriptionStatus()
        return activeTransactions
    }

    func refreshSubscriptionStatus() async throws {
        var currentTransactions: [Transaction] = []

        for await entitlement in Transaction.currentEntitlements {
            let transaction = try requireVerified(entitlement)
            currentTransactions.append(transaction)
        }

        activeTransactions = currentTransactions
        activePlanTier = highestTier(from: currentTransactions)
        accessLevel = accessLevel(for: activePlanTier)
        lastErrorMessage = nil
    }

    func hasAccess(to requiredTier: VitaPlanTier) -> Bool {
        guard let activePlanTier else {
            return false
        }

        return accessLevel(for: activePlanTier).rawValue >= accessLevel(for: requiredTier).rawValue
    }

    func groupedProducts(for cycle: VitaBillingCycle) -> [(tier: VitaPlanTier, product: Product)] {
        VitaPlanTier.allCases.compactMap { tier in
            guard let product = product(for: tier, cycle: cycle) else {
                return nil
            }

            return (tier, product)
        }
    }

    private func observeTransactionUpdates() -> Task<Void, Never> {
        Task { [weak self] in
            guard let self else { return }

            for await update in Transaction.updates {
                do {
                    let transaction = try self.requireVerified(update)
                    await transaction.finish()
                    try await self.refreshSubscriptionStatus()
                } catch {
                    self.lastErrorMessage = error.localizedDescription
                }
            }
        }
    }

    private func highestTier(from transactions: [Transaction]) -> VitaPlanTier? {
        let matchedTiers = transactions.compactMap { transaction in
            Self.tier(for: transaction.productID)
        }

        return matchedTiers.max { lhs, rhs in
            accessLevel(for: lhs).rawValue < accessLevel(for: rhs).rawValue
        }
    }

    private func accessLevel(for tier: VitaPlanTier?) -> VitaPlanAccessLevel {
        switch tier {
        case .pro:
            return .pro
        case .team:
            return .team
        case .business:
            return .business
        case .hospitais:
            return .hospitais
        case nil:
            return .none
        }
    }

    private func requireVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified(_, let error):
            throw error
        }
    }

    static func tier(for productId: String) -> VitaPlanTier? {
        if productId.contains("vita_pro") {
            return .pro
        }

        if productId.contains("vita_team") {
            return .team
        }

        if productId.contains("vita_business") {
            return .business
        }

        if productId.contains("hospitais") {
            return .hospitais
        }

        return nil
    }
}
