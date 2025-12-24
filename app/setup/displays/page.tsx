'use client';

import Link from 'next/link';

const displays = [
  {
    name: 'Room TV Display',
    description: 'Full screen workout display for hotel room TVs',
    path: '/demo-player',
    icon: '📺'
  },
  {
    name: 'Tablet Remote',
    description: 'Control interface for trainers',
    path: '/tablet',
    icon: '📱'
  },
  {
    name: 'Phone Remote',
    description: 'Guest workout control interface',
    path: '/remote',
    icon: '📲'
  },
  {
    name: 'Station TV Display',
    description: '16:9 station-specific workout display for gym floor TVs',
    path: '/station-tv/1',
    icon: '🏋️'
  },
  {
    name: 'Timer Display',
    description: 'Standalone timer interface',
    path: '/ui/timer',
    icon: '⏱'
  },
  {
    name: 'HRM Leaderboard',
    description: 'Heart rate leaderboard for team training zones',
    path: '/hrm-tv',
    icon: '❤️'
  }
];

export default function DisplaysOverview() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Display Interfaces</h1>
          <p className="text-xl text-gray-400">Select a display to preview or configure</p>
        </header>

        <div className="grid grid-cols-2 gap-6">
          {displays.map((display) => (
            <Link
              key={display.path}
              href={display.path}
              className="block p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-blue-500 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{display.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400">
                    {display.name}
                  </h2>
                  <p className="text-gray-400">{display.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl bg-blue-900/20 border border-blue-800">
          <h3 className="text-xl font-bold mb-4">Display Configuration</h3>
          <p className="text-gray-400">
            All displays will automatically use your brand settings. You can preview each display
            by clicking on the cards above. Make sure to test each interface before deploying
            to your hotel rooms.
          </p>
        </div>
      </div>
    </main>
  );
}
