"use client";

import { motion } from "framer-motion";
import Features from "@/components/homepage/features";
import Footer from "@/components/homepage/footer";
import Hero from "@/components/homepage/hero";
import Navbar from "@/components/homepage/navbar";
import Pricing from "@/components/homepage/pricing";
import SocialProof from "@/components/homepage/social-proof";

export default function HomePage() {
	return (
		<div
			id="saas-container-root"
			className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background relative"
		>
			<Navbar />

			<motion.main
				id="saas-main-flow"
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
			>
				<Hero />
				<SocialProof />
				<Features />
				<Pricing />
			</motion.main>

			<Footer />
		</div>
	);
}
