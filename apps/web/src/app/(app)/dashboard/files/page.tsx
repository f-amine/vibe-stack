"use client";

import { Button } from "@vibestack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vibestack/ui/components/card";
import { Dropzone } from "@vibestack/ui/components/dropzone";
import { EmptyState } from "@vibestack/ui/components/empty-state";
import { PageHeader } from "@vibestack/ui/components/page-header";
import { Skeleton } from "@vibestack/ui/components/skeleton";
import { Download, FileIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type FileRow = {
	key: string;
	size: number;
	lastModified: string | null;
	publicUrl: string | null;
};

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT =
	"image/*,application/pdf,text/plain,text/csv,text/markdown,application/json,application/zip";

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

function nameFromKey(key: string): string {
	const parts = key.split("/");
	return parts[parts.length - 1] ?? key;
}

export default function FilesPage() {
	const [files, setFiles] = useState<FileRow[] | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/files", { cache: "no-store" });
			if (!res.ok) {
				throw new Error(`Couldn't list files (${res.status})`);
			}
			const data = (await res.json()) as { objects: FileRow[] };
			setFiles(data.objects ?? []);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't list files");
			setFiles([]);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const onUpload = async (incoming: File[]) => {
		const file = incoming[0];
		if (!file) {
			return;
		}

		if (file.size > DEFAULT_MAX_BYTES) {
			toast.error("File is too big", {
				description: `Up to ${formatBytes(DEFAULT_MAX_BYTES)} per upload.`,
			});
			return;
		}

		setBusy(true);
		const toastId = toast.loading(`Uploading ${file.name}…`);
		try {
			const presignRes = await fetch("/api/files", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type || "application/octet-stream",
					size: file.size,
				}),
			});

			if (!presignRes.ok) {
				const data = (await presignRes.json().catch(() => null)) as {
					message?: string;
					error?: string;
				} | null;
				throw new Error(
					data?.message ??
						data?.error ??
						`Presign failed (${presignRes.status})`,
				);
			}
			const presign = (await presignRes.json()) as {
				uploadUrl: string;
				key: string;
				contentType: string;
			};

			const putRes = await fetch(presign.uploadUrl, {
				method: "PUT",
				headers: { "content-type": presign.contentType },
				body: file,
			});
			if (!putRes.ok) {
				throw new Error(`R2 upload failed (${putRes.status})`);
			}

			toast.success("Uploaded", { id: toastId, description: file.name });
			await load();
		} catch (err) {
			toast.error("Couldn't upload", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		} finally {
			setBusy(false);
		}
	};

	const onDownload = async (key: string) => {
		const toastId = toast.loading("Generating download link…");
		try {
			const res = await fetch(
				`/api/files/${encodeURIComponent(key)}?action=download`,
			);
			if (!res.ok) {
				throw new Error(`Couldn't sign URL (${res.status})`);
			}
			const data = (await res.json()) as { url: string };
			toast.dismiss(toastId);
			window.open(data.url, "_blank", "noopener,noreferrer");
		} catch (err) {
			toast.error("Couldn't download", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
		}
	};

	const onDelete = async (key: string) => {
		if (!confirm(`Delete ${nameFromKey(key)}? This can't be undone.`)) {
			return;
		}
		const toastId = toast.loading("Deleting…");
		setFiles((current) => current?.filter((f) => f.key !== key) ?? null);
		try {
			const res = await fetch(`/api/files/${encodeURIComponent(key)}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				throw new Error(`Delete failed (${res.status})`);
			}
			toast.success("Deleted", { id: toastId });
		} catch (err) {
			toast.error("Couldn't delete", {
				id: toastId,
				description: err instanceof Error ? err.message : "?",
			});
			await load();
		}
	};

	return (
		<>
			<PageHeader
				bordered
				title="Files"
				description="Drag and drop. Stored in Cloudflare R2, scoped to your user."
			/>

			<div className="grid gap-6">
				<Dropzone
					onFiles={onUpload}
					maxBytes={DEFAULT_MAX_BYTES}
					accept={ACCEPT}
					busy={busy}
					hint={`Up to ${formatBytes(DEFAULT_MAX_BYTES)} per file · images, PDF, text, JSON, ZIP`}
				/>

				<Card>
					<CardHeader className="border-b">
						<CardTitle className="text-base">Your uploads</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{files === null ? (
							<ul className="divide-y">
								{Array.from({ length: 3 }).map((_, i) => (
									<li key={i} className="flex items-center gap-3 px-6 py-4">
										<Skeleton className="h-9 w-9 rounded-md" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-48" />
											<Skeleton className="h-3 w-24" />
										</div>
									</li>
								))}
							</ul>
						) : files.length === 0 ? (
							<EmptyState
								illustration="stack"
								title="No files yet"
								description="Drop a file above to get started. Files are signed-URL fetched on download — never publicly listable."
								className="border-0 bg-transparent py-12"
							/>
						) : (
							<ul className="divide-y">
								{files.map((f) => (
									<li
										key={f.key}
										className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
									>
										<div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
											<FileIcon className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-sm">
												{nameFromKey(f.key)}
											</p>
											<p className="text-muted-foreground text-xs">
												{formatBytes(f.size)}
												{f.lastModified
													? ` · ${new Date(f.lastModified).toLocaleString()}`
													: null}
											</p>
										</div>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => onDownload(f.key)}
										>
											<Download className="mr-1.5 h-4 w-4" />
											Download
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => onDelete(f.key)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
											<span className="sr-only">Delete</span>
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
