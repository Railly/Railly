export const MUTE_STORAGE_KEY = "makeables:editor:muted";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | undefined {
	if (typeof window === "undefined") return undefined;
	return (
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: AudioContextConstructor })
			.webkitAudioContext
	);
}

function createNoiseBuffer(
	context: AudioContext,
	seconds: number,
): AudioBuffer {
	const buffer = context.createBuffer(
		1,
		Math.ceil(context.sampleRate * seconds),
		context.sampleRate,
	);
	const data = buffer.getChannelData(0);
	for (let index = 0; index < data.length; index += 1)
		data[index] = Math.random() * 2 - 1;
	return buffer;
}

/**
 * A synthesized "peel and press" sticker sound. The AudioContext is created lazily on the first
 * `play()`, which callers must only invoke from a user gesture so no sound starts on page load.
 */
export function createApplySound() {
	let context: AudioContext | null = null;

	function play() {
		const Constructor = getAudioContextConstructor();
		if (!Constructor) return;
		context ??= new Constructor();
		if (context.state === "suspended") void context.resume();
		const now = context.currentTime;

		// Peel: a band-passed noise sweep, like backing paper tearing away.
		const peel = context.createBufferSource();
		peel.buffer = createNoiseBuffer(context, 0.22);
		const band = context.createBiquadFilter();
		band.type = "bandpass";
		band.Q.value = 1.4;
		band.frequency.setValueAtTime(3600, now);
		band.frequency.exponentialRampToValueAtTime(900, now + 0.2);
		const peelGain = context.createGain();
		peelGain.gain.setValueAtTime(0.0001, now);
		peelGain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
		peelGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
		peel.connect(band).connect(peelGain).connect(context.destination);
		peel.start(now);
		peel.stop(now + 0.22);

		// Press: a short low thump as the sticker meets the card.
		const pressAt = now + 0.24;
		const thump = context.createOscillator();
		thump.type = "sine";
		thump.frequency.setValueAtTime(170, pressAt);
		thump.frequency.exponentialRampToValueAtTime(55, pressAt + 0.14);
		const thumpGain = context.createGain();
		thumpGain.gain.setValueAtTime(0.0001, pressAt);
		thumpGain.gain.exponentialRampToValueAtTime(0.35, pressAt + 0.01);
		thumpGain.gain.exponentialRampToValueAtTime(0.0001, pressAt + 0.16);
		thump.connect(thumpGain).connect(context.destination);
		thump.start(pressAt);
		thump.stop(pressAt + 0.17);
	}

	function dispose() {
		void context?.close();
		context = null;
	}

	return { play, dispose };
}

/**
 * The Makeables "ta-da": a bubbly pop, then a rising three-note chirp, played when the agent
 * finishes a piece. Same lazy AudioContext rule as `createApplySound`.
 */
export function createDoneSound() {
	let context: AudioContext | null = null;

	function play() {
		const Constructor = getAudioContextConstructor();
		if (!Constructor) return;
		context ??= new Constructor();
		if (context.state === "suspended") void context.resume();
		const audio = context;
		const now = audio.currentTime;
		const master = context.createGain();
		master.gain.value = 0.5;
		master.connect(context.destination);

		// Pop: a quick pitch drop, like a sticker lifting off the sheet.
		const pop = context.createOscillator();
		pop.type = "sine";
		pop.frequency.setValueAtTime(900, now);
		pop.frequency.exponentialRampToValueAtTime(260, now + 0.07);
		const popGain = context.createGain();
		popGain.gain.setValueAtTime(0.0001, now);
		popGain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
		popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
		pop.connect(popGain).connect(master);
		pop.start(now);
		pop.stop(now + 0.1);

		// Chirp: G5, C6, E6 with a little upward bend on each, the companion's happy hop.
		[784, 1047, 1319].forEach((frequency, index) => {
			const at = now + 0.1 + index * 0.085;
			const length = index === 2 ? 0.32 : 0.11;
			const note = audio.createOscillator();
			note.type = "triangle";
			note.frequency.setValueAtTime(frequency * 0.94, at);
			note.frequency.exponentialRampToValueAtTime(frequency, at + 0.03);
			const sparkle = audio.createOscillator();
			sparkle.type = "sine";
			sparkle.frequency.setValueAtTime(frequency * 2.005, at);
			const sparkleGain = audio.createGain();
			sparkleGain.gain.value = 0.25;
			const gain = audio.createGain();
			gain.gain.setValueAtTime(0.0001, at);
			gain.gain.exponentialRampToValueAtTime(0.3, at + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
			note.connect(gain);
			sparkle.connect(sparkleGain).connect(gain);
			gain.connect(master);
			note.start(at);
			sparkle.start(at);
			note.stop(at + length + 0.02);
			sparkle.stop(at + length + 0.02);
		});
	}

	function dispose() {
		void context?.close();
		context = null;
	}

	return { play, dispose };
}

export function readMutedPreference(): boolean {
	try {
		return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

export function writeMutedPreference(muted: boolean) {
	try {
		window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
	} catch {
		// Storage can be unavailable (private mode, blocked site data); the toggle still works.
	}
}
