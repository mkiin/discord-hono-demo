import type { CoreMessage } from "ai";
import type { BindingsEnv, Env } from "./types";

export async function loadHistory(
	env: BindingsEnv,
	channel_id: string,
): Promise<CoreMessage[]> {
	return (await env.CHAT_HISTORY.get(channel_id, { type: "json" })) ?? [];
}
export async function saveHistory(
	env: BindingsEnv,
	channel_id: string,
	messages: CoreMessage[],
) {
	const latest = messages.slice(-10);
	await env.CHAT_HISTORY.put(channel_id, JSON.stringify(latest), {
		expirationTtl: 60 * 60 * 24,
	});
}
