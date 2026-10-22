export type Muscle = "legs" | "push" | "pull";
export type Exercise = {
  id: string;
  name: string;
  equipment: string;
  muscle: Muscle;
  level: 1 | 2; // 1 = easiest, least intimidating (machines)
  setup: string[];
  tip: string;
  startKg: number; // per hand for dumbbells
  maxKg: number;
  step: number; // how much to add after a perfect session
};

export const EXERCISES: Exercise[] = [
  { id: "leg-press", name: "Leg Press", equipment: "Leg press machine", muscle: "legs", level: 1, startKg: 40, maxKg: 140, step: 5,
    setup: ["Sit back in the seat and place your feet shoulder-width apart in the middle of the platform.", "Release the safety handles and lower the platform until your knees bend about 90 degrees.", "Push through your heels until your legs are almost straight. Don't lock your knees."],
    tip: "Keep your lower back pressed into the seat the whole time." },
  { id: "leg-extension", name: "Leg Extension", equipment: "Leg extension machine", muscle: "legs", level: 1, startKg: 15, maxKg: 60, step: 2.5,
    setup: ["Sit so your knees line up with the round pivot on the side of the machine.", "Rest the pad on your lower shins, just above your feet.", "Straighten your legs, pause, then lower slowly."],
    tip: "Go slow on the way down. That's where the work is." },
  { id: "leg-curl", name: "Seated Leg Curl", equipment: "Seated leg curl machine", muscle: "legs", level: 1, startKg: 15, maxKg: 60, step: 2.5,
    setup: ["Sit down and set the pad just above your heels.", "Lower the thigh pad so it holds your legs in place.", "Pull your heels back and down, then let them rise slowly."],
    tip: "Don't let your hips lift off the seat." },
  { id: "goblet-squat", name: "Goblet Squat", equipment: "One dumbbell", muscle: "legs", level: 2, startKg: 8, maxKg: 28, step: 2,
    setup: ["Hold one dumbbell upright against your chest with both hands.", "Stand with feet slightly wider than your shoulders, toes turned out a little.", "Sit down between your knees, keep your chest tall, then stand back up."],
    tip: "Weight shown is the single dumbbell." },
  { id: "romanian-deadlift", name: "Dumbbell Romanian Deadlift", equipment: "Two dumbbells", muscle: "legs", level: 2, startKg: 6, maxKg: 24, step: 2,
    setup: ["Hold a dumbbell in each hand in front of your thighs, knees soft.", "Push your hips back and slide the dumbbells down your legs until you feel a stretch behind your thighs.", "Squeeze your glutes to stand tall again."],
    tip: "Weight shown is per hand. Keep your back flat, never rounded." },
  { id: "calf-raise", name: "Calf Raise", equipment: "Seated or standing calf raise machine", muscle: "legs", level: 1, startKg: 20, maxKg: 100, step: 5,
    setup: ["Set the pad so it rests on your thighs (seated) or shoulders (standing).", "Place the balls of your feet on the platform edge.", "Rise onto your toes, pause, then lower your heels below the platform."],
    tip: "Full stretch at the bottom, full squeeze at the top." },
  { id: "chest-press", name: "Chest Press", equipment: "Seated chest press machine", muscle: "push", level: 1, startKg: 20, maxKg: 80, step: 2.5,
    setup: ["Sit and adjust the seat so the handles are level with the middle of your chest.", "Keep your back flat against the pad and feet flat on the floor.", "Push the handles forward until your arms are almost straight, then bring them back slowly."],
    tip: "Don't let your shoulders roll forward." },
  { id: "shoulder-press", name: "Shoulder Press", equipment: "Seated shoulder press machine", muscle: "push", level: 1, startKg: 10, maxKg: 50, step: 2.5,
    setup: ["Adjust the seat so the handles start at about shoulder height.", "Keep your back against the pad.", "Press the handles up until your arms are almost straight, then lower slowly."],
    tip: "Keep your ribs down. Don't arch your back." },
  { id: "pec-deck", name: "Pec Deck (Chest Fly)", equipment: "Pec deck / butterfly machine", muscle: "push", level: 1, startKg: 15, maxKg: 55, step: 2.5,
    setup: ["Sit with your back flat and set the seat so the handles are at chest height.", "Place your forearms or hands on the pads with elbows slightly bent.", "Bring the handles together in front of you, pause, then open slowly."],
    tip: "Think about hugging a big tree." },
  { id: "db-bench-press", name: "Dumbbell Bench Press", equipment: "Flat bench + two dumbbells", muscle: "push", level: 2, startKg: 6, maxKg: 30, step: 2,
    setup: ["Sit on the bench with the dumbbells on your thighs, then lie back and bring them to chest level.", "Plant your feet flat and keep your shoulder blades pulled together.", "Press up until your arms are almost straight, then lower with control."],
    tip: "Weight shown is per hand. Ask someone to spot you if the weights get heavy." },
  { id: "tricep-pushdown", name: "Triceps Pushdown", equipment: "Cable machine with rope or bar", muscle: "push", level: 2, startKg: 10, maxKg: 40, step: 2.5,
    setup: ["Set the cable at the top and attach the rope or short bar.", "Stand close, elbows tucked at your sides.", "Push down until your arms are straight, then let the handle rise slowly."],
    tip: "Only your forearms move. Keep your elbows glued to your sides." },
  { id: "lat-pulldown", name: "Lat Pulldown", equipment: "Lat pulldown machine", muscle: "pull", level: 1, startKg: 20, maxKg: 80, step: 2.5,
    setup: ["Sit down and lower the thigh pad so it holds your legs snugly.", "Grab the bar a little wider than your shoulders.", "Pull the bar to your upper chest, then let it rise slowly."],
    tip: "Pull with your elbows, not your hands." },
  { id: "seated-row", name: "Seated Row", equipment: "Seated cable row machine", muscle: "pull", level: 1, startKg: 20, maxKg: 80, step: 2.5,
    setup: ["Sit with your feet on the footrests and knees slightly bent.", "Grab the handle and sit up tall with your chest out.", "Pull the handle to your belly button, squeeze your shoulder blades, then return slowly."],
    tip: "Don't lean back to cheat the weight." },
  { id: "face-pull", name: "Face Pull", equipment: "Cable machine with rope", muscle: "pull", level: 2, startKg: 7.5, maxKg: 30, step: 2.5,
    setup: ["Set the cable at about face height and attach the rope.", "Step back until the weight is lifted, arms straight in front.", "Pull the rope toward your face, elbows high, then return slowly."],
    tip: "Light weight, good form. It's great for your shoulders." },
  { id: "biceps-curl", name: "Dumbbell Biceps Curl", equipment: "Two dumbbells", muscle: "pull", level: 2, startKg: 4, maxKg: 16, step: 2,
    setup: ["Stand tall holding a dumbbell in each hand, palms facing forward.", "Keep your elbows at your sides and curl the weights up.", "Lower them slowly until your arms are straight."],
    tip: "Weight shown is per hand. No swinging." },
];

export const EXERCISE_IDS = EXERCISES.map((e) => e.id);
export const byId = (id: string) => EXERCISES.find((e) => e.id === id);
