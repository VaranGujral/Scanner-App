import { useEffect, useRef, useState } from "react";
import { Camera, X, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

function ScannerModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  async function startCamera() {
    setStatus("starting");
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus("ready");
    } catch (err) {
      console.error(err);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission was denied. Please allow camera access in your browser."
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setError(
          "Unable to access the camera. Please check your browser permissions."
        );
      }

      setStatus("error");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">

        <div className="scanner-header">
          <div>
            <h2>Scan Product</h2>
            <p>Point your camera at a barcode</p>
          </div>

          <button
            className="scanner-close"
            onClick={handleClose}
            aria-label="Close scanner"
          >
            <X size={22} />
          </button>
        </div>

        <div className="scanner-camera">

          {status === "error" ? (
            <div className="scanner-error">
              <AlertCircle size={42} />

              <h3>Camera unavailable</h3>

              <p>{error}</p>

              <button
                className="scanner-retry"
                onClick={startCamera}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="scanner-video"
              />

              <div className="scanner-frame">
                <span className="corner top-left" />
                <span className="corner top-right" />
                <span className="corner bottom-left" />
                <span className="corner bottom-right" />
              </div>

              {status === "starting" && (
                <div className="scanner-status">
                  <Camera size={18} />
                  Starting camera...
                </div>
              )}

              {status === "ready" && (
                <div className="scanner-status ready">
                  <Camera size={18} />
                  Camera ready
                </div>
              )}
            </>
          )}

        </div>

        <div className="scanner-footer">
          <p>
            Hold the barcode inside the frame.
          </p>

          <button
            className="scanner-cancel"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default ScannerModal;
