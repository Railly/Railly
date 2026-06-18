import { type FormEvent, useState } from "react";

interface Props {
	className?: string;
}

type Status = "idle" | "loading" | "success" | "error" | "already";

export default function NewsletterSignup({ className = "" }: Props) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [honeypot, setHoneypot] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [focusedField, setFocusedField] = useState<"name" | "email" | null>(
		null,
	);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setStatus("loading");

		try {
			const res = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					firstName: name.trim() || undefined,
					...(honeypot && { honeypot }),
				}),
			});

			const data = await res.json();

			if (res.ok) {
				setStatus("success");
				setName("");
				setEmail("");
			} else if (data.error?.code === "ALREADY_SUBSCRIBED") {
				setStatus("already");
			} else {
				setStatus("error");
			}
		} catch {
			setStatus("error");
		}
	};

	if (status === "success") {
		return (
			<p
				className={`font-mono text-sm text-foreground-2 flex items-center gap-2 ${className}`}
			>
				<span aria-hidden className="text-foreground">
					✓
				</span>
				You're in. First issue drops Sunday.
			</p>
		);
	}

	if (status === "already") {
		return (
			<p className={`font-mono text-sm text-foreground-3 ${className}`}>
				<span aria-hidden>—</span> Already on the list.
			</p>
		);
	}

	const isError = status === "error";
	const isLoading = status === "loading";

	return (
		<form onSubmit={handleSubmit} className={`group w-full ${className}`}>
			<input
				type="text"
				name="website"
				value={honeypot}
				onChange={(e) => setHoneypot(e.target.value)}
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
				style={{ position: "absolute", left: "-9999px", opacity: 0 }}
			/>

			{/* Two labelled fields, each with its own baseline — no boxes, no pills */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				{/* Name — optional, gets a narrow column of its own */}
				<label className="flex flex-col gap-1.5 sm:w-32 sm:shrink-0">
					<span className="font-mono text-[0.65rem] uppercase tracking-widest text-foreground-3">
						name
					</span>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onFocus={() => setFocusedField("name")}
						onBlur={() => setFocusedField(null)}
						placeholder="optional"
						aria-label="First name"
						className={`border-b bg-transparent pb-2 font-mono text-sm tracking-tight text-foreground placeholder:text-foreground-3/50 outline-none transition-colors duration-300 ${
							focusedField === "name"
								? "border-foreground"
								: "border-ui group-hover:border-ui-3"
						}`}
					/>
				</label>

				{/* Email — required, takes the remaining width, owns the submit */}
				<label className="flex min-w-0 flex-1 flex-col gap-1.5">
					<span className="font-mono text-[0.65rem] uppercase tracking-widest text-foreground-3">
						email
					</span>
					<div
						className={`flex items-baseline gap-2 border-b pb-2 transition-colors duration-300 ${
							isError
								? "border-foreground-2"
								: focusedField === "email"
									? "border-foreground"
									: "border-ui group-hover:border-ui-3"
						}`}
					>
						<input
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								if (status === "error") setStatus("idle");
							}}
							onFocus={() => setFocusedField("email")}
							onBlur={() => setFocusedField(null)}
							placeholder="you@email.com"
							required
							aria-label="Email address"
							className="min-w-0 flex-1 bg-transparent font-mono text-sm tracking-tight text-foreground placeholder:text-foreground-3/50 outline-none"
						/>

						{/* Submit as an affordance, not a button — arrow slides on hover */}
						<button
							type="submit"
							disabled={isLoading}
							aria-label="Subscribe"
							className="group/btn shrink-0 cursor-pointer self-center font-mono text-foreground-3 transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40"
						>
							{isLoading ? (
								<span className="inline-block animate-pulse text-sm">···</span>
							) : (
								<span className="inline-flex items-center text-base leading-none transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5">
									→
								</span>
							)}
						</button>
					</div>
				</label>
			</div>

			{/* Reserve a line so layout never shifts when the error appears */}
			<div className="h-5 pt-1.5">
				{isError && (
					<span className="font-mono text-xs text-foreground-3">
						Something broke. Try once more.
					</span>
				)}
			</div>
		</form>
	);
}
