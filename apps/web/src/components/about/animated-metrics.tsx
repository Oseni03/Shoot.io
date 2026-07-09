"use client";

import { motion } from "framer-motion";

const metrics = [
	{ label: "Global Edge Nodes", value: "140+" },
	{ label: "Requests Processed Daily", value: "2.4B+" },
	{ label: "Uptime SLA Guaranteed", value: "99.99%" },
	{ label: "Engineers Saved", value: "18,000+" },
];

export default function AnimatedMetrics() {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
			{metrics.map((metric, idx) => (
				<motion.div
					key={idx}
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.35, delay: idx * 0.05 }}
					className="bg-card p-6 text-center"
				>
					<p className="text-3xl font-extrabold font-display text-foreground">
						{metric.value}
					</p>
					<p className="text-[11px] font-mono font-semibold text-foreground/50 mt-2 uppercase tracking-wide">
						{metric.label}
					</p>
				</motion.div>
			))}
		</div>
	);
}
