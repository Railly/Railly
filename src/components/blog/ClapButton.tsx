import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ClapButtonProps {
	slug: string;
}

const isDev = () => {
	if (typeof window === "undefined") return false;
	return (
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
	);
};

const MAX_SESSION_CLAPS = 50;
const DEBOUNCE_MS = 600;
const PITCH_RESET_MS = 2000;
const PARTICLE_COUNT = 5;

function OdometerDigit({ value }: { value: number }) {
	return (
		<div className="h-[1.2em] overflow-hidden inline-block">
			<motion.div
				animate={{ y: `${-value * 1.2}em` }}
				transition={{ type: "spring", damping: 20, stiffness: 300 }}
			>
				{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
					<div key={d} className="h-[1.2em] leading-[1.2em] text-center">
						{d}
					</div>
				))}
			</motion.div>
		</div>
	);
}

function OdometerNumber({ value }: { value: number }) {
	const digits = String(value).split("").map(Number);
	return (
		<span className="inline-flex font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
			{digits.map((d, i) => (
				<OdometerDigit key={`${digits.length}-${i}`} value={d} />
			))}
		</span>
	);
}

function ClapIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 512 512"
			className="transition-colors duration-150"
		>
			<path
				d="M336 16l0 64c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64c0-8.8 7.2-16 16-16s16 7.2 16 16zm-98.7 7.1l32 48c4.9 7.4 2.9 17.3-4.4 22.2s-17.3 2.9-22.2-4.4l-32-48c-4.9-7.4-2.9-17.3 4.4-22.2s17.3-2.9 22.2 4.4zM135 119c9.4-9.4 24.6-9.4 33.9 0L292.7 242.7c10.1 10.1 27.3 2.9 27.3-11.3l0-39.4c0-17.7 14.3-32 32-32s32 14.3 32 32l0 153.6c0 57.1-30 110-78.9 139.4c-64 38.4-145.8 28.3-198.5-24.4L7 361c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l53 53c6.1 6.1 16 6.1 22.1 0s6.1-16 0-22.1L23 265c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l93 93c6.1 6.1 16 6.1 22.1 0s6.1-16 0-22.1L55 185c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l117 117c6.1 6.1 16 6.1 22.1 0s6.1-16 0-22.1l-93-93c-9.4-9.4-9.4-24.6 0-33.9zM433.1 484.9c-24.2 14.5-50.9 22.1-77.7 23.1c48.1-39.6 76.6-99 76.6-162.4l0-98.1c8.2-.1 16-6.4 16-16l0-39.4c0-17.7 14.3-32 32-32s32 14.3 32 32l0 153.6c0 57.1-30 110-78.9 139.4zM424.9 18.7c7.4 4.9 9.3 14.8 4.4 22.2l-32 48c-4.9 7.4-14.8 9.3-22.2 4.4s-9.3-14.8-4.4-22.2l32-48c4.9-7.4 14.8-9.3 22.2-4.4z"
				fill={active ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth={16}
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function BurstParticles({ trigger }: { trigger: number }) {
	if (trigger === 0) return null;

	return (
		<AnimatePresence>
			<motion.div
				key={trigger}
				className="absolute inset-0 pointer-events-none"
				initial={{ rotate: Math.random() * 72 }}
			>
				{Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
					const angle = (i * 360) / PARTICLE_COUNT;
					const rad = (angle * Math.PI) / 180;
					return (
						<motion.div
							key={i}
							className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-flexoki-tx-2"
							initial={{
								x: 0,
								y: 0,
								opacity: 1,
								scale: 1,
							}}
							animate={{
								x: Math.cos(rad) * 28,
								y: Math.sin(rad) * 28,
								opacity: 0,
								scale: 0,
							}}
							transition={{ duration: 0.5, ease: "easeOut" }}
						/>
					);
				})}
			</motion.div>
		</AnimatePresence>
	);
}

let audioCtx: AudioContext | null = null;

