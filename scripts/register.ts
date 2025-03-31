import { env } from "node:process";
import { Command, Option, register } from "discord-hono";
import { config } from "dotenv";
import { ImageModels, TextModels } from "../src/constants";

config({ path: ".dev.vars" });

const options = (
	promptDesc: string,
	defaultModel: string,
	models: string[],
) => [
	new Option("prompt", promptDesc).required(),
	new Option("model", `選択モデル (デフォルト ${defaultModel})`).choices(
		...models
			.map((m) => ({ name: m, value: m }))
			.sort((a, b) => a.name.localeCompare(b.name)),
	),
];

const commands = [
	new Command("chat", "AIチャット").options(
		...options("プロンプト", "gemini-2.5-pro-exp-03-25", TextModels),
	),
	new Command("image", "画像生成").options(
		...options("プロンプト", "gemini-2.0-flash-exp", ImageModels),
	),
];
register(commands, env.DISCORD_APPLICATION_ID, env.DISCORD_TOKEN);
