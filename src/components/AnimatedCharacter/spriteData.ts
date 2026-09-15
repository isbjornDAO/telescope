export type CharacterAnimation = "walk" | "jump";

export interface FrameData {
  /** Source X position in the spritesheet */
  x: number;
  /** Source Y position in the spritesheet */
  y: number;
  /** Source width in the spritesheet */
  w: number;
  /** Source height in the spritesheet */
  h: number;
  /** Ground baseline Y in the spritesheet */
  groundY: number;
}

export interface AnimationConfig {
  name: CharacterAnimation;
  frameCount: number;
  fps: number;
  loop: boolean;
  spritesheetSrc: string;
  frames: FrameData[];
  frameUrls: string[];
}

export const SPRITE_CANVAS_WIDTH = 140;
export const SPRITE_CANVAS_HEIGHT = 220;
export const SPRITE_BASELINE_Y = 210;

export const ANIMATIONS: Record<CharacterAnimation, AnimationConfig> = {
  walk: {
    name: "walk",
    frameCount: 6,
    fps: 8,
    loop: true,
    spritesheetSrc: "/test/walk.png",
    frames: [
      { x: 7, y: 8, w: 117, h: 175, groundY: 183 },
      { x: 157, y: 9, w: 105, h: 175, groundY: 183 },
      { x: 309, y: 8, w: 86, h: 176, groundY: 183 },
      { x: 446, y: 9, w: 96, h: 176, groundY: 184 },
      { x: 581, y: 11, w: 108, h: 173, groundY: 183 },
      { x: 735, y: 9, w: 87, h: 176, groundY: 184 },
    ],
    frameUrls: [
      "/test/walk_0.png",
      "/test/walk_1.png",
      "/test/walk_2.png",
      "/test/walk_3.png",
      "/test/walk_4.png",
      "/test/walk_5.png",
    ],
  },
  jump: {
    name: "jump",
    frameCount: 6,
    fps: 10,
    loop: false,
    spritesheetSrc: "/test/jump.png",
    frames: [
      { x: 12, y: 37, w: 83, h: 170, groundY: 206 },
      { x: 146, y: 58, w: 111, h: 149, groundY: 206 },
      { x: 294, y: 56, w: 110, h: 151, groundY: 206 },
      { x: 447, y: 4, w: 90, h: 168, groundY: 206 }, // Airborne jump frame
      { x: 578, y: 50, w: 108, h: 157, groundY: 206 },
      { x: 721, y: 62, w: 116, h: 145, groundY: 206 },
    ],
    frameUrls: [
      "/test/jump_0.png",
      "/test/jump_1.png",
      "/test/jump_2.png",
      "/test/jump_3.png",
      "/test/jump_4.png",
      "/test/jump_5.png",
    ],
  },
};
