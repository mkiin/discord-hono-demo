export const MODEL_MAPPINGS = {
	"text-generation": ["gemini-2.5-pro-exp-03-25", "gemini-2.0-flash-001"],
	"text-to-image": ["gemini-2.0-flash-exp"],
};

export const COMMANDS = {};

export const TextModels = MODEL_MAPPINGS["text-generation"];
export const ImageModels = MODEL_MAPPINGS["text-to-image"];

export const SYSTEM = `
あなたは優秀なアシスタントです。

- 詳細な情報を求められない限り、質問には簡潔に答えてください。
- 知らないことがあれば、それを検索して要約して回答してください。
`;
