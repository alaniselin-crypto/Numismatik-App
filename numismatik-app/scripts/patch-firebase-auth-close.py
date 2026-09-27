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
"""

AUTH_NEW = """    private var phoneAuthProviderHandler: PhoneAuthProviderHandler?
    private var savedCall: CAPPluginCall?
    private var authStateListenerHandle: AuthStateDidChangeListenerHandle?
    private var idTokenListenerHandle: AuthStateDidChangeListenerHandle?

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
        authStateListenerHandle = Auth.auth().addStateDidChangeListener { [weak self] _, _ in
            self?.plugin.handleAuthStateChange()
        }
        idTokenListenerHandle = Auth.auth().addIDTokenDidChangeListener { [weak self] _, _ in
            self?.plugin.handleIdTokenChange()
        }
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


def main() -> None:
    if not AUTH.exists() or not BRIDGE.exists():
        raise SystemExit("Firebase Authentication iOS plugin was not installed")
    replace_once(AUTH, AUTH_OLD, AUTH_NEW, "listener handles")
    auth_text = AUTH.read_text()
    if DEINIT_BLOCK in auth_text:
        AUTH.write_text(auth_text.replace(DEINIT_BLOCK, "\n", 1))
        print(f"{AUTH.name}: deinit removed")
    else:
        print(f"{AUTH.name}: deinit already absent")
    replace_once(BRIDGE, BRIDGE_OLD, BRIDGE_NEW, "bridge guard")


if __name__ == "__main__":
    main()
