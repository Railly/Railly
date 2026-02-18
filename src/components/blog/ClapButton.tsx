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
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill={active ? "currentColor" : "none"}
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="transition-colors duration-150"
		>
			<path d="M20.2 7.8l-7.7 7.7-4-4-5.7 5.7" />
			<path d="M15 7h6v6" />
			<path d="m8.5 12.5-2-2a1.4 1.4 0 0 1 2-2l2 2" />
			<path d="m10.5 10.5-2-2a1.4 1.4 0 0 1 2-2l4 4" />
			<path d="m14.5 14.5-6-6a1.4 1.4 0 0 1 2-2l2 2" />
			<path d="m6.5 14.5 4.59 4.59a2 2 0 0 0 2.83 0L19 14" />
			<path d="m5 16 .59.59a2 2 0 0 0 2.83 0L9 16" />
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
