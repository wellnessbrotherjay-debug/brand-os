'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "@/lib/supabase";

interface FitnessTestData {
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct: number;
  sex: 'male' | 'female' | 'other';
  level_self: 'beginner' | 'intermediate' | 'advanced';
  max_pushups: number;
  squats_60s: number;
  plank_hold_sec: number;
  step_test_hr: number;
}

export default function FitnessTest() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl font-bold">Loading Fitness Test...</div>
        </div>
      </div>
    }>
      <FitnessTestContent />
    </Suspense>
  );
}

function FitnessTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const roomId = searchParams.get('roomId');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<FitnessTestData>>({
    sex: 'other',
    level_self: 'beginner'
  });

  const updateField = (field: keyof FitnessTestData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !roomId) return;

    try {
      setLoading(true);

      // Submit fitness test data
      const response = await fetch('/api/fitness/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit fitness test');
      }

      // Update session status
      await supabase
        .from('workout_sessions')
        .update({
          status: 'ready',
          tested_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Redirect to player
      router.push(`/room/${roomId}/player?sessionId=${sessionId}`);

    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit fitness test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-blue-100">Basic Information</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Age</label>
                <input
                  type="number"
                  value={data.age || ''}
                  onChange={(e) => updateField('age', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Sex</label>
                <select
                  value={data.sex}
                  onChange={(e) => updateField('sex', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
                <input
                  type="number"
                  value={data.height_cm || ''}
                  onChange={(e) => updateField('height_cm', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                <input
                  type="number"
                  value={data.weight_kg || ''}
                  onChange={(e) => updateField('weight_kg', parseFloat(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Body Fat % (estimate)</label>
                <input
                  type="number"
                  value={data.body_fat_pct || ''}
                  onChange={(e) => updateField('body_fat_pct', parseFloat(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  step="0.1"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-blue-100">Fitness Level</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300">Your Fitness Level</label>
              <select
                value={data.level_self}
                onChange={(e) => updateField('level_self', e.target.value)}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-blue-100">Performance Tests</h3>
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">Push-ups (max in one set)</label>
                <input
                  type="number"
                  value={data.max_pushups || ''}
                  onChange={(e) => updateField('max_pushups', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">Do as many push-ups as you can in one set</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Squats (in 60 seconds)</label>
                <input
                  type="number"
                  value={data.squats_60s || ''}
                  onChange={(e) => updateField('squats_60s', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">Count full squats for 60 seconds</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Plank Hold (seconds)</label>
                <input
                  type="number"
                  value={data.plank_hold_sec || ''}
                  onChange={(e) => updateField('plank_hold_sec', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">Hold a plank as long as possible</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Step Test Recovery HR</label>
                <input
                  type="number"
                  value={data.step_test_hr || ''}
                  onChange={(e) => updateField('step_test_hr', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">Step up/down for 3min, measure 1min recovery heart rate</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!sessionId || !roomId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Invalid Session</h2>
          <p className="text-gray-400">Please start a new workout session from your room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Fitness Assessment</h1>
          <p className="text-xl text-blue-400">Step {step} of 3</p>
        </header>

        <div className="bg-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit}>
            {renderStep()}

            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="ml-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600"
                >
                  {loading ? 'Processing...' : 'Start Workout'}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-900/30 rounded-lg p-6">
          <h3 className="font-semibold text-blue-300 mb-3">Why do we need this?</h3>
          <p className="text-gray-300">
            This assessment helps us customize your workout intensity and exercise selection.
            We&apos;ll use this data to:
          </p>
          <ul className="mt-3 space-y-2 text-gray-400">
            <li>• Calculate your optimal workout intensity</li>
            <li>• Select appropriate exercise variations</li>
            <li>• Track your fitness progress over time</li>
            <li>• Provide personalized nutrition recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
