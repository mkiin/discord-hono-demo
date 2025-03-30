import { env } from "node:process";
import { config } from "dotenv";
import { Command, register } from "discord-hono";
config({ path: ".dev.vars" });
const commands = [new Command("text", "AIチャット")];

register(commands, env.DISCORD_APPLICATION_ID, env.DISCORD_TOKEN);
