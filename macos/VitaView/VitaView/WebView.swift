import SwiftUI
import WebKit

struct WebLoadError {
    let description: String
    let failedURL: String
}

struct WebView: NSViewRepresentable {
    @Binding var loadError: WebLoadError?

    static var startURL: URL {
        #if DEBUG
        if let override = ProcessInfo.processInfo.environment["VITAVIEW_DESKTOP_START_URL"],
           let url = URL(string: override) {
            return url
        }
        return URL(string: "http://localhost:3000/auth")!
        #else
        return URL(string: "https://vitaview.ai/auth")!
        #endif
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []

        let script = WKUserScript(
            source: """
            window.vitaViewDesktop = {
                isDesktop: true,
                platform: "darwin",
                nativeApp: "swift"
            };
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(script)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: Self.startURL))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        if loadError == nil && webView.url == nil {
            webView.load(URLRequest(url: Self.startURL))
        }
    }

    func makeCoordinator() -> NavigationGuard {
        NavigationGuard(loadError: $loadError, startURL: Self.startURL)
    }
}
