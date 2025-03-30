import { Command, register } from "discord-hono";

const commands = [new Command("text", "AIチャット")];

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN
);
