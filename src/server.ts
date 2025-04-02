import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { type CoreMessage, streamText } from "ai";
import { DiscordHono } from "discord-hono";
import { loadHistory, saveHistory } from "./backend";
import { SYSTEM } from "./constants";
import { updateMessage } from "./discord_helper";
import type { BindingsEnv, Env } from "./types";

const app = new DiscordHono<Env>().command("chat", (c) =>
	c.resDefer(async (c) => {
		const command = c.key;
		console.log("c var", c.var);
		switch (command) {
			case "chat": {
				const { prompt } = c.var;
				const model = "gemini-2.5-pro-exp-03-25";
				const token = c.interaction.token;
				const channel_id = c.interaction.channel?.id;
				if (!channel_id) {
					return await c.followup("チャンネルIDが無効です。");
				}
				console.log("input", prompt);
				const messages = await runChatStreamInBackGround(
					prompt,
					token,
					channel_id,
					c.env,
					model,
					SYSTEM,
				);
				await c.followup(messages);
				break;
			}
			default:
				c.followup("無効なコマンドです");
				break;
		}
	}),
);

const runChatStreamInBackGround = async (
	input: string,
	interaction_token: string,
	discord_channel_id: string,
	env: BindingsEnv,
	model: string,
	system: string,
) => {
	const startedAt = Date.now();

	const history = await loadHistory(env, discord_channel_id);
	const gemini = createGoogleGenerativeAI({
		apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
	});

	// ストリーム管理用の変数
	let currentText = "";
	let ended = false;
	let intervalId: null | NodeJS.Timeout = null;
	let timeoutId: null | NodeJS.Timeout = null;
	const onStreamEnd = async () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	try {
		// Geminiモデルを使用してストリーミングを開始
		const { fullStream } = await streamText({
			model: gemini(model, {
				useSearchGrounding: true, // Google検索を有効化
			}),
			maxTokens: 1024,
			system,
			messages: [
				...history,
				{
					role: "user",
					content: input,
				},
			],
		});

		// 1.5秒ごとにメッセージを更新
		// intervalId = setInterval(async () => {
		// 	await updateMessage(`${prefixed}\n\n${currentText}`, {
		// 		token: interaction_token,
		// 		appId: env.DISCORD_APPLICATION_ID,
		// 	});
		// }, 1500);

		// // 27秒後にタイムアウト
		// timeoutId = setTimeout(async () => {
		// 	if (!ended) {
		// 		await updateMessage(
		// 			`${prefixed}\n\n${currentText}\n[timeout:${Date.now() - startedAt}ms]`,
		// 			{
		// 				token: interaction_token,
		// 				appId: env.DISCORD_APPLICATION_ID,
		// 			},
		// 		);
		// 		await fullStream.cancel();
		// 	}
		// }, 27000);

		// ストリームからのレスポンスを処理
		for await (const part of fullStream) {
			const readableStringify = (obj: unknown) => JSON.stringify(obj, null, 2);
			switch (part.type) {
				case "text-delta": {
					currentText += part.textDelta;
					break;
				}
				case "error": {
					currentText += `\n[error] ${readableStringify(part.error)}`;
					break;
				}
				// Google検索の結果が含まれる場合の処理
				case "source": {
					// 検索結果のソースが含まれる場合
					if (part.source) {
						currentText += `\n[source: ${part.source.title || "検索結果"}]`;
					}
					break;
				}
			}
		}
		console.log("current text", currentText);

		// ストリーム終了処理
		ended = true;
		onStreamEnd();

		// 履歴を保存
		const newHistory = [
			...history,
			{ role: "user", content: input },
			{ role: "assistant", content: currentText },
		] as CoreMessage[];

		await saveHistory(env, discord_channel_id, newHistory);
		return currentText;
	} catch (e) {
		console.error(e);
		onStreamEnd();
		if (e instanceof Error) {
			await updateMessage(`内部エラー: ${e.stack}`, {
				token: interaction_token,
				appId: env.DISCORD_APPLICATION_ID,
			});
		}
	}
};

export default app;
