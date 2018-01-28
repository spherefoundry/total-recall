/* global Quagga */

const config = {
    inputStream: {
        type: 'LiveStream',
        constraints: {
            width: { min: 1280 },
            height: { min: 720 },
            facingMode: 'environment',
            aspectRatio: { min: 1, max: 2 }
        },
        target: '#scanner-page'
    },
    locator: {
        patchSize: 'medium',
        halfSample: true
    },
    numOfWorkers: 4,
    frequency: 10,
    decoder: {
        readers: [
            'ean_reader',
            'ean_8_reader'
        ]
    },
    locate: true
};

export default class Scanner {
    constructor(onDetectedCallback) {
        this.lastResult = null;
        this.running = false;
        this.onDetectedCallback = onDetectedCallback;

        this.onProcessed = this.onProcessed.bind(this);
        this.onDetected = this.onDetected.bind(this);

        Quagga.onProcessed(this.onProcessed);
        Quagga.onDetected(this.onDetected);

        Quagga.CameraAccess.enumerateVideoDevices()
            .then(function (devices) {
                for (const device of devices) {
                    console.log(device);
                }
            });
    }

    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        Quagga.init(config, function (err) {
            if (err) {
                console.log(err);
                this.running = false;
                return;
            }
            Quagga.start();
        });
    }

    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        Quagga.stop();
    }

    onProcessed(result) {
        var drawingCtx = Quagga.canvas.ctx.overlay, drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), parseInt(drawingCanvas.getAttribute('height')));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00F', lineWidth: 2 });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
        }
    }

    onDetected(result) {
        var code = result.codeResult.code;

        if (this.lastResult !== code) {
            this.lastResult = code;

            this.onDetectedCallback(code);
        }
    }
}