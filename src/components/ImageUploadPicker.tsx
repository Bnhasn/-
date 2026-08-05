import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Check, X, Image as ImageIcon, FlipHorizontal } from 'lucide-react';

interface ImageUploadPickerProps {
  currentPhotoUrl: string;
  onPhotoChange: (newPhotoUrl: string) => void;
  label?: string;
}

export const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  currentPhotoUrl,
  onPhotoChange,
  label = 'الصورة الشخصية للفرد'
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when unmounting or stopping
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start live camera
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setCapturedPreview(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('عذراً، متصفحك لا يدعم التصوير المباشر بالكاميرا.');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          }
        });
      } catch (e) {
        // Fallback to basic video constraint if ideal constraints fail
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video element if already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('لم نتمكن من الوصول للكاميرا. يرجى السماح بصلاحية الكاميرا أو استخدام الرفع من المعرض.');
      setIsCameraActive(false);
    }
  };

  // Video Ref Callback to guarantee stream attachment upon DOM mount
  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  };

  // Toggle front/rear camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Capture snapshot from video stream
  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip horizontally if front camera for natural mirror feel
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPreview(dataUrl);
    }
  };

  // Accept captured photo
  const acceptCapturedPhoto = () => {
    if (capturedPreview) {
      onPhotoChange(capturedPreview);
      setCapturedPreview(null);
      stopCamera();
    }
  };

  // Handle Gallery File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700">{label}</label>

      {/* Main Preview Container */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
        {/* Current Avatar */}
        <div className="relative group shrink-0">
          <img
            src={currentPhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
            alt="الصورة الشخصية"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
          />
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2 w-full text-right">
          <p className="text-[11px] text-slate-500 font-medium">
            يمكنك التقاط صورة مباشرة عبر كاميرا الهاتف/الجهاز أو اختيار صورة محفوظة من الاستوديو والمعرض.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-700" />
              <span>رفع من المعرض</span>
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Camera Live Capture Button */}
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>تصوير مباشر بالكاميرا 📷</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Camera View Modal Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-emerald-400 font-bold text-sm">
                <Camera className="w-5 h-5" />
                <span>التقاط صورة العسكرية الفورية</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message if camera failed */}
            {cameraError ? (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs font-medium space-y-2">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-rose-600 text-white font-bold rounded-xl text-xs"
                >
                  استخدام المعرض بدلاً من ذلك
                </button>
              </div>
            ) : (
              <>
                {/* Video Stream or Captured Preview */}
                <div className="relative aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner flex items-center justify-center">
                  {!capturedPreview ? (
                    <>
                      <video
                        ref={handleVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                      />
                      {/* Framing Overlay Grid */}
                      <div className="absolute inset-0 border-2 border-dashed border-emerald-400/40 rounded-full m-8 pointer-events-none" />
                      <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] bg-slate-950/70 text-slate-300 py-1 px-2 rounded-lg backdrop-blur-xs">
                        ضع وجه الفرد داخل الإطار الدائري
                      </div>
                    </>
                  ) : (
                    <img
                      src={capturedPreview}
                      alt="معاينة اللقطة"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {!capturedPreview ? (
                    <>
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
                        title="تبديل الكاميرا الأمامية/الخلفية"
                      >
                        <FlipHorizontal className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">قلب الكاميرا</span>
                      </button>

                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-slate-950" />
                        <span>التقاط الصورة الآن 📸</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setCapturedPreview(null)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>إعادة الالتقاط</span>
                      </button>

                      <button
                        type="button"
                        onClick={acceptCapturedPhoto}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Check className="w-4 h-4" />
                        <span>اعتماد الصورة للفرد</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
