import Foundation
import Capacitor
import AVFoundation

@objc(NativeAudioRecorderPlugin)
public class NativeAudioRecorderPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioRecorderDelegate {
    public let identifier = "NativeAudioRecorderPlugin"
    public let jsName = "NativeAudioRecorder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pauseRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resumeRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "rotateSegment", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]

    private let session = AVAudioSession.sharedInstance()
    private var recorder: AVAudioRecorder?
    private var currentSegmentURL: URL?
    private var meterTimer: Timer?
    private var isPaused = false

    private let meterUpdateInterval: TimeInterval = 0.2
    private let outputMimeType = "audio/mp4"
    private let outputExtension = "m4a"

    private var recorderSettings: [String: Any] {
        [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 44_100,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitRateKey: 64_000,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
        ]
    }

    public override func load() {
        super.load()
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        requestMicrophonePermission { granted in
            if granted {
                call.resolve(["granted": true])
            } else {
                call.resolve(["granted": false])
            }
        }
    }

    @objc func startRecording(_ call: CAPPluginCall) {
        requestMicrophonePermission { [weak self] granted in
            guard let self else {
                call.reject("Plugin de gravação indisponível")
                return
            }

            guard granted else {
                call.reject("Permissão de microfone negada")
                return
            }

            DispatchQueue.main.async {
                do {
                    try self.cleanupRecorder(deleteCurrentFile: true)
                    try self.configureAudioSession()
                    try self.startRecorder(at: self.makeSegmentURL())
                    call.resolve(self.buildRecorderInfo(state: "recording"))
                } catch {
                    call.reject("Não foi possível iniciar a gravação: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func pauseRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.recorder != nil else {
                self.isPaused = true
                call.resolve(self.buildSegmentResponse(state: "paused", segment: nil))
                return
            }

            self.finalizeCurrentSegment(markPaused: true) { result in
                switch result {
                case .success(let segment):
                    call.resolve(self.buildSegmentResponse(state: "paused", segment: segment))
                case .failure(let error):
                    call.reject("Não foi possível pausar a gravação: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func resumeRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                try self.configureAudioSession()

                if self.recorder == nil {
                    try self.startRecorder(at: self.makeSegmentURL())
                } else if let recorder = self.recorder, !recorder.isRecording, !recorder.record() {
                    call.reject("Não foi possível retomar a gravação")
                    return
                }

                self.isPaused = false
                self.startMetering()
                call.resolve(self.buildRecorderInfo(state: "recording"))
            } catch {
                call.reject("Não foi possível retomar a gravação: \(error.localizedDescription)")
            }
        }
    }

    @objc func rotateSegment(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let recorder = self.recorder, recorder.isRecording else {
                call.reject("Nenhuma gravação ativa para segmentar")
                return
            }

            self.finalizeCurrentSegment(markPaused: false) { result in
                switch result {
                case .success(let segment):
                    do {
                        try self.startRecorder(at: self.makeSegmentURL())
                        call.resolve(self.buildSegmentResponse(state: "recording", segment: segment))
                    } catch {
                        call.reject("Não foi possível reiniciar a gravação após segmentar: \(error.localizedDescription)")
                    }
                case .failure(let error):
                    call.reject("Não foi possível segmentar a gravação: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func stopRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.recorder != nil else {
                self.isPaused = false
                call.resolve(self.buildSegmentResponse(state: "idle", segment: nil))
                return
            }

            self.finalizeCurrentSegment(markPaused: false) { result in
                switch result {
                case .success(let segment):
                    call.resolve(self.buildSegmentResponse(state: "idle", segment: segment))
                case .failure(let error):
                    call.reject("Não foi possível finalizar a gravação: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func cancelRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            do {
                try self.cleanupRecorder(deleteCurrentFile: true)
                self.isPaused = false
                call.resolve()
            } catch {
                call.reject("Não foi possível cancelar a gravação: \(error.localizedDescription)")
            }
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(self.currentStatusPayload())
        }
    }

    private func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { granted in
                completion(granted)
            }
            return
        }

        session.requestRecordPermission { granted in
            completion(granted)
        }
    }

    private func configureAudioSession() throws {
        try session.setCategory(
            .playAndRecord,
            mode: .default,
            options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers]
        )
        try session.setActive(true, options: .notifyOthersOnDeactivation)
    }

    private func makeSegmentURL() -> URL {
        FileManager.default.temporaryDirectory
            .appendingPathComponent("vitaview-consultation-\(UUID().uuidString)")
            .appendingPathExtension(outputExtension)
    }

    private func startRecorder(at url: URL) throws {
        let recorder = try AVAudioRecorder(url: url, settings: recorderSettings)
        recorder.delegate = self
        recorder.isMeteringEnabled = true
        recorder.prepareToRecord()

        guard recorder.record() else {
            throw NSError(
                domain: "NativeAudioRecorder",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "AVAudioRecorder não iniciou a captura"]
            )
        }

        self.recorder = recorder
        self.currentSegmentURL = url
        self.isPaused = false
        startMetering()
    }

    private func finalizeCurrentSegment(
        markPaused: Bool,
        completion: @escaping (Result<JSObject?, Error>) -> Void
    ) {
        guard let recorder = recorder, let url = currentSegmentURL else {
            isPaused = markPaused
            completion(.success(nil))
            return
        }

        let recordedDuration = recorder.currentTime
        stopMetering(emitZeroLevel: true)
        recorder.stop()
        self.recorder = nil
        self.currentSegmentURL = nil
        self.isPaused = markPaused

        guard recordedDuration > 0.15 else {
            try? FileManager.default.removeItem(at: url)
            completion(.success(nil))
            return
        }

        readSegmentPayload(from: url, completion: completion)
    }

    private func cleanupRecorder(deleteCurrentFile: Bool) throws {
        stopMetering(emitZeroLevel: true)

        if let recorder = recorder {
            recorder.delegate = nil
            if recorder.isRecording || isPaused {
                recorder.stop()
            }
        }

        recorder = nil
        isPaused = false

        if deleteCurrentFile, let url = currentSegmentURL {
            try? FileManager.default.removeItem(at: url)
        }

        currentSegmentURL = nil
    }

    private func startMetering() {
        stopMetering(emitZeroLevel: false)

        meterTimer = Timer(timeInterval: meterUpdateInterval, repeats: true) { [weak self] _ in
            self?.emitCurrentLevel()
        }

        if let meterTimer {
            RunLoop.main.add(meterTimer, forMode: .common)
        }
    }

    private func stopMetering(emitZeroLevel: Bool) {
        meterTimer?.invalidate()
        meterTimer = nil

        if emitZeroLevel {
            notifyListeners("recordingLevel", data: ["level": 0])
        }
    }

    private func emitCurrentLevel() {
        guard let recorder = recorder, recorder.isRecording else {
            notifyListeners("recordingLevel", data: ["level": 0])
            return
        }

        recorder.updateMeters()
        let averagePower = recorder.averagePower(forChannel: 0)
        let level = normalizeAveragePower(averagePower)
        notifyListeners("recordingLevel", data: ["level": level])
    }

    private func normalizeAveragePower(_ averagePower: Float) -> Double {
        if averagePower <= -80 {
            return 0
        }

        let amplitude = pow(10, averagePower / 20)
        return min(1, max(0, Double(amplitude) * 2.6))
    }

    private func readSegmentPayload(
        from url: URL,
        completion: @escaping (Result<JSObject?, Error>) -> Void
    ) {
        let fileManager = FileManager.default

        DispatchQueue.global(qos: .userInitiated).async {
            var lastError: Error?

            for attempt in 0..<6 {
                if attempt > 0 {
                    Thread.sleep(forTimeInterval: 0.2)
                }

                do {
                    if !fileManager.fileExists(atPath: url.path) {
                        continue
                    }

                    let attributes = try fileManager.attributesOfItem(atPath: url.path)
                    let size = (attributes[.size] as? NSNumber)?.intValue ?? 0

                    if size <= 0 {
                        continue
                    }

                    let data = try Data(contentsOf: url, options: .mappedIfSafe)

                    if data.isEmpty {
                        continue
                    }

                    let payload: JSObject = [
                        "base64Data": data.base64EncodedString(),
                        "mimeType": self.outputMimeType,
                        "fileName": url.lastPathComponent,
                        "sizeBytes": data.count,
                        "extension": self.outputExtension,
                    ]

                    try? fileManager.removeItem(at: url)

                    DispatchQueue.main.async {
                        completion(.success(payload))
                    }
                    return
                } catch {
                    lastError = error
                }
            }

            let finalError = lastError ?? NSError(
                domain: "NativeAudioRecorder",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "O arquivo de áudio não pôde ser consolidado."]
            )

            DispatchQueue.main.async {
                completion(.failure(finalError))
            }
        }
    }

    private func buildRecorderInfo(state: String) -> JSObject {
        [
            "state": state,
            "mimeType": outputMimeType,
            "extension": outputExtension,
        ]
    }

    private func buildSegmentResponse(state: String, segment: JSObject?) -> JSObject {
        var payload = buildRecorderInfo(state: state)
        payload["segment"] = segment ?? NSNull()
        return payload
    }

    private func currentStatusPayload() -> JSObject {
        let state: String

        if let recorder = recorder {
            if recorder.isRecording {
                state = "recording"
            } else if isPaused {
                state = "paused"
            } else {
                state = "idle"
            }
        } else if isPaused {
            state = "paused"
        } else {
            state = "idle"
        }

        return [
            "state": state,
            "mimeType": outputMimeType,
            "extension": outputExtension,
        ]
    }

    public func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        notifyListeners("recordingError", data: [
            "message": error?.localizedDescription ?? "Falha ao codificar o áudio"
        ])
    }
}
