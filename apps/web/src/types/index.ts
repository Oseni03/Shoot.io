export interface FeatureItem {
	id: string;
	title: string;
	description: string;
	category: string;
	tag: string;
}

export interface PricingPlan {
	id: string;
	name: string;
	priceMonthly: number;
	priceAnnually: number;
	description: string;
	features: string[];
	cta: string;
	popular: boolean;
}

export interface BrandColorPreset {
	name: string;
	hex: string;
	bgHex: string;
	fgHex: string;
}
