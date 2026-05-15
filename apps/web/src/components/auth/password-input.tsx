"use client";

import { Input } from "@starter-saas/ui/components/input";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

type PasswordInputProps = Omit<
	React.ComponentProps<typeof Input>,
	"type" | "ref"
>;

export const PasswordInput = React.forwardRef<
	HTMLInputElement,
	PasswordInputProps
>(function PasswordInput({ className, ...props }, ref) {
	const [visible, setVisible] = React.useState(false);

	return (
		<div className="relative">
			<Input
				ref={ref}
				type={visible ? "text" : "password"}
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck="false"
				className={`pr-10 ${className ?? ""}`}
				{...props}
			/>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label={visible ? "Hide password" : "Show password"}
				aria-pressed={visible}
				tabIndex={-1}
			>
				{visible ? (
					<EyeOff className="h-4 w-4" aria-hidden />
				) : (
					<Eye className="h-4 w-4" aria-hidden />
				)}
			</button>
		</div>
	);
});
