import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Circle, ChevronRight, Clock, Target, Watch, Activity, Apple, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import WearableDevices from "./WearableDevices";
import BodyMetrics from "@/components/BodyMetrics";
import NutritionPlanner from "@/components/NutritionPlanner";
import { WorkoutHistoryContent } from "@/components/WorkoutHistoryContent";
import NutritionDashboard from "@/components/NutritionDashboard";
import whoopLogo from "@/assets/whoop-logo.png";

const Body = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "workouts";

  const workoutProgram = [
    {
      day: 1,
      title: "Core Stability",
      duration: "60-70 min",
      focus: "Foundation of core stability—the keel of your body",
      completed: false,
      blocks: [
        { name: "Warm Up", exercises: ["Cat-cow — 8 reps", "Thread-the-needle — 4 reps/side", "World's greatest lunge — 2 reps/side"] },
        { name: "Block 1", exercises: ["Plank Hold w/ Shoulder Taps — 3×30–45s", "Hollow Rocks — 3×12–15"] },
        { name: "Block 2", exercises: ["Side Plank (each side) — 3×30s", "Russian Twists (weighted) — 3×20"] },
        { name: "Block 3", exercises: ["Dead Bugs — 3×10 per side"] },
        { name: "Cool Down", exercises: ["Child's pose — 30s", "Hip flexor stretch — 30s/side", "Hamstring hinge fold — 30s", "Box breathing — 3 rounds"] },
      ],
      note: "Core is your keel. Lock it in and every other movement becomes more stable.",
    },
    {
      day: 2,
      title: "Grip & Pull Power",
      duration: "60-70 min",
      focus: "Build grip endurance + pulling power for trimming",
      completed: false,
      blocks: [
        { name: "Warm Up", exercises: ["Band pull-aparts — 15 reps", "Scap push-ups — 10 reps", "Farmer carries — 2×20m"] },
        { name: "Block 1", exercises: ["Farmer Carries — 4×40m", "Pull-ups (or Band Rows) — 3×8–12"] },
        { name: "Block 2", exercises: ["Bent-over Rows — 3×10–12", "KB Swings — 3×15"] },
        { name: "Block 3", exercises: ["Box Jumps — 3×8", "Broad Jumps — 3×8"] },
        { name: "Cool Down", exercises: ["Forearm stretches — 30s", "Grip openers — 30s", "Pec doorway stretch — 30s"] },
      ],
      note: "Grip = trimming strength. Every rep builds your ability to hold tension longer.",
    },
    {
      day: 3,
      title: "Leg Drive & Balance",
      duration: "60-70 min",
      focus: "Lower-body endurance for hiking power and stable balance",
      completed: false,
      blocks: [
        { name: "Warm Up", exercises: ["Bodyweight squats — 20 reps", "Glute bridges — 20 reps", "Walking lunges — 10/leg"] },
        { name: "Block 1", exercises: ["Split squats — 3×12/leg", "Wall sit — 3×45–60s", "Walking lunges — 3×12/leg"] },
        { name: "Block 2", exercises: ["Bulgarian split squat — 3×10/leg", "Step-ups (knee drive) — 3×10/leg"] },
        { name: "Block 3", exercises: ["Broad jumps — 4×8", "Lateral bounds — 3×12/side", "Calf raises — 3×20"] },
        { name: "Cool Down", exercises: ["Quad stretch — 45s/side", "Pigeon pose — 45s/side", "Calf stretch — 45s/side"] },
      ],
      note: "Legs are your engine—drive hard, stay balanced.",
    },
    {
      day: 4,
      title: "Back & Biceps Pull Power",
      duration: "60 min",
      focus: "Lats, upper back, biceps for trimming sheets and pulling halyards",
      completed: false,
      blocks: [
        { name: "Block 1 (AMRAP 10min)", exercises: ["Pull-Ups — 12 reps", "Barbell Row — 12 reps", "KB Hammer Curls — 12 reps"] },
        { name: "Block 2 (4×8)", exercises: ["Deadlift", "Lat Pulldown", "Single Arm DB Row"] },
        { name: "Block 3 (3 rounds)", exercises: ["Banded Face Pulls — 3×15", "EZ Bar Curls — 3×12", "Chin-Ups — Max reps"] },
        { name: "Finisher", exercises: ["Max Pull-Ups in 3 minutes"] },
      ],
      note: "Pull with your lats, not just arms. Keep back flat, chest up on rows.",
    },
    {
      day: 5,
      title: "Active Recovery",
      duration: "30-40 min",
      focus: "Light movement, mobility, and mental reset",
      completed: false,
      blocks: [
        { name: "Movement", exercises: ["20-30 min easy cardio (walk, bike, swim)", "Foam rolling — 10 min"] },
        { name: "Mobility", exercises: ["Hip openers", "Shoulder circles", "Spinal twists"] },
      ],
      note: "Recovery is training. Move light, breathe deep, prepare for tomorrow.",
    },
    {
      day: 6,
      title: "Chest & Shoulders Press",
      duration: "60-70 min",
      focus: "Upper body pushing power for spinnaker work and control",
      completed: false,
      blocks: [
        { name: "Block 1", exercises: ["Bench Press — 4×8", "Overhead Press — 4×8"] },
        { name: "Block 2", exercises: ["Incline DB Press — 3×10", "Arnold Press — 3×12"] },
        { name: "Block 3", exercises: ["Push-ups — 3×15", "Lateral Raises — 3×15", "Front Raises — 3×12"] },
      ],
      note: "Press with purpose. Chest and shoulders power your upper body control.",
    },
    {
      day: 7,
      title: "Full Body Power Circuit",
      duration: "50-60 min",
      focus: "Explosive power and cardiovascular endurance",
      completed: false,
      blocks: [
        { name: "Circuit (4 rounds)", exercises: ["KB Swings — 15", "Box Jumps — 10", "Battle Ropes — 30s", "Burpees — 10", "Rest — 90s"] },
        { name: "Finisher", exercises: ["500m row for time"] },
      ],
      note: "Bring it all together. Power + conditioning = race-ready.",
    },
    {
      day: 8,
      title: "Endurance & Stamina",
      duration: "45-60 min",
      focus: "Build the endurance to outlast the competition",
      completed: false,
      blocks: [
        { name: "Main Set", exercises: ["30 min steady cardio (row, bike, run)", "Every 5 min: 20 jump squats"] },
        { name: "Core Finisher", exercises: ["Plank hold — 2 min", "Russian twists — 2×50"] },
      ],
      note: "Long races require deep tanks. Build yours here.",
    },
    {
      day: 9,
      title: "Peak Performance Test",
      duration: "60 min",
      focus: "Test your progress and celebrate your gains",
      completed: false,
      blocks: [
        { name: "Tests", exercises: ["Max Pull-ups", "Max Plank Hold", "500m Row for Time", "Max Wall Sit"] },
        { name: "Cool Down", exercises: ["Full body stretch — 15 min", "Reflection time"] },
      ],
      note: "You've earned this. Test your limits and see how far you've come.",
    },
  ];

  const completedCount = workoutProgram.filter(w => w.completed).length;
  const progress = (completedCount / workoutProgram.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Body Training</h1>
          <p className="text-muted-foreground">Sailing fitness program</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30 shadow-medium">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{completedCount} of 9 days completed</span>
              </div>
              <Progress value={progress} className="h-2 bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workouts" onClick={() => navigate("/body?tab=workouts")}>
            Workouts
          </TabsTrigger>
          <TabsTrigger value="history" onClick={() => navigate("/body?tab=history")}>
            <Activity className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="metrics" onClick={() => navigate("/body?tab=metrics")}>
            <Activity className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="health" onClick={() => navigate("/body?tab=health")}>
            <Apple className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="nutrition" onClick={() => navigate("/body?tab=nutrition")}>
            <Apple className="h-4 w-4 mr-2" />
            Plan
          </TabsTrigger>
          <TabsTrigger value="devices" onClick={() => navigate("/body?tab=devices")}>
            <Watch className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-6">
          {/* Fitness Test Card */}
          <Card className="overflow-hidden shadow-strong border-2 border-primary/30">
            <div className="bg-gradient-to-r from-primary via-primary-light to-primary p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-1 bg-black/30 text-white border-white/20">Fitness Test</Badge>
                  <h2 className="text-xl font-bold">Fitness Assessment</h2>
                </div>
                <div className="flex items-center gap-2 text-sm bg-black/20 px-3 py-2 rounded-lg">
                  <Target className="h-4 w-4" />
                  <span>10 Tests</span>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Track your baseline and progress</p>
              <Button
                onClick={() => navigate('/fitness-test')}
                className="w-full bg-gradient-to-r from-primary to-primary-light text-white hover:opacity-90 h-12"
              >
                <Play className="mr-2 h-4 w-4" />
                Open Fitness Test
              </Button>
            </CardContent>
          </Card>

          {/* Workout Days Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Days</CardTitle>
              <p className="text-sm text-muted-foreground">Expand each day to view exercises and start training</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {workoutProgram.map((workout) => (
                  <AccordionItem key={workout.day} value={`day-${workout.day}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {workout.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <p className="font-semibold">Day {workout.day}: {workout.title}</p>
                            <p className="text-sm text-muted-foreground">{workout.duration}</p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">{workout.focus}</p>

                        {/* Workout Blocks */}
                        <Accordion type="single" collapsible className="border-l-2 border-primary/20 pl-4">
                          {workout.blocks.map((block, index) => (
                            <AccordionItem key={index} value={`block-${index}`} className="border-b-0">
                              <AccordionTrigger className="py-2 text-sm font-medium">
                                {block.name}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1 pl-2">
                                  {block.exercises.map((exercise, exIndex) => (
                                    <div key={exIndex} className="flex items-start gap-2 text-sm">
                                      <Circle className="h-2 w-2 mt-1.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-muted-foreground">{exercise}</span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>

                        {/* Coach's Note */}
                        <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                          <p className="text-xs font-medium text-accent mb-1">Coach&apos;s Note</p>
                          <p className="text-xs text-foreground">{workout.note}</p>
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            navigate(`/workout-tracker?day=${workout.day}`);
                          }}
                          className="w-full bg-gradient-to-r from-primary to-primary-light text-white hover:opacity-90 h-12"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {workout.completed ? "Review Workout" : "Start Workout"}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <WorkoutHistoryContent />
        </TabsContent>

        <TabsContent value="metrics">
          <BodyMetrics />
        </TabsContent>

        <TabsContent value="health">
          <NutritionDashboard />
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionPlanner />
        </TabsContent>

        <TabsContent value="devices">
          <WearableDevices />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Body;
