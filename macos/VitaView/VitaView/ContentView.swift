import SwiftUI

struct ContentView: View {
    @State private var loadError: WebLoadError?

    var body: some View {
        ZStack {
            WebView(loadError: $loadError)
                .opacity(loadError == nil ? 1 : 0)

            if let error = loadError {
                FallbackView(error: error) {
                    loadError = nil
                }
            }
        }
    }
}
