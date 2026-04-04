import SwiftUI
import WebKit

final class NavigationGuard: NSObject, WKNavigationDelegate, WKUIDelegate {
    @Binding var loadError: WebLoadError?
    let startURL: URL

    private static let allowedOrigins: Set<String> = {
        var origins: Set<String> = [
            "https://vitaview.ai",
            "https://www.vitaview.ai",
        ]
        #if DEBUG
        origins.insert("http://localhost:3000")
        origins.insert("http://127.0.0.1:3000")
        #endif
        return origins
    }()

    /// Domains that load as embedded iframes/scripts (Stripe, analytics, etc.)
    private static let embeddedDomains: Set<String> = [
        "js.stripe.com",
        "m.stripe.com",
        "m.stripe.network",
        "api.stripe.com",
        "hooks.stripe.com",
        "accounts.google.com",
        "apis.google.com",
    ]

    init(loadError: Binding<WebLoadError?>, startURL: URL) {
        self._loadError = loadError
        self.startURL = startURL
    }

    private func isAllowed(_ url: URL) -> Bool {
        guard let scheme = url.scheme, let host = url.host else { return false }
        let origin = "\(scheme)://\(host)" + (url.port.map { ":\($0)" } ?? "")
        return Self.allowedOrigins.contains(origin)
    }

    private func isEmbedded(_ url: URL) -> Bool {
        guard let host = url.host else { return false }
        return Self.embeddedDomains.contains(host)
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        // Allow app origins and embedded third-party iframes/scripts
        if isAllowed(url) || isEmbedded(url) {
            decisionHandler(.allow)
        } else if navigationAction.targetFrame != nil && navigationAction.targetFrame!.isMainFrame {
            // Only open in browser if it's a main-frame navigation to an unknown domain
            decisionHandler(.cancel)
            NSWorkspace.shared.open(url)
        } else {
            // Sub-frame navigations to unknown domains: allow silently (iframes, scripts)
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView,
                 didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        handleLoadError(error, webView: webView)
    }

    func webView(_ webView: WKWebView,
                 didFail navigation: WKNavigation!,
                 withError error: Error) {
        handleLoadError(error, webView: webView)
    }

    private func handleLoadError(_ error: Error, webView: WKWebView) {
        let nsError = error as NSError
        if nsError.code == NSURLErrorCancelled { return }

        DispatchQueue.main.async {
            self.loadError = WebLoadError(
                description: nsError.localizedDescription,
                failedURL: webView.url?.absoluteString ?? self.startURL.absoluteString
            )
        }
    }

    // MARK: - WKUIDelegate

    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            if isAllowed(url) {
                webView.load(navigationAction.request)
            } else if isEmbedded(url) {
                // Embedded third-party frames — silently ignore new window
            } else {
                NSWorkspace.shared.open(url)
            }
        }
        return nil
    }

    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        let originString = "\(origin.protocol)://\(origin.host)" +
            (origin.port != 0 ? ":\(origin.port)" : "")
        if Self.allowedOrigins.contains(originString) {
            decisionHandler(.grant)
        } else {
            decisionHandler(.deny)
        }
    }
}
