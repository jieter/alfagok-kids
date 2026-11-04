// Burst of confetti out of the given element, falling down with gravity.
export function confetti(origin: HTMLElement): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#e85d45", "#ffbf47", "#a8d8a2", "#2b8a4e", "#6ea8fe", "#ff9a8b"];
  const banner = origin.getBoundingClientRect();
  // Air drag slows the pieces down quickly, after which they flutter down at fallSpeed.
  const drag = 2;
  const fallSpeed = 350;
  const duration = 4.5;
  for (let i = 0; i < 250; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${banner.left + Math.random() * banner.width}px`;
    piece.style.top = `${banner.top + Math.random() * banner.height}px`;
    piece.style.background = colors[i % colors.length];
    document.body.append(piece);

    // mostly upwards, a bit to the sides
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 1000 + Math.random() * 1400;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 1440;
    const keyframes: Keyframe[] = [];
    for (let step = 0; step <= 30; step++) {
      const t = (duration * step) / 30;
      const slowdown = (1 - Math.exp(-drag * t)) / drag;
      const x = vx * slowdown;
      const y = (vy - fallSpeed) * slowdown + fallSpeed * t;
      keyframes.push({
        transform: `translate(${x}px, ${y}px) rotate(${(spin * step) / 30}deg)`,
        opacity: step === 30 ? 0 : 1,
      });
    }
    piece.animate(keyframes, { duration: duration * 1000, easing: "linear" }).finished.then(() => piece.remove());
  }
}
