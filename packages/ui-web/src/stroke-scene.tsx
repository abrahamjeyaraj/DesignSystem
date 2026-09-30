import * as React from 'react';

/**
 * DSStrokeScene plays a line-art scene produced by ds-art: each stroke draws itself on during its
 * own window of a 0..1 timeline (stroke-dashoffset over pathLength 1, the same model as SwiftUI
 * `trim` and Compose `PathMeasure.getSegment`). Colour comes from `currentColor`.
 */

export type DSPoint = readonly [number, number];
export type DSWindow = readonly [number, number];
export interface DSSceneStroke {
  readonly d: string;
  readonly width: number;
  readonly window: DSWindow;
  readonly faint?: number;
  readonly group?: string;
  readonly fill?: boolean;
}
export interface DSSceneFly {
  readonly from: DSPoint;
  readonly ctrl: DSPoint;
  readonly to: DSPoint;
  readonly radius: number;
  readonly window: DSWindow;
  readonly group?: string;
}
export interface DSSceneKeyframe {
  readonly t: number;
  readonly rotate?: number;
  readonly origin?: DSPoint;
  readonly translate?: DSPoint;
  readonly opacity?: number;
}
export interface DSScene {
  readonly schema: number;
  readonly id: string;
  readonly viewBox: readonly [number, number, number, number];
  readonly strokes: readonly DSSceneStroke[];
  readonly flies?: readonly DSSceneFly[];
  readonly groups?: Readonly<Record<string, { readonly keyframes: readonly DSSceneKeyframe[] }>>;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const round = (x: number) => +x.toFixed(4);

/** Progress of one stroke (0..1) at global time t. */
export function strokeProgress(t: number, [start, end]: DSWindow): number {
  if (end <= start) return t >= end ? 1 : 0;
  return clamp01((t - start) / (end - start));
}

/** Point on a fly's quadratic curve at local progress p. */
export function flyPoint(f: DSSceneFly, p: number): [number, number] {
  const u = 1 - p;
  const at = (i: 0 | 1) => round(u * u * f.from[i] + 2 * u * p * f.ctrl[i] + p * p * f.to[i]);
  return [at(0), at(1)];
}

export interface DSGroupState {
  rotate: number;
  translate: [number, number];
  origin: [number, number];
  opacity: number;
}

/** A group's transform and opacity at time t, linear between keyframes and held at the ends. */
export function groupState(group: { readonly keyframes: readonly DSSceneKeyframe[] }, t: number): DSGroupState {
  const frames = group.keyframes;
  const state = (k: DSSceneKeyframe): DSGroupState => ({
    rotate: k.rotate ?? 0,
    translate: [k.translate?.[0] ?? 0, k.translate?.[1] ?? 0],
    origin: [k.origin?.[0] ?? 0, k.origin?.[1] ?? 0],
    opacity: k.opacity ?? 1,
  });
  if (!frames.length) return { rotate: 0, translate: [0, 0], origin: [0, 0], opacity: 1 };
  if (t <= frames[0].t) return state(frames[0]);
  const last = frames[frames.length - 1];
  if (t >= last.t) return state(last);
  const i = frames.findIndex((k) => k.t > t);
  const [a, b] = [state(frames[i - 1]), state(frames[i])];
  const f = (t - frames[i - 1].t) / (frames[i].t - frames[i - 1].t);
  const mix = (x: number, y: number) => round(x + (y - x) * f);
  return {
    rotate: mix(a.rotate, b.rotate),
    translate: [mix(a.translate[0], b.translate[0]), mix(a.translate[1], b.translate[1])],
    origin: [mix(a.origin[0], b.origin[0]), mix(a.origin[1], b.origin[1])],
    opacity: mix(a.opacity, b.opacity),
  };
}

function transformOf(s: DSGroupState): string | undefined {
  const parts: string[] = [];
  if (s.rotate) parts.push(`rotate(${s.rotate} ${s.origin[0]} ${s.origin[1]})`);
  if (s.translate[0] || s.translate[1]) parts.push(`translate(${s.translate[0]} ${s.translate[1]})`);
  return parts.length ? parts.join(' ') : undefined;
}

function usePlayback(progress: number | undefined, duration: number): number {
  const [t, setT] = React.useState(progress ?? 0);
  React.useEffect(() => {
    if (progress !== undefined) {
      setT(progress);
      return;
    }
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = clamp01((now - start) / duration);
      setT(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress, duration]);
  return progress ?? t;
}

export interface DSStrokeSceneProps extends Omit<React.SVGProps<SVGSVGElement>, 'viewBox'> {
  scene: DSScene;
  /** Timeline position 0..1. Omit to play once over `duration` (reduced motion shows the end). */
  progress?: number;
  duration?: number;
  /** Accessible description. Omit for decorative scenes, which are hidden from assistive tech. */
  label?: string;
}

export function DSStrokeScene({ scene, progress, duration = 2400, label, ...rest }: DSStrokeSceneProps) {
  const t = usePlayback(progress, duration);
  const order: string[] = [];
  const buckets: Record<string, React.ReactNode[]> = {};
  const add = (group: string | undefined, node: React.ReactNode) => {
    const key = group ?? '';
    if (!buckets[key]) {
      buckets[key] = [];
      order.push(key);
    }
    buckets[key].push(node);
  };

  scene.strokes.forEach((s, i) => {
    const p = strokeProgress(t, s.window);
    add(
      s.group,
      <path
        key={`s${i}`}
        d={s.d}
        pathLength={1}
        strokeWidth={s.width}
        strokeDasharray="1"
        strokeDashoffset={round(1 - p)}
        strokeOpacity={s.faint}
        fill={s.fill ? 'currentColor' : undefined}
        fillOpacity={s.fill ? round(p) : undefined}
      />,
    );
  });
  scene.flies?.forEach((f, i) => {
    if (t < f.window[0]) return;
    const [cx, cy] = flyPoint(f, strokeProgress(t, f.window));
    add(f.group, <circle key={`f${i}`} cx={cx} cy={cy} r={f.radius} fill="currentColor" stroke="none" />);
  });

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      viewBox={scene.viewBox.join(' ')}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
      {...rest}
    >
      {order.map((key) => {
        const group = key ? scene.groups?.[key] : undefined;
        if (!group) return <React.Fragment key={`g-${key}`}>{buckets[key]}</React.Fragment>;
        const state = groupState(group, t);
        return (
          <g key={`g-${key}`} transform={transformOf(state)} opacity={state.opacity === 1 ? undefined : state.opacity}>
            {buckets[key]}
          </g>
        );
      })}
    </svg>
  );
}
