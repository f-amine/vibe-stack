import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeader } from "@/components/marketing/header";
import { CTA } from "@/components/marketing/sections/cta";
import { FAQ } from "@/components/marketing/sections/faq";
import { Features } from "@/components/marketing/sections/features";
import { Hero } from "@/components/marketing/sections/hero";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { LogoMarquee } from "@/components/marketing/sections/logos";
import { Pricing } from "@/components/marketing/sections/pricing";

export default function HomePage() {
	return (
		<div className="marketing grain min-h-dvh">
			<MarketingHeader />
			<main>
				<Hero />
				<LogoMarquee />
				<Features />
				<HowItWorks />
				<Pricing />
				<FAQ />
				<CTA />
			</main>
			<MarketingFooter />
		</div>
	);
}
