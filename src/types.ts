import { MODEL_MAPPINGS } from "./constants.js";

export type Env = {
	Bindings: {
		ACCOUNT_ID: string;
		AI_API_TOKEN: string;
	};
};

export type CommandKey = "text" | "image" | "image-genshin" | (string & {});

export type ModelMappings = typeof MODEL_MAPPINGS;
export type TextModels = ModelMappings["text-generation"][number];
export type ImageModels = ModelMappings["text-to-image"][number];
