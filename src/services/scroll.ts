/**
 * Smooth custom ease scroll utility for fluid navigation motions
 */
export function smoothScrollTo(
  target: string | HTMLElement | number,
  duration = 850,
  offset = 72
) {
  let targetPosition = 0;

  if (typeof target === 'number') {
    targetPosition = Math.max(0, target);
  } else if (typeof target === 'string') {
    const cleanId = target.replace(/^#/, '');
    const element = document.getElementById(cleanId);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    targetPosition = Math.max(0, rect.top + window.pageYOffset - offset);
  } else if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    targetPosition = Math.max(0, rect.top + window.pageYOffset - offset);
  }

  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;

  if (Math.abs(distance) < 2) {
    window.scrollTo(0, targetPosition);
    return;
  }

  let startTime: number | null = null;

  // Easing function: Cubic Ease-In-Out for natural acceleration & deceleration
  function easeInOutCubic(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t * t + b;
    t -= 2;
    return (c / 2) * (t * t * t + 2) + b;
  }

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
    
    window.scrollTo(0, run);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      window.scrollTo(0, targetPosition);
    }
  }

  requestAnimationFrame(animation);
}
