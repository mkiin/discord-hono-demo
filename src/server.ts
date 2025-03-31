import { InteractionContextType, InteractionType } from "discord-api-types/v10";
import { Command, type CommandContext, DiscordHono } from "discord-hono";
import type { CommandKey, Env } from "./types";
// import type { CommandContext } from "discord-hono";
// import { CommandKey, Env, ImageModels, TextModels } from "./types.js";
// import { MODEL_MAPPINGS } from "./constants.js";

// const defaultModel = (type: CommandKey) =>
//   type === "text"
//     ? MODEL_MAPPINGS["text-generation"][0]
//     : type === "image"
//     ? MODEL_MAPPINGS["text-to-image"][0]
//     : type === "image-genshin"
//     ? MODEL_MAPPINGS["text-to-image"][0]
//     : MODEL_MAPPINGS["text-generation"][0];

interface DeferrableContext<E extends Env> {
	env: E["Bindings"];
	waitUntil: ExecutionContext["waitUntil"];

	// 必要に応じて他のメソッドも追加
}

/**
 * バックグラウンドで実行される処理（簡易版）
 * 受け取ったメッセージをそのままフォローアップで返す。
 * @param message ユーザーが入力したメッセージ
 * @param ctx InteractionContext (c.resDefer のコールバックから渡される)
 * @param channelId チャンネルID (この簡易実装では未使用)
 * @param env 環境変数 (この簡易実装では未使用)
 * @param model モデル情報 (この簡易実装では未使用)
 * @param prompt プロンプト情報 (この簡易実装では未使用)
 */
export async function runChatStreamInBackground(
	message: string,
	ctx: DeferrableContext<Env>, // c.resDefer のコールバック引数を受け取る
	channelId: string | undefined, // 型だけ合わせておく
	env: Env, // 型だけ合わせておく
	model: string, // 型だけ合わせておく
	prompt: string, // 型だけ合わせておく
): Promise<void> {
	// 何も返さないので Promise<void>

	console.log(`Background task started for message: "${message}"`);

	try {
		// InteractionContext の followup メソッドを使って応答を送信
		await ctx.followup({
			content: `あなたが入力したのは:\n>>> ${message}`, // 受け取ったメッセージをそのまま返す
			// 必要であれば他のオプションも追加可能
			// 例: ephemeral: true など
		});
		console.log("Followup message sent successfully.");
	} catch (error) {
		console.error("Failed to send followup message in background task:", error);
		// ここでさらにエラー処理を行うことも可能 (例: 別の方法で通知する等)
		// ただし、この時点でユーザーへの直接的な応答は難しい場合がある
	}
}

const app = new DiscordHono()
	.command("chat", async (c) => {
		const message = c.var.prompt as string;
		return c.resDefer(async (ctxDefer) => {
			try {
			} catch (error) {}
		});
	})
	.component("delete-self", (c) => c.resDeferUpdate(c.followupDelete));

export default app;
InteractionContextType;
