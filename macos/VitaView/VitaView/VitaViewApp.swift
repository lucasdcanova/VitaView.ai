import SwiftUI

@main
struct VitaViewApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 1100, minHeight: 720)
                .ignoresSafeArea()
                .background(WindowConfigurator())
        }
        .defaultSize(width: 1440, height: 920)
    }
}

struct WindowConfigurator: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        DispatchQueue.main.async {
            guard let window = view.window else { return }
            window.titleVisibility = .hidden
            window.isMovableByWindowBackground = true
            window.backgroundColor = .windowBackgroundColor
        }
        return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {}
}
