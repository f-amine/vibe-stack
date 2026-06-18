import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/sections/hero";
import {
	SoftwareApplicationJsonLd,
	WebsiteJsonLd,
} from "@/components/seo/json-ld";
import { getRepoStars } from "@/lib/github";
import { ogMetadata, siteBase } from "@/lib/og";

const HOME_TITLE = "vibestack — The SaaS starter where Claude writes the rest.";
const HOME_DESCRIPTION =
	"Opinionated, AI-first SaaS starter. Stack pre-wired, Claude Code skills vendored in the repo. For devs and vibe-coders. Bring the business logic, skip the plumbing.";

export const metadata: Metadata = {
	title: HOME_TITLE,
	description: HOME_DESCRIPTION,
	alternates: {
		canonical: "/",
	},
	...ogMetadata({
		title: "Claude writes the rest.",
		subtitle:
			"Auth, billing, email, storage, deploy, pre-wired. Skills vendored.",
		eyebrow: "vibestack",
	}),
};

// Hero stays static — above the fold, anchors LCP. Below-fold sections
// each pull GSAP + ScrollTrigger (~41kb gz) and don't paint until the
// user scrolls; lazy them with SSR so the markup ships server-rendered
// (for SEO + no-JS) but the gsap bundle defers to idle.
const StackStrip = dynamic(() =>
	import("@/components/marketing/sections/stack-strip").then((m) => ({
		default: m.StackStrip,
	})),
);
const Features = dynamic(() =>
	import("@/components/marketing/sections/features").then((m) => ({
		default: m.Features,
	})),
);
const HowItWorks = dynamic(() =>
	import("@/components/marketing/sections/how-it-works").then((m) => ({
		default: m.HowItWorks,
	})),
);
const Free = dynamic(() =>
	import("@/components/marketing/sections/free").then((m) => ({
		default: m.Free,
	})),
);
const FAQ = dynamic(() =>
	import("@/components/marketing/sections/faq").then((m) => ({
		default: m.FAQ,
	})),
);
const CTA = dynamic(() =>
	import("@/components/marketing/sections/cta").then((m) => ({
		default: m.CTA,
	})),
);
const StickyCTA = dynamic(() =>
	import("@/components/marketing/sticky-cta").then((m) => ({
		default: m.StickyCTA,
	})),
);

export default async function HomePage() {
	const siteUrl = siteBase();
	const stars = await getRepoStars();
	return (
		<div className="marketing grain min-h-dvh">
			<MarketingHeader />
			<main>
				<WebsiteJsonLd
					siteUrl={siteUrl}
					name="vibestack"
					description="Opinionated, AI-first SaaS starter. Stack pre-wired, Claude Code skills vendored in the repo. For devs and vibe-coders."
				/>
				<SoftwareApplicationJsonLd siteUrl={siteUrl} />
				<Hero stars={stars} />
				<StackStrip />
				<Features />
				<HowItWorks />
				<Free />
				<FAQ />
				<CTA />
			</main>
			<MarketingFooter />
			<StickyCTA />
		</div>
	);
}
