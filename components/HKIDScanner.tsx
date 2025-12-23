'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface HKIDData {
  image: string; // Base64 encoded image
  detected: boolean;
  confidence: number;
}

interface HKIDScannerProps {
  onImageCaptured: (data: HKIDData) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function HKIDScanner({ onImageCaptured, onClose, isOpen }: HKIDScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<HKIDData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('無法存取相機，請確保已授予相機權限');
    }
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setDetectionResult(null);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);

    // Perform simple HKID detection
    detectHKID(imageData);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        setCapturedImage(imageSrc);
        detectHKID(imageSrc);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectHKID = async (imageData: string) => {
    setIsCapturing(true);
    
    try {
      // Simple image analysis to detect if it looks like an HKID
      const img = new Image();
      img.onload = () => {
        // Basic detection logic based on image properties
        const aspectRatio = img.width / img.height;
        const isLandscape = aspectRatio > 1.4 && aspectRatio < 1.8; // HKID aspect ratio
        
        // Simulate confidence based on image quality and size
        const confidence = calculateConfidence(img);
        
        const result: HKIDData = {
          image: imageData,
          detected: isLandscape && confidence > 0.5,
          confidence: confidence
        };

        setDetectionResult(result);
        setIsCapturing(false);
      };
      
      img.src = imageData;
    } catch (error) {
      console.error('Detection error:', error);
      setIsCapturing(false);
    }
  };

  const calculateConfidence = (img: HTMLImageElement): number => {
    // Simple confidence calculation based on image properties
    let confidence = 0.5; // Base confidence
    
    // Check image size (larger images usually better quality)
    if (img.width > 800 && img.height > 500) {
      confidence += 0.2;
    }
    
    // Check aspect ratio (HKID cards have specific ratio)
    const aspectRatio = img.width / img.height;
    if (aspectRatio > 1.4 && aspectRatio < 1.8) {
      confidence += 0.3;
    }
    
    return Math.min(confidence, 1.0);
  };

  const handleConfirm = () => {
    if (detectionResult) {
      onImageCaptured(detectionResult);
      onClose();
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setDetectionResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-text-primary">身份證掃描器</h3>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary text-2xl font-bold"
              aria-label="關閉"
            >
              ×
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">使用說明：</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 請將身份證正面完整顯示在鏡頭內</li>
              <li>• 保持身份證平整，避免反光和陰影</li>
              <li>• 確保光線充足，圖像清晰</li>
              <li>• 您也可以選擇上傳現有照片</li>
            </ul>
          </div>

          {/* Camera/Image Display */}
          <div className="mb-6">
            {!capturedImage ? (
              <div>
                <div className="mb-4 bg-black rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay guide for HKID positioning */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center bg-black bg-opacity-20">
                      <span className="text-white text-sm">將身份證置於此框內</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="btn-apple-primary px-6 py-2 disabled:opacity-50"
                  >
                    📷 拍照
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCapturing}
                    className="btn-apple-secondary px-6 py-2 disabled:opacity-50"
                  >
                    📁 選擇檔案
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <img
                    src={capturedImage}
                    alt="Captured HKID"
                    className="w-full h-64 object-contain bg-bg-tertiary rounded-lg"
                  />
                </div>
                
                {isCapturing && (
                  <div className="text-center p-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-text-secondary">正在分析圖像...</p>
                  </div>
                )}
                
                {detectionResult && !isCapturing && (
                  <div className={`border rounded-lg p-4 mb-4 ${
                    detectionResult.detected 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <h4 className={`font-medium mb-3 ${
                      detectionResult.detected ? 'text-green-900' : 'text-yellow-900'
                    }`}>
                      檢測結果：
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>狀態：</strong> 
                        <span className={detectionResult.detected ? 'text-green-700' : 'text-yellow-700'}>
                          {detectionResult.detected ? ' ✅ 檢測到身份證' : ' ⚠️ 未能明確檢測到身份證'}
                        </span>
                      </div>
                      <div>
                        <strong>信心度：</strong> 
                        <span className={`ml-1 ${
                          detectionResult.confidence > 0.7 ? 'text-green-700' : 
                          detectionResult.confidence > 0.5 ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                          {Math.round(detectionResult.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {!detectionResult.detected && (
                      <div className="mt-3 text-sm text-yellow-800">
                        建議：請確保身份證完整顯示在照片中，光線充足且圖像清晰
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {capturedImage && !isCapturing && (
              <button
                onClick={retake}
                className="btn-apple-secondary px-6 py-2"
              >
                重新拍照
              </button>
            )}
            
            {detectionResult && (
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 ${
                  detectionResult.detected 
                    ? 'btn-apple-primary' 
                    : 'btn-apple-secondary border-yellow-300 text-yellow-700'
                }`}
              >
                {detectionResult.detected ? '確認使用' : '仍要使用'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="btn-apple-secondary px-6 py-2"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
