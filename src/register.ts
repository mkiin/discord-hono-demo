import { env } from "node:process";
import { config } from "dotenv";
import { Command, Option, register } from "discord-hono";
import { ImageModels, TextModels } from "./constants.js";
config({ path: ".dev.vars" });

const options = (
  promptDesc: string,
  defaultModel: string,
  models: string[]
) => [
  new Option("prompt", promptDesc).required(),
  new Option("model", `選択モデル (デフォルト ${defaultModel})`).choices(
    ...models
      .map((m) => ({ name: m.replace("-", " "), value: m }))
      .sort((a, b) => a.name.localeCompare(b.name))
  ),
];

const commands = [
  new Command("chat", "AIチャット").options(
    ...options("AIに聞く内容", "gemini-2.5-pro-exp-03-25", TextModels)
  ),
  new Command("image", "画像生成").options(
    ...options("画像の要素", "gemini-2.0-flash-exp", ImageModels)
  ),
];

register(commands, env.DISCORD_APPLICATION_ID, env.DISCORD_TOKEN);
