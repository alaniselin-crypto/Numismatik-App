import Capacitor
import UIKit

@objc(NativePrintPlugin)
public class NativePrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativePrintPlugin"
    public let jsName = "NativePrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "print", returnType: CAPPluginReturnPromise),
    ]

    @objc func print(_ call: CAPPluginCall) {
        guard let html = call.getString("html"), !html.isEmpty else {
            call.reject("Der Druckinhalt fehlt.")
            return
        }

        DispatchQueue.main.async {
            let printController = UIPrintInteractionController.shared
            let printInfo = UIPrintInfo(dictionary: nil)
            printInfo.outputType = .general
            printInfo.jobName = call.getString("jobName") ?? "Numismatik-Katalog"
            printInfo.orientation = .landscape
            printController.printInfo = printInfo
            printController.printFormatter = UIMarkupTextPrintFormatter(markupText: html)

            let completion: UIPrintInteractionController.CompletionHandler = { _, completed, error in
                if let error {
                    call.reject("Drucken fehlgeschlagen: \(error.localizedDescription)")
                } else if completed {
                    call.resolve()
                } else {
                    call.resolve()
                }
            }

            if UIDevice.current.userInterfaceIdiom == .pad,
               let sourceView = self.bridge?.viewController?.view {
                printController.present(
                    from: sourceView.bounds,
                    in: sourceView,
                    animated: true,
                    completionHandler: completion
                )
            } else {
                printController.present(animated: true, completionHandler: completion)
            }
        }
    }
}
