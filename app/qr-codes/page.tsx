"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  storage,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";

export default function QRCodesPage() {
  const [setup, setSetup] = useState<WorkoutSetup | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [detectedIP, setDetectedIP] = useState<string | null>(null);

  // Function to detect local IP address
  const detectLocalIP = async () => {
    try {
      // Create a dummy peer connection to detect local IP
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      
      pc.createDataChannel("");
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      return new Promise<string>((resolve) => {
        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) return;
          
          const candidate = ice.candidate.candidate;
          const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          
          if (ipMatch && !ipMatch[0].startsWith('127.')) {
            pc.close();
            resolve(ipMatch[0]);
          }
        };
      });
    } catch (error) {
      console.log('IP detection failed, using fallback');
      return '192.168.0.104'; // Fallback to known working IP
    }
  };

  useEffect(() => {
    setSetup(storage.getSetup());
    
    // Get current URL base for QR code generation
    const initializeBaseUrl = async () => {
      if (typeof window !== "undefined") {
        const currentUrl = window.location.origin;
        const port = window.location.port || '3001';
        
        // If we're on localhost, detect the actual IP address
        if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
          try {
            const ip = await detectLocalIP();
            const ipUrl = `http://${ip}:${port}`;
            setDetectedIP(ip);
            setBaseUrl(ipUrl);
          } catch (error) {
            // Fallback to known working IP
            setBaseUrl('http://192.168.0.104:3001');
            setDetectedIP('192.168.0.104');
          }
        } else {
          setBaseUrl(currentUrl);
        }
      }
    };

    initializeBaseUrl();
  }, []);

  const [manualIP, setManualIP] = useState("");
  const [useManualIP, setUseManualIP] = useState(false);

  // Update base URL when manual IP changes
  useEffect(() => {
    if (useManualIP && manualIP) {
      const port = window.location.port || '3001';
      setBaseUrl(`http://${manualIP}:${port}`);
    } else if (detectedIP) {
      const port = window.location.port || '3001';
      setBaseUrl(`http://${detectedIP}:${port}`);
    }
  }, [useManualIP, manualIP, detectedIP]);

  const mobileUrl = `${baseUrl}/mobile`;

  if (!setup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold mb-4">Loading...</div>
          <div className="text-gray-400">Please set up your workout first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          {setup.logo && (
            <Image
              src={setup.logo}
              alt="Logo"
              width={60}
              height={60}
              className="rounded-full object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-blue-400">
              {setup.facilityName || "Fitness Center"}
            </h1>
            <p className="text-gray-400">Mobile Workout Access</p>
          </div>
        </div>
      </div>

      {/* Main QR Code */}
      <div className="max-w-md mx-auto">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 text-blue-400">
              🏋️ Start Your Workout
            </h2>
            <p className="text-gray-400 text-sm">
              Scan this QR code with your phone to begin your personalized workout experience
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-xl mb-6">
            <div className="w-full aspect-square flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mobileUrl)}&bgcolor=ffffff&color=000000&margin=10`}
                alt="Workout QR Code"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Workout Info */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Stations:</span>
              <span className="font-bold text-blue-400">{setup.stations?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Rounds:</span>
              <span className="font-bold text-blue-400">{setup.rounds}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Work Time:</span>
              <span className="font-bold text-green-400">{setup.workTime}s</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Rest Time:</span>
              <span className="font-bold text-yellow-400">{setup.restTime}s</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-blue-400">📱 How to Use</h3>
          
          {/* IP Address Info */}
          {detectedIP && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-400">Detected IP Address:</span>
                <code className="text-sm bg-gray-800 px-2 py-1 rounded text-blue-300">{detectedIP}</code>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                This QR code will work on your phone when connected to the same WiFi network
              </p>
              
              {/* Manual IP Override */}
              <div className="border-t border-blue-500/20 pt-3">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={useManualIP}
                    onChange={(e) => setUseManualIP(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-blue-400">Use custom IP address</span>
                </label>
                
                {useManualIP && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualIP}
                      onChange={(e) => setManualIP(e.target.value)}
                      placeholder="192.168.1.100"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    />
                    <button
                      onClick={() => {
                        setManualIP('192.168.0.104');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Use Default
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-semibold text-white">Scan QR Code</p>
                <p>Open your phone&apos;s camera and point it at the QR code above</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-semibold text-white">Start Workout</p>
                <p>Tap &quot;Start Workout&quot; on your phone to begin the complete circuit</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-semibold text-white">Control Your Pace</p>
                <p>Use &quot;Start&quot; and &quot;Finished&quot; buttons to move through each exercise at your own speed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
              <div>
                <p className="font-semibold text-white">Follow Your Guide</p>
                <p>Your phone will show which station to visit next and preview upcoming exercises</p>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting */}
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">📡 Network Requirements:</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Your phone must be on the same WiFi network as this computer</li>
              <li>• Make sure your phone can access: <code className="bg-gray-800 px-1 rounded">{baseUrl}</code></li>
              <li>• If the QR code doesn&apos;t work, try typing the URL directly in your phone&apos;s browser</li>
            </ul>
          </div>
        </div>

        {/* URL for manual entry */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Or visit directly:</p>
          <code className="text-xs bg-gray-800 px-3 py-1 rounded text-blue-400 break-all">
            {mobileUrl}
          </code>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          🖨️ Print QR Code
        </button>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .bg-black {
            background: white !important;
          }
          .text-white {
            color: black !important;
          }
          .bg-gray-900 {
            background: #f5f5f5 !important;
            border: 1px solid #ddd !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
