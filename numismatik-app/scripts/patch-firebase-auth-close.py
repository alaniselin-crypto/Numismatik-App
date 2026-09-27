#!/usr/bin/env python3
"""Stop Firebase Auth from notifying a torn-down iOS bridge when the app closes."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "node_modules/@capacitor-firebase/authentication/ios/Plugin"
AUTH = PLUGIN / "FirebaseAuthentication.swift"
BRIDGE = PLUGIN / "FirebaseAuthenticationPlugin.swift"

AUTH_OLD = """    private var phoneAuthProviderHandler: PhoneAuthProviderHandler?
    private var savedCall: CAPPluginCall?

    init(plugin: FirebaseAuthenticationPlugin, config: FirebaseAuthenticationConfig) {
        self.plugin = plugin
        self.config = config
        super.init()
        if FirebaseApp.app() == nil {
            guard FirebaseOptions.defaultOptions() != nil else {
                CAPLog.print("[FirebaseAuthentication] Firebase was not configured: GoogleService-Info.plist is missing from the app bundle.")
                return
            }
            FirebaseApp.configure()
        }
        self.initAuthProviderHandlers(config: config)
        Auth.auth().addStateDidChangeListener {_, _ in
            self.plugin.handleAuthStateChange()
        }
        _ = Auth.auth().addIDTokenDidChangeListener {_, _ in
            self.plugin.handleIdTokenChange()
        }
        if let authDomain = config.authDomain {
            Auth.auth().customAuthDomain = authDomain
        }
"""

AUTH_NEW = """    private var phoneAuthProviderHandler: PhoneAuthProviderHandler?
    private var savedCall: CAPPluginCall?
    private var authStateListenerHandle: AuthStateDidChangeListenerHandle?
    private var idTokenListenerHandle: AuthStateDidChangeListenerHandle?

    init(plugin: FirebaseAuthenticationPlugin, config: FirebaseAuthenticationConfig) {
        self.plugin = plugin
        self.config = config
        super.init()
        if FirebaseApp.app() == nil, FirebaseOptions.defaultOptions() != nil {
            FirebaseApp.configure()
        }
        self.initAuthProviderHandlers(config: config)
        if FirebaseApp.app() != nil {
            authStateListenerHandle = Auth.auth().addStateDidChangeListener { [weak self] _, _ in
                self?.plugin.handleAuthStateChange()
            }
            idTokenListenerHandle = Auth.auth().addIDTokenDidChangeListener { [weak self] _, _ in
                self?.plugin.handleIdTokenChange()
            }
            if let authDomain = config.authDomain {
                Auth.auth().customAuthDomain = authDomain
            }
        }
"""

EARLY_RETURN = """        if FirebaseApp.app() == nil {
            guard FirebaseOptions.defaultOptions() != nil else {
                CAPLog.print("[FirebaseAuthentication] Firebase was not configured: GoogleService-Info.plist is missing from the app bundle.")
                return
            }
            FirebaseApp.configure()
        }
"""

EARLY_RETURN_FIXED = """        if FirebaseApp.app() == nil, FirebaseOptions.defaultOptions() != nil {
            FirebaseApp.configure()
        }
"""

CONFIG_OLD = """public struct FirebaseAuthenticationConfig {
    var skipNativeAuth = false
    var providers = [String]()
    var authDomain: String?
}
"""

CONFIG_NEW = """public struct FirebaseAuthenticationConfig {
    var skipNativeAuth = false
    var providers = [String]()
    var authDomain: String?
    var googleClientId: String?
}
"""

PROVIDERS_OLD = """        if let providers = getConfig().getArray("providers") as? [String] {
            config.providers = providers
        }
"""

PROVIDERS_NEW = """        if let providers = getConfig().getArray("providers") {
            config.providers = providers.compactMap { $0 as? String }
        }
        config.authDomain = getConfig().getString("authDomain")
        config.googleClientId = getConfig().getString("googleClientId")
"""

GOOGLE_OLD = """        guard let clientId = FirebaseApp.app()?.options.clientID else { return }
        let config = GIDConfiguration(clientID: clientId, serverClientID: clientId)
"""

GOOGLE_DESKTOP_CLIENT = """        let clientId = FirebaseApp.app()?.options.clientID ?? self.pluginImplementation.getConfig().googleClientId
        guard let clientId else {
            let message = "Google-Anmeldung ist auf diesem iPhone nicht eingerichtet."
            if isLink == true {
                pluginImplementation.handleFailedLink(message: message, error: nil)
            } else {
                pluginImplementation.handleFailedSignIn(message: message, error: nil)
            }
            return
        }
        let config = GIDConfiguration(clientID: clientId, serverClientID: clientId)
"""

GOOGLE_NEW = """        let clientId = FirebaseApp.app()?.options.clientID ?? self.pluginImplementation.getConfig().googleClientId
        guard let clientId else {
            let message = "Google-Anmeldung ist auf diesem iPhone nicht eingerichtet."
            if isLink == true {
                pluginImplementation.handleFailedLink(message: message, error: nil)
            } else {
                pluginImplementation.handleFailedSignIn(message: message, error: nil)
            }
            return
        }
        let config = GIDConfiguration(clientID: clientId)
"""

SIGN_OUT_OLD = """    @objc func signOut(_ call: CAPPluginCall) {
        do {
            try Auth.auth().signOut()
            googleAuthProviderHandler?.signOut()
            facebookAuthProviderHandler?.signOut()
            call.resolve()
"""

SIGN_OUT_NEW = """    @objc func signOut(_ call: CAPPluginCall) {
        do {
            if FirebaseApp.app() != nil {
                try Auth.auth().signOut()
            }
            googleAuthProviderHandler?.signOut()
            facebookAuthProviderHandler?.signOut()
            call.resolve()
"""

DEINIT_BLOCK = """
    deinit {
        if let authStateListenerHandle {
            Auth.auth().removeStateDidChangeListener(authStateListenerHandle)
        }
        if let idTokenListenerHandle {
            Auth.auth().removeStateDidChangeListener(idTokenListenerHandle)
        }
    }
"""

BRIDGE_OLD = """    @objc func handleAuthStateChange() {
        let user = implementation?.getCurrentUser()
        let userResult = FirebaseAuthenticationHelper.createUserResult(user)
        var result = JSObject()
        result["user"] = userResult ?? NSNull()
        notifyListeners(authStateChangeEvent, data: result, retainUntilConsumed: true)
    }

    @objc func handleIdTokenChange() {
        implementation?.getIdToken(false, completion: { result, error in
            if let error = error {
                CAPLog.print("[", self.tag, "] ", error)
                return
            }
            if let result = result {
                self.notifyListeners(self.idTokenChangeEvent, data: result.toJSObject(), retainUntilConsumed: true)
            }
        })
    }
"""

BRIDGE_NEW = """    @objc func handleAuthStateChange() {
        guard bridge != nil else { return }
        let user = implementation?.getCurrentUser()
        let userResult = FirebaseAuthenticationHelper.createUserResult(user)
        var result = JSObject()
        result["user"] = userResult ?? NSNull()
        notifyListeners(authStateChangeEvent, data: result, retainUntilConsumed: false)
    }

    @objc func handleIdTokenChange() {
        guard bridge != nil else { return }
        implementation?.getIdToken(false, completion: { [weak self] result, error in
            guard let self, self.bridge != nil else { return }
            if let error = error {
                CAPLog.print("[", self.tag, "] ", error)
                return
            }
            if let result = result {
                self.notifyListeners(self.idTokenChangeEvent, data: result.toJSObject(), retainUntilConsumed: false)
            }
        })
    }
"""


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if new in text:
        print(f"{path.name}: {label} already applied")
        return
    if old not in text:
        raise SystemExit(f"{path}: could not find the {label} block")
    path.write_text(text.replace(old, new, 1))
    print(f"{path.name}: {label} applied")

def replace_google_client(path: Path) -> None:
    text = path.read_text()
    if GOOGLE_NEW in text:
        print(f"{path.name}: native Google client already applied")
        return
    old = GOOGLE_DESKTOP_CLIENT if GOOGLE_DESKTOP_CLIENT in text else GOOGLE_OLD
    if old not in text:
        raise SystemExit(f"{path}: could not find the Google client block")
    path.write_text(text.replace(old, GOOGLE_NEW, 1))
    print(f"{path.name}: native Google client applied")


def main() -> None:
    if not AUTH.exists() or not BRIDGE.exists():
        raise SystemExit("Firebase Authentication iOS plugin was not installed")
    replace_once(AUTH, AUTH_OLD, AUTH_NEW, "listener handles")
    replace_once(AUTH, EARLY_RETURN, EARLY_RETURN_FIXED, "google startup")
    config_path = PLUGIN / "FirebaseAuthenticationConfig.swift"
    google_path = PLUGIN / "Handlers" / "GoogleAuthProviderHandler.swift"
    replace_once(config_path, CONFIG_OLD, CONFIG_NEW, "google client id")
    replace_once(BRIDGE, PROVIDERS_OLD, PROVIDERS_NEW, "provider list")
    replace_google_client(google_path)
    replace_once(AUTH, SIGN_OUT_OLD, SIGN_OUT_NEW, "safe native sign-out")
    auth_text = AUTH.read_text()
    if DEINIT_BLOCK in auth_text:
        AUTH.write_text(auth_text.replace(DEINIT_BLOCK, "\n", 1))
        print(f"{AUTH.name}: deinit removed")
    else:
        print(f"{AUTH.name}: deinit already absent")
    replace_once(BRIDGE, BRIDGE_OLD, BRIDGE_NEW, "bridge guard")


if __name__ == "__main__":
    main()
