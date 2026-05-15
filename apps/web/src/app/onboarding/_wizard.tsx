"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@starter-saas/ui/components/avatar";
import { Button, buttonVariants } from "@starter-saas/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@starter-saas/ui/components/card";
import { Input } from "@starter-saas/ui/components/input";
import { Label } from "@starter-saas/ui/components/label";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { formatError } from "@/lib/format-error";

import { completeOnboardingAction } from "./_actions";

type Props = {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
	};
};

type StepKey = "profile" | "org" | "team" | "plan";

const STEPS: { key: StepKey; label: string; hint: string }[] = [
	{ key: "profile", label: "Profile", hint: "Tell us your name." },
	{ key: "org", label: "Workspace", hint: "Create your first org." },
	{ key: "team", label: "Team", hint: "Invite up to 3 teammates." },
	{ key: "plan", label: "Plan", hint: "Free is fine — upgrade later." },
];

function StepDots({ active }: { active: StepKey }) {
	return (
		<ol className="flex items-center gap-3">
			{STEPS.map((s, i) => {
				const isActive = s.key === active;
				const isDone = STEPS.findIndex((x) => x.key === active) > i;
				return (
					<li key={s.key} className="flex items-center gap-3">
						<span
							aria-current={isActive ? "step" : undefined}
							className={`inline-flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs ${
								isDone
									? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
									: isActive
										? "border-foreground bg-foreground text-background"
										: "border-border text-muted-foreground"
							}`}
						>
							{isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
						</span>
						<span
							className={`hidden text-sm sm:inline ${isActive ? "" : "text-muted-foreground"}`}
						>
							{s.label}
						</span>
						{i < STEPS.length - 1 ? (
							<span aria-hidden className="text-muted-foreground/50">
								·
							</span>
						) : null}
					</li>
				);
			})}
		</ol>
	);
}

export function OnboardingWizard({ user }: Props) {
	const router = useRouter();
	const [step, setStep] = React.useState<StepKey>("profile");
	const [name, setName] = React.useState(user.name);
	const [orgName, setOrgName] = React.useState("");
	const [orgSlug, setOrgSlug] = React.useState("");
	const [orgSlugTouched, setOrgSlugTouched] = React.useState(false);
	const [createdOrgId, setCreatedOrgId] = React.useState<string | null>(null);
	const [invites, setInvites] = React.useState<string[]>(["", "", ""]);
	const [busy, setBusy] = React.useState(false);
	const [finishing, setFinishing] = React.useState(false);

	const initials =
		(name || user.email)
			.split(" ")
			.map((s) => s[0])
			.slice(0, 2)
			.join("")
			.toUpperCase() || "U";

	const effectiveOrgSlug = orgSlugTouched
		? orgSlug
		: orgName
				.toLowerCase()
				.normalize("NFKD")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/-{2,}/g, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, 48);

	const finish = async (skipped: boolean) => {
		setFinishing(true);
		const toastId = toast.loading(
			skipped ? "Skipping onboarding…" : "Finishing onboarding…",
		);
		try {
			const result = await completeOnboardingAction({ skipped });
			if (!result.ok) {
				toast.error("Couldn't finish", {
					id: toastId,
					description: result.error,
				});
				return;
			}
			toast.success(skipped ? "Skipped — see you later" : "You're set", {
				id: toastId,
			});
			router.replace("/dashboard");
			router.refresh();
		} finally {
			setFinishing(false);
		}
	};

	const saveProfile = async () => {
		if (name.trim().length < 2) {
			toast.error("Name needs at least 2 characters");
			return;
		}
		setBusy(true);
		try {
			if (name.trim() !== user.name) {
				const { error } = await authClient.updateUser({ name: name.trim() });
				if (error) {
					toast.error(formatError(error, "Couldn't save profile"));
					return;
				}
			}
			setStep("org");
		} finally {
			setBusy(false);
		}
	};

	const createOrg = async () => {
		const trimmed = orgName.trim();
		if (trimmed.length < 2) {
			toast.error("Pick an org name (≥2 chars)");
			return;
		}
		if (effectiveOrgSlug.length < 2) {
			toast.error("Slug needs ≥2 chars");
			return;
		}
		setBusy(true);
		const toastId = toast.loading(`Creating ${trimmed}…`);
		try {
			const { data, error } = await authClient.organization.create({
				name: trimmed,
				slug: effectiveOrgSlug,
			});
			if (error) {
				toast.error(formatError(error, "Couldn't create"), { id: toastId });
				return;
			}
			const newId = (data as { id?: string } | null)?.id ?? null;
			setCreatedOrgId(newId);
			if (newId) {
				await authClient.organization.setActive({ organizationId: newId });
			}
			toast.success(`Created ${trimmed}`, { id: toastId });
			setStep("team");
		} finally {
			setBusy(false);
		}
	};

	const sendInvites = async () => {
		const emails = invites.map((e) => e.trim()).filter(Boolean);
		if (emails.length === 0) {
			setStep("plan");
			return;
		}
		if (!createdOrgId) {
			toast.error("No active org yet — go back to the workspace step.");
			return;
		}
		setBusy(true);
		const toastId = toast.loading(
			`Inviting ${emails.length} teammate${emails.length === 1 ? "" : "s"}…`,
		);
		try {
			const results = await Promise.allSettled(
				emails.map((email) =>
					authClient.organization.inviteMember({
						email,
						role: "member",
						organizationId: createdOrgId,
					}),
				),
			);
			const failures = results.filter(
				(r): r is PromiseRejectedResult => r.status === "rejected",
			);
			if (failures.length > 0) {
				toast.error(`Couldn't invite ${failures.length} of ${emails.length}`, {
					id: toastId,
				});
			} else {
				toast.success("Invitations sent", { id: toastId });
			}
			setStep("plan");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="grain relative min-h-dvh bg-background">
			<header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
				<Link
					href="/"
					className="inline-flex items-center gap-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs">
						S
					</span>
					<span>stack/saas</span>
				</Link>
				<button
					type="button"
					className="text-muted-foreground text-xs uppercase tracking-widest hover:text-foreground"
					onClick={() => void finish(true)}
					disabled={finishing}
				>
					Skip for now
				</button>
			</header>

			<main className="mx-auto max-w-xl px-6 pt-2 pb-20">
				<div className="mb-8 flex flex-col items-center gap-4">
					<StepDots active={step} />
					<p className="text-center font-display text-3xl tracking-tight sm:text-4xl">
						{STEPS.find((s) => s.key === step)?.hint}
					</p>
				</div>

				<Card>
					{step === "profile" ? (
						<>
							<CardHeader>
								<CardTitle>Quick hello</CardTitle>
								<CardDescription>
									Your name shows up on receipts, invites, and audit logs.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<div className="flex items-center gap-4">
									<Avatar className="h-14 w-14">
										{user.image ? (
											<AvatarImage src={user.image} alt="" />
										) : null}
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>
									<div className="text-muted-foreground text-xs">
										Avatar uploads land in the next release.
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="onb-name">Full name</Label>
									<Input
										id="onb-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={busy}
										autoFocus
									/>
								</div>
							</CardContent>
							<CardFooter className="justify-end">
								<Button onClick={saveProfile} disabled={busy}>
									Continue
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</Button>
							</CardFooter>
						</>
					) : null}

					{step === "org" ? (
						<>
							<CardHeader>
								<CardTitle>Name your workspace</CardTitle>
								<CardDescription>
									Workspaces hold teammates, billing, and audit history.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor="onb-org-name">Workspace name</Label>
									<Input
										id="onb-org-name"
										value={orgName}
										onChange={(e) => setOrgName(e.target.value)}
										placeholder="Acme Robotics"
										disabled={busy}
										autoFocus
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="onb-org-slug">Slug</Label>
									<Input
										id="onb-org-slug"
										value={effectiveOrgSlug}
										onChange={(e) => {
											setOrgSlugTouched(true);
											setOrgSlug(e.target.value.toLowerCase());
										}}
										placeholder="acme-robotics"
										disabled={busy}
									/>
								</div>
							</CardContent>
							<CardFooter className="justify-between">
								<Button
									variant="ghost"
									onClick={() => setStep("profile")}
									disabled={busy}
								>
									Back
								</Button>
								<Button onClick={createOrg} disabled={busy}>
									{busy ? "Creating…" : "Create workspace"}
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</Button>
							</CardFooter>
						</>
					) : null}

					{step === "team" ? (
						<>
							<CardHeader>
								<CardTitle>Invite up to 3 teammates</CardTitle>
								<CardDescription>
									We'll email each one a magic-link invitation. Leave blank to
									skip.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3">
								{invites.map((value, i) => (
									<Input
										key={`invite-${i}`}
										type="email"
										autoComplete="email"
										placeholder={`teammate-${i + 1}@example.com`}
										value={value}
										onChange={(e) =>
											setInvites((prev) =>
												prev.map((v, idx) => (idx === i ? e.target.value : v)),
											)
										}
										disabled={busy}
									/>
								))}
							</CardContent>
							<CardFooter className="justify-between">
								<Button
									variant="ghost"
									onClick={() => setStep("org")}
									disabled={busy}
								>
									Back
								</Button>
								<Button onClick={sendInvites} disabled={busy}>
									{busy
										? "Sending…"
										: invites.some((e) => e.trim())
											? "Send & continue"
											: "Skip"}
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</Button>
							</CardFooter>
						</>
					) : null}

					{step === "plan" ? (
						<>
							<CardHeader>
								<CardTitle>You're on Free for now</CardTitle>
								<CardDescription>
									All the boring parts are wired up. Upgrade when paid features
									become a fit.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3">
								<ul className="grid gap-2 text-sm">
									<li className="flex items-start gap-2">
										<CheckCircle2
											className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
											aria-hidden
										/>
										Authentication, billing, email, storage, analytics — all
										ready.
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2
											className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
											aria-hidden
										/>
										Audit logging on every consequential action.
									</li>
									<li className="flex items-start gap-2">
										<CheckCircle2
											className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
											aria-hidden
										/>
										Self-host friendly — Dokploy compose + nightly R2 backups.
									</li>
								</ul>
							</CardContent>
							<CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
								<Link
									href={{ pathname: "/dashboard/billing" }}
									className={`${buttonVariants({ variant: "outline" })} w-full sm:w-auto`}
								>
									Explore plans
								</Link>
								<Button onClick={() => void finish(false)} disabled={finishing}>
									{finishing ? "Saving…" : "Take me to the dashboard"}
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</Button>
							</CardFooter>
						</>
					) : null}
				</Card>
			</main>
		</div>
	);
}
