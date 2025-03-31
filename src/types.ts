import type { MODEL_MAPPINGS } from "./constants";

export type Env = {
	Bindings: {
		ACCOUNT_ID: string;
		AI_API_TOKEN: string;
	};
};

export type CommandKey = "chat" | "image" | "image-genshin" | (string & {});

export type ModelMappings = typeof MODEL_MAPPINGS;
export type TextModels = ModelMappings["text-generation"][number];
export type ImageModels = ModelMappings["text-to-image"][number];
