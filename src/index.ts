import { Button, Components, DiscordHono } from "discord-hono";

const app = new DiscordHono()
  .command("text", (c) => c.res("world!"))
  .component("delete-self", (c) => c.resDeferUpdate(c.followupDelete));

export default app;
