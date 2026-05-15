"use client";

import { cn } from "@starter-saas/ui/lib/utils";
import { CloudUpload, FileText, Loader2 } from "lucide-react";
import * as React from "react";

export type DropzoneProps = {
	onFiles: (files: File[]) => void;
	maxBytes?: number;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	busy?: boolean;
	className?: string;
	hint?: string;
};

function formatBytes(bytes: number): string {
	if (bytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(
		units.length - 1,
		Math.floor(Math.log(bytes) / Math.log(1024)),
	);
	const value = bytes / 1024 ** i;
	return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function Dropzone({
	onFiles,
	maxBytes,
	accept,
	multiple = false,
	disabled = false,
	busy = false,
	className,
	hint,
}: DropzoneProps) {
	const [dragging, setDragging] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleFiles = (list: FileList | null) => {
		if (!list) {
			return;
		}
		const files = Array.from(list);
		if (files.length === 0) {
			return;
		}
		onFiles(multiple ? files : files.slice(0, 1));
	};

	const onClick = () => {
		if (disabled || busy) {
			return;
		}
		inputRef.current?.click();
	};

	const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled || busy) {
			return;
		}
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			inputRef.current?.click();
		}
	};

	const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		if (disabled || busy) {
			return;
		}
		e.preventDefault();
		setDragging(true);
	};

	const onDragLeave = () => setDragging(false);

	const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
		if (disabled || busy) {
			return;
		}
		e.preventDefault();
		setDragging(false);
		handleFiles(e.dataTransfer.files);
	};

	return (
		<div
			role="button"
			tabIndex={disabled || busy ? -1 : 0}
			aria-disabled={disabled || busy}
			aria-busy={busy}
			onClick={onClick}
			onKeyDown={onKey}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className={cn(
				"group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/15 px-8 py-12 text-center transition-colors",
				"hover:bg-muted/30",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				dragging && "border-primary bg-primary/5",
				(disabled || busy) && "cursor-not-allowed opacity-60",
				className,
			)}
		>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				className="sr-only"
				onChange={(e) => handleFiles(e.target.files)}
				disabled={disabled || busy}
			/>

			<div
				className={cn(
					"flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-transform",
					"group-hover:scale-105",
					dragging && "scale-110 text-primary",
				)}
			>
				{busy ? (
					<Loader2 className="h-5 w-5 animate-spin" aria-hidden />
				) : dragging ? (
					<FileText className="h-5 w-5" aria-hidden />
				) : (
					<CloudUpload className="h-5 w-5" aria-hidden />
				)}
			</div>

			<p className="mt-4 font-medium text-sm">
				{busy
					? "Uploading…"
					: dragging
						? "Drop to upload"
						: "Drop files here or click to browse"}
			</p>

			<p className="mt-1 text-muted-foreground text-xs">
				{hint ??
					(maxBytes
						? `Up to ${formatBytes(maxBytes)}${accept ? ` · ${accept}` : ""}`
						: accept)}
			</p>
		</div>
	);
}
