import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StoreKitPlugin())
        bridge?.registerPluginInstance(NativeAudioRecorderPlugin())
    }
}
