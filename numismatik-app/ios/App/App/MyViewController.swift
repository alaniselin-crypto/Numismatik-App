import UIKit
import Capacitor

/// Bridge view controller used as the app's root. Subclasses
/// CAPBridgeViewController so the Capacitor bridge (including the local
/// AppleStoreKit plugin) is installed exactly as before, while keeping a
/// stable, app-owned root class for scene-based launches.
class MyViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
    }
}