function playPop(rate: number) {
	try {
		if (!audioCtx) audioCtx = new AudioContext();
		const ctx = audioCtx;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(600 * rate, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(200 * rate, ctx.currentTime + 0.06);

		gain.gain.setValueAtTime(0.15, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.08);
	} catch {}
}

export default function ClapButton({ slug }: ClapButtonProps) {
	const [totalClaps, setTotalClaps] = useState<number | null>(null);
	const [myClaps, setMyClaps] = useState(0);
	const [burstKey, setBurstKey] = useState(0);
	const [showFloat, setShowFloat] = useState(false);
	const pitchRef = useRef(1.0);
	const pitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingRef = useRef(0);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasFetchedRef = useRef(false);

	useEffect(() => {
		if (!slug || hasFetchedRef.current) return;
		if (isDev()) {
			setTotalClaps(42);
			return;
		}

		hasFetchedRef.current = true;

		fetch(`/api/claps?id=${encodeURIComponent(slug)}`)
			.then((r) => r.json())
			.then((d) => setTotalClaps(d.claps ?? 0))
			.catch(() => setTotalClaps(0));
	}, [slug]);

	const flush = useCallback(() => {
		if (pendingRef.current <= 0 || isDev()) return;
		const n = pendingRef.current;
		pendingRef.current = 0;
		fetch(`/api/claps?id=${encodeURIComponent(slug)}&incr=${n}`).catch(() => {});
	}, [slug]);

	const handleClap = useCallback(() => {
		if (myClaps >= MAX_SESSION_CLAPS) return;

		setMyClaps((prev) => prev + 1);
		setTotalClaps((prev) => (prev ?? 0) + 1);
		setBurstKey((k) => k + 1);
		setShowFloat(true);

		playPop(pitchRef.current);
		pitchRef.current = Math.min(pitchRef.current + 0.06, 1.8);

		if (pitchTimerRef.current) clearTimeout(pitchTimerRef.current);
		pitchTimerRef.current = setTimeout(() => {
			pitchRef.current = 1.0;
		}, PITCH_RESET_MS);

		pendingRef.current += 1;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(flush, DEBOUNCE_MS);
	}, [myClaps, flush]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			if (pitchTimerRef.current) clearTimeout(pitchTimerRef.current);
			if (pendingRef.current > 0) flush();
		};
	}, [flush]);

	if (totalClaps === null) return null;

	const hasClapped = myClaps > 0;

	return (
		<div className="flex flex-col items-center gap-3 select-none">
			<div className="relative">
				<motion.button
					type="button"
					onClick={handleClap}
					whileTap={{ scale: 0.88 }}
					disabled={myClaps >= MAX_SESSION_CLAPS}
					className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors duration-200 cursor-pointer disabled:cursor-default ${
						hasClapped
							? "border-flexoki-tx text-flexoki-tx"
							: "border-flexoki-ui text-flexoki-tx-3 hover:border-flexoki-tx-3 hover:text-flexoki-tx-2"
					}`}
					aria-label={`Clap for this post. ${totalClaps} claps total.`}
				>
					<ClapIcon active={hasClapped} />
					<BurstParticles trigger={burstKey} />
				</motion.button>

				<AnimatePresence>
					{showFloat && (
						<motion.span
							key={myClaps}
							className="absolute -top-2 left-1/2 text-xs font-mono font-medium text-flexoki-tx pointer-events-none"
							initial={{ y: 0, opacity: 1, x: "-50%" }}
							animate={{ y: -24, opacity: 0 }}
							transition={{ duration: 0.7, ease: "easeOut" }}
							onAnimationComplete={() => setShowFloat(false)}
						>
							+{myClaps}
						</motion.span>
					)}
				</AnimatePresence>
			</div>

			<div className="flex items-center gap-1.5 text-sm text-flexoki-tx-3">
				<OdometerNumber value={totalClaps} />
				<span>claps</span>
			</div>
		</div>
	);
}
