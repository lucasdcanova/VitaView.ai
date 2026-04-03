import SwiftUI

struct FallbackView: View {
    let error: WebLoadError
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            VStack(spacing: 12) {
                Text("VitaView indisponivel")
                    .font(.system(size: 28, weight: .bold))

                Text("O app abriu, mas nao conseguiu carregar a pagina inicial.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                Text("Verifique sua conexao e tente novamente.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                Text("Erro: \(error.description)")
                    .font(.callout)
                    .foregroundStyle(.secondary)

                Text(error.failedURL)
                    .font(.system(.callout, design: .monospaced))
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Button("Tentar novamente") {
                    onRetry()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.top, 8)
            }
            .padding(32)
            .frame(width: 560)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .shadow(color: .black.opacity(0.14), radius: 40, y: 12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            LinearGradient(
                colors: [Color(red: 0.96, green: 0.98, blue: 1.0), .white],
                startPoint: .top, endPoint: .bottom
            )
        )
    }
}
