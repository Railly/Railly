import { useCallback, useEffect, useRef, useState } from "react";

interface Reply {
	id: string;
	name: string;
	text: string;
	timestamp: number;
}

interface Comment {
	id: string;
	name: string;
	text: string;
	quote?: string;
	x: number;
	y: number;
	timestamp: number;
	resolved: boolean;
	replies?: Reply[];
}

interface SelectionPopup {
	x: number;
	y: number;
	text: string;
}

const COLORS = [
	"#E93D82", "#3E63DD", "#30A46C", "#E5484D",
	"#6E56CF", "#F76B15", "#12A594", "#7C66DC",
];

const BADGE_BG = "var(--color-flexoki-ui, #262626)";
const BADGE_BG_40 = "color-mix(in oklch, var(--color-flexoki-ui, #262626) 40%, transparent)";
const BADGE_BORDER = "var(--color-flexoki-ui, #262626)";
const BADGE_TEXT = "var(--color-flexoki-tx-3, #525252)";
const HIGHLIGHT_COLOR = "color-mix(in oklch, var(--color-flexoki-ui, #262626) 50%, transparent)";

function getColor(name: string) {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return COLORS[Math.abs(hash) % COLORS.length];
}

function timeAgo(ts: number) {
	const diff = Date.now() - ts;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function getSelectionInfo(): SelectionPopup | null {
	const sel = window.getSelection();
	if (!sel || sel.isCollapsed || !sel.toString().trim()) return null;
	const range = sel.getRangeAt(0);
	const rect = range.getBoundingClientRect();
	return {
		x: rect.left + rect.width / 2,
		y: rect.top,
		text: sel.toString().trim(),
	};
}

function makeCursor(fillColor: string) {
	const encoded = encodeURIComponent(fillColor);
	return `url("data:image/svg+xml,%3Csvg width='22' height='26' viewBox='0 0 396 434' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M49.7 29.8L346.2 199.7L202.3 244l-82.9 119.1L49.7 29.8Z' fill='${encoded}' stroke='white' stroke-width='20'/%3E%3C/svg%3E") 3 1, crosshair`;
}

function ArrowUp({ size = 14 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M8 3v10M3 8l5-5 5 5" />
		</svg>
	);
}

function ArrowDown({ size = 14 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M8 13V3M3 8l5 5 5-5" />
		</svg>
	);
}

function highlightTextInPage(text: string, active: boolean) {
	for (const el of document.querySelectorAll("mark[data-dc-highlight]")) {
		const parent = el.parentNode;
		if (parent) {
			parent.replaceChild(document.createTextNode(el.textContent || ""), el);
			parent.normalize();
		}
	}
	if (!text || !active) return;

	const snippet = text;
	const sel = window.getSelection();
	if (!sel) return;
	sel.removeAllRanges();

	const found = (window as any).find(snippet, false, false, true, false, true, false);
	if (!found) return;

	const range = sel.getRangeAt(0);
	const container = document.querySelector(".blog-content");
	if (container && !container.contains(range.commonAncestorContainer)) {
		sel.removeAllRanges();
		return;
	}

	const mark = document.createElement("mark");
	mark.setAttribute("data-dc-highlight", "");
	mark.style.background = "oklch(0.85 0.15 85 / 0.25)";
	mark.style.borderRadius = "2px";
	mark.style.padding = "1px 0";
	mark.style.color = "inherit";
	mark.style.textDecoration = "underline";
	mark.style.textDecorationColor = "oklch(0.75 0.15 85 / 0.6)";
	mark.style.textUnderlineOffset = "3px";
	mark.style.textDecorationThickness = "2px";

	try {
		range.surroundContents(mark);
	} catch {
		const fragment = range.extractContents();
		mark.appendChild(fragment);
		range.insertNode(mark);
	}
	sel.removeAllRanges();
}

export default function DraftComments({ draftId }: { draftId: string }) {
	const [name, setName] = useState("");
	const [nameConfirmed, setNameConfirmed] = useState(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const [placing, setPlacing] = useState(false);
	const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
	const [pendingText, setPendingText] = useState("");
	const [pendingQuote, setPendingQuote] = useState("");
	const [activeComment, setActiveComment] = useState<string | null>(null);
	const [showNamePrompt, setShowNamePrompt] = useState(false);
	const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null);
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [replyText, setReplyText] = useState("");
	const [focusedIdx, setFocusedIdx] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const replyInputRef = useRef<HTMLInputElement>(null);
	const selectionPopupRef = useRef<HTMLDivElement>(null);

	const unresolvedComments = comments.filter((c) => !c.resolved).sort((a, b) => a.y - b.y);
	const resolvedComments = comments.filter((c) => c.resolved).sort((a, b) => a.y - b.y);
	const navComments = [...unresolvedComments, ...resolvedComments];

	useEffect(() => {
		const saved = localStorage.getItem("draft-reviewer-name");
		if (saved) {
			setName(saved);
			setNameConfirmed(true);
		} else {
			const timer = setTimeout(() => setShowNamePrompt(true), 800);
			return () => clearTimeout(timer);
		}
	}, []);

	const fetchComments = useCallback(async () => {
		const res = await fetch(`/api/comments?draftId=${draftId}`);
		const data = await res.json();
		if (data.comments) setComments(data.comments);
	}, [draftId]);

	useEffect(() => {
		fetchComments();
		const interval = setInterval(fetchComments, 10000);
		return () => clearInterval(interval);
	}, [fetchComments]);

	useEffect(() => {
		if (pendingPos && inputRef.current) inputRef.current.focus();
	}, [pendingPos]);

	useEffect(() => {
		const active = comments.find((c) => c.id === activeComment);
		const quoteToHighlight = active?.quote || pendingQuote;
		highlightTextInPage(quoteToHighlight || "", !!(activeComment || pendingQuote));
		return () => highlightTextInPage("", false);
	}, [activeComment, comments, pendingQuote]);

	useEffect(() => {
		if (replyingTo && replyInputRef.current) replyInputRef.current.focus();
	}, [replyingTo]);

	useEffect(() => {
		if (!nameConfirmed) return;
		const handleMouseUp = () => {
			setTimeout(() => {
				const info = getSelectionInfo();
				if (info && !pendingPos) setSelectionPopup(info);
				else setSelectionPopup(null);
			}, 10);
		};
		const handleMouseDown = (e: MouseEvent) => {
			if (selectionPopupRef.current?.contains(e.target as Node)) return;
			setSelectionPopup(null);
		};
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("mousedown", handleMouseDown);
		return () => {
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [nameConfirmed, pendingPos]);

	const stateRef = useRef({ focusedIdx, navComments, placing });
	stateRef.current = { focusedIdx, navComments, placing };

	useEffect(() => {
		if (!nameConfirmed) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
			const { focusedIdx: fi, navComments: nc, placing: pl } = stateRef.current;

			if (e.key === "ArrowDown" && nc.length > 0) {
				e.preventDefault();
				const next = fi < nc.length - 1 ? fi + 1 : 0;
				setFocusedIdx(next);
				setActiveComment(nc[next].id);
				window.scrollTo({ top: nc[next].y - window.innerHeight / 3, behavior: "smooth" });
			} else if (e.key === "ArrowUp" && nc.length > 0) {
				e.preventDefault();
				const prev = fi > 0 ? fi - 1 : nc.length - 1;
				setFocusedIdx(prev);
				setActiveComment(nc[prev].id);
				window.scrollTo({ top: nc[prev].y - window.innerHeight / 3, behavior: "smooth" });
			} else if (e.key === "c" || e.key === "C") {
				e.preventDefault();
				setPlacing(!pl);
				setPendingPos(null);
				setPendingQuote("");
				setActiveComment(null);
				setSelectionPopup(null);
			} else if (e.key === "Escape") {
				setActiveComment(null);
				setFocusedIdx(-1);
				setPendingPos(null);
				setPendingText("");
				setPendingQuote("");
				if (pl) setPlacing(false);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [nameConfirmed]);

	const navigateComments = (dir: "up" | "down") => {
		if (navComments.length === 0) return;
		let next: number;
		if (dir === "down") {
			next = focusedIdx < navComments.length - 1 ? focusedIdx + 1 : 0;
		} else {
			next = focusedIdx > 0 ? focusedIdx - 1 : navComments.length - 1;
		}
		setFocusedIdx(next);
		setActiveComment(navComments[next].id);
		window.scrollTo({ top: navComments[next].y - window.innerHeight / 3, behavior: "smooth" });
	};

	const confirmName = () => {
		if (!name.trim()) return;
		localStorage.setItem("draft-reviewer-name", name.trim());
		setNameConfirmed(true);
		setShowNamePrompt(false);
	};

	const startCommentFromSelection = (selInfo: SelectionPopup) => {
		const xPercent = (selInfo.x / document.documentElement.clientWidth) * 100;
		const yAbs = selInfo.y + window.scrollY;
		setPendingPos({ x: xPercent, y: yAbs });
		setPendingQuote(selInfo.text);
		setPendingText("");
		setSelectionPopup(null);
		setActiveComment(null);
		window.getSelection()?.removeAllRanges();
		if (!placing) setPlacing(true);
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (!nameConfirmed || !placing) return;
		if ((e.target as HTMLElement).closest("[data-comment-pin]")) return;
		if ((e.target as HTMLElement).closest("[data-comment-input]")) return;

		const sel = window.getSelection();
		if (sel && !sel.isCollapsed && sel.toString().trim()) {
			const info = getSelectionInfo();
			if (info) {
				startCommentFromSelection(info);
				return;
			}
		}

		const xPercent = (e.clientX / document.documentElement.clientWidth) * 100;
		const yAbs = e.clientY + window.scrollY;
		setPendingPos({ x: xPercent, y: yAbs });
		setPendingQuote("");
		setPendingText("");
		setActiveComment(null);
	};

	const submitComment = async () => {
		if (!pendingText.trim() || !pendingPos) return;
		const res = await fetch("/api/comments", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				draftId,
				name: name.trim(),
				text: pendingText.trim(),
				quote: pendingQuote || undefined,
				x: pendingPos.x,
				y: pendingPos.y,
			}),
		});
		const data = await res.json();
		if (data.ok) {
			setComments((prev) => [...prev, data.comment]);
			setPendingPos(null);
			setPendingText("");
			setPendingQuote("");
			if (data.comment.quote) setActiveComment(data.comment.id);
		}
	};

	const toggleResolve = async (commentId: string) => {
		await fetch("/api/comments", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ draftId, commentId, action: "resolve" }),
		});
		setComments((prev) =>
			prev.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)),
		);
	};

	const submitReply = async (commentId: string) => {
		if (!replyText.trim()) return;
		const res = await fetch("/api/comments", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ draftId, commentId, action: "reply", name: name.trim(), text: replyText.trim() }),
		});
		const data = await res.json();
		if (data.ok && data.comment) {
			setComments((prev) =>
				prev.map((c) => (c.id === commentId ? data.comment : c)),
			);
		}
		setReplyText("");
		setReplyingTo(null);
	};

	const deleteComment = async (commentId: string) => {
		await fetch("/api/comments", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ draftId, commentId, name: name.trim() }),
		});
		setComments((prev) => prev.filter((c) => c.id !== commentId));
		setActiveComment(null);
	};

	const color = getColor(name || "?");

	const pinStyle = (c: Comment, isActive: boolean): React.CSSProperties => ({
		position: "absolute",
		left: `${c.x}%`,
		top: c.y,
		zIndex: isActive ? 9996 : 9995,
		transform: "translate(-12px, -12px)",
	});

	const avatarStyle = (c: Comment, size: number): React.CSSProperties => ({
		width: size,
		height: size,
		borderRadius: "50%",
		background: c.resolved ? "var(--color-flexoki-ui, #262626)" : getColor(c.name),
		border: "2px solid var(--color-flexoki-bg, #111)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: size * 0.42,
		fontWeight: 600,
		color: "#fff",
		cursor: "pointer",
		boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
		transition: "transform 0.15s, opacity 0.15s",
		opacity: c.resolved ? 0.5 : 1,
	});

	return (
		<>
			{/* Name prompt */}
			{showNamePrompt && !nameConfirmed && (
				<div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, animation: "dc-slideUp 0.3s ease-out" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: "1px solid var(--color-flexoki-ui, #262626)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
						<div style={{ width: 24, height: 24, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
							{name ? name[0].toUpperCase() : "?"}
						</div>
						<input
							type="text"
							placeholder="Your name to leave comments..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && confirmName()}
							ref={(el) => el?.focus()}
							style={{ background: "transparent", border: "none", outline: "none", color: "var(--color-flexoki-tx, #fafafa)", fontSize: 14, width: 220, fontFamily: "inherit" }}
						/>
						<button
							type="button"
							onClick={confirmName}
							disabled={!name.trim()}
							style={{ background: name.trim() ? color : "var(--color-flexoki-ui, #262626)", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 500, color: "#fff", cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.4, transition: "all 0.15s", fontFamily: "inherit" }}
						>
							Join
						</button>
					</div>
				</div>
			)}

			{/* Floating toolbar */}
			{nameConfirmed && (
				<div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9998, display: "flex", alignItems: "center", gap: 6, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: `1px solid ${placing ? color : "var(--color-flexoki-ui, #262626)"}`, borderRadius: 10, padding: "6px 10px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", transition: "border-color 0.2s" }}>
					<div style={{ width: 22, height: 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
						{name[0].toUpperCase()}
					</div>
					<span style={{ fontSize: 13, color: "var(--color-flexoki-tx-2, #a3a3a3)" }}>{name}</span>
					<div style={{ width: 1, height: 16, background: "var(--color-flexoki-ui, #262626)" }} />
					<button
						type="button"
						onClick={() => { setPlacing(!placing); setPendingPos(null); setPendingQuote(""); setActiveComment(null); setSelectionPopup(null); }}
						style={{ display: "flex", alignItems: "center", gap: 6, background: placing ? color : "transparent", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: placing ? "#fff" : "var(--color-flexoki-tx-2, #a3a3a3)", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
					>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 2l10 5.5L8 9l-1.5 5z" />
						</svg>
						{placing ? "Click anywhere..." : "Comment"}
					</button>
					<div style={{ width: 1, height: 16, background: "var(--color-flexoki-ui, #262626)" }} />
					<span style={{ fontSize: 12, color: "var(--color-flexoki-tx-3, #525252)", minWidth: 20, textAlign: "center" }}>
						{comments.length}
					</span>
					{comments.length > 0 && (
						<>
							<button
								type="button"
								onClick={() => navigateComments("up")}
								title="Previous comment (Arrow Up)"
								style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--color-flexoki-tx-3, #525252)", cursor: "pointer", padding: 2, borderRadius: 4, transition: "color 0.15s" }}
								onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx, #fafafa)"; }}
								onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-3, #525252)"; }}
							>
								<ArrowUp size={14} />
							</button>
							<button
								type="button"
								onClick={() => navigateComments("down")}
								title="Next comment (Arrow Down)"
								style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--color-flexoki-tx-3, #525252)", cursor: "pointer", padding: 2, borderRadius: 4, transition: "color 0.15s" }}
								onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx, #fafafa)"; }}
								onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-3, #525252)"; }}
							>
								<ArrowDown size={14} />
							</button>
						</>
					)}
				</div>
			)}

			{/* Text selection tooltip (passive mode) */}
			{selectionPopup && nameConfirmed && !placing && !pendingPos && (
				<div
					ref={selectionPopupRef}
					style={{ position: "fixed", left: selectionPopup.x, top: selectionPopup.y - 8, transform: "translate(-50%, -100%)", zIndex: 9997, animation: "dc-fadeIn 0.12s ease-out" }}
				>
					<button
						type="button"
						onClick={() => startCommentFromSelection(selectionPopup)}
						style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: "1px solid var(--color-flexoki-ui, #262626)", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "var(--color-flexoki-tx-2, #a3a3a3)", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s" }}
						onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx, #fafafa)"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-flexoki-ui, #262626)"; (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-2, #a3a3a3)"; }}
					>
						<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M2 4h12M2 8h8M2 12h10" />
						</svg>
						Comment on selection
					</button>
					<div style={{ width: 8, height: 8, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: "1px solid var(--color-flexoki-ui, #262626)", borderTop: "none", borderLeft: "none", transform: "rotate(45deg)", position: "absolute", bottom: -5, left: "50%", marginLeft: -4 }} />
				</div>
			)}

			{/* Comment overlay */}
			{placing && (
				<button
					type="button"
					onClick={handleOverlayClick}
					style={{ position: "fixed", inset: 0, zIndex: 9990, cursor: makeCursor(color), background: "transparent", border: "none", padding: 0, margin: 0 }}
				/>
			)}

			{/* Existing comment pins */}
			{comments.map((c) => {
				const isActive = activeComment === c.id;
				const cColor = getColor(c.name);
				return (
					<div key={c.id} data-comment-pin style={pinStyle(c, isActive)}>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								const newActive = isActive ? null : c.id;
								setActiveComment(newActive);
								setFocusedIdx(newActive ? navComments.findIndex((nc) => nc.id === c.id) : -1);
								setReplyingTo(null);
								setReplyText("");
							}}
							style={{ ...avatarStyle(c, 24), border: "2px solid var(--color-flexoki-bg, #111)" }}
							onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
							onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
						>
							{c.resolved ? "\u2713" : c.name[0].toUpperCase()}
						</button>

						{isActive && (
							<div style={{ position: "absolute", top: 30, left: 0, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: "1px solid var(--color-flexoki-ui, #262626)", borderRadius: 10, padding: 0, minWidth: 260, maxWidth: 320, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", animation: "dc-fadeIn 0.15s ease-out", overflow: "hidden" }}>
								{/* Header */}
								<div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 8px" }}>
									<div style={{ width: 18, height: 18, borderRadius: "50%", background: cColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#fff" }}>
										{c.name[0].toUpperCase()}
									</div>
									<span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-flexoki-tx, #fafafa)" }}>{c.name}</span>
									<span style={{ fontSize: 11, color: "var(--color-flexoki-tx-3, #525252)", marginLeft: "auto" }}>{timeAgo(c.timestamp)}</span>
								</div>

								{/* Body */}
								<p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-flexoki-tx-2, #a3a3a3)", margin: 0, padding: "0 12px 8px" }}>
									{c.text}
								</p>

								{/* Replies */}
								{c.replies && c.replies.length > 0 && (
									<div style={{ borderTop: "1px solid var(--color-flexoki-ui, #262626)" }}>
										{c.replies.map((r) => (
											<div key={r.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-flexoki-ui, #262626)" }}>
												<div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
													<div style={{ width: 14, height: 14, borderRadius: "50%", background: getColor(r.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 600, color: "#fff" }}>
														{r.name[0].toUpperCase()}
													</div>
													<span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-flexoki-tx, #fafafa)" }}>{r.name}</span>
													<span style={{ fontSize: 10, color: "var(--color-flexoki-tx-3, #525252)", marginLeft: "auto" }}>{timeAgo(r.timestamp)}</span>
												</div>
												<p style={{ fontSize: 12, lineHeight: 1.4, color: "var(--color-flexoki-tx-2, #a3a3a3)", margin: 0, paddingLeft: 18 }}>{r.text}</p>
											</div>
										))}
									</div>
								)}

								{/* Reply input */}
								{replyingTo === c.id && (
									<div style={{ padding: "8px 12px", borderTop: "1px solid var(--color-flexoki-ui, #262626)" }}>
										<input
											ref={replyInputRef}
											type="text"
											placeholder="Reply..."
											value={replyText}
											onChange={(e) => setReplyText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") submitReply(c.id);
												if (e.key === "Escape") { setReplyingTo(null); setReplyText(""); }
											}}
											style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--color-flexoki-tx, #fafafa)", fontSize: 12, fontFamily: "inherit", padding: 0 }}
										/>
									</div>
								)}

								{/* Actions */}
								<div style={{ display: "flex", borderTop: "1px solid var(--color-flexoki-ui, #262626)" }}>
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); toggleResolve(c.id); }}
										style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 0", background: "transparent", border: "none", borderRight: "1px solid var(--color-flexoki-ui, #262626)", color: c.resolved ? "#30A46C" : "var(--color-flexoki-tx-3, #525252)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
										onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#30A46C"; }}
										onMouseLeave={(e) => { if (!c.resolved) (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-3, #525252)"; }}
									>
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M3 8.5l3.5 3.5 6.5-8" />
										</svg>
										{c.resolved ? "Reopen" : "Resolve"}
									</button>
									<button
										type="button"
										onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }}
										style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 0", background: "transparent", border: "none", borderRight: c.name === name.trim() ? "1px solid var(--color-flexoki-ui, #262626)" : "none", color: "var(--color-flexoki-tx-3, #525252)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
										onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx, #fafafa)"; }}
										onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-3, #525252)"; }}
									>
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
											<path d="M14 10c0 .55-.2 1.05-.59 1.41-.38.37-.88.59-1.41.59H5l-3 3V4c0-.55.2-1.05.59-1.41C2.97 2.2 3.45 2 4 2h8c.55 0 1.05.2 1.41.59.37.38.59.88.59 1.41v6z" />
										</svg>
										Reply
									</button>
									{c.name === name.trim() && (
										<button
											type="button"
											onClick={(e) => { e.stopPropagation(); deleteComment(c.id); }}
											style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 0", background: "transparent", border: "none", color: "var(--color-flexoki-tx-3, #525252)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
											onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E5484D"; }}
											onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-3, #525252)"; }}
										>
											<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
											</svg>
											Delete
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* Pending comment input */}
			{pendingPos && (
				<div data-comment-input style={{ position: "absolute", left: `${pendingPos.x}%`, top: pendingPos.y, zIndex: 9996, transform: "translate(-12px, -12px)" }}>
					<div style={{ width: 24, height: 24, borderRadius: "50%", background: color, border: "2px solid var(--color-flexoki-bg, #111)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
						{name[0].toUpperCase()}
					</div>
					<div style={{ position: "absolute", top: 28, left: 0, background: "var(--color-flexoki-bg-2, #1a1a1a)", border: `1px solid ${color}`, borderRadius: 8, padding: 8, minWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", animation: "dc-fadeIn 0.15s ease-out" }}>
						<input
							ref={inputRef}
							type="text"
							placeholder="Add a comment..."
							value={pendingText}
							onChange={(e) => setPendingText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") submitComment();
								if (e.key === "Escape") { setPendingPos(null); setPendingText(""); setPendingQuote(""); }
							}}
							style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--color-flexoki-tx, #fafafa)", fontSize: 13, fontFamily: "inherit", padding: 0 }}
						/>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 8 }}>
							<button
								type="button"
								onClick={() => { setPendingPos(null); setPendingText(""); setPendingQuote(""); }}
								style={{ background: "transparent", border: "none", color: "var(--color-flexoki-tx-3, #525252)", fontSize: 12, cursor: "pointer", padding: "2px 8px", borderRadius: 4, fontFamily: "inherit" }}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={submitComment}
								disabled={!pendingText.trim()}
								style={{ background: pendingText.trim() ? color : "var(--color-flexoki-ui, #262626)", border: "none", borderRadius: 4, padding: "2px 10px", fontSize: 12, color: "#fff", cursor: pendingText.trim() ? "pointer" : "default", opacity: pendingText.trim() ? 1 : 0.4, fontFamily: "inherit" }}
							>
								Post
							</button>
						</div>
					</div>
				</div>
			)}

			<style>{`
				@keyframes dc-slideUp {
					from { opacity: 0; transform: translateX(-50%) translateY(12px); }
					to { opacity: 1; transform: translateX(-50%) translateY(0); }
				}
				@keyframes dc-fadeIn {
					from { opacity: 0; transform: scale(0.95); }
					to { opacity: 1; transform: scale(1); }
				}
				::selection {
					background: ${HIGHLIGHT_COLOR};
				}
			`}</style>
		</>
	);
}
