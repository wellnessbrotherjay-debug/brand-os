'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BrandSetup() {
  const router = useRouter();
  const [brandConfig, setBrandConfig] = useState({
    hotelName: '',
    primaryColor: '#00BFFF',
    secondaryColor: '#FF4D4D',
    logo: null as File | null,
    backgroundColor: '#000000',
    accentColor: '#32CD32'
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandConfig(prev => ({ ...prev, logo: file }));
    }
  };

  const handleSave = async () => {
    // TODO: Save to Supabase and local storage
    // Upload logo to storage
    // Save colors and config
    // Update environment variables
    router.push('/setup/displays');
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Brand Setup</h1>
        
        <div className="space-y-6">
          {/* Hotel Name */}
          <div>
            <label className="block text-lg mb-2">Hotel Name</label>
            <input
              type="text"
              value={brandConfig.hotelName}
              onChange={(e) => setBrandConfig(prev => ({ ...prev, hotelName: e.target.value }))}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-lg mb-2">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700"
            />
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg mb-2">Primary Color</label>
              <input
                type="color"
                value={brandConfig.primaryColor}
                onChange={(e) => setBrandConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-lg mb-2">Secondary Color</label>
              <input
                type="color"
                value={brandConfig.secondaryColor}
                onChange={(e) => setBrandConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-lg mb-2">Background Color</label>
              <input
                type="color"
                value={brandConfig.backgroundColor}
                onChange={(e) => setBrandConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-lg mb-2">Accent Color</label>
              <input
                type="color"
                value={brandConfig.accentColor}
                onChange={(e) => setBrandConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: brandConfig.backgroundColor }}>
            <h2 className="text-2xl mb-4">Preview</h2>
            <div className="flex items-center gap-4">
              {brandConfig.logo && (
                <img
                  src={URL.createObjectURL(brandConfig.logo)}
                  alt="Logo Preview"
                  className="w-16 h-16 object-contain"
                />
              )}
              <div>
                <div style={{ color: brandConfig.primaryColor }}>{brandConfig.hotelName}</div>
                <div style={{ color: brandConfig.secondaryColor }}>Sample Text</div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold mt-8"
          >
            Save and Continue to Displays
          </button>
        </div>
      </div>
    </main>
  );
}