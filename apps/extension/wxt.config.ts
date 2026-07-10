import { defineConfig } from "wxt";

export default defineConfig({
	extensionApi: "chrome",
	modules: [],
	manifest: {
		name: "Resumio",
		permissions: ["storage", "alarms"],
		host_permissions: ["*://*/*"],
	},
});
