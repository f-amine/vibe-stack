import dynamic from "next/dynamic";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/sections/hero";

// Hero stays static — above the fold, anchors LCP. Below-fold sections
// each pull GSAP + ScrollTrigger (~41kb gz) and don't paint until the
// user scrolls; lazy them with SSR so the markup ships server-rendered
// (for SEO + no-JS) but the gsap bundle defers to idle.
const SocialProof = dynamic(() =>
	import("@/components/marketing/sections/social-proof").then((m) => ({
		default: m.SocialProof,
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
const Pricing = dynamic(() =>
	import("@/components/marketing/sections/pricing").then((m) => ({
		default: m.Pricing,
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

export default function HomePage() {
	return (
		<div className="marketing grain min-h-dvh">
			<MarketingHeader />
			<main>
				<Hero />
				<SocialProof />
				<Features />
				<HowItWorks />
				<Pricing />
				<FAQ />
				<CTA />
			</main>
			<MarketingFooter />
			<StickyCTA />
		</div>
	);
}
