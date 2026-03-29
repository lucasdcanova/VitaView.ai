import SwiftUI
import StoreKit

@MainActor
struct SubscriptionPaywallView: View {
    @ObservedObject var manager: SubscriptionManager
    let appAccountToken: UUID?
    let onCompleted: ((VerificationResult<StoreKit.Transaction>?) -> Void)?
    let onClose: (() -> Void)?

    @State private var selectedCycle: VitaBillingCycle = .monthly
    @State private var viewError: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                VStack(spacing: 8) {
                    Text("VitaView")
                        .font(.system(size: 28, weight: .bold))
                    Text("Escolha seu plano para desbloquear os recursos premium.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 12)

                Picker("Ciclo", selection: $selectedCycle) {
                    ForEach(VitaBillingCycle.allCases, id: \.self) { cycle in
                        Text(cycle.displayName).tag(cycle)
                    }
                }
                .pickerStyle(.segmented)

                if manager.isLoadingProducts {
                    ProgressView("Carregando produtos...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(manager.groupedProducts(for: selectedCycle), id: \.product.id) { item in
                                productCard(tier: item.tier, product: item.product)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                VStack(spacing: 12) {
                    Button("Restaurar compras") {
                        Task {
                            do {
                                _ = try await manager.restorePurchases()
                                onCompleted?(nil)
                            } catch {
                                viewError = error.localizedDescription
                            }
                        }
                    }
                    .buttonStyle(.bordered)

                    if let viewError {
                        Text(viewError)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.bottom, 8)
            }
            .padding()
            .navigationTitle("Assinaturas")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Fechar") {
                        onClose?()
                    }
                }
            }
            .task {
                do {
                    if manager.productsById.isEmpty {
                        try await manager.loadProducts()
                    }
                    try await manager.refreshSubscriptionStatus()
                } catch {
                    viewError = error.localizedDescription
                }
            }
        }
    }

    @ViewBuilder
    private func productCard(tier: VitaPlanTier, product: Product) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(tier.displayName)
                        .font(.headline)
                    Text(product.description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(product.displayPrice)
                    .font(.title3.weight(.semibold))
            }

            Button {
                Task {
                    do {
                        let outcome = try await manager.purchase(
                            productId: product.id,
                            appAccountToken: appAccountToken
                        )
                        switch outcome {
                        case .purchased(let transaction):
                            onCompleted?(transaction)
                        case .pending, .cancelled:
                            onCompleted?(nil)
                        }
                    } catch {
                        viewError = error.localizedDescription
                    }
                }
            } label: {
                if manager.isProcessingPurchase {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Assinar")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(manager.isProcessingPurchase)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
