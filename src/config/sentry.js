const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
	dsn: "https://8437d057d086ced40f19eef26730b90c@o4508607036784640.ingest.us.sentry.io/4508607039733760",
	integrations: [
		nodeProfilingIntegration(),
	],
	// Tracing
	tracesSampleRate: 1.0, //  Capture 100% of the transactions
});