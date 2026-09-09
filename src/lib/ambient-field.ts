import type { Gpu } from "vgpu";

export function mountAmbientField(root: HTMLElement) {
	const element = root.querySelector("canvas");
	if (!(element instanceof HTMLCanvasElement)) return () => {};
	const canvas: HTMLCanvasElement = element;
	const motion = matchMedia("(prefers-reduced-motion: reduce)");
	const desktop = matchMedia("(min-width: 768px) and (pointer: fine)");
	const theme = matchMedia("(prefers-color-scheme: dark)");
	const events = new AbortController();
	let disposed = false;
	let gpu: Gpu | undefined;
	let timer = 0;
	let frames = 0;
	let started = false;
	let failure = false;
	let draw: (() => void) | undefined;
	let pointer = [0.5, 0.5];
	let target = [0.5, 0.5];
	let time = 0;
	const stop = () => {
		window.clearTimeout(timer);
		timer = 0;
	};
	const canAnimate = () =>
		!disposed &&
		!failure &&
		!motion.matches &&
		desktop.matches &&
		!document.hidden &&
		scrollY < 800;
	const tick = () => {
		stop();
		if (!canAnimate() || !draw) return;
		try {
			draw();
			timer = window.setTimeout(tick, 1000 / 24);
		} catch {
			fallback();
		}
	};
	const fallback = () => {
		failure = true;
		stop();
		root.dataset.renderer = "static";
		gpu?.dispose();
	};
	async function start() {
		if (started || !canAnimate() || !("gpu" in navigator)) return;
		started = true;
		try {
			const [{ init, effect, surface, frame }, { default: shader }] =
				await Promise.all([
					import("vgpu"),
					import("@/shaders/ambient.wgsl?raw"),
				]);
			if (disposed) return;
			const context = await init();
			if (disposed) {
				context.dispose();
				return;
			}
			gpu = context;
			context.onError(fallback);
			void context.gpu.lost.then(() => {
				if (!disposed) fallback();
			});
			const output = surface(context, canvas, { dpr: 1, autoResize: false });
			const material = effect(context, shader, {
				label: "Railly graphite relief",
			});
			await material.compile({ colors: [output.format], sampleCount: 1 });
			if (disposed || failure) return;
			draw = () => {
				const width = Math.max(
					1,
					Math.round(
						canvas.clientWidth * Math.min(1, 1400 / canvas.clientWidth),
					),
				);
				const height = Math.max(
					1,
					Math.round((canvas.clientHeight * width) / canvas.clientWidth),
				);
				if (canvas.width !== width || canvas.height !== height)
					output.resize([width, height]);
				pointer = pointer.map((value, i) => value + (target[i] - value) * 0.04);
				time += 1 / 24;
				const color = getComputedStyle(document.body)
					.backgroundColor.match(/[\d.]+/g)
					?.slice(0, 3)
					.map(Number) ?? [17, 17, 17];
				material.set({
					scene: {
						resolution: [width, height],
						pointer,
						time,
						dark: theme.matches ? 1 : 0,
						padding: [0, 0],
						base: [...color.map((value) => value / 255), 1],
					},
				});
				frame(context, (f) => f.pass(output, material));
				root.dataset.renderer = "vgpu";
				root.dataset.frames = String(++frames);
			};
			tick();
		} catch {
			fallback();
		}
	}
	const resume = () => {
		root.style.opacity = String(Math.max(0, 1 - scrollY / 800));
		if (motion.matches || !desktop.matches) root.dataset.renderer = "static";
		if (canAnimate()) {
			if (draw && !timer) tick();
			else void start();
		} else stop();
	};
	window.addEventListener(
		"pointermove",
		(event) => {
			target = [event.clientX / innerWidth, event.clientY / innerHeight];
		},
		{ passive: true, signal: events.signal },
	);
	window.addEventListener("scroll", resume, {
		passive: true,
		signal: events.signal,
	});
	window.addEventListener("resize", resume, {
		passive: true,
		signal: events.signal,
	});
	document.addEventListener("visibilitychange", resume, {
		signal: events.signal,
	});
	motion.addEventListener("change", resume, { signal: events.signal });
	desktop.addEventListener("change", resume, { signal: events.signal });
	theme.addEventListener("change", resume, { signal: events.signal });
	resume();
	return () => {
		disposed = true;
		stop();
		events.abort();
		gpu?.dispose();
		root.dataset.renderer = "static";
	};
}
