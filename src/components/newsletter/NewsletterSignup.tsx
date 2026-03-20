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
			<p className={`text-sm text-foreground-2 ${className}`}>
				You're in. First issue drops Sunday.
			</p>
		);
	}

	if (status === "already") {
		return (
			<p className={`text-sm text-foreground-3 ${className}`}>
				Already subscribed.
			</p>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className={`flex flex-col sm:flex-row gap-2 ${className}`}
		>
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
			<input
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="First name"
				className="sm:w-28 border border-ui focus:border-foreground-2 bg-transparent text-foreground text-sm px-3 py-2 rounded-md outline-none transition-colors font-sans placeholder:text-foreground-3"
			/>
			<input
				type="email"
				value={email}
				onChange={(e) => {
					setEmail(e.target.value);
					if (status === "error") setStatus("idle");
				}}
				placeholder="you@example.com"
				required
				className="flex-1 border border-ui focus:border-foreground-2 bg-transparent text-foreground text-sm px-3 py-2 rounded-md outline-none transition-colors font-sans placeholder:text-foreground-3"
			/>
			<button
				type="submit"
				disabled={status === "loading"}
				className="bg-foreground text-background text-sm font-medium px-4 py-2 rounded-md hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
			>
				{status === "loading" ? "..." : "Subscribe"}
			</button>
			{status === "error" && (
				<span className="text-sm text-foreground-3 self-center">
					Something went wrong. Try again.
				</span>
			)}
		</form>
	);
}
