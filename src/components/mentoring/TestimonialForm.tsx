import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import {
	FileInput,
	FileInputDropzone,
	FileInputItem,
	FileInputItemRemove,
	FileInputList,
	FileInputTrigger,
	formatFileSize,
} from "@ui-sdk/react/file-input";
import { Input } from "@ui-sdk/react/input";
import { Textarea } from "@ui-sdk/react/textarea";
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastRegion,
	ToastTitle,
	toast,
} from "@ui-sdk/react/toast";
import { useEffect, useState } from "react";
import { boxClass, CheckMark, indicatorClass } from "./NextSteps";

const controlClass =
	"w-full rounded-[4px] border border-[var(--ed-line-2)] bg-background px-3 py-2.5 text-[15px] text-foreground shadow-[inset_2px_2px_0_var(--ed-wash)] transition-[border-color,box-shadow] placeholder:text-foreground-3 hover:border-foreground/40 focus:border-foreground focus:shadow-[3px_3px_0_var(--ed-shadow-2)] focus:outline-none";

const labelClass = "text-[13.5px] font-medium text-foreground";
const hintClass = "ed-label";

function Avatar({ file }: { file: File | undefined }) {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!file) {
			setUrl(null);
			return;
		}
		const next = URL.createObjectURL(file);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [file]);

	return (
		<span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ed-line-2)] bg-background-2 shadow-[2px_2px_0_var(--ed-shadow)]">
			{url ? (
				<img src={url} alt="" className="size-full object-cover" />
			) : (
				<svg
					viewBox="0 0 24 24"
					className="size-6 text-foreground-3"
					aria-hidden="true"
				>
					<circle
						cx="12"
						cy="9"
						r="3.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M5 19.5c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			)}
		</span>
	);
}

export function TestimonialForm({ mentee }: { mentee: string }) {
	const [photo, setPhoto] = useState<File[]>([]);
	const [consent, setConsent] = useState(false);
	const firstName = mentee.split(" ")[0];

	return (
		<form
			className="ed flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				toast.success(`Thanks, ${firstName}`, {
					description: consent
						? "Mockup: nothing was sent. With your OK, your words could appear on railly.dev/mentoring."
						: "Mockup: nothing was sent. Your words stay private.",
					duration: 6000,
				});
			}}
		>
			<Field name="quote" className="flex flex-col gap-2">
				<FieldLabel className={labelClass}>
					What changed for you after the session?
				</FieldLabel>
				<Textarea
					autoResize
					rows={4}
					placeholder="A few honest sentences are plenty."
					className={`${controlClass} min-h-28 max-h-72 resize-none leading-relaxed`}
				/>
				<FieldDescription className={hintClass}>
					This is the part others would read.
				</FieldDescription>
			</Field>

			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<Field name="role" className="flex flex-col gap-2">
					<FieldLabel className={labelClass}>Role</FieldLabel>
					<Input
						placeholder="e.g. Product Designer"
						autoComplete="organization-title"
						className={controlClass}
					/>
				</Field>
				<Field name="link" className="flex flex-col gap-2">
					<FieldLabel className={labelClass}>Link</FieldLabel>
					<Input
						type="url"
						inputMode="url"
						placeholder="Portfolio, LinkedIn or X"
						className={controlClass}
					/>
				</Field>
			</div>

			<Field className="flex flex-col gap-2">
				<FieldLabel className={labelClass}>Photo</FieldLabel>
				<FileInput
					name="photo"
					accept="image/*"
					maxFiles={1}
					value={photo}
					onValueChange={(files) => setPhoto(files)}
				>
					<FileInputDropzone className="flex items-center gap-4 rounded-[4px] border border-dashed border-[var(--ed-line-2)] p-3 transition-colors data-drag-accept:border-foreground data-drag-accept:bg-[var(--ed-wash)] data-drag-reject:border-foreground-3">
						<Avatar file={photo[0]} />
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<FileInputList aria-label="Photo" className="min-w-0">
								<FileInputItem className="flex min-w-0 items-center gap-2 text-[13.5px]">
									{({ file }) => (
										<>
											<span className="truncate">{file.name}</span>
											<span className="ed-label shrink-0">
												{formatFileSize(file.size)}
											</span>
											<FileInputItemRemove className="ml-auto shrink-0 cursor-pointer rounded-[3px] px-1.5 font-mono text-[11px] text-foreground-3 hover:text-foreground">
												Remove
											</FileInputItemRemove>
										</>
									)}
								</FileInputItem>
							</FileInputList>
							{photo.length === 0 ? (
								<span className="text-[13.5px] text-foreground-2">
									Drop a photo here, or
								</span>
							) : null}
							<div>
								<FileInputTrigger className="cursor-pointer font-mono text-[12px] text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
									{photo.length ? "Choose another" : "Choose a file"}
								</FileInputTrigger>
							</div>
						</div>
					</FileInputDropzone>
				</FileInput>
				<FieldDescription className={hintClass}>
					Optional. A square photo works best.
				</FieldDescription>
			</Field>

			<Field
				name="better"
				className="flex flex-col gap-2 rounded-[4px] bg-[var(--ed-wash)] p-4"
			>
				<FieldLabel className={`${labelClass} flex items-center gap-2`}>
					<svg
						viewBox="0 0 16 16"
						className="size-3.5 text-foreground-3"
						aria-hidden="true"
					>
						<rect
							x="3"
							y="7"
							width="10"
							height="7"
							rx="1.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.4"
						/>
						<path
							d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.4"
						/>
					</svg>
					What could have been better?
				</FieldLabel>
				<Textarea
					autoResize
					rows={2}
					placeholder="Be blunt. It helps."
					className={`${controlClass} min-h-20 max-h-56 resize-none leading-relaxed`}
				/>
				<FieldDescription className={hintClass}>
					Private. Only I read this. Never published.
				</FieldDescription>
			</Field>

			{/* biome-ignore lint/a11y/noLabelWithoutControl: ui-sdk Checkbox is the control, wrapped in its label as its docs show */}
			<label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-foreground-2">
				<Checkbox
					name="consent"
					checked={consent}
					onCheckedChange={(checked) => setConsent(checked === true)}
					className={boxClass}
				>
					<CheckboxIndicator className={indicatorClass}>
						<CheckMark />
					</CheckboxIndicator>
				</Checkbox>
				<span>
					You can publish my words with my name and photo. I can ask to remove
					them anytime.
				</span>
			</label>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<button type="submit" className="ed-btn ed-btn-ink">
					Send
				</button>
				<span className="ed-label">
					Skip it if you like. Your files stay yours.
				</span>
			</div>

			<ToastRegion className="m-toasts z-50">
				{() => (
					<Toast className="ed flex items-start gap-3 rounded-[4px] border border-[var(--ed-line-2)] bg-background p-4 text-foreground shadow-[4px_4px_0_var(--ed-shadow-2)]">
						<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
							<CheckMark />
						</span>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<ToastTitle className="font-serif text-[17px] leading-tight" />
							<ToastDescription className="text-[13px] leading-snug text-foreground-2" />
						</div>
						<ToastClose
							aria-label="Dismiss"
							className="cursor-pointer font-mono text-[14px] leading-none text-foreground-3 hover:text-foreground"
						>
							&times;
						</ToastClose>
					</Toast>
				)}
			</ToastRegion>
		</form>
	);
}
