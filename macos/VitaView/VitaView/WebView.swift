import SwiftUI
import WebKit

struct WebLoadError {
    let description: String
    let failedURL: String
}

struct WebView: NSViewRepresentable {
    @Binding var loadError: WebLoadError?

    /// Shared process pool so cookies and sessions persist across WKWebView recreations
    private static let processPool = WKProcessPool()

    static var startURL: URL {
        if let override = ProcessInfo.processInfo.environment["VITAVIEW_DESKTOP_START_URL"],
           let url = URL(string: override) {
            return url
        }
        return URL(string: "https://vitaview.ai/auth")!
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.processPool = Self.processPool
        config.websiteDataStore = .default()
        config.mediaTypesRequiringUserActionForPlayback = []

        let bridgeScript = WKUserScript(
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
        config.userContentController.addUserScript(bridgeScript)

        let cssScript = WKUserScript(
            source: """
            (function() {
                var style = document.createElement('style');
                style.textContent = `
                    button[aria-label="Voltar para a landing page"] { display: none !important; }
                `;
                document.head.appendChild(style);
            })();
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(cssScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.underPageBackgroundColor = .clear
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
