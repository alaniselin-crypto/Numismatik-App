import Capacitor
import CryptoKit
import UIKit
import WebKit

/**
 * Google sign-in for the iPhone uses the same desktop client as the Mac app.
 * That client needs a secret, and the secret stays on Render. This view only
 * collects the authorization code, then Render exchanges it.
 */
@objc(GoogleDesktopSignInPlugin)
public class GoogleDesktopSignIn: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GoogleDesktopSignInPlugin"
    public let jsName = "GoogleDesktopSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
    ]

    private var activeController: GoogleDesktopSignInController?

    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController else {
                call.reject("Das Anmeldefenster konnte nicht geöffnet werden.")
                return
            }
            let controller = GoogleDesktopSignInController()
            controller.onFinish = { [weak self] result in
                self?.activeController = nil
                switch result {
                case .success(let tokens):
                    var payload: [String: Any] = ["idToken": tokens.idToken]
                    if let accessToken = tokens.accessToken {
                        payload["accessToken"] = accessToken
                    }
                    call.resolve(payload)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
            self.activeController = controller
            controller.modalPresentationStyle = .fullScreen
            presenter.present(controller, animated: true)
        }
    }
}

private struct GoogleDesktopTokens {
    let idToken: String
    let accessToken: String?
}

private final class GoogleDesktopSignInController: UIViewController, WKNavigationDelegate {
    var onFinish: ((Result<GoogleDesktopTokens, Error>) -> Void)?

    private let clientId = "211237775065-c5l25t57c5oe9bl02gkl2p93qq0mchok.apps.googleusercontent.com"
    private let exchangeURL = URL(string: "https://inumis-node-backend.onrender.com/api/oauth/google/desktop/token")!
    private let redirectUri = "http://127.0.0.1:53127/oauth2/callback"
    private let state = GoogleDesktopSignInController.randomToken(count: 32)
    private let codeVerifier = GoogleDesktopSignInController.randomToken(count: 64)
    private var finished = false
    private var webView: WKWebView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.07, green: 0.06, blue: 0.05, alpha: 1)

        let close = UIButton(type: .system)
        close.setTitle("Abbrechen", for: .normal)
        close.setTitleColor(UIColor(red: 0.98, green: 0.75, blue: 0.25, alpha: 1), for: .normal)
        close.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        close.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        close.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(close)

        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1"
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        self.webView = webView

        NSLayoutConstraint.activate([
            close.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            close.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            webView.topAnchor.constraint(equalTo: close.bottomAnchor, constant: 8),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirectUri),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "code_challenge", value: Self.codeChallenge(for: codeVerifier)),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "prompt", value: "select_account"),
        ]
        if let url = components.url {
            webView.load(URLRequest(url: url))
        }
    }

    @objc private func cancelTapped() {
        finish(.failure(GoogleDesktopSignInError("Die Google-Anmeldung wurde abgebrochen.")))
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url, isCallback(url) else {
            decisionHandler(.allow)
            return
        }
        decisionHandler(.cancel)
        handleCallback(url)
    }

    private func isCallback(_ url: URL) -> Bool {
        url.host == "127.0.0.1" && url.path == "/oauth2/callback"
    }

    private func handleCallback(_ url: URL) {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let receivedState = components?.queryItems?.first { $0.name == "state" }?.value
        guard receivedState == state else {
            finish(.failure(GoogleDesktopSignInError("Die Google-Anmeldung konnte nicht geprüft werden.")))
            return
        }
        if let error = components?.queryItems?.first(where: { $0.name == "error" })?.value {
            finish(.failure(GoogleDesktopSignInError("Google-Anmeldung fehlgeschlagen: \(error)")))
            return
        }
        guard let code = components?.queryItems?.first(where: { $0.name == "code" })?.value, !code.isEmpty else {
            finish(.failure(GoogleDesktopSignInError("Google hat keinen Anmeldecode geliefert.")))
            return
        }
        exchange(code: code)
    }

    private func exchange(code: String) {
        var request = URLRequest(url: exchangeURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 90
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "code": code,
            "codeVerifier": codeVerifier,
            "redirectUri": redirectUri,
        ])

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error {
                self?.finish(.failure(error))
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let payload = (try? JSONSerialization.jsonObject(with: data ?? Data())) as? [String: Any]
            guard status == 200, let idToken = payload?["idToken"] as? String else {
                let serverError = payload?["error"] as? String ?? "oauth/token-exchange-failed"
                self?.finish(.failure(GoogleDesktopSignInError("Google-Anmeldung fehlgeschlagen: \(serverError)")))
                return
            }
            let accessToken = payload?["accessToken"] as? String
            self?.finish(.success(GoogleDesktopTokens(idToken: idToken, accessToken: accessToken)))
        }.resume()
    }

    private func finish(_ result: Result<GoogleDesktopTokens, Error>) {
        DispatchQueue.main.async {
            guard !self.finished else { return }
            self.finished = true
            let callback = self.onFinish
            self.dismiss(animated: true) {
                callback?(result)
            }
        }
    }

    private static func randomToken(count: Int) -> String {
        let bytes = (0..<count).map { _ in UInt8.random(in: 0...255) }
        return Data(bytes).base64URLEncodedString()
    }

    private static func codeChallenge(for verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return Data(digest).base64URLEncodedString()
    }
}

private struct GoogleDesktopSignInError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

private extension Data {
    func base64URLEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
