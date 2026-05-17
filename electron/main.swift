import Cocoa
import WebKit
import UniformTypeIdentifiers

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var serverProcess: Process?

    func applicationDidFinishLaunching(_ notification: Notification) {
        startServer()
        createWindow()
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.loadApp()
        }
    }

    func startServer() {
        let bundle = Bundle.main.bundlePath
        let serverDir = "\(bundle)/Contents/Resources/server"
        let clientDist = "\(bundle)/Contents/Resources/client"
        let nodePath = "/opt/homebrew/bin/node"

        let process = Process()
        process.executableURL = URL(fileURLWithPath: nodePath)
        process.arguments = ["index.js"]
        process.currentDirectoryURL = URL(fileURLWithPath: serverDir)
        process.environment = ProcessInfo.processInfo.environment.merging([
            "CLIENT_DIST": clientDist,
            "PORT": "3001"
        ]) { _, new in new }

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe

        try? process.run()
        serverProcess = process
    }

    func createWindow() {
        let screen = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let w = min(1440.0, screen.width * 0.9)
        let h = min(900.0, screen.height * 0.9)
        let x = (screen.width - w) / 2
        let y = (screen.height - h) / 2

        window = NSWindow(
            contentRect: NSRect(x: x, y: y, width: w, height: h),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Aymond"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.minSize = NSSize(width: 1100, height: 700)

        // Register message handler for PDF export
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "savePDF")

        let config = WKWebViewConfiguration()
        config.userContentController = userContentController

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.uiDelegate = self

        let loadingView = NSVisualEffectView(frame: window.contentView!.bounds)
        loadingView.material = .sidebar
        loadingView.blendingMode = .behindWindow
        loadingView.autoresizingMask = [.width, .height]
        window.contentView?.addSubview(loadingView)

        let label = NSTextField(labelWithString: "Đang khởi động Aymond...")
        label.font = NSFont.systemFont(ofSize: 16, weight: .medium)
        label.textColor = NSColor.secondaryLabelColor
        label.frame = NSRect(x: (w - 240) / 2, y: (h - 30) / 2, width: 240, height: 30)
        label.autoresizingMask = [.minXMargin, .maxXMargin, .minYMargin, .maxYMargin]
        loadingView.addSubview(label)
        window.contentView?.addSubview(webView)
        webView.isHidden = true

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func loadApp() {
        let url = URL(string: "http://localhost:3001")!
        webView.load(URLRequest(url: url))
    }

    // ── WKUIDelegate — handle window.confirm() / window.alert() ────────────────
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "Xác nhận"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Hủy")
        alert.beginSheetModal(for: window) { response in
            completionHandler(response == .alertFirstButtonReturn)
        }
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "OK")
        alert.beginSheetModal(for: window) { _ in completionHandler() }
    }

    // ── WKScriptMessageHandler — receives PDF data from JavaScript ──────────────
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "savePDF",
              let body = message.body as? [String: String],
              let dataURI = body["data"],
              let filename = body["filename"] else { return }

        // Strip "data:application/pdf;base64," prefix
        let parts = dataURI.components(separatedBy: ",")
        guard parts.count >= 2, let pdfData = Data(base64Encoded: parts[1]) else { return }

        // Show native Save dialog on main thread
        DispatchQueue.main.async {
            let savePanel = NSSavePanel()
            if #available(macOS 12.0, *) {
                savePanel.allowedContentTypes = [UTType.pdf]
            }
            savePanel.nameFieldStringValue = filename
            savePanel.directoryURL = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first

            savePanel.beginSheetModal(for: self.window) { response in
                if response == .OK, let url = savePanel.url {
                    try? pdfData.write(to: url)
                }
            }
        }
    }

    // ── WKNavigationDelegate ────────────────────────────────────────────────────
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.isHidden = false
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.loadApp()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        serverProcess?.terminate()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
