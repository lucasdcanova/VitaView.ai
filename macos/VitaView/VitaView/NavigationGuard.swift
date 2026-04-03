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

    init(loadError: Binding<WebLoadError?>, startURL: URL) {
        self._loadError = loadError
        self.startURL = startURL
    }

    private func isAllowed(_ url: URL) -> Bool {
        guard let scheme = url.scheme, let host = url.host else { return false }
        let origin = "\(scheme)://\(host)" + (url.port.map { ":\($0)" } ?? "")
        return Self.allowedOrigins.contains(origin)
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        if isAllowed(url) {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            NSWorkspace.shared.open(url)
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
