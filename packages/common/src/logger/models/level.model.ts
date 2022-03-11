export const LogLevel = {
	EMERGENCY: { name: "emerg", value: 0 },
	ALERT: { name: "alert", value: 1 },
	CRITICAL: { name: "crit", value: 2 },
	ERROR: { name: "error", value: 3 },
	WARNING: { name: "warning", value: 4 },
	NOTICE: { name: "notice", value: 5 },
	INFO: { name: "info", value: 6 },
	DEBUG: { name: "debug", value: 7 },
};

export type LogLevelType = keyof typeof LogLevel;
