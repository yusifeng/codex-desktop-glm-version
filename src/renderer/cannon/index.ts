// Celebration confetti cannon. Release chunk: cannon-83a86e614bd8.js.
import "@rchunk/rolldown-runtime";

interface CannonOptions {
  emojis?: string[];
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color?: string;
  emoji?: string;
  radius: number;
  createdAt: number;
}
let cleanupActiveCannon: (() => void) | undefined;
const defaultEmojis = ["🦄", "✨", "🎉", "🚀"];
const colors = [
  "#FF1E56",
  "#FF8230",
  "#FFCF32",
  "#37D672",
  "#28BCD9",
  "#4885F7",
  "#A95DEC",
  "#F65AAA",
];
const random = (minimum: number, maximum: number) =>
  Math.random() * (maximum - minimum) + minimum;

function fireConfettiCannon({ emojis = defaultEmojis }: CannonOptions = {}):
  | {
      fired: false;
      reason: "reduced-motion" | "window-not-visible" | "canvas-unavailable";
    }
  | { fired: true } {
  cleanupActiveCannon?.();
  const reducedMotion = document.documentElement.dataset.reducedMotion;
  if (
    reducedMotion == null
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : reducedMotion === "true"
  )
    return { fired: false, reason: "reduced-motion" };
  if (document.visibilityState !== "visible") {
    return { fired: false, reason: "window-not-visible" };
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return { fired: false, reason: "canvas-unavailable" };
  canvas.className =
    "pointer-events-none fixed inset-0 z-(--max-app-overlay-z-index) size-full";
  canvas.setAttribute("aria-hidden", "true");
  canvas.inert = true;
  document.body.append(canvas);
  const particles: Particle[] = [];
  const width = Math.max(
    canvas.getBoundingClientRect().width,
    window.innerWidth,
    1,
  );
  const height = Math.max(
    canvas.getBoundingClientRect().height,
    window.innerHeight,
    1,
  );
  const addBurst = (count: number, emojiValues: string[]) => {
    for (let index = 0; index < count; index += 1) {
      const fromLeft = index % 2 === 0;
      particles.push({
        x: fromLeft ? 0 : width,
        y: (height * 5) / 7,
        vx: (fromLeft ? 1 : -1) * random(0.9, 1.7),
        vy: random(-1.5, -0.7),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(0.03, 0.07),
        color: emojiValues.length ? undefined : colors[index % colors.length],
        emoji: emojiValues.length
          ? emojiValues[index % emojiValues.length]
          : undefined,
        radius: 6,
        createdAt: performance.now(),
      });
    }
  };
  addBurst(200, []);
  if (emojis.length) addBurst(50, emojis);
  let frame = 0;
  let previous = performance.now();
  const draw = (now: number) => {
    const delta = Math.min(now - previous, 32);
    previous = now;
    const ratio = window.devicePixelRatio;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const particle of particles) {
      particle.vy += 0.00125 * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.rotationSpeed * delta;
      if (particle.emoji) {
        context.save();
        context.translate(particle.x * ratio, particle.y * ratio);
        context.rotate(particle.rotation);
        context.font = 72 * ratio + "px serif";
        context.textAlign = "center";
        context.fillText(particle.emoji, 0, 0);
        context.restore();
      } else {
        context.fillStyle = particle.color ?? colors[0];
        context.beginPath();
        context.ellipse(
          particle.x * ratio,
          particle.y * ratio,
          particle.radius * ratio,
          Math.max(
            0.5,
            Math.abs(Math.cos(particle.rotation)) * particle.radius,
          ) * ratio,
          particle.rotation,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }
    frame = window.requestAnimationFrame(draw);
  };
  frame = window.requestAnimationFrame(draw);
  const timeout = window.setTimeout(cleanup, 3_500);
  function cleanup() {
    cleanupActiveCannon = undefined;
    window.clearTimeout(timeout);
    window.cancelAnimationFrame(frame);
    canvas.remove();
  }
  cleanupActiveCannon = cleanup;
  return { fired: true };
}

export { fireConfettiCannon };
