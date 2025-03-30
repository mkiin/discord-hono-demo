import { Button, Components, DiscordHono } from "discord-hono";
import type { CommandContext } from "discord-hono";
import { CommandKey, Env, ImageModels, TextModels } from "./types";
import { MODEL_MAPPINGS } from "./constants";

const defaultModel = (type: CommandKey) =>
  type === "text"
    ? MODEL_MAPPINGS["text-generation"][0]
    : type === "image"
    ? MODEL_MAPPINGS["text-to-image"][0]
    : type === "image-genshin"
    ? MODEL_MAPPINGS["text-to-image"][0]
    : MODEL_MAPPINGS["text-generation"][0];

/**
 * AIの処理 ⇒ Discordの待機中メッセージへ送信
 * @param c Context
 * @param type AI type
 */
const cfai = async (c: CommandContext<Env>, type: CommandKey) => {
  const input = c.var.text;
  const model = (c.values.model || defaultModel(type)).toString() as
    | TextModels
    | ImageModels;
};

const app = new DiscordHono<Env>()
  .command("", (c) => c.resDefer(async (c) => cfai(c, c.key)))
  .component("delete-self", (c) => c.resDeferUpdate(c.followupDelete));

export default app;
