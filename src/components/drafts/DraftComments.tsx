import { useCallback, useEffect, useRef, useState } from "react";

interface Comment {
	id: string;
	name: string;
	text: string;
	quote?: string;
	x: number;
	y: number;
	timestamp: number;
	resolved: boolean;
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
	const inputRef = useRef<HTMLInputElement>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const selectionPopupRef = useRef<HTMLDivElement>(null);

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
		if (pendingPos && inputRef.current) {
			inputRef.current.focus();
		}
	}, [pendingPos]);

	useEffect(() => {
		if (!nameConfirmed) return;

		const handleMouseUp = () => {
			setTimeout(() => {
				const info = getSelectionInfo();
				if (info && !pendingPos) {
					setSelectionPopup(info);
				} else {
					setSelectionPopup(null);
				}
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
		setPendingQuote(selInfo.text.slice(0, 120));
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
		}
	};

	const color = getColor(name || "?");

	return (
		<>
			{/* Name prompt */}
			{showNamePrompt && !nameConfirmed && (
				<div
					style={{
						position: "fixed",
						bottom: 24,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 9999,
						animation: "slideUp 0.3s ease-out",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							background: "var(--color-flexoki-bg-2, #1c1b1a)",
							border: "1px solid var(--color-flexoki-ui, #343331)",
							borderRadius: 10,
							padding: "8px 12px",
							boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
						}}
					>
						<div
							style={{
								width: 24,
								height: 24,
								borderRadius: "50%",
								background: color,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 11,
								fontWeight: 600,
								color: "#fff",
								flexShrink: 0,
							}}
						>
							{name ? name[0].toUpperCase() : "?"}
						</div>
						<input
							ref={nameInputRef}
							type="text"
							placeholder="Your name to leave comments..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && confirmName()}
							autoFocus
							style={{
								background: "transparent",
								border: "none",
								outline: "none",
								color: "var(--color-flexoki-tx, #cecdc3)",
								fontSize: 14,
								width: 220,
								fontFamily: "inherit",
							}}
						/>
						<button
							type="button"
							onClick={confirmName}
							disabled={!name.trim()}
							style={{
								background: name.trim() ? color : "var(--color-flexoki-ui, #343331)",
								border: "none",
								borderRadius: 6,
								padding: "4px 12px",
								fontSize: 13,
								fontWeight: 500,
								color: "#fff",
								cursor: name.trim() ? "pointer" : "default",
								opacity: name.trim() ? 1 : 0.4,
								transition: "all 0.15s",
								fontFamily: "inherit",
							}}
						>
							Join
						</button>
					</div>
				</div>
			)}

			{/* Floating toolbar */}
			{nameConfirmed && (
				<div
					style={{
						position: "fixed",
						bottom: 24,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 9998,
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: "var(--color-flexoki-bg-2, #1c1b1a)",
						border: `1px solid ${placing ? color : "var(--color-flexoki-ui, #343331)"}`,
						borderRadius: 10,
						padding: "6px 12px",
						boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
						transition: "border-color 0.2s",
					}}
				>
					<div
						style={{
							width: 22,
							height: 22,
							borderRadius: "50%",
							background: color,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 10,
							fontWeight: 600,
							color: "#fff",
							flexShrink: 0,
						}}
					>
						{name[0].toUpperCase()}
					</div>
					<span style={{ fontSize: 13, color: "var(--color-flexoki-tx-2, #878580)" }}>
						{name}
					</span>
					<div style={{ width: 1, height: 16, background: "var(--color-flexoki-ui, #343331)" }} />
					<button
						type="button"
						onClick={() => {
							setPlacing(!placing);
							setPendingPos(null);
							setPendingQuote("");
							setActiveComment(null);
							setSelectionPopup(null);
						}}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							background: placing ? color : "transparent",
							border: "none",
							borderRadius: 6,
							padding: "4px 10px",
							fontSize: 13,
							color: placing ? "#fff" : "var(--color-flexoki-tx-2, #878580)",
							cursor: "pointer",
							transition: "all 0.15s",
							fontFamily: "inherit",
						}}
					>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 2l10 5.5L8 9l-1.5 5z" />
						</svg>
						{placing ? "Click anywhere..." : "Comment"}
					</button>
					<span style={{ fontSize: 12, color: "var(--color-flexoki-tx-3, #575653)" }}>
						{comments.length} {comments.length === 1 ? "comment" : "comments"}
					</span>
				</div>
			)}

			{/* Text selection tooltip (when NOT in placing mode) */}
			{selectionPopup && nameConfirmed && !placing && !pendingPos && (
				<div
					ref={selectionPopupRef}
					style={{
						position: "fixed",
						left: selectionPopup.x,
						top: selectionPopup.y - 8,
						transform: "translate(-50%, -100%)",
						zIndex: 9997,
						animation: "fadeIn 0.12s ease-out",
					}}
				>
					<button
						type="button"
						onClick={() => startCommentFromSelection(selectionPopup)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 5,
							background: "var(--color-flexoki-bg-2, #1c1b1a)",
							border: "1px solid var(--color-flexoki-ui, #343331)",
							borderRadius: 8,
							padding: "5px 10px",
							fontSize: 12,
							color: "var(--color-flexoki-tx-2, #878580)",
							cursor: "pointer",
							boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
							fontFamily: "inherit",
							whiteSpace: "nowrap",
							transition: "all 0.15s",
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLElement).style.borderColor = color;
							(e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx, #cecdc3)";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLElement).style.borderColor = "var(--color-flexoki-ui, #343331)";
							(e.currentTarget as HTMLElement).style.color = "var(--color-flexoki-tx-2, #878580)";
						}}
					>
						<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M2 4h12M2 8h8M2 12h10" />
						</svg>
						Comment on selection
					</button>
					<div
						style={{
							width: 8,
							height: 8,
							background: "var(--color-flexoki-bg-2, #1c1b1a)",
							border: "1px solid var(--color-flexoki-ui, #343331)",
							borderTop: "none",
							borderLeft: "none",
							transform: "rotate(45deg)",
							position: "absolute",
							bottom: -5,
							left: "50%",
							marginLeft: -4,
						}}
					/>
				</div>
			)}

			{/* Comment overlay */}
			{placing && (
				<div
					ref={overlayRef}
					onClick={handleOverlayClick}
					style={{
						position: "fixed",
						inset: 0,
						zIndex: 9990,
						cursor: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 2L16 9L10 11L8 18L4 2Z' fill='${encodeURIComponent(color)}' stroke='white' stroke-width='1'/%3E%3C/svg%3E") 4 2, crosshair`,
					}}
				/>
			)}

			{/* Existing comment pins */}
			{comments.map((c) => (
				<div
					key={c.id}
					data-comment-pin
					onClick={(e) => {
						e.stopPropagation();
						setActiveComment(activeComment === c.id ? null : c.id);
					}}
					style={{
						position: "absolute",
						left: `${c.x}%`,
						top: c.y,
						zIndex: 9995,
						transform: "translate(-12px, -12px)",
					}}
				>
					<div
						style={{
							width: 24,
							height: 24,
							borderRadius: "50%",
							background: getColor(c.name),
							border: "2px solid var(--color-flexoki-bg, #100f0f)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 10,
							fontWeight: 600,
							color: "#fff",
							cursor: "pointer",
							boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
							transition: "transform 0.15s",
						}}
						onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.2)"; }}
						onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
					>
						{c.name[0].toUpperCase()}
					</div>

					{activeComment === c.id && (
						<div
							style={{
								position: "absolute",
								top: 28,
								left: 0,
								background: "var(--color-flexoki-bg-2, #1c1b1a)",
								border: "1px solid var(--color-flexoki-ui, #343331)",
								borderRadius: 8,
								padding: "10px 12px",
								minWidth: 200,
								maxWidth: 280,
								boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
								animation: "fadeIn 0.15s ease-out",
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
								<div
									style={{
										width: 18,
										height: 18,
										borderRadius: "50%",
										background: getColor(c.name),
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 9,
										fontWeight: 600,
										color: "#fff",
									}}
								>
									{c.name[0].toUpperCase()}
								</div>
								<span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-flexoki-tx, #cecdc3)" }}>
									{c.name}
								</span>
								<span style={{ fontSize: 11, color: "var(--color-flexoki-tx-3, #575653)", marginLeft: "auto" }}>
									{timeAgo(c.timestamp)}
								</span>
							</div>
							{c.quote && (
								<div
									style={{
										fontSize: 12,
										lineHeight: 1.4,
										color: "var(--color-flexoki-tx-3, #575653)",
										borderLeft: `2px solid ${getColor(c.name)}40`,
										paddingLeft: 8,
										marginBottom: 6,
										fontStyle: "italic",
									}}
								>
									"{c.quote.length > 80 ? `${c.quote.slice(0, 80)}...` : c.quote}"
								</div>
							)}
							<p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-flexoki-tx-2, #878580)", margin: 0 }}>
								{c.text}
							</p>
						</div>
					)}
				</div>
			))}

			{/* Pending comment input */}
			{pendingPos && (
				<div
					data-comment-input
					style={{
						position: "absolute",
						left: `${pendingPos.x}%`,
						top: pendingPos.y,
						zIndex: 9996,
						transform: "translate(-12px, -12px)",
					}}
				>
					<div
						style={{
							width: 24,
							height: 24,
							borderRadius: "50%",
							background: color,
							border: "2px solid var(--color-flexoki-bg, #100f0f)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 10,
							fontWeight: 600,
							color: "#fff",
							boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
						}}
					>
						{name[0].toUpperCase()}
					</div>
					<div
						style={{
							position: "absolute",
							top: 28,
							left: 0,
							background: "var(--color-flexoki-bg-2, #1c1b1a)",
							border: `1px solid ${color}`,
							borderRadius: 8,
							padding: 8,
							minWidth: 240,
							boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
							animation: "fadeIn 0.15s ease-out",
						}}
					>
						{pendingQuote && (
							<div
								style={{
									fontSize: 11,
									lineHeight: 1.4,
									color: "var(--color-flexoki-tx-3, #575653)",
									borderLeft: `2px solid ${color}40`,
									paddingLeft: 8,
									marginBottom: 8,
									fontStyle: "italic",
								}}
							>
								"{pendingQuote.length > 80 ? `${pendingQuote.slice(0, 80)}...` : pendingQuote}"
							</div>
						)}
						<input
							ref={inputRef}
							type="text"
							placeholder="Add a comment..."
							value={pendingText}
							onChange={(e) => setPendingText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") submitComment();
								if (e.key === "Escape") {
									setPendingPos(null);
									setPendingText("");
									setPendingQuote("");
								}
							}}
							style={{
								width: "100%",
								background: "transparent",
								border: "none",
								outline: "none",
								color: "var(--color-flexoki-tx, #cecdc3)",
								fontSize: 13,
								fontFamily: "inherit",
								padding: 0,
							}}
						/>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 8 }}>
							<button
								type="button"
								onClick={() => { setPendingPos(null); setPendingText(""); setPendingQuote(""); }}
								style={{
									background: "transparent",
									border: "none",
									color: "var(--color-flexoki-tx-3, #575653)",
									fontSize: 12,
									cursor: "pointer",
									padding: "2px 8px",
									borderRadius: 4,
									fontFamily: "inherit",
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={submitComment}
								disabled={!pendingText.trim()}
								style={{
									background: pendingText.trim() ? color : "var(--color-flexoki-ui, #343331)",
									border: "none",
									borderRadius: 4,
									padding: "2px 10px",
									fontSize: 12,
									color: "#fff",
									cursor: pendingText.trim() ? "pointer" : "default",
									opacity: pendingText.trim() ? 1 : 0.4,
									fontFamily: "inherit",
								}}
							>
								Post
							</button>
						</div>
					</div>
				</div>
			)}

			<style>{`
				@keyframes slideUp {
					from { opacity: 0; transform: translateX(-50%) translateY(12px); }
					to { opacity: 1; transform: translateX(-50%) translateY(0); }
				}
				@keyframes fadeIn {
					from { opacity: 0; transform: scale(0.95); }
					to { opacity: 1; transform: scale(1); }
				}
			`}</style>
		</>
	);
}
