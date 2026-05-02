// Hand-curated panel content per vision sceneId. Each scene is a small
// number of short panels — the 3D room is for impression, not reading.
// The full text remains available via "skip to text".

import type { Panel } from "@/components/three/VisionRoomScene";

export const scenes: Record<string, Panel[]> = {
  "focus-statement": [
    {
      title: "The takeoff isn't taking off for everyone",
      body: "We're in the steepest technoevolutionary leap in the observable universe — and most of the leap is locked away.",
    },
    {
      title: "A $1,000 humanoid robot",
      body: "Vertically integrated hydraulic actuators, a self-built prime mover, and machine-learning architectures designed for the hardware they run on.",
    },
    {
      title: "Why the price floor matters",
      body: "If embodied general-purpose intelligence costs less than the median household budget, the question of who benefits stops being a question.",
    },
    {
      title: "On-demand swarm",
      body: "An Uber-shaped utility model: people request the robot when they need it, the robot returns to its owner when they don't.",
    },
    {
      title: "The next milestone",
      body: "Prototype 3, manufacturable in batches of 100, demonstrated under real households in real time.",
    },
  ],
};

export function panelsFor(sceneId: string | undefined): Panel[] | null {
  if (!sceneId) return null;
  return scenes[sceneId] ?? null;
}
