"use client";

import { motion } from "framer-motion";
import { Globe, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const clauses = [
	{
		id: "collection",
		icon: Globe,
		title: "1. Information Gathering & Processing",
		updated: "June 10, 2026",
		content: (
			<div className="space-y-4">
				<p>
					When utilizing the Index platform, we gather specific
					details depending on the level of interaction:
				</p>
				<ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
					<li>
						<strong>Account Information:</strong> When creating an
						account, we collect your name, email address, and
						encrypted authentication credentials.
					</li>
					<li>
						<strong>Content Data:</strong> We store the content you
						create and publish through our platform. This data is
						encrypted at rest and only accessible to you and those
						you explicitly share it with.
					</li>
					<li>
						<strong>Usage Analytics:</strong> We collect anonymous
						usage statistics to improve our service. We do NOT
						analyze the content of your writing.
					</li>
				</ul>
			</div>
		),
	},
	{
		id: "security",
		icon: Lock,
		title: "2. Security Standards",
		updated: "May 24, 2026",
		content: (
			<div className="space-y-4">
				<p>
					The protection of your data is our highest priority. We
					operate under strict security protocols:
				</p>
				<ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
					<li>
						<strong>Encryption in Transit:</strong> All data
						transferred between your browser and our servers is
						encrypted using TLS 1.3.
					</li>
					<li>
						<strong>Encryption at Rest:</strong> Your content and
						personal information are encrypted at rest using
						industry-standard AES-256 encryption.
					</li>
					<li>
						<strong>Access Control:</strong> We follow the principle
						of least privilege. Only essential personnel have access
						to production systems, and all access is logged and
						audited.
					</li>
				</ul>
			</div>
		),
	},
	{
		id: "compliance",
		icon: ShieldCheck,
		title: "3. Compliance & Regulations",
		updated: "April 18, 2026",
		content: (
			<div className="space-y-4">
				<p>
					Index aligns with international guidelines protecting user
					data and privacy:
				</p>
				<ul className="list-disc pl-5 space-y-2 text-xs md:text-sm">
					<li>
						<strong>GDPR & CCPA Compliance:</strong> Users from the
						European Union and California retain full control over
						their data. You can request export or deletion of your
						data at any time.
					</li>
					<li>
						<strong>No Data Sales:</strong> Index has never sold,
						traded, or shared personal data with third-party
						marketing services.
					</li>
					<li>
						<strong>Transparent Operations:</strong> We are
						committed to transparency about how your data is
						collected, stored, and used.
					</li>
				</ul>
			</div>
		),
	},
];

export default function PolicyTabs() {
	const [activeSection, setActiveSection] = useState<string>("collection");

	return (
		<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
			<div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:border-r border-border lg:pr-4">
				{clauses.map((clause) => {
					const Icon = clause.icon;
					return (
						<Button
							key={clause.id}
							variant={
								activeSection === clause.id
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => setActiveSection(clause.id)}
							className="flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider font-mono rounded-none h-auto w-full justify-start whitespace-nowrap"
						>
							<Icon className="h-4 w-4 shrink-0" />
							{clause.id} Clause
						</Button>
					);
				})}
			</div>

			<div className="lg:col-span-3">
				{clauses.map((clause) => {
					if (activeSection !== clause.id) return null;
					return (
						<motion.div
							key={clause.id}
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
							className="space-y-4 bg-card p-6 md:p-8"
							id={`clause-${clause.id}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-border">
								<h3 className="font-display text-lg font-bold text-foreground">
									{clause.title}
								</h3>
								<span className="text-[10px] uppercase font-mono text-foreground/50 mt-1 sm:mt-0">
									Active since: {clause.updated}
								</span>
							</div>
							<div className="text-foreground/65 leading-relaxed text-xs md:text-sm">
								{clause.content}
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
