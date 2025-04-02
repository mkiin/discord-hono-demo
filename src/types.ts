import type { MODEL_MAPPINGS } from "./constants";

export type Env = {
	Bindings: {
		DISCORD_PUBLIC_KEY: string; // public key for verifying requests
		DISCORD_APPLICATION_ID: string; // application id for oauth
		CHAT_HISTORY: KVNamespace;
		DISCORD_TOKEN: string;
		GOOGLE_GENERATIVE_AI_API_KEY: string;
	};
	Variables: {
		prompt: string;
		model: string;
	};
};

export type BindingsEnv = Env["Bindings"];

export type CommandKey = "chat" | "image" | "image-genshin" | (string & {});

export type ModelMappings = typeof MODEL_MAPPINGS;
export type TextModels = ModelMappings["text-generation"][number];
export type ImageModels = ModelMappings["text-to-image"][number];
