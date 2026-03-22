import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, WKHTTPCookieStoreObserver {

    var window: UIWindow?
    private weak var observedCookieStore: WKHTTPCookieStore?
    private let themeCookieKeys = ["vitaview-theme", "theme", "vite-ui-theme"]

    private var shouldSyncWindowAppearance: Bool {
        if #available(iOS 14.0, *), ProcessInfo.processInfo.isiOSAppOnMac {
            return false
        }

        return true
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        guard shouldSyncWindowAppearance else {
            return true
        }

        DispatchQueue.main.async { [weak self] in
            self?.ensureThemeObservation()
            self?.applyWindowAppearance(theme: .light)
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        guard shouldSyncWindowAppearance else {
            return
        }

        ensureThemeObservation()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func cookiesDidChange(in cookieStore: WKHTTPCookieStore) {
        guard shouldSyncWindowAppearance else {
            return
        }

        synchronizeWindowAppearance(using: cookieStore)
    }

    private func ensureThemeObservation(attempt: Int = 0) {
        guard shouldSyncWindowAppearance else {
            return
        }

        guard let webView = findPrimaryWebView() else {
            if attempt < 12 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                    self?.ensureThemeObservation(attempt: attempt + 1)
                }
            } else {
                synchronizeWindowAppearance()
            }
            return
        }

        let cookieStore = webView.configuration.websiteDataStore.httpCookieStore
        if observedCookieStore !== cookieStore {
            observedCookieStore?.remove(self)
            cookieStore.add(self)
            observedCookieStore = cookieStore
        }

        synchronizeWindowAppearance(using: cookieStore)
    }

    private func synchronizeWindowAppearance(using cookieStore: WKHTTPCookieStore? = nil) {
        guard shouldSyncWindowAppearance else {
            return
        }

        guard let targetCookieStore = cookieStore ?? observedCookieStore else {
            applyWindowAppearance(theme: .light)
            return
        }

        targetCookieStore.getAllCookies { [weak self] cookies in
            let theme = self?.resolveTheme(from: cookies) ?? .light
            DispatchQueue.main.async {
                self?.applyWindowAppearance(theme: theme)
            }
        }
    }

    private func resolveTheme(from cookies: [HTTPCookie]) -> UIUserInterfaceStyle {
        for key in themeCookieKeys {
            if let value = cookies.first(where: { $0.name == key })?.value {
                if value == "dark" {
                    return .dark
                }

                if value == "light" {
                    return .light
                }
            }
        }

        return .light
    }

    private func applyWindowAppearance(theme: UIUserInterfaceStyle) {
        guard shouldSyncWindowAppearance else {
            return
        }

        let backgroundColor = themeBackgroundColor(for: theme)

        activeWindows().forEach { window in
            window.overrideUserInterfaceStyle = theme
            window.backgroundColor = backgroundColor
            window.rootViewController?.view.backgroundColor = backgroundColor
            configureMacTitlebar(for: window)
        }
    }

    private func themeBackgroundColor(for theme: UIUserInterfaceStyle) -> UIColor {
        switch theme {
        case .dark:
            return UIColor(red: 15.0 / 255.0, green: 17.0 / 255.0, blue: 21.0 / 255.0, alpha: 1.0)
        default:
            return UIColor(red: 244.0 / 255.0, green: 244.0 / 255.0, blue: 244.0 / 255.0, alpha: 1.0)
        }
    }

    private func activeWindows() -> [UIWindow] {
        let sceneWindows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }

        if !sceneWindows.isEmpty {
            return sceneWindows
        }

        if let window {
            return [window]
        }

        return []
    }

    private func findPrimaryWebView() -> WKWebView? {
        for window in activeWindows() {
            if let webView = findWebView(in: window.rootViewController?.view) {
                return webView
            }
        }

        return nil
    }

    private func findWebView(in view: UIView?) -> WKWebView? {
        guard let view else {
            return nil
        }

        if let webView = view as? WKWebView {
            return webView
        }

        for subview in view.subviews {
            if let webView = findWebView(in: subview) {
                return webView
            }
        }

        return nil
    }

    private func configureMacTitlebar(for window: UIWindow) {
        #if targetEnvironment(macCatalyst)
        if let titlebar = window.windowScene?.titlebar {
            if #available(iOS 15.0, *) {
                titlebar.toolbarStyle = .unifiedCompact
            }
        }
        #endif
    }
}
