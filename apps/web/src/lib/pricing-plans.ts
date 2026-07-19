import { PlanTier } from "@/schemas";
import type { PricingPlan } from "@/types";

export const PRICING_PLANS: PricingPlan[] = [
	{
		id: PlanTier.FREE,
		name: "Free",
		priceMonthly: 0,
		priceAnnually: 0,
		description:
			"Perfect for getting started with basic features and exploring the platform.",
		popular: false,
		features: [
			"Up to 3 projects",
			"Basic features",
			"Community support",
			"Standard security",
		],
		cta: "Get Started",
	},
	{
		id: PlanTier.PRO,
		name: "Pro",
		priceMonthly: 29,
		priceAnnually: 24,
		description:
			"For professionals and growing teams who need advanced capabilities.",
		popular: true,
		features: [
			"Unlimited projects",
			"Advanced features",
			"Priority support",
			"Custom domains",
			"Team collaboration",
			"API access",
		],
		cta: "Start Pro",
	},
	{
		id: PlanTier.ULTIMATE,
		name: "Ultimate",
		priceMonthly: 299,
		priceAnnually: 249,
		description:
			"Custom solutions with dedicated support and enterprise-grade infrastructure.",
		popular: false,
		features: [
			"Everything in Pro",
			"Custom integrations",
			"Dedicated support team",
			"SLA guarantee",
			"On-premise deployment",
			"Custom contracts & pricing",
		],
		cta: "Contact Sales",
	},
];
