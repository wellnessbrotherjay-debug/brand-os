'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { EXERCISE_MEDIA } from '@/lib/lib/exercise-library';
import { motion, AnimatePresence } from 'framer-motion';

const availableExercises = EXERCISE_MEDIA.filter(ex => ex.video);

export default function DemoPlayer() {
  const [timeLeft, setTimeLeft] = useState(45);
  const [phase, setPhase] = useState<'prep' | 'work' | 'rest'>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Generate QR code for workout control
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/demo-remote`;
        const qrData = await QRCode.toDataURL(url);
        setQrCodeUrl(qrData);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateQR();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          setPhase(p => p === 'work' ? 'rest' : 'work');
          if (phase === 'rest') {
            setExerciseIndex(i => (i + 1) % availableExercises.length);
          }
          return phase === 'work' ? 15 : 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, phase]);

  return (
    <main
      className="font-orbitron min-h-screen w-screen bg-gradient-to-b from-[#000510] to-[#0A0F18] text-white overflow-hidden"
    >
      <div className="relative w-full h-screen p-16">
        {/* Centered Top Section */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center">
          {/* Logo - Should be dynamic from builder */}
          <div className="text-4xl font-black tracking-[0.4em] text-[#00AFFF] mb-2">
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'inline-block' }}
            >
              RACEFIT
            </motion.span>
          </div>
          <div className="text-xl tracking-[0.3em] text-[#E0E0E0]/70 mb-4">
            MGM HOTEL GYM
          </div>
          <h1 className="text-8xl font-black tracking-[0.2em] mb-4">
            STAGE TIMER
          </h1>
          <div className="text-xl tracking-[0.3em] text-[#E0E0E0]/70">
            45S WORK · 15S REST · STRENGTH · ROUND 1/1
          </div>
        </div>

        {/* Main Content Grid - 16:9 TV Layout */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-full max-w-[90%] grid grid-cols-12 gap-8">
          {/* Left Section - Current Exercise (≈45%) */}
          <div className="col-span-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-video rounded-lg overflow-hidden"
              style={{
                boxShadow: '0 0 0 1.5px #00AFFF, 0 0 20px rgba(0,175,255,0.3)'
              }}
            >
              <video
                key={exerciseIndex}
                src={availableExercises[exerciseIndex].video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="text-3xl font-bold tracking-wider mb-4">
                  {availableExercises[exerciseIndex].name}
                </div>
                <div className="inline-block px-4 py-2 rounded-full bg-[#00AFFF]/10 border border-[#00AFFF]/30">
                  Equipment: {availableExercises[exerciseIndex].equipment}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Section - Timer Block (≈30%) */}
          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative h-full rounded-lg border-[1.5px] border-[#00AFFF] overflow-hidden"
              style={{
                boxShadow: '0 0 30px rgba(0,175,255,0.2)',
                background: 'radial-gradient(circle at center, rgba(0,175,255,0.1) 0%, transparent 70%)'
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xl tracking-[0.3em] text-[#00AFFF] mb-4"
                  >
                    {phase === 'work' ? 'GET READY' : 'REST'}
                  </motion.div>
                </AnimatePresence>

                {/* Timer Digits */}
                <div
                  className="text-[180px] font-black leading-none tracking-wider text-[#00AFFF]"
                  style={{
                    textShadow: '0 0 30px rgba(0,175,255,0.4)',
                  }}
                >
                  {String(timeLeft).padStart(2, '0')}.0
                </div>

                {/* Interval Blueprint */}
                <div className="mt-8 w-full">
                  <div className="text-center mb-4 text-sm tracking-[0.2em]">
                    INTERVAL BLUEPRINT
                  </div>
                  <div className="flex justify-center gap-12">
                    <div>
                      <div className="text-xs opacity-50">WORK</div>
                      <div className="text-[#00AFFF]">45s</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-50">CHANGE</div>
                      <div className="text-[#00AFFF]">15s</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-[#FF3E3E] text-sm">
                      NEXT: {phase === 'work' ? 'REST' : 'WORK'}
                    </div>
                    <div className="text-xs opacity-50 mt-1">
                      NEXT CUE IN: {timeLeft}S
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Section - Up Next & QR (≈25%) */}
          <div className="col-span-3 space-y-8">
            {/* Up Next */}
            <div>
              <div className="text-xl tracking-[0.3em] text-[#00AFFF] mb-4">UP NEXT</div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video rounded-lg overflow-hidden"
                style={{
                  boxShadow: '0 0 0 1.5px #00AFFF, 0 0 20px rgba(0,175,255,0.2)'
                }}
              >
                <video
                  src={availableExercises[(exerciseIndex + 1) % availableExercises.length].video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-lg font-bold tracking-wider">
                    {availableExercises[(exerciseIndex + 1) % availableExercises.length].name}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative rounded-lg overflow-hidden border-[1.5px] border-[#00AFFF]/30 p-6"
              style={{
                boxShadow: '0 0 20px rgba(0,175,255,0.1)'
              }}
            >
              <div className="text-center">
                <div className="text-lg tracking-[0.3em] text-[#00AFFF] mb-6">
                  SCAN TO START WORKOUT
                </div>
                <motion.div
                  animate={{
                    boxShadow: ['0 0 20px rgba(0,175,255,0.2)', '0 0 30px rgba(0,175,255,0.4)', '0 0 20px rgba(0,175,255,0.2)']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                  className="bg-white inline-block rounded-lg p-4"
                >
                  {qrCodeUrl && (
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={160}
                      height={160}
                      className="mx-auto"
                    />
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}