"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EQUIPMENT_OPTIONS,
  BASE_EQUIPMENT_OPTIONS,
  getAllEquipmentOptions,
  addCustomEquipment,
  addExerciseForEquipment,
  type EquipmentOption,
} from "@/lib/workout-engine/constants";
import {
  buildStationList,
  getDefaultBrandColors,
  storage,
  type StationSetup,
  type WorkoutSetup,
} from "@/lib/workout-engine/storage";
import {
  DEFAULT_FONT_SETTINGS,
  FONT_OPTIONS,
  type FontKey,
} from "@/lib/workout-engine/branding";

const THEMES = ["gold", "neon", "luxury-dark"] as const;
const WORK_TIMES = [30, 40, 45, 60];
const REST_TIMES = [10, 15, 20, 30];
const ROUNDS = [1, 2, 3, 4];

const MIN_STATIONS = 1;
const MAX_STATIONS = 12;

// Custom equipment that can be added manually (using existing EquipmentOption types)
const CUSTOM_EQUIPMENT: EquipmentOption[] = BASE_EQUIPMENT_OPTIONS;

// Additional equipment suggestions that can be added as custom text
const SUGGESTED_EQUIPMENT = [
  "kettlebells", "medicine-ball", "resistance-bands", "battle-ropes",
  "agility-ladder", "rowing-machine", "spin-bike", "elliptical", 
  "pull-up-bar", "cable-machine", "stepper"
];

export default function SetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousSetup = useMemo(() => storage.getSetup(), []);
  const themeRef = useRef<string>(previousSetup?.theme ?? "gold");
  const defaultPalette = useMemo(
    () => getDefaultBrandColors(previousSetup?.theme),
    [previousSetup?.theme]
  );

  const [stationCount, setStationCount] = useState<number>(
    previousSetup?.stations.length ?? 6
  );
  const [stations, setStations] = useState<StationSetup[]>(() =>
    buildStationList(previousSetup?.stations.length ?? 6, previousSetup?.stations)
  );
  const [logoData, setLogoData] = useState<string | null>(previousSetup?.logo ?? null);
  const [theme, setTheme] = useState<string>(previousSetup?.theme ?? "gold");
  const [workTime, setWorkTime] = useState<number>(previousSetup?.workTime ?? 45);
  const [restTime, setRestTime] = useState<number>(previousSetup?.restTime ?? 20);
  const [rounds, setRounds] = useState<number>(previousSetup?.rounds ?? 1);
  const [facilityName, setFacilityName] = useState<string>(
    previousSetup?.facilityName ?? "RaceFit Warrior Series"
  );
  const [quote, setQuote] = useState<string>(
    previousSetup?.quote ??
      "Strength grows in the moments when you think you can't go on but you keep going anyway."
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    previousSetup?.colors?.primary ?? defaultPalette.primary
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    previousSetup?.colors?.secondary ?? defaultPalette.secondary
  );
  const [accentColor, setAccentColor] = useState<string>(
    previousSetup?.colors?.accent ?? defaultPalette.accent
  );
  const [headingFont, setHeadingFont] = useState<FontKey>(
    previousSetup?.fonts?.heading ?? DEFAULT_FONT_SETTINGS.heading
  );
  const [bodyFont, setBodyFont] = useState<FontKey>(
    previousSetup?.fonts?.body ?? DEFAULT_FONT_SETTINGS.body
  );
  const [numericFont, setNumericFont] = useState<FontKey>(
    previousSetup?.fonts?.numeric ?? DEFAULT_FONT_SETTINGS.numeric
  );

  // Manual equipment setup state
  const [customEquipment, setCustomEquipment] = useState<string>("");
  const [selectedCustomEquipment, setSelectedCustomEquipment] = useState<string[]>([]);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [videoLoadingStatus, setVideoLoadingStatus] = useState<string>("");
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentOption[]>(getAllEquipmentOptions());

  useEffect(() => {
    if (themeRef.current !== theme) {
      const palette = getDefaultBrandColors(theme);
      setPrimaryColor(palette.primary);
      setSecondaryColor(palette.secondary);
      setAccentColor(palette.accent);
      themeRef.current = theme;
    }
  }, [theme]);

  const handleStationCountChange = (value: number) => {
    const clamped = Math.min(Math.max(value, MIN_STATIONS), MAX_STATIONS);
    setStationCount(clamped);
    setStations((prev) => buildStationList(clamped, prev));
  };

  const handleEquipmentChange = (id: number, equipment: EquipmentOption) => {
    setStations((prev) =>
      prev.map((station) =>
        station.id === id
          ? {
              ...station,
              equipment,
            }
          : station
      )
    );
  };

  // Manual equipment setup functions
  const handleAddCustomEquipment = () => {
    if (customEquipment.trim() && !selectedCustomEquipment.includes(customEquipment.trim())) {
      const newEquipment = customEquipment.trim().toLowerCase();
      
      // Add to selected equipment
      setSelectedCustomEquipment(prev => [...prev, newEquipment]);
      
      // Add to global equipment library
      addCustomEquipment(newEquipment);
      
      // Add default exercise for this equipment
      addExerciseForEquipment(newEquipment);
      
      // Update available equipment options
      setAvailableEquipment(getAllEquipmentOptions());
      
      // Clear input
      setCustomEquipment("");
      
      // Show success message
      setVideoLoadingStatus(`Added "${newEquipment}" to the equipment library. It is now available in the station dropdowns.`);
    }
  };

  const handleRemoveCustomEquipment = (equipment: string) => {
    setSelectedCustomEquipment(prev => prev.filter(eq => eq !== equipment));
  };

  const handleAutoAssignEquipment = () => {
    if (selectedCustomEquipment.length === 0) return;
    
    const updatedStations = stations.map((station, index) => {
      const equipment = selectedCustomEquipment[index % selectedCustomEquipment.length];
      // Use the equipment directly (now supported by dynamic system)
      return {
        ...station,
        equipment: equipment as EquipmentOption
      };
    });
    
    // Update all selected equipment in the global library
    selectedCustomEquipment.forEach(eq => {
      addCustomEquipment(eq);
      addExerciseForEquipment(eq);
    });
    
    // Update available equipment
    setAvailableEquipment(getAllEquipmentOptions());
    
    setStations(updatedStations);
    setVideoLoadingStatus(`Auto-assigned ${selectedCustomEquipment.length} equipment types to ${stations.length} stations. All equipment is now available in the dropdowns.`);
  };

  const handleLoadVideos = async () => {
    setVideoLoadingStatus("Preparing video library...");
    
    try {
      const equipmentList = Array.from(new Set([
        ...stations.map(s => s.equipment),
        ...selectedCustomEquipment
      ]));
      
      setVideoLoadingStatus(`Copy your videos to: /public/videos/public/`);
      
      // Simulate checking for videos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show file naming instructions
      const fileInstructions = equipmentList.map(equipment => {
        const filename = equipment.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.mp4';
        return `${equipment} -> ${filename}`;
      }).join('\n');
      
      setVideoLoadingStatus(`Video instructions:\n\nLocal folder path:\n/Users/a11/exequte-hotel-1/public/videos/public/\n\nName your video files:\n${fileInstructions}\n\nTips:\n- Use .mp4 format\n- Keep filenames lowercase with dashes\n- Videos will auto-load in your app\n- File size under 50MB is recommended\n\nCurrent equipment needs ${equipmentList.length} videos\nExisting files: barbell shoulder press.mp4, bosu side plank hip drops.mp4, db-squat-woodchops.mp4, slow wide arm push up.mp4`);
      
    } catch (error) {
      setVideoLoadingStatus("Error preparing video instructions.");
    }
  };

  const handleDownloadFromWeb = async () => {
    setVideoLoadingStatus("Opening exercise video resources...");
    
    try {
      const equipmentList = Array.from(new Set([
        ...stations.map(s => s.equipment),
        ...selectedCustomEquipment
      ]));
      
      // Open useful websites for exercise videos
      const videoSources = [
        "https://www.youtube.com/results?search_query=exercise+demonstrations",
        "https://www.bodybuilding.com/exercises/",
        "https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/",
        "https://darebee.com/workouts.html"
      ];
      
      setVideoLoadingStatus(`Download from websites:\n\nRecommended video sources:\n- YouTube: exercise demonstrations\n- Bodybuilding.com: exercise library\n- ACE Fitness: professional exercises\n- Darebee: free workout videos\n\nSuggested search terms:\n${equipmentList.map(eq => `"${eq} exercise" OR "${eq} workout"`).join('\n')}\n\nDownload steps:\n1. Search for exercises using your equipment\n2. Download/save videos as .mp4 files\n3. Rename files to match the naming pattern\n4. Copy to: /public/videos/public/\n\nQuick tip: use reputable online downloaders for YouTube content.`);

      // Optional: Open the first source
      if (typeof window !== 'undefined') {
        window.open(videoSources[0], '_blank');
      }
      
    } catch (error) {
      setVideoLoadingStatus("Error opening video resources.");
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result;
      if (typeof base64 === "string") {
        setLogoData(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: WorkoutSetup = {
      stations,
      logo: logoData,
      theme,
      workTime,
      restTime,
      rounds,
      facilityName: facilityName.trim(),
      quote: quote.trim(),
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
      fonts: {
        heading: headingFont,
        body: bodyFont,
        numeric: numericFont,
      },
    };

    storage.saveSetup(payload);
    storage.clearSession();
    router.push("/builder");
  };

  const themeLabel = (value: string) =>
    value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <main
      className="body-font min-h-screen px-6 py-12 text-white"
      style={{
        background:
          "radial-gradient(1200px 800px at 50% 20%, rgba(0,175,255,0.12), transparent), linear-gradient(180deg,#05060a,#0b1420)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-white/10 bg-black/60 p-10 shadow-[0_0_45px_rgba(0,175,255,0.18)] backdrop-blur-md"
      >
        <header className="space-y-2 text-center">
          <p className="heading-font text-xs uppercase tracking-[0.4em] text-sky-400/70">Hotel Fitness Builder</p>
          <h1 className="heading-font text-4xl font-semibold text-slate-200">Setup Console</h1>
          <p className="text-sm text-slate-400">
            Configure stations, equipment, and branding before you launch a workout.
          </p>
          <Link
            href="/setup/console"
            className="text-sm font-semibold text-sky-300 underline-offset-4 transition hover:text-sky-100"
          >
            View Library Catalogs
          </Link>
        </header>

        <section className="grid gap-6 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_0_30px_rgba(0,175,255,0.18)] lg:grid-cols-2">
          <label className="flex flex-col gap-2 lg:col-span-2">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-400">Facility Name</span>
            <input
              className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
              value={facilityName}
              onChange={(event) => setFacilityName(event.target.value)}
              placeholder="e.g. MGM Sky Fitness"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-400">
              Number of Stations
            </span>
            <select
              className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
              value={stationCount}
              onChange={(event) => handleStationCountChange(Number(event.target.value))}
            >
              {Array.from({ length: MAX_STATIONS }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-400">Branding</span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-sky-400/60 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                Upload Logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {logoData && (
                <Image
                  src={logoData}
                  alt="Gym logo preview"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg border border-sky-400/30 bg-black/40 object-contain"
                />
              )}
            </div>

            <label className="flex flex-col gap-2">
              <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-400">Theme</span>
              <select
                className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                {THEMES.map((option) => (
                  <option key={option} value={option}>
                    {themeLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Primary Color</span>
                <input
                  type="color"
                  className="h-12 w-full cursor-pointer rounded border border-white/10 bg-transparent"
                  value={primaryColor}
                  onChange={(event) => setPrimaryColor(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Secondary Color</span>
                <input
                  type="color"
                  className="h-12 w-full cursor-pointer rounded border border-white/10 bg-transparent"
                  value={secondaryColor}
                  onChange={(event) => setSecondaryColor(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Accent Color</span>
                <input
                  type="color"
                  className="h-12 w-full cursor-pointer rounded border border-white/10 bg-transparent"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Heading Font</span>
                <select
                  className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                  value={headingFont}
                  onChange={(event) => setHeadingFont(event.target.value as FontKey)}
                >
                  {Object.entries(FONT_OPTIONS).map(([key, option]) => (
                    <option key={key} value={key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Body Font</span>
                <select
                  className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                  value={bodyFont}
                  onChange={(event) => setBodyFont(event.target.value as FontKey)}
                >
                  {Object.entries(FONT_OPTIONS).map(([key, option]) => (
                    <option key={key} value={key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Numeric Font</span>
                <select
                  className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                  value={numericFont}
                  onChange={(event) => setNumericFont(event.target.value as FontKey)}
                >
                  {Object.entries(FONT_OPTIONS).map(([key, option]) => (
                    <option key={key} value={key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_0_30px_rgba(0,175,255,0.18)] sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Work Time</span>
            <select
              className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
              value={workTime}
              onChange={(event) => setWorkTime(Number(event.target.value))}
            >
              {WORK_TIMES.map((value) => (
                <option key={value} value={value}>
                  {value} seconds
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Rest Time</span>
            <select
              className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
              value={restTime}
              onChange={(event) => setRestTime(Number(event.target.value))}
            >
              {REST_TIMES.map((value) => (
                <option key={value} value={value}>
                  {value} seconds
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Rounds</span>
            <select
              className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
              value={rounds}
              onChange={(event) => setRounds(Number(event.target.value))}
            >
              {ROUNDS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="flex flex-col gap-2">
          <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-400">Quote of the Day</span>
          <textarea
            className="min-h-[120px] rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            placeholder="Enter an inspirational quote to display on the workout screens."
          />
        </section>

        {/* Manual Equipment Setup Section */}
        <section className="rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_0_30px_rgba(0,175,255,0.18)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="heading-font text-lg uppercase tracking-[0.35em] text-sky-300 mb-2">Equipment Configuration</h3>
              <p className="text-sm text-slate-400">Manage facility equipment assignments and supporting media.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualSetup(!showManualSetup)}
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
            >
              {showManualSetup ? "Hide Tools" : "Open Tools"}
            </button>
          </div>

          {showManualSetup && (
            <div className="space-y-6">
              {/* Custom Equipment Input */}
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-2">
                  <label className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">Add Equipment Type</label>
                  <input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomEquipment()}
                    placeholder="e.g., rowing-machine, battle-ropes, kettlebells"
                    className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomEquipment}
                    className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    Add Equipment
                  </button>
                </div>
              </div>

              {/* Quick Select from Common Equipment */}
              <div>
                <label className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300 mb-3 block">Standard Equipment Types</label>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {CUSTOM_EQUIPMENT.map((equipment) => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => {
                        if (!selectedCustomEquipment.includes(equipment)) {
                          setSelectedCustomEquipment(prev => [...prev, equipment]);
                        }
                      }}
                      disabled={selectedCustomEquipment.includes(equipment)}
                      className={`rounded-lg border border-white/10 px-3 py-2 text-sm font-medium transition ${
                        selectedCustomEquipment.includes(equipment)
                          ? "bg-sky-500/30 text-sky-100 cursor-not-allowed"
                          : "bg-black/60 text-slate-200 hover:bg-black/70 hover:text-white"
                      }`}
                    >
                      {equipment.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Additional Equipment */}
              <div>
                <label className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300 mb-3 block">Additional Equipment (Custom)</label>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {SUGGESTED_EQUIPMENT.map((equipment) => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => {
                        if (!selectedCustomEquipment.includes(equipment)) {
                          // Add to selected equipment
                          setSelectedCustomEquipment(prev => [...prev, equipment]);
                          
                          // Add to global equipment library
                          addCustomEquipment(equipment);
                          addExerciseForEquipment(equipment);
                          
                          // Update available equipment
                          setAvailableEquipment(getAllEquipmentOptions());
                          
                          setVideoLoadingStatus(`Added "${equipment}" to the equipment library.`);
                        }
                      }}
                      disabled={selectedCustomEquipment.includes(equipment)}
                      className={`rounded-lg border border-white/10 px-3 py-2 text-sm font-medium transition ${
                        selectedCustomEquipment.includes(equipment)
                          ? "bg-sky-500/30 text-sky-100 cursor-not-allowed"
                          : "bg-black/60 text-slate-200 hover:bg-black/70 hover:text-white"
                      }`}
                    >
                      {equipment.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Equipment Display */}
              {selectedCustomEquipment.length > 0 && (
                <div>
                  <label className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300 mb-3 block">Selected Equipment ({selectedCustomEquipment.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomEquipment.map((equipment) => (
                      <div
                        key={equipment}
                        className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm"
                      >
                        <span className="text-sky-100">{equipment}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEquipment(equipment)}
                          className="text-xs text-sky-300 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {selectedCustomEquipment.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoAssignEquipment}
                    className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    Auto-Assign to Stations
                  </button>
                )}
                {stations.some((s) => s.equipment) && (
                  <>
                    <button
                      type="button"
                      onClick={handleLoadVideos}
                      className="rounded-lg bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                    >
                      Show Local Folder Instructions
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadFromWeb}
                      className="rounded-lg bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                    >
                      Download from Websites
                    </button>
                  </>
                )}
              </div>

              {/* Status Display */}
              {videoLoadingStatus && (
                <div className="rounded-lg border border-white/10 bg-black/70 p-4">
                  <p className="text-sm text-slate-200 whitespace-pre-line">{videoLoadingStatus}</p>
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                <h4 className="heading-font text-sm uppercase tracking-[0.3em] text-sky-300 mb-2">Equipment Library Status</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">Total Equipment Types</p>
                    <p className="text-lg font-bold text-sky-200">{availableEquipment.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Available in Dropdowns</p>
                    <p className="text-lg font-bold text-sky-200">Synced</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-slate-400 mb-1">Current Equipment</p>
                  <div className="flex flex-wrap gap-1">
                    {availableEquipment.slice(0, 8).map((eq) => (
                      <span key={eq} className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200">
                        {eq}
                      </span>
                    ))}
                    {availableEquipment.length > 8 && (
                      <span className="text-xs text-slate-400">+{availableEquipment.length - 8} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-[0_0_30px_rgba(0,175,255,0.18)] sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full mb-4">
            <h3 className="heading-font text-lg uppercase tracking-[0.35em] text-sky-300">Individual Station Configuration</h3>
            <p className="text-sm text-slate-400">Fine-tune equipment assignments for each station.</p>
          </div>
          {stations.map((station) => (
            <div
              key={station.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 p-5 shadow-[0_0_18px_rgba(0,175,255,0.12)]"
            >
              <span className="heading-font text-xs uppercase tracking-[0.35em] text-sky-300">
                Station {station.id}
              </span>
              <select
                className="rounded-lg border border-white/10 bg-black/70 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none"
                value={station.equipment}
                onChange={(event) =>
                  handleEquipmentChange(station.id, event.target.value as EquipmentOption)
                }
              >
                {availableEquipment.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>

        <div className="flex justify-center">
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(0,175,255,0.35)] transition hover:bg-sky-600"
          >
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}
