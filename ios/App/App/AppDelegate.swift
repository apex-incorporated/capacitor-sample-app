import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    /// One-shot flag — applicationDidBecomeActive can fire repeatedly
    /// (every foreground transition), but we only need to disable
    /// WebView gesture recognizers once after the bridge is set up.
    private var didDisableWebViewGestures = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
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
        // Disable WKWebView's built-in gesture recognizers that we
        // don't use but that compete with page tap handlers and cause
        // the iOS-17+ "Gesture: System gesture gate timed out" bug
        // (Apple Developer Forums thread #730213). Symptom: tab taps
        // intermittently dropped, requiring 2-10 retries to register.
        //
        // The competing recognizers are:
        //   - The outer UIScrollView's pan gesture (scroll). We never
        //     scroll at the WebView level (body has overflow: hidden,
        //     scroll happens inside <main>). `scrollEnabled: false`
        //     in capacitor.config disables the SCROLLING but the
        //     gesture recognizer remains attached and competing — we
        //     have to disable the recognizer itself.
        //   - The back-forward navigation swipe (we use React Router).
        //
        // Done from applicationDidBecomeActive (one-shot via flag) so
        // the bridge view controller has finished `viewDidLoad`. Doing
        // it earlier (e.g. didFinishLaunchingWithOptions) hits the
        // bridge before the WebView is constructed.
        if !didDisableWebViewGestures {
            disableCompetingWebViewGestures()
        }
    }

    private func disableCompetingWebViewGestures() {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeVC.bridge?.webView else { return }
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.isScrollEnabled = false
        for recognizer in webView.scrollView.gestureRecognizers ?? [] {
            recognizer.isEnabled = false
        }

        // Make the WebView itself the first responder. This is the
        // Capacitor 7 fix from PR #7753 ("Make Bridge webView first
        // responder"), backported here because we're on Capacitor 6.
        // Without this, touch events have to traverse the responder
        // chain (CAPBridgeViewController is the first responder, NOT
        // the webView), and on iOS 17+ that chain traversal during
        // heavy paint/layout work is exactly when iOS drops touches
        // to the page. Calling becomeFirstResponder on the webView
        // means iOS delivers touches to it directly, no chain hop.
        webView.becomeFirstResponder()

        didDisableWebViewGestures = true
        NSLog("[ApexOutfitters] Disabled WKWebView competing gesture recognizers + made webView first responder")
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

    // MARK: - Push notifications bridge for @apex-inc/capacitor-plugin

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken token: Data) {
        NotificationCenter.default.post(
            name: Notification.Name("ApexCapacitor.didRegisterForRemoteNotifications"),
            object: nil,
            userInfo: ["deviceToken": token]
        )
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: Notification.Name("ApexCapacitor.didFailToRegisterForRemoteNotifications"),
            object: nil,
            userInfo: ["error": error]
        )
    }

    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        NotificationCenter.default.post(
            name: Notification.Name("ApexCapacitor.didReceiveRemoteNotification"),
            object: nil,
            userInfo: userInfo
        )
        completionHandler(.noData)
    }
}
