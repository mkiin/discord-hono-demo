# Generating and Streaming Text

Large language models (LLMs) can generate text in response to a prompt, which can contain instructions and information to process.
For example, you can ask a model to come up with a recipe, draft an email, or summarize a document.

The AI SDK Core provides two functions to generate text and stream it from LLMs:

- [`generateText`](#generatetext): Generates text for a given prompt and model.
- [`streamText`](#streamtext): Streams text from a given prompt and model.

Advanced LLM features such as [tool calling](./tools-and-tool-calling) and [structured data generation](./generating-structured-data) are built on top of text generation.

## `generateText`

You can generate text using the [`generateText`](/docs/reference/ai-sdk-core/generate-text) function. This function is ideal for non-interactive use cases where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.

```tsx
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

You can use more [advanced prompts](./prompts) to generate text with more complex instructions and content:

```tsx
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  system:
    'You are a professional writer. ' +
    'You write simple, clear, and concise content.',
  prompt: `Summarize the following article in 3-5 sentences: ${article}`,
});
```

The result object of `generateText` contains several promises that resolve when all required data is available:

- `result.text`: The generated text.
- `result.reasoning`: The reasoning text of the model (only available for some models).
- `result.sources`: Sources that have been used as input to generate the response (only available for some models).
- `result.finishReason`: The reason the model finished generating text.
- `result.usage`: The usage of the model during text generation.

### Accessing response headers & body

Sometimes you need access to the full response from the model provider,
e.g. to access some provider-specific headers or body content.

You can access the raw response headers and body using the `response` property:

```ts
import { generateText } from 'ai';

const result = await generateText({
  // ...
});

console.log(JSON.stringify(result.response.headers, null, 2));
console.log(JSON.stringify(result.response.body, null, 2));
```

## `streamText`

Depending on your model and prompt, it can take a large language model (LLM) up to a minute to finish generating its response. This delay can be unacceptable for interactive use cases such as chatbots or real-time applications, where users expect immediate responses.

AI SDK Core provides the [`streamText`](/docs/reference/ai-sdk-core/stream-text) function which simplifies streaming text from LLMs:

```ts
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
});

// example: use textStream as an async iterable
for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

<Note>
  `result.textStream` is both a `ReadableStream` and an `AsyncIterable`.
</Note>

<Note type="warning">
  `streamText` immediately starts streaming and suppresses errors to prevent
  server crashes. Use the `onError` callback to log errors.
</Note>

You can use `streamText` on its own or in combination with [AI SDK
UI](/examples/next-pages/basics/streaming-text-generation) and [AI SDK
RSC](/examples/next-app/basics/streaming-text-generation).
The result object contains several helper functions to make the integration into [AI SDK UI](/docs/ai-sdk-ui) easier:

- `result.toDataStreamResponse()`: Creates a data stream HTTP response (with tool calls etc.) that can be used in a Next.js App Router API route.
- `result.pipeDataStreamToResponse()`: Writes data stream delta output to a Node.js response-like object.
- `result.toTextStreamResponse()`: Creates a simple text stream HTTP response.
- `result.pipeTextStreamToResponse()`: Writes text delta output to a Node.js response-like object.

<Note>
  `streamText` is using backpressure and only generates tokens as they are
  requested. You need to consume the stream in order for it to finish.
</Note>

It also provides several promises that resolve when the stream is finished:

- `result.text`: The generated text.
- `result.reasoning`: The reasoning text of the model (only available for some models).
- `result.sources`: Sources that have been used as input to generate the response (only available for some models).
- `result.finishReason`: The reason the model finished generating text.
- `result.usage`: The usage of the model during text generation.

### `onError` callback

`streamText` immediately starts streaming to enable sending data without waiting for the model.
Errors become part of the stream and are not thrown to prevent e.g. servers from crashing.

To log errors, you can provide an `onError` callback that is triggered when an error occurs.

```tsx highlight="6-8"
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onError({ error }) {
    console.error(error); // your error logging logic here
  },
});
```

### `onChunk` callback

When using `streamText`, you can provide an `onChunk` callback that is triggered for each chunk of the stream.

It receives the following chunk types:

- `text-delta`
- `reasoning`
- `source`
- `tool-call`
- `tool-result`
- `tool-call-streaming-start` (when `toolCallStreaming` is enabled)
- `tool-call-delta` (when `toolCallStreaming` is enabled)

```tsx highlight="6-11"
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onChunk({ chunk }) {
    // implement your own logic here, e.g.:
    if (chunk.type === 'text-delta') {
      console.log(chunk.text);
    }
  },
});
```

### `onFinish` callback

When using `streamText`, you can provide an `onFinish` callback that is triggered when the stream is finished (
[API Reference](/docs/reference/ai-sdk-core/stream-text#on-finish)
).
It contains the text, usage information, finish reason, messages, and more:

```tsx highlight="6-8"
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onFinish({ text, finishReason, usage, response }) {
    // your own logic, e.g. for saving the chat history or recording usage

    const messages = response.messages; // messages that were generated
  },
});
```

### `fullStream` property

You can read a stream with all events using the `fullStream` property.
This can be useful if you want to implement your own UI or handle the stream in a different way.
Here is an example of how to use the `fullStream` property:

```tsx
import { streamText } from 'ai';
import { z } from 'zod';

const result = streamText({
  model: yourModel,
  tools: {
    cityAttractions: {
      parameters: z.object({ city: z.string() }),
      execute: async ({ city }) => ({
        attractions: ['attraction1', 'attraction2', 'attraction3'],
      }),
    },
  },
  prompt: 'What are some San Francisco tourist attractions?',
});

for await (const part of result.fullStream) {
  switch (part.type) {
    case 'text-delta': {
      // handle text delta here
      break;
    }
    case 'reasoning': {
      // handle reasoning here
      break;
    }
    case 'source': {
      // handle source here
      break;
    }
    case 'tool-call': {
      switch (part.toolName) {
        case 'cityAttractions': {
          // handle tool call here
          break;
        }
      }
      break;
    }
    case 'tool-result': {
      switch (part.toolName) {
        case 'cityAttractions': {
          // handle tool result here
          break;
        }
      }
      break;
    }
    case 'finish': {
      // handle finish here
      break;
    }
    case 'error': {
      // handle error here
      break;
    }
  }
}
```

### Stream transformation

You can use the `experimental_transform` option to transform the stream.
This is useful for e.g. filtering, changing, or smoothing the text stream.

The transformations are applied before the callbacks are invoked and the promises are resolved.
If you e.g. have a transformation that changes all text to uppercase, the `onFinish` callback will receive the transformed text.

#### Smoothing streams

The AI SDK Core provides a [`smoothStream` function](/docs/reference/ai-sdk-core/smooth-stream) that
can be used to smooth out text streaming.

```tsx highlight="6"
import { smoothStream, streamText } from 'ai';

const result = streamText({
  model,
  prompt,
  experimental_transform: smoothStream(),
});
```

#### Custom transformations

You can also implement your own custom transformations.
The transformation function receives the tools that are available to the model,
and returns a function that is used to transform the stream.
Tools can either be generic or limited to the tools that you are using.

Here is an example of how to implement a custom transformation that converts
all text to uppercase:

```ts
const upperCaseTransform =
  <TOOLS extends ToolSet>() =>
  (options: { tools: TOOLS; stopStream: () => void }) =>
    new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        controller.enqueue(
          // for text-delta chunks, convert the text to uppercase:
          chunk.type === 'text-delta'
            ? { ...chunk, textDelta: chunk.textDelta.toUpperCase() }
            : chunk,
        );
      },
    });
```

You can also stop the stream using the `stopStream` function.
This is e.g. useful if you want to stop the stream when model guardrails are violated, e.g. by generating inappropriate content.

When you invoke `stopStream`, it is important to simulate the `step-finish` and `finish` events to guarantee that a well-formed stream is returned
and all callbacks are invoked.

```ts
const stopWordTransform =
  <TOOLS extends ToolSet>() =>
  ({ stopStream }: { stopStream: () => void }) =>
    new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      // note: this is a simplified transformation for testing;
      // in a real-world version more there would need to be
      // stream buffering and scanning to correctly emit prior text
      // and to detect all STOP occurrences.
      transform(chunk, controller) {
        if (chunk.type !== 'text-delta') {
          controller.enqueue(chunk);
          return;
        }

        if (chunk.textDelta.includes('STOP')) {
          // stop the stream
          stopStream();

          // simulate the step-finish event
          controller.enqueue({
            type: 'step-finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: {
              completionTokens: NaN,
              promptTokens: NaN,
              totalTokens: NaN,
            },
            request: {},
            response: {
              id: 'response-id',
              modelId: 'mock-model-id',
              timestamp: new Date(0),
            },
            warnings: [],
            isContinued: false,
          });

          // simulate the finish event
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: {
              completionTokens: NaN,
              promptTokens: NaN,
              totalTokens: NaN,
            },
            response: {
              id: 'response-id',
              modelId: 'mock-model-id',
              timestamp: new Date(0),
            },
          });

          return;
        }

        controller.enqueue(chunk);
      },
    });
```

#### Multiple transformations

You can also provide multiple transformations. They are applied in the order they are provided.

```tsx highlight="4"
const result = streamText({
  model,
  prompt,
  experimental_transform: [firstTransform, secondTransform],
});
```

## Sources

Some providers such as [Perplexity](/providers/ai-sdk-providers/perplexity#sources) and
[Google Generative AI](/providers/ai-sdk-providers/google-generative-ai#sources) include sources in the response.

Currently sources are limited to web pages that ground the response.
You can access them using the `sources` property of the result.

Each `url` source contains the following properties:

- `id`: The ID of the source.
- `url`: The URL of the source.
- `title`: The optional title of the source.
- `providerMetadata`: Provider metadata for the source.

When you use `generateText`, you can access the sources using the `sources` property:

```ts
const result = await generateText({
  model: google('gemini-2.0-flash-exp', { useSearchGrounding: true }),
  prompt: 'List the top 5 San Francisco news from the past week.',
});

for (const source of result.sources) {
  if (source.sourceType === 'url') {
    console.log('ID:', source.id);
    console.log('Title:', source.title);
    console.log('URL:', source.url);
    console.log('Provider metadata:', source.providerMetadata);
    console.log();
  }
}
```

When you use `streamText`, you can access the sources using the `fullStream` property:

```tsx
const result = streamText({
  model: google('gemini-2.0-flash-exp', { useSearchGrounding: true }),
  prompt: 'List the top 5 San Francisco news from the past week.',
});

for await (const part of result.fullStream) {
  if (part.type === 'source' && part.source.sourceType === 'url') {
    console.log('ID:', part.source.id);
    console.log('Title:', part.source.title);
    console.log('URL:', part.source.url);
    console.log('Provider metadata:', part.source.providerMetadata);
    console.log();
  }
}
```

The sources are also available in the `result.sources` promise.

## Generating Long Text

Most language models have an output limit that is much shorter than their context window.
This means that you cannot generate long text in one go,
but it is possible to add responses back to the input and continue generating
to create longer text.

`generateText` and `streamText` support such continuations for long text generation using the experimental `continueSteps` setting:

```tsx highlight="5-6,9-10"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const {
  text, // combined text
  usage, // combined usage of all steps
} = await generateText({
  model: openai('gpt-4o'), // 4096 output tokens
  maxSteps: 5, // enable multi-step calls
  experimental_continueSteps: true,
  prompt:
    'Write a book about Roman history, ' +
    'from the founding of the city of Rome ' +
    'to the fall of the Western Roman Empire. ' +
    'Each chapter MUST HAVE at least 1000 words.',
});
```

<Note>
  When `experimental_continueSteps` is enabled, only full words are streamed in
  `streamText`, and both `generateText` and `streamText` might drop the trailing
  tokens of some calls to prevent whitespace issues.
</Note>

<Note type="warning">
  Some models might not always stop correctly on their own and keep generating
  until `maxSteps` is reached. You can hint the model to stop by e.g. using a
  system message such as "Stop when sufficient information was provided."
</Note>

## Examples

You can see `generateText` and `streamText` in action using various frameworks in the following examples:

### `generateText`

<ExampleLinks
  examples={[
    {
      title: 'Learn to generate text in Node.js',
      link: '/examples/node/generating-text/generate-text',
    },
    {
      title:
        'Learn to generate text in Next.js with Route Handlers (AI SDK UI)',
      link: '/examples/next-pages/basics/generating-text',
    },
    {
      title:
        'Learn to generate text in Next.js with Server Actions (AI SDK RSC)',
      link: '/examples/next-app/basics/generating-text',
    },
  ]}
/>

### `streamText`

<ExampleLinks
  examples={[
    {
      title: 'Learn to stream text in Node.js',
      link: '/examples/node/generating-text/stream-text',
    },
    {
      title: 'Learn to stream text in Next.js with Route Handlers (AI SDK UI)',
      link: '/examples/next-pages/basics/streaming-text-generation',
    },
    {
      title: 'Learn to stream text in Next.js with Server Actions (AI SDK RSC)',
      link: '/examples/next-app/basics/streaming-text-generation',
    },
  ]}
/>

---
title: Generating Structured Data
description: Learn how to generate structured data with the AI SDK.
---

# Generating Structured Data

While text generation can be useful, your use case will likely call for generating structured data.
For example, you might want to extract information from text, classify data, or generate synthetic data.

Many language models are capable of generating structured data, often defined as using "JSON modes" or "tools".
However, you need to manually provide schemas and then validate the generated data as LLMs can produce incorrect or incomplete structured data.

The AI SDK standardises structured object generation across model providers
with the [`generateObject`](/docs/reference/ai-sdk-core/generate-object)
and [`streamObject`](/docs/reference/ai-sdk-core/stream-object) functions.
You can use both functions with different output strategies, e.g. `array`, `object`, or `no-schema`,
and with different generation modes, e.g. `auto`, `tool`, or `json`.
You can use [Zod schemas](/docs/reference/ai-sdk-core/zod-schema), [Valibot](/docs/reference/ai-sdk-core/valibot-schema), or [JSON schemas](/docs/reference/ai-sdk-core/json-schema) to specify the shape of the data that you want,
and the AI model will generate data that conforms to that structure.

<Note>
  You can pass Zod objects directly to the AI SDK functions or use the
  `zodSchema` helper function.
</Note>

## Generate Object

The `generateObject` generates structured data from a prompt.
The schema is also used to validate the generated data, ensuring type safety and correctness.

```ts
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: yourModel,
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

<Note>
  See `generateObject` in action with [these examples](#more-examples)
</Note>

### Accessing response headers & body

Sometimes you need access to the full response from the model provider,
e.g. to access some provider-specific headers or body content.

You can access the raw response headers and body using the `response` property:

```ts
import { generateText } from 'ai';

const result = await generateText({
  // ...
});

console.log(JSON.stringify(result.response.headers, null, 2));
console.log(JSON.stringify(result.response.body, null, 2));
```

## Stream Object

Given the added complexity of returning structured data, model response time can be unacceptable for your interactive use case.
With the [`streamObject`](/docs/reference/ai-sdk-core/stream-object) function, you can stream the model's response as it is generated.

```ts
import { streamObject } from 'ai';

const { partialObjectStream } = streamObject({
  // ...
});

// use partialObjectStream as an async iterable
for await (const partialObject of partialObjectStream) {
  console.log(partialObject);
}
```

You can use `streamObject` to stream generated UIs in combination with React Server Components (see [Generative UI](../ai-sdk-rsc))) or the [`useObject`](/docs/reference/ai-sdk-ui/use-object) hook.

<Note>See `streamObject` in action with [these examples](#more-examples)</Note>

### `onError` callback

`streamObject` immediately starts streaming.
Errors become part of the stream and are not thrown to prevent e.g. servers from crashing.

To log errors, you can provide an `onError` callback that is triggered when an error occurs.

```tsx highlight="5-7"
import { streamObject } from 'ai';

const result = streamObject({
  // ...
  onError({ error }) {
    console.error(error); // your error logging logic here
  },
});
```

## Output Strategy

You can use both functions with different output strategies, e.g. `array`, `object`, or `no-schema`.

### Object

The default output strategy is `object`, which returns the generated data as an object.
You don't need to specify the output strategy if you want to use the default.

### Array

If you want to generate an array of objects, you can set the output strategy to `array`.
When you use the `array` output strategy, the schema specifies the shape of an array element.
With `streamObject`, you can also stream the generated array elements using `elementStream`.

```ts highlight="7,18"
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

const { elementStream } = streamObject({
  model: openai('gpt-4-turbo'),
  output: 'array',
  schema: z.object({
    name: z.string(),
    class: z
      .string()
      .describe('Character class, e.g. warrior, mage, or thief.'),
    description: z.string(),
  }),
  prompt: 'Generate 3 hero descriptions for a fantasy role playing game.',
});

for await (const hero of elementStream) {
  console.log(hero);
}
```

### Enum

If you want to generate a specific enum value, e.g. for classification tasks,
you can set the output strategy to `enum`
and provide a list of possible values in the `enum` parameter.

<Note>Enum output is only available with `generateObject`.</Note>

```ts highlight="5-6"
import { generateObject } from 'ai';

const { object } = await generateObject({
  model: yourModel,
  output: 'enum',
  enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi'],
  prompt:
    'Classify the genre of this movie plot: ' +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."',
});
```

### No Schema

In some cases, you might not want to use a schema,
for example when the data is a dynamic user request.
You can use the `output` setting to set the output format to `no-schema` in those cases
and omit the schema parameter.

```ts highlight="6"
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

const { object } = await generateObject({
  model: openai('gpt-4-turbo'),
  output: 'no-schema',
  prompt: 'Generate a lasagna recipe.',
});
```

## Generation Mode

While some models (like OpenAI) natively support object generation, others require alternative methods, like modified [tool calling](/docs/ai-sdk-core/tools-and-tool-calling). The `generateObject` function allows you to specify the method it will use to return structured data.

- `auto`: The provider will choose the best mode for the model. This recommended mode is used by default.
- `tool`: A tool with the JSON schema as parameters is provided and the provider is instructed to use it.
- `json`: The response format is set to JSON when supported by the provider, e.g. via json modes or grammar-guided generation. If grammar-guided generation is not supported, the JSON schema and instructions to generate JSON that conforms to the schema are injected into the system prompt.

<Note>
  Please note that not every provider supports all generation modes. Some
  providers do not support object generation at all.
</Note>

## Schema Name and Description

You can optionally specify a name and description for the schema. These are used by some providers for additional LLM guidance, e.g. via tool or schema name.

```ts highlight="6-7"
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: yourModel,
  schemaName: 'Recipe',
  schemaDescription: 'A recipe for a dish.',
  schema: z.object({
    name: z.string(),
    ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
    steps: z.array(z.string()),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

## Error Handling

When `generateObject` cannot generate a valid object, it throws a [`AI_NoObjectGeneratedError`](/docs/reference/ai-sdk-errors/ai-no-object-generated-error).

This error occurs when the AI provider fails to generate a parsable object that conforms to the schema.
It can arise due to the following reasons:

- The model failed to generate a response.
- The model generated a response that could not be parsed.
- The model generated a response that could not be validated against the schema.

The error preserves the following information to help you log the issue:

- `text`: The text that was generated by the model. This can be the raw text or the tool call text, depending on the object generation mode.
- `response`: Metadata about the language model response, including response id, timestamp, and model.
- `usage`: Request token usage.
- `cause`: The cause of the error (e.g. a JSON parsing error). You can use this for more detailed error handling.

```ts
import { generateObject, NoObjectGeneratedError } from 'ai';

try {
  await generateObject({ model, schema, prompt });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.log('NoObjectGeneratedError');
    console.log('Cause:', error.cause);
    console.log('Text:', error.text);
    console.log('Response:', error.response);
    console.log('Usage:', error.usage);
  }
}
```

## Repairing Invalid or Malformed JSON

<Note type="warning">
  The `repairText` function is experimental and may change in the future.
</Note>

Sometimes the model will generate invalid or malformed JSON.
You can use the `repairText` function to attempt to repair the JSON.

It receives the error, either a `JSONParseError` or a `TypeValidationError`,
and the text that was generated by the model.
You can then attempt to repair the text and return the repaired text.

```ts highlight="7-10"
import { generateObject } from 'ai';

const { object } = await generateObject({
  model,
  schema,
  prompt,
  experimental_repairText: async ({ text, error }) => {
    // example: add a closing brace to the text
    return text + '}';
  },
});
```

## Structured outputs with `generateText` and `streamText`

You can generate structured data with `generateText` and `streamText` by using the `experimental_output` setting.

<Note>
  Some models, e.g. those by OpenAI, support structured outputs and tool calling
  at the same time. This is only possible with `generateText` and `streamText`.
</Note>

<Note type="warning">
  Structured output generation with `generateText` and `streamText` is
  experimental and may change in the future.
</Note>

### `generateText`

```ts highlight="2,4-18"
// experimental_output is a structured object that matches the schema:
const { experimental_output } = await generateText({
  // ...
  experimental_output: Output.object({
    schema: z.object({
      name: z.string(),
      age: z.number().nullable().describe('Age of the person.'),
      contact: z.object({
        type: z.literal('email'),
        value: z.string(),
      }),
      occupation: z.object({
        type: z.literal('employed'),
        company: z.string(),
        position: z.string(),
      }),
    }),
  }),
  prompt: 'Generate an example person for testing.',
});
```

### `streamText`

```ts highlight="2,4-18"
// experimental_partialOutputStream contains generated partial objects:
const { experimental_partialOutputStream } = await streamText({
  // ...
  experimental_output: Output.object({
    schema: z.object({
      name: z.string(),
      age: z.number().nullable().describe('Age of the person.'),
      contact: z.object({
        type: z.literal('email'),
        value: z.string(),
      }),
      occupation: z.object({
        type: z.literal('employed'),
        company: z.string(),
        position: z.string(),
      }),
    }),
  }),
  prompt: 'Generate an example person for testing.',
});
```

## More Examples

You can see `generateObject` and `streamObject` in action using various frameworks in the following examples:

### `generateObject`

<ExampleLinks
  examples={[
    {
      title: 'Learn to generate objects in Node.js',
      link: '/examples/node/generating-structured-data/generate-object',
    },
    {
      title:
        'Learn to generate objects in Next.js with Route Handlers (AI SDK UI)',
      link: '/examples/next-pages/basics/generating-object',
    },
    {
      title:
        'Learn to generate objects in Next.js with Server Actions (AI SDK RSC)',
      link: '/examples/next-app/basics/generating-object',
    },
  ]}
/>

### `streamObject`

<ExampleLinks
  examples={[
    {
      title: 'Learn to stream objects in Node.js',
      link: '/examples/node/streaming-structured-data/stream-object',
    },
    {
      title:
        'Learn to stream objects in Next.js with Route Handlers (AI SDK UI)',
      link: '/examples/next-pages/basics/streaming-object-generation',
    },
    {
      title:
        'Learn to stream objects in Next.js with Server Actions (AI SDK RSC)',
      link: '/examples/next-app/basics/streaming-object-generation',
    },
  ]}
/>

---
title: Tool Calling
description: Learn about tool calling and multi-step calls (using maxSteps) with AI SDK Core.
---

# Tool Calling

As covered under Foundations, [tools](/docs/foundations/tools) are objects that can be called by the model to perform a specific task.
AI SDK Core tools contain three elements:

- **`description`**: An optional description of the tool that can influence when the tool is picked.
- **`parameters`**: A [Zod schema](/docs/foundations/tools#schemas) or a [JSON schema](/docs/reference/ai-sdk-core/json-schema) that defines the parameters. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
- **`execute`**: An optional async function that is called with the arguments from the tool call. It produces a value of type `RESULT` (generic type). It is optional because you might want to forward tool calls to the client or to a queue instead of executing them in the same process.

<Note className="mb-2">
  You can use the [`tool`](/docs/reference/ai-sdk-core/tool) helper function to
  infer the types of the `execute` parameters.
</Note>

The `tools` parameter of `generateText` and `streamText` is an object that has the tool names as keys and the tools as values:

```ts highlight="6-17"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

<Note>
  When a model uses a tool, it is called a "tool call" and the output of the
  tool is called a "tool result".
</Note>

Tool calling is not restricted to only text generation.
You can also use it to render user interfaces (Generative UI).

## Multi-Step Calls (using maxSteps)

With the `maxSteps` setting, you can enable multi-step calls in `generateText` and `streamText`. When `maxSteps` is set to a number greater than 1 and the model generates a tool call, the AI SDK will trigger a new generation passing in the tool result until there
are no further tool calls or the maximum number of tool steps is reached.

<Note>
  To decide what value to set for `maxSteps`, consider the most complex task the
  call might handle and the number of sequential steps required for completion,
  rather than just the number of available tools.
</Note>

By default, when you use `generateText` or `streamText`, it triggers a single generation (`maxSteps: 1`). This works well for many use cases where you can rely on the model's training data to generate a response. However, when you provide tools, the model now has the choice to either generate a normal text response, or generate a tool call. If the model generates a tool call, it's generation is complete and that step is finished.

You may want the model to generate text after the tool has been executed, either to summarize the tool results in the context of the users query. In many cases, you may also want the model to use multiple tools in a single response. This is where multi-step calls come in.

You can think of multi-step calls in a similar way to a conversation with a human. When you ask a question, if the person does not have the requisite knowledge in their common knowledge (a model's training data), the person may need to look up information (use a tool) before they can provide you with an answer. In the same way, the model may need to call a tool to get the information it needs to answer your question where each generation (tool call or text generation) is a step.

### Example

In the following example, there are two steps:

1. **Step 1**
   1. The prompt `'What is the weather in San Francisco?'` is sent to the model.
   1. The model generates a tool call.
   1. The tool call is executed.
1. **Step 2**
   1. The tool result is sent to the model.
   1. The model generates a response considering the tool result.

```ts highlight="18"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const { text, steps } = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  maxSteps: 5, // allow up to 5 steps
  prompt: 'What is the weather in San Francisco?',
});
```

<Note>You can use `streamText` in a similar way.</Note>

### Steps

To access intermediate tool calls and results, you can use the `steps` property in the result object
or the `streamText` `onFinish` callback.
It contains all the text, tool calls, tool results, and more from each step.

#### Example: Extract tool results from all steps

```ts highlight="3,9-10"
import { generateText } from 'ai';

const { steps } = await generateText({
  model: openai('gpt-4-turbo'),
  maxSteps: 10,
  // ...
});

// extract all tool calls from the steps:
const allToolCalls = steps.flatMap(step => step.toolCalls);
```

### `onStepFinish` callback

When using `generateText` or `streamText`, you can provide an `onStepFinish` callback that
is triggered when a step is finished,
i.e. all text deltas, tool calls, and tool results for the step are available.
When you have multiple steps, the callback is triggered for each step.

```tsx highlight="5-7"
import { generateText } from 'ai';

const result = await generateText({
  // ...
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    // your own logic, e.g. for saving the chat history or recording usage
  },
});
```

## Response Messages

Adding the generated assistant and tool messages to your conversation history is a common task,
especially if you are using multi-step tool calls.

Both `generateText` and `streamText` have a `response.messages` property that you can use to
add the assistant and tool messages to your conversation history.
It is also available in the `onFinish` callback of `streamText`.

The `response.messages` property contains an array of `CoreMessage` objects that you can add to your conversation history:

```ts
import { generateText } from 'ai';

const messages: CoreMessage[] = [
  // ...
];

const { response } = await generateText({
  // ...
  messages,
});

// add the response messages to your conversation history:
messages.push(...response.messages); // streamText: ...((await response).messages)
```

## Tool Choice

You can use the `toolChoice` setting to influence when a tool is selected.
It supports the following settings:

- `auto` (default): the model can choose whether and which tools to call.
- `required`: the model must call a tool. It can choose which tool to call.
- `none`: the model must not call tools
- `{ type: 'tool', toolName: string (typed) }`: the model must call the specified tool

```ts highlight="18"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  toolChoice: 'required', // force the model to call a tool
  prompt: 'What is the weather in San Francisco?',
});
```

## Tool Execution Options

When tools are called, they receive additional options as a second parameter.

### Tool Call ID

The ID of the tool call is forwarded to the tool execution.
You can use it e.g. when sending tool-call related information with stream data.

```ts highlight="14-20"
import { StreamData, streamText, tool } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const data = new StreamData();

  const result = streamText({
    // ...
    messages,
    tools: {
      myTool: tool({
        // ...
        execute: async (args, { toolCallId }) => {
          // return e.g. custom status for tool call
          data.appendMessageAnnotation({
            type: 'tool-status',
            toolCallId,
            status: 'in-progress',
          });
          // ...
        },
      }),
    },
    onFinish() {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}
```

### Messages

The messages that were sent to the language model to initiate the response that contained the tool call are forwarded to the tool execution.
You can access them in the second parameter of the `execute` function.
In multi-step calls, the messages contain the text, tool calls, and tool results from all previous steps.

```ts highlight="8-9"
import { generateText, tool } from 'ai';

const result = await generateText({
  // ...
  tools: {
    myTool: tool({
      // ...
      execute: async (args, { messages }) => {
        // use the message history in e.g. calls to other language models
        return something;
      },
    }),
  },
});
```

### Abort Signals

The abort signals from `generateText` and `streamText` are forwarded to the tool execution.
You can access them in the second parameter of the `execute` function and e.g. abort long-running computations or forward them to fetch calls inside tools.

```ts highlight="6,11,14"
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: yourModel,
  abortSignal: myAbortSignal, // signal that will be forwarded to tools
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({ location: z.string() }),
      execute: async ({ location }, { abortSignal }) => {
        return fetch(
          `https://api.weatherapi.com/v1/current.json?q=${location}`,
          { signal: abortSignal }, // forward the abort signal to fetch
        );
      },
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

## Types

Modularizing your code often requires defining types to ensure type safety and reusability.
To enable this, the AI SDK provides several helper types for tools, tool calls, and tool results.

You can use them to strongly type your variables, function parameters, and return types
in parts of the code that are not directly related to `streamText` or `generateText`.

Each tool call is typed with `ToolCall<NAME extends string, ARGS>`, depending
on the tool that has been invoked.
Similarly, the tool results are typed with `ToolResult<NAME extends string, ARGS, RESULT>`.

The tools in `streamText` and `generateText` are defined as a `ToolSet`.
The type inference helpers `ToolCallUnion<TOOLS extends ToolSet>`
and `ToolResultUnion<TOOLS extends ToolSet>` can be used to
extract the tool call and tool result types from the tools.

```ts highlight="18-19,23-24"
import { openai } from '@ai-sdk/openai';
import { ToolCallUnion, ToolResultUnion, generateText, tool } from 'ai';
import { z } from 'zod';

const myToolSet = {
  firstTool: tool({
    description: 'Greets the user',
    parameters: z.object({ name: z.string() }),
    execute: async ({ name }) => `Hello, ${name}!`,
  }),
  secondTool: tool({
    description: 'Tells the user their age',
    parameters: z.object({ age: z.number() }),
    execute: async ({ age }) => `You are ${age} years old!`,
  }),
};

type MyToolCall = ToolCallUnion<typeof myToolSet>;
type MyToolResult = ToolResultUnion<typeof myToolSet>;

async function generateSomething(prompt: string): Promise<{
  text: string;
  toolCalls: Array<MyToolCall>; // typed tool calls
  toolResults: Array<MyToolResult>; // typed tool results
}> {
  return generateText({
    model: openai('gpt-4o'),
    tools: myToolSet,
    prompt,
  });
}
```

## Handling Errors

The AI SDK has three tool-call related errors:

- [`NoSuchToolError`](/docs/reference/ai-sdk-errors/ai-no-such-tool-error): the model tries to call a tool that is not defined in the tools object
- [`InvalidToolArgumentsError`](/docs/reference/ai-sdk-errors/ai-invalid-tool-arguments-error): the model calls a tool with arguments that do not match the tool's parameters
- [`ToolExecutionError`](/docs/reference/ai-sdk-errors/ai-tool-execution-error): an error that occurred during tool execution
- [`ToolCallRepairError`](/docs/reference/ai-sdk-errors/ai-tool-call-repair-error): an error that occurred during tool call repair

### `generateText`

`generateText` throws errors and can be handled using a `try`/`catch` block:

```ts
try {
  const result = await generateText({
    //...
  });
} catch (error) {
  if (NoSuchToolError.isInstance(error)) {
    // handle the no such tool error
  } else if (InvalidToolArgumentsError.isInstance(error)) {
    // handle the invalid tool arguments error
  } else if (ToolExecutionError.isInstance(error)) {
    // handle the tool execution error
  } else {
    // handle other errors
  }
}
```

### `streamText`

`streamText` sends the errors as part of the full stream. The error parts contain the error object.

When using `toDataStreamResponse`, you can pass an `getErrorMessage` function to extract the error message from the error part and forward it as part of the data stream response:

```ts
const result = streamText({
  // ...
});

return result.toDataStreamResponse({
  getErrorMessage: error => {
    if (NoSuchToolError.isInstance(error)) {
      return 'The model tried to call a unknown tool.';
    } else if (InvalidToolArgumentsError.isInstance(error)) {
      return 'The model called a tool with invalid arguments.';
    } else if (ToolExecutionError.isInstance(error)) {
      return 'An error occurred during tool execution.';
    } else {
      return 'An unknown error occurred.';
    }
  },
});
```

## Tool Call Repair

<Note type="warning">
  The tool call repair feature is experimental and may change in the future.
</Note>

Language models sometimes fail to generate valid tool calls,
especially when the parameters are complex or the model is smaller.

You can use the `experimental_repairToolCall` function to attempt to repair the tool call
with a custom function.

You can use different strategies to repair the tool call:

- Use a model with structured outputs to generate the arguments.
- Send the messages, system prompt, and tool schema to a stronger model to generate the arguments.
- Provide more specific repair instructions based on which tool was called.

### Example: Use a model with structured outputs for repair

```ts
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
  model,
  tools,
  prompt,

  experimental_repairToolCall: async ({
    toolCall,
    tools,
    parameterSchema,
    error,
  }) => {
    if (NoSuchToolError.isInstance(error)) {
      return null; // do not attempt to fix invalid tool names
    }

    const tool = tools[toolCall.toolName as keyof typeof tools];

    const { object: repairedArgs } = await generateObject({
      model: openai('gpt-4o', { structuredOutputs: true }),
      schema: tool.parameters,
      prompt: [
        `The model tried to call the tool "${toolCall.toolName}"` +
          ` with the following arguments:`,
        JSON.stringify(toolCall.args),
        `The tool accepts the following schema:`,
        JSON.stringify(parameterSchema(toolCall)),
        'Please fix the arguments.',
      ].join('\n'),
    });

    return { ...toolCall, args: JSON.stringify(repairedArgs) };
  },
});
```

### Example: Use the re-ask strategy for repair

```ts
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
  model,
  tools,
  prompt,

  experimental_repairToolCall: async ({
    toolCall,
    tools,
    error,
    messages,
    system,
  }) => {
    const result = await generateText({
      model,
      system,
      messages: [
        ...messages,
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
            },
          ],
        },
        {
          role: 'tool' as const,
          content: [
            {
              type: 'tool-result',
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              result: error.message,
            },
          ],
        },
      ],
      tools,
    });

    const newToolCall = result.toolCalls.find(
      newToolCall => newToolCall.toolName === toolCall.toolName,
    );

    return newToolCall != null
      ? {
          toolCallType: 'function' as const,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          args: JSON.stringify(newToolCall.args),
        }
      : null;
  },
});
```

## Active Tools

<Note type="warning">
  The `activeTools` property is experimental and may change in the future.
</Note>

Language models can only handle a limited number of tools at a time, depending on the model.
To allow for static typing using a large number of tools and limiting the available tools to the model at the same time,
the AI SDK provides the `experimental_activeTools` property.

It is an array of tool names that are currently active.
By default, the value is `undefined` and all tools are active.

```ts highlight="7"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  tools: myToolSet,
  experimental_activeTools: ['firstTool'],
});
```

## Multi-modal Tool Results

<Note type="warning">
  Multi-modal tool results are experimental and only supported by Anthropic.
</Note>

In order to send multi-modal tool results, e.g. screenshots, back to the model,
they need to be converted into a specific format.

AI SDK Core tools have an optional `experimental_toToolResultContent` function
that converts the tool result into a content part.

Here is an example for converting a screenshot into a content part:

```ts highlight="22-27"
const result = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    computer: anthropic.tools.computer_20241022({
      // ...
      async execute({ action, coordinate, text }) {
        switch (action) {
          case 'screenshot': {
            return {
              type: 'image',
              data: fs
                .readFileSync('./data/screenshot-editor.png')
                .toString('base64'),
            };
          }
          default: {
            return `executed ${action}`;
          }
        }
      },

      // map to tool result content for LLM consumption:
      experimental_toToolResultContent(result) {
        return typeof result === 'string'
          ? [{ type: 'text', text: result }]
          : [{ type: 'image', data: result.data, mimeType: 'image/png' }];
      },
    }),
  },
  // ...
});
```

## Extracting Tools

Once you start having many tools, you might want to extract them into separate files.
The `tool` helper function is crucial for this, because it ensures correct type inference.

Here is an example of an extracted tool:

```ts filename="tools/weather-tool.ts" highlight="1,4-5"
import { tool } from 'ai';
import { z } from 'zod';

// the `tool` helper function ensures correct type inference:
export const weatherTool = tool({
  description: 'Get the weather in a location',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});
```

## MCP Tools

<Note type="warning">
  The MCP tools feature is experimental and may change in the future.
</Note>

The AI SDK supports connecting to [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers to access their tools.
This enables your AI applications to discover and use tools across various services through a standardized interface.

### Initializing an MCP Client

Create an MCP client using either:

- `SSE` (Server-Sent Events): Uses HTTP-based real-time communication, better suited for remote servers that need to send data over the network
- `stdio`: Uses standard input and output streams for communication, ideal for local tool servers running on the same machine (like CLI tools or local services)
- Custom transport: Bring your own transport by implementing the `MCPTransport` interface

#### SSE Transport

The SSE can be configured using a simple object with a `type` and `url` property:

```typescript
import { experimental_createMCPClient as createMCPClient } from 'ai';

const mcpClient = await createMCPClient({
  transport: {
    type: 'sse',
    url: 'https://my-server.com/sse',

    // optional: configure HTTP headers, e.g. for authentication
    headers: {
      Authorization: 'Bearer my-api-key',
    },
  },
});
```

#### Stdio Transport

The Stdio transport requires importing the `StdioMCPTransport` class from the `ai/mcp-stdio` package:

```typescript
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';

const mcpClient = await createMCPClient({
  transport: new StdioMCPTransport({
    command: 'node',
    args: ['src/stdio/dist/server.js'],
  }),
});
```

#### Custom Transport

You can also bring your own transport by implementing the `MCPTransport` interface:

```typescript
import { MCPTransport, createMCPClient } from 'ai';

const mcpClient = await createMCPClient({
  transport: new MyCustomTransport({
    // ...
  }),
});
```

#### Closing the MCP Client

After initialization, you should close the MCP client based on your usage pattern:

- For short-lived usage (e.g., single requests), close the client when the response is finished
- For long-running clients (e.g., command line apps), keep the client open but ensure it's closed when the application terminates

When streaming responses, you can close the client when the LLM response has finished. For example, when using `streamText`, you should use the `onFinish` callback:

```typescript
const mcpClient = await experimental_createMCPClient({
  // ...
});

const result = await streamText({
  model: openai('gpt-4o'),
  tools: mcpClient.tools(),
  prompt: 'What is the weather in Brooklyn, New York?',
  onFinish: async () => {
    await mcpClient.close();
  },
});
```

When generating responses without streaming, you can use try/finally or cleanup functions in your framework:

```typescript
let mcpClient: MCPClient | undefined;

try {
  mcpClient = await experimental_createMCPClient({
    // ...
  });
} finally {
  await mcpClient?.close();
}
```

### Using MCP Tools

The client's `tools` method acts as an adapter between MCP tools and AI SDK tools. It supports two approaches for working with tool schemas:

#### Schema Discovery

The simplest approach where all tools offered by the server are listed, and input parameter types are inferred based the schemas provided by the server:

```typescript
const tools = await mcpClient.tools();
```

**Pros:**

- Simpler to implement
- Automatically stays in sync with server changes

**Cons:**

- No TypeScript type safety during development
- No IDE autocompletion for tool parameters
- Errors only surface at runtime
- Loads all tools from the server

#### Schema Definition

You can also define the tools and their input schemas explicitly in your client code:

```typescript
import { z } from 'zod';

const tools = await mcpClient.tools({
  schemas: {
    'get-data': {
      parameters: z.object({
        query: z.string().describe('The data query'),
        format: z.enum(['json', 'text']).optional(),
      }),
    },
  },
});
```

**Pros:**

- Control over which tools are loaded
- Full TypeScript type safety
- Better IDE support with autocompletion
- Catch parameter mismatches during development

**Cons:**

- Need to manually keep schemas in sync with server
- More code to maintain

When you define `schemas`, the client will only pull the explicitly defined tools, even if the server offers additional tools. This can be beneficial for:

- Keeping your application focused on the tools it needs
- Reducing unnecessary tool loading
- Making your tool dependencies explicit

## Examples

You can see tools in action using various frameworks in the following examples:

<ExampleLinks
  examples={[
    {
      title: 'Learn to use tools in Node.js',
      link: '/cookbook/node/call-tools',
    },
    {
      title: 'Learn to use tools in Next.js with Route Handlers',
      link: '/cookbook/next/call-tools',
    },
    {
      title: 'Learn to use MCP tools in Node.js',
      link: '/cookbook/node/mcp-tools',
    },
  ]}
/>

---
title: Prompt Engineering
description: Learn how to develop prompts with AI SDK Core.
---

# Prompt Engineering

## Tips

### Prompts for Tools

When you create prompts that include tools, getting good results can be tricky as the number and complexity of your tools increases.

Here are a few tips to help you get the best results:

1. Use a model that is strong at tool calling, such as `gpt-4` or `gpt-4-turbo`. Weaker models will often struggle to call tools effectively and flawlessly.
1. Keep the number of tools low, e.g. to 5 or less.
1. Keep the complexity of the tool parameters low. Complex Zod schemas with many nested and optional elements, unions, etc. can be challenging for the model to work with.
1. Use semantically meaningful names for your tools, parameters, parameter properties, etc. The more information you pass to the model, the better it can understand what you want.
1. Add `.describe("...")` to your Zod schema properties to give the model hints about what a particular property is for.
1. When the output of a tool might be unclear to the model and there are dependencies between tools, use the `description` field of a tool to provide information about the output of the tool execution.
1. You can include example input/outputs of tool calls in your prompt to help the model understand how to use the tools. Keep in mind that the tools work with JSON objects, so the examples should use JSON.

In general, the goal should be to give the model all information it needs in a clear way.

### Tool & Structured Data Schemas

The mapping from Zod schemas to LLM inputs (typically JSON schema) is not always straightforward, since the mapping is not one-to-one.

#### Zod Dates

Zod expects JavaScript Date objects, but models return dates as strings.
You can specify and validate the date format using `z.string().datetime()` or `z.string().date()`,
and then use a Zod transformer to convert the string to a Date object.

```ts highlight="7-10"
const result = await generateObject({
  model: openai('gpt-4-turbo'),
  schema: z.object({
    events: z.array(
      z.object({
        event: z.string(),
        date: z
          .string()
          .date()
          .transform(value => new Date(value)),
      }),
    ),
  }),
  prompt: 'List 5 important events from the year 2000.',
});
```

## Debugging

### Inspecting Warnings

Not all providers support all AI SDK features.
Providers either throw exceptions or return warnings when they do not support a feature.
To check if your prompt, tools, and settings are handled correctly by the provider, you can check the call warnings:

```ts
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Hello, world!',
});

console.log(result.warnings);
```

### HTTP Request Bodies

You can inspect the raw HTTP request bodies for models that expose them, e.g. [OpenAI](/providers/ai-sdk-providers/openai).
This allows you to inspect the exact payload that is sent to the model provider in the provider-specific way.

Request bodies are available via the `request.body` property of the response:

```ts highlight="6"
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Hello, world!',
});

console.log(result.request.body);
```

---
title: Settings
description: Learn how to configure the AI SDK.
---

# Settings

Large language models (LLMs) typically provide settings to augment their output.

All AI SDK functions support the following common settings in addition to the model, the [prompt](./prompts), and additional provider-specific settings:

```ts highlight="3-5"
const result = await generateText({
  model: yourModel,
  maxTokens: 512,
  temperature: 0.3,
  maxRetries: 5,
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

<Note>
  Some providers do not support all common settings. If you use a setting with a
  provider that does not support it, a warning will be generated. You can check
  the `warnings` property in the result object to see if any warnings were
  generated.
</Note>

### `maxTokens`

Maximum number of tokens to generate.

### `temperature`

Temperature setting.

The value is passed through to the provider. The range depends on the provider and model.
For most providers, `0` means almost deterministic results, and higher values mean more randomness.

It is recommended to set either `temperature` or `topP`, but not both.

### `topP`

Nucleus sampling.

The value is passed through to the provider. The range depends on the provider and model.
For most providers, nucleus sampling is a number between 0 and 1.
E.g. 0.1 would mean that only tokens with the top 10% probability mass are considered.

It is recommended to set either `temperature` or `topP`, but not both.

### `topK`

Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses.
Recommended for advanced use cases only. You usually only need to use `temperature`.

### `presencePenalty`

The presence penalty affects the likelihood of the model to repeat information that is already in the prompt.

The value is passed through to the provider. The range depends on the provider and model.
For most providers, `0` means no penalty.

### `frequencyPenalty`

The frequency penalty affects the likelihood of the model to repeatedly use the same words or phrases.

The value is passed through to the provider. The range depends on the provider and model.
For most providers, `0` means no penalty.

### `stopSequences`

The stop sequences to use for stopping the text generation.

If set, the model will stop generating text when one of the stop sequences is generated.
Providers may have limits on the number of stop sequences.

### `seed`

It is the seed (integer) to use for random sampling.
If set and supported by the model, calls will generate deterministic results.

### `maxRetries`

Maximum number of retries. Set to 0 to disable retries. Default: `2`.

### `abortSignal`

An optional abort signal that can be used to cancel the call.

The abort signal can e.g. be forwarded from a user interface to cancel the call,
or to define a timeout.

#### Example: Timeout

```ts
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
  abortSignal: AbortSignal.timeout(5000), // 5 seconds
});
```

### `headers`

Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.

You can use the request headers to provide additional information to the provider,
depending on what the provider supports. For example, some observability providers support
headers such as `Prompt-Id`.

```ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
  headers: {
    'Prompt-Id': 'my-prompt-id',
  },
});
```

<Note>
  The `headers` setting is for request-specific headers. You can also set
  `headers` in the provider configuration. These headers will be sent with every
  request made by the provider.
</Note>

---
title: Embeddings
description: Learn how to embed values with the AI SDK.
---

# Embeddings

Embeddings are a way to represent words, phrases, or images as vectors in a high-dimensional space.
In this space, similar words are close to each other, and the distance between words can be used to measure their similarity.

## Embedding a Single Value

The AI SDK provides the [`embed`](/docs/reference/ai-sdk-core/embed) function to embed single values, which is useful for tasks such as finding similar words
or phrases or clustering text.
You can use it with embeddings models, e.g. `openai.embedding('text-embedding-3-large')` or `mistral.embedding('mistral-embed')`.

```tsx
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// 'embedding' is a single embedding object (number[])
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
});
```

## Embedding Many Values

When loading data, e.g. when preparing a data store for retrieval-augmented generation (RAG),
it is often useful to embed many values at once (batch embedding).

The AI SDK provides the [`embedMany`](/docs/reference/ai-sdk-core/embed-many) function for this purpose.
Similar to `embed`, you can use it with embeddings models,
e.g. `openai.embedding('text-embedding-3-large')` or `mistral.embedding('mistral-embed')`.

```tsx
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

// 'embeddings' is an array of embedding objects (number[][]).
// It is sorted in the same order as the input values.
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'sunny day at the beach',
    'rainy afternoon in the city',
    'snowy night in the mountains',
  ],
});
```

## Embedding Similarity

After embedding values, you can calculate the similarity between them using the [`cosineSimilarity`](/docs/reference/ai-sdk-core/cosine-similarity) function.
This is useful to e.g. find similar words or phrases in a dataset.
You can also rank and filter related items based on their similarity.

```ts highlight={"2,10"}
import { openai } from '@ai-sdk/openai';
import { cosineSimilarity, embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['sunny day at the beach', 'rainy afternoon in the city'],
});

console.log(
  `cosine similarity: ${cosineSimilarity(embeddings[0], embeddings[1])}`,
);
```

## Token Usage

Many providers charge based on the number of tokens used to generate embeddings.
Both `embed` and `embedMany` provide token usage information in the `usage` property of the result object:

```ts highlight={"4,9"}
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding, usage } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
});

console.log(usage); // { tokens: 10 }
```

## Settings

### Retries

Both `embed` and `embedMany` accept an optional `maxRetries` parameter of type `number`
that you can use to set the maximum number of retries for the embedding process.
It defaults to `2` retries (3 attempts in total). You can set it to `0` to disable retries.

```ts highlight={"7"}
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  maxRetries: 0, // Disable retries
});
```

### Abort Signals and Timeouts

Both `embed` and `embedMany` accept an optional `abortSignal` parameter of
type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
that you can use to abort the embedding process or set a timeout.

```ts highlight={"7"}
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  abortSignal: AbortSignal.timeout(1000), // Abort after 1 second
});
```

### Custom Headers

Both `embed` and `embedMany` accept an optional `headers` parameter of type `Record<string, string>`
that you can use to add custom headers to the embedding request.

```ts highlight={"7"}
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  headers: { 'X-Custom-Header': 'custom-value' },
});
```

## Embedding Providers & Models

Several providers offer embedding models:

| Provider                                                                                  | Model                           | Embedding Dimensions |
| ----------------------------------------------------------------------------------------- | ------------------------------- | -------------------- |
| [OpenAI](/providers/ai-sdk-providers/openai#embedding-models)                             | `text-embedding-3-large`        | 3072                 |
| [OpenAI](/providers/ai-sdk-providers/openai#embedding-models)                             | `text-embedding-3-small`        | 1536                 |
| [OpenAI](/providers/ai-sdk-providers/openai#embedding-models)                             | `text-embedding-ada-002`        | 1536                 |
| [Google Generative AI](/providers/ai-sdk-providers/google-generative-ai#embedding-models) | `text-embedding-004`            | 768                  |
| [Mistral](/providers/ai-sdk-providers/mistral#embedding-models)                           | `mistral-embed`                 | 1024                 |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-english-v3.0`            | 1024                 |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-multilingual-v3.0`       | 1024                 |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-english-light-v3.0`      | 384                  |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-multilingual-light-v3.0` | 384                  |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-english-v2.0`            | 4096                 |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-english-light-v2.0`      | 1024                 |
| [Cohere](/providers/ai-sdk-providers/cohere#embedding-models)                             | `embed-multilingual-v2.0`       | 768                  |
| [Amazon Bedrock](/providers/ai-sdk-providers/amazon-bedrock#embedding-models)             | `amazon.titan-embed-text-v1`    | 1024                 |
| [Amazon Bedrock](/providers/ai-sdk-providers/amazon-bedrock#embedding-models)             | `amazon.titan-embed-text-v2:0`  | 1024                 |

---
title: Image Generation
description: Learn how to generate images with the AI SDK.
---

# Image Generation

<Note type="warning">Image generation is an experimental feature.</Note>

The AI SDK provides the [`generateImage`](/docs/reference/ai-sdk-core/generate-image)
function to generate images based on a given prompt using an image model.

```tsx
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
});
```

You can access the image data using the `base64` or `uint8Array` properties:

```tsx
const base64 = image.base64; // base64 image data
const uint8Array = image.uint8Array; // Uint8Array image data
```

## Settings

### Size and Aspect Ratio

Depending on the model, you can either specify the size or the aspect ratio.

##### Size

The size is specified as a string in the format `{width}x{height}`.
Models only support a few sizes, and the supported sizes are different for each model and provider.

```tsx highlight={"7"}
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
  size: '1024x1024',
});
```

##### Aspect Ratio

The aspect ratio is specified as a string in the format `{width}:{height}`.
Models only support a few aspect ratios, and the supported aspect ratios are different for each model and provider.

```tsx highlight={"7"}
import { experimental_generateImage as generateImage } from 'ai';
import { vertex } from '@ai-sdk/google-vertex';

const { image } = await generateImage({
  model: vertex.image('imagen-3.0-generate-001'),
  prompt: 'Santa Claus driving a Cadillac',
  aspectRatio: '16:9',
});
```

### Generating Multiple Images

`generateImage` also supports generating multiple images at once:

```tsx highlight={"7"}
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { images } = await generateImage({
  model: openai.image('dall-e-2'),
  prompt: 'Santa Claus driving a Cadillac',
  n: 4, // number of images to generate
});
```

<Note>
  `generateImage` will automatically call the model as often as needed (in
  parallel) to generate the requested number of images.
</Note>

Each image model has an internal limit on how many images it can generate in a single API call. The AI SDK manages this automatically by batching requests appropriately when you request multiple images using the `n` parameter. By default, the SDK uses provider-documented limits (for example, DALL-E 3 can only generate 1 image per call, while DALL-E 2 supports up to 10).

If needed, you can override this behavior using the `maxImagesPerCall` setting when configuring your model. This is particularly useful when working with new or custom models where the default batch size might not be optimal:

```tsx
const model = openai.image('dall-e-2', {
  maxImagesPerCall: 5, // Override the default batch size
});

const { images } = await generateImage({
  model,
  prompt: 'Santa Claus driving a Cadillac',
  n: 10, // Will make 2 calls of 5 images each
});
```

### Providing a Seed

You can provide a seed to the `generateImage` function to control the output of the image generation process.
If supported by the model, the same seed will always produce the same image.

```tsx highlight={"7"}
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
  seed: 1234567890,
});
```

### Provider-specific Settings

Image models often have provider- or even model-specific settings.
You can pass such settings to the `generateImage` function
using the `providerOptions` parameter. The options for the provider
(`openai` in the example below) become request body properties.

```tsx highlight={"9"}
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
  size: '1024x1024',
  providerOptions: {
    openai: { style: 'vivid', quality: 'hd' },
  },
});
```

### Abort Signals and Timeouts

`generateImage` accepts an optional `abortSignal` parameter of
type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
that you can use to abort the image generation process or set a timeout.

```ts highlight={"7"}
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
  abortSignal: AbortSignal.timeout(1000), // Abort after 1 second
});
```

### Custom Headers

`generateImage` accepts an optional `headers` parameter of type `Record<string, string>`
that you can use to add custom headers to the image generation request.

```ts highlight={"7"}
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';

const { image } = await generateImage({
  model: openai.image('dall-e-3'),
  value: 'sunny day at the beach',
  headers: { 'X-Custom-Header': 'custom-value' },
});
```

### Warnings

If the model returns warnings, e.g. for unsupported parameters, they will be available in the `warnings` property of the response.

```tsx
const { image, warnings } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'Santa Claus driving a Cadillac',
});
```

### Error Handling

When `generateImage` cannot generate a valid image, it throws a [`AI_NoImageGeneratedError`](/docs/reference/ai-sdk-errors/ai-no-image-generated-error).

This error occurs when the AI provider fails to generate an image. It can arise due to the following reasons:

- The model failed to generate a response
- The model generated a response that could not be parsed

The error preserves the following information to help you log the issue:

- `responses`: Metadata about the image model responses, including timestamp, model, and headers.
- `cause`: The cause of the error. You can use this for more detailed error handling

```ts
import { generateImage, NoImageGeneratedError } from 'ai';

try {
  await generateImage({ model, prompt });
} catch (error) {
  if (NoImageGeneratedError.isInstance(error)) {
    console.log('NoImageGeneratedError');
    console.log('Cause:', error.cause);
    console.log('Responses:', error.responses);
  }
}
```

## Generating Images with Language Models

Some language models such as Google `gemini-2.0-flash-exp` support multi-modal outputs including images.
With such models, you can access the generated images using the `files` property of the response.

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.0-flash-exp'),
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: 'Generate an image of a comic cat',
});

for (const file of result.files) {
  if (file.mimeType.startsWith('image/')) {
    // show the image
  }
}
```

## Image Models

| Provider                                                                  | Model                                                        | Support sizes (`width x height`) or aspect ratios (`width : height`)                                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [xAI Grok](/providers/ai-sdk-providers/xai#image-models)                  | `grok-2-image`                                               | 1024x768 (default)                                                                                                                                                  |
| [OpenAI](/providers/ai-sdk-providers/openai#image-models)                 | `dall-e-3`                                                   | 1024x1024, 1792x1024, 1024x1792                                                                                                                                     |
| [OpenAI](/providers/ai-sdk-providers/openai#image-models)                 | `dall-e-2`                                                   | 256x256, 512x512, 1024x1024                                                                                                                                         |
| [Amazon Bedrock](/providers/ai-sdk-providers/amazon-bedrock#image-models) | `amazon.nova-canvas-v1:0`                                    | 320-4096 (multiples of 16), 1:4 to 4:1, max 4.2M pixels                                                                                                             |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/flux/dev`                                            | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/flux-lora`                                           | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/fast-sdxl`                                           | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/flux-pro/v1.1-ultra`                                 | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/ideogram/v2`                                         | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/recraft-v3`                                          | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/stable-diffusion-3.5-large`                          | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Fal](/providers/ai-sdk-providers/fal#image-models)                       | `fal-ai/hyper-sdxl`                                          | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `stabilityai/sd3.5`                                          | 1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21                                                                                                                      |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `black-forest-labs/FLUX-1.1-pro`                             | 256-1440 (multiples of 32)                                                                                                                                          |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `black-forest-labs/FLUX-1-schnell`                           | 256-1440 (multiples of 32)                                                                                                                                          |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `black-forest-labs/FLUX-1-dev`                               | 256-1440 (multiples of 32)                                                                                                                                          |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `black-forest-labs/FLUX-pro`                                 | 256-1440 (multiples of 32)                                                                                                                                          |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `stabilityai/sd3.5-medium`                                   | 1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21                                                                                                                      |
| [DeepInfra](/providers/ai-sdk-providers/deepinfra#image-models)           | `stabilityai/sdxl-turbo`                                     | 1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21                                                                                                                      |
| [Replicate](/providers/ai-sdk-providers/replicate)                        | `black-forest-labs/flux-schnell`                             | 1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9                                                                                                                     |
| [Replicate](/providers/ai-sdk-providers/replicate)                        | `recraft-ai/recraft-v3`                                      | 1024x1024, 1365x1024, 1024x1365, 1536x1024, 1024x1536, 1820x1024, 1024x1820, 1024x2048, 2048x1024, 1434x1024, 1024x1434, 1024x1280, 1280x1024, 1024x1707, 1707x1024 |
| [Google Vertex](/providers/ai-sdk-providers/google-vertex#image-models)   | `imagen-3.0-generate-001`                                    | 1:1, 3:4, 4:3, 9:16, 16:9                                                                                                                                           |
| [Google Vertex](/providers/ai-sdk-providers/google-vertex#image-models)   | `imagen-3.0-fast-generate-001`                               | 1:1, 3:4, 4:3, 9:16, 16:9                                                                                                                                           |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/flux-1-dev-fp8`                   | 1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9                                                                                                                     |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/flux-1-schnell-fp8`               | 1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9                                                                                                                     |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/playground-v2-5-1024px-aesthetic` | 640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640                                                                           |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/japanese-stable-diffusion-xl`     | 640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640                                                                           |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/playground-v2-1024px-aesthetic`   | 640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640                                                                           |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/SSD-1B`                           | 640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640                                                                           |
| [Fireworks](/providers/ai-sdk-providers/fireworks#image-models)           | `accounts/fireworks/models/stable-diffusion-xl-1024-v1-0`    | 640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640                                                                           |
| [Luma](/providers/ai-sdk-providers/luma#image-models)                     | `photon-1`                                                   | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Luma](/providers/ai-sdk-providers/luma#image-models)                     | `photon-flash-1`                                             | 1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9                                                                                                                               |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `stabilityai/stable-diffusion-xl-base-1.0`                   | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-dev`                               | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-dev-lora`                          | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-schnell`                           | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-canny`                             | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-depth`                             | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-redux`                             | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1.1-pro`                             | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-pro`                               | 512x512, 768x768, 1024x1024                                                                                                                                         |
| [Together.ai](/providers/ai-sdk-providers/togetherai#image-models)        | `black-forest-labs/FLUX.1-schnell-Free`                      | 512x512, 768x768, 1024x1024                                                                                                                                         |

Above are a small subset of the image models supported by the AI SDK providers. For more, see the respective provider documentation.

---
title: Language Model Middleware
description: Learn how to use middleware to enhance the behavior of language models
---

# Language Model Middleware

Language model middleware is a way to enhance the behavior of language models
by intercepting and modifying the calls to the language model.

It can be used to add features like guardrails, RAG, caching, and logging
in a language model agnostic way. Such middleware can be developed and
distributed independently from the language models that they are applied to.

## Using Language Model Middleware

You can use language model middleware with the `wrapLanguageModel` function.
It takes a language model and a language model middleware and returns a new
language model that incorporates the middleware.

```ts
import { wrapLanguageModel } from 'ai';

const wrappedLanguageModel = wrapLanguageModel({
  model: yourModel,
  middleware: yourLanguageModelMiddleware,
});
```

The wrapped language model can be used just like any other language model, e.g. in `streamText`:

```ts highlight="2"
const result = streamText({
  model: wrappedLanguageModel,
  prompt: 'What cities are in the United States?',
});
```

## Multiple middlewares

You can provide multiple middlewares to the `wrapLanguageModel` function.
The middlewares will be applied in the order they are provided.

```ts
const wrappedLanguageModel = wrapLanguageModel({
  model: yourModel,
  middleware: [firstMiddleware, secondMiddleware],
});

// applied as: firstMiddleware(secondMiddleware(yourModel))
```

## Built-in Middleware

The AI SDK comes with several built-in middlewares that you can use to configure language models:

- `extractReasoningMiddleware`: Extracts reasoning information from the generated text and exposes it as a `reasoning` property on the result.
- `simulateStreamingMiddleware`: Simulates streaming behavior with responses from non-streaming language models.
- `defaultSettingsMiddleware`: Applies default settings to a language model.

### Extract Reasoning

Some providers and models expose reasoning information in the generated text using special tags,
e.g. &lt;think&gt; and &lt;/think&gt;.

The `extractReasoningMiddleware` function can be used to extract this reasoning information and expose it as a `reasoning` property on the result.

```ts
import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: yourModel,
  middleware: extractReasoningMiddleware({ tagName: 'think' }),
});
```

You can then use that enhanced model in functions like `generateText` and `streamText`.

The `extractReasoningMiddleware` function also includes a `startWithReasoning` option.
When set to `true`, the reasoning tag will be prepended to the generated text.
This is useful for models that do not include the reasoning tag at the beginning of the response.
For more details, see the [DeepSeek R1 guide](https://sdk.vercel.ai/docs/guides/r1#deepseek-r1-middleware).

### Simulate Streaming

The `simulateStreamingMiddleware` function can be used to simulate streaming behavior with responses from non-streaming language models.
This is useful when you want to maintain a consistent streaming interface even when using models that only provide complete responses.

```ts
import { wrapLanguageModel, simulateStreamingMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: yourModel,
  middleware: simulateStreamingMiddleware(),
});
```

### Default Settings

The `defaultSettingsMiddleware` function can be used to apply default settings to a language model.

```ts
import { wrapLanguageModel, defaultSettingsMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: yourModel,
  middleware: defaultSettingsMiddleware({
    settings: {
      temperature: 0.5,
      maxTokens: 800,
      // note: use providerMetadata instead of providerOptions here:
      providerMetadata: { openai: { store: false } },
    },
  }),
});
```

## Implementing Language Model Middleware

<Note>
  Implementing language model middleware is advanced functionality and requires
  a solid understanding of the [language model
  specification](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v1/language-model-v1.ts).
</Note>

You can implement any of the following three function to modify the behavior of the language model:

1. `transformParams`: Transforms the parameters before they are passed to the language model, for both `doGenerate` and `doStream`.
2. `wrapGenerate`: Wraps the `doGenerate` method of the [language model](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v1/language-model-v1.ts).
   You can modify the parameters, call the language model, and modify the result.
3. `wrapStream`: Wraps the `doStream` method of the [language model](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v1/language-model-v1.ts).
   You can modify the parameters, call the language model, and modify the result.

Here are some examples of how to implement language model middleware:

## Examples

<Note>
  These examples are not meant to be used in production. They are just to show
  how you can use middleware to enhance the behavior of language models.
</Note>

### Logging

This example shows how to log the parameters and generated text of a language model call.

```ts
import type { LanguageModelV1Middleware, LanguageModelV1StreamPart } from 'ai';

export const yourLogMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.log('doGenerate called');
    console.log(`params: ${JSON.stringify(params, null, 2)}`);

    const result = await doGenerate();

    console.log('doGenerate finished');
    console.log(`generated text: ${result.text}`);

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    console.log('doStream called');
    console.log(`params: ${JSON.stringify(params, null, 2)}`);

    const { stream, ...rest } = await doStream();

    let generatedText = '';

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          generatedText += chunk.textDelta;
        }

        controller.enqueue(chunk);
      },

      flush() {
        console.log('doStream finished');
        console.log(`generated text: ${generatedText}`);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
```

### Caching

This example shows how to build a simple cache for the generated text of a language model call.

```ts
import type { LanguageModelV1Middleware } from 'ai';

const cache = new Map<string, any>();

export const yourCacheMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = await doGenerate();

    cache.set(cacheKey, result);

    return result;
  },

  // here you would implement the caching logic for streaming
};
```

### Retrieval Augmented Generation (RAG)

This example shows how to use RAG as middleware.

<Note>
  Helper functions like `getLastUserMessageText` and `findSources` are not part
  of the AI SDK. They are just used in this example to illustrate the concept of
  RAG.
</Note>

```ts
import type { LanguageModelV1Middleware } from 'ai';

export const yourRagMiddleware: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({
      prompt: params.prompt,
    });

    if (lastUserMessageText == null) {
      return params; // do not use RAG (send unmodified parameters)
    }

    const instruction =
      'Use the following information to answer the question:\n' +
      findSources({ text: lastUserMessageText })
        .map(chunk => JSON.stringify(chunk))
        .join('\n');

    return addToLastUserMessage({ params, text: instruction });
  },
};
```

### Guardrails

Guard rails are a way to ensure that the generated text of a language model call
is safe and appropriate. This example shows how to use guardrails as middleware.

```ts
import type { LanguageModelV1Middleware } from 'ai';

export const yourGuardrailMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const { text, ...rest } = await doGenerate();

    // filtering approach, e.g. for PII or other sensitive information:
    const cleanedText = text?.replace(/badword/g, '<REDACTED>');

    return { text: cleanedText, ...rest };
  },

  // here you would implement the guardrail logic for streaming
  // Note: streaming guardrails are difficult to implement, because
  // you do not know the full content of the stream until it's finished.
};
```

---
title: Provider & Model Management
description: Learn how to work with multiple providers and models
---

# Provider & Model Management

When you work with multiple providers and models, it is often desirable to manage them in a central place
and access the models through simple string ids.

The AI SDK offers [custom providers](/docs/reference/ai-sdk-core/custom-provider) and
a [provider registry](/docs/reference/ai-sdk-core/provider-registry) for this purpose:

- With **custom providers**, you can pre-configure model settings, provide model name aliases,
  and limit the available models.
- The **provider registry** lets you mix multiple providers and access them through simple string ids.

You can mix and match custom providers, the provider registry, and [middleware](/docs/ai-sdk-core/middleware) in your application.

## Custom Providers

You can create a [custom provider](/docs/reference/ai-sdk-core/custom-provider) using `customProvider`.

### Example: custom model settings

You might want to override the default model settings for a provider or provide model name aliases
with pre-configured settings.

```ts
import { openai as originalOpenAI } from '@ai-sdk/openai';
import { customProvider } from 'ai';

// custom provider with different model settings:
export const openai = customProvider({
  languageModels: {
    // replacement model with custom settings:
    'gpt-4o': originalOpenAI('gpt-4o', { structuredOutputs: true }),
    // alias model with custom settings:
    'gpt-4o-mini-structured': originalOpenAI('gpt-4o-mini', {
      structuredOutputs: true,
    }),
  },
  fallbackProvider: originalOpenAI,
});
```

### Example: model name alias

You can also provide model name aliases, so you can update the model version in one place in the future:

```ts
import { anthropic as originalAnthropic } from '@ai-sdk/anthropic';
import { customProvider } from 'ai';

// custom provider with alias names:
export const anthropic = customProvider({
  languageModels: {
    opus: originalAnthropic('claude-3-opus-20240229'),
    sonnet: originalAnthropic('claude-3-5-sonnet-20240620'),
    haiku: originalAnthropic('claude-3-haiku-20240307'),
  },
  fallbackProvider: originalAnthropic,
});
```

### Example: limit available models

You can limit the available models in the system, even if you have multiple providers.

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { customProvider } from 'ai';

export const myProvider = customProvider({
  languageModels: {
    'text-medium': anthropic('claude-3-5-sonnet-20240620'),
    'text-small': openai('gpt-4o-mini'),
    'structure-medium': openai('gpt-4o', { structuredOutputs: true }),
    'structure-fast': openai('gpt-4o-mini', { structuredOutputs: true }),
  },
  embeddingModels: {
    emdedding: openai.textEmbeddingModel('text-embedding-3-small'),
  },
  // no fallback provider
});
```

## Provider Registry

You can create a [provider registry](/docs/reference/ai-sdk-core/provider-registry) with multiple providers and models using `createProviderRegistry`.

### Setup

```ts filename={"registry.ts"}
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic,

  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});
```

### Setup with Custom Separator

By default, the registry uses `:` as the separator between provider and model IDs. You can customize this separator:

```ts filename={"registry.ts"}
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const customSeparatorRegistry = createProviderRegistry(
  {
    anthropic,
    openai,
  },
  { separator: ' > ' },
);
```

### Example: Use language models

You can access language models by using the `languageModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { generateText } from 'ai';
import { registry } from './registry';

const { text } = await generateText({
  model: registry.languageModel('openai:gpt-4-turbo'), // default separator
  // or with custom separator:
  // model: customSeparatorRegistry.languageModel('openai > gpt-4-turbo'),
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

### Example: Use text embedding models

You can access text embedding models by using the `textEmbeddingModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { embed } from 'ai';
import { registry } from './registry';

const { embedding } = await embed({
  model: registry.textEmbeddingModel('openai:text-embedding-3-small'),
  value: 'sunny day at the beach',
});
```

### Example: Use image models

You can access image models by using the `imageModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { generateImage } from 'ai';
import { registry } from './registry';

const { image } = await generateImage({
  model: registry.imageModel('openai:dall-e-3'),
  prompt: 'A beautiful sunset over a calm ocean',
});
```

## Combining Custom Providers, Provider Registry, and Middleware

The central idea of provider management is to set up a file that contains all the providers and models you want to use.
You may want to pre-configure model settings, provide model name aliases, limit the available models, and more.

Here is an example that implements the following concepts:

- pass through a full provider with a namespace prefix (here: `xai > *`)
- setup an OpenAI-compatible provider with custom api key and base URL (here: `custom > *`)
- setup model name aliases (here: `anthropic > fast`, `anthropic > writing`, `anthropic > reasoning`)
- pre-configure model settings (here: `anthropic > reasoning`)
- validate the provider-specific options (here: `AnthropicProviderOptions`)
- use a fallback provider (here: `anthropic > *`)
- limit a provider to certain models without a fallback (here: `groq > gemma2-9b-it`, `groq > qwen-qwq-32b`)
- define a custom separator for the provider registry (here: `>`)

```ts
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import {
  createProviderRegistry,
  customProvider,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from 'ai';

export const registry = createProviderRegistry(
  {
    // pass through a full provider with a namespace prefix
    xai,

    // access an OpenAI-compatible provider with custom setup
    custom: createOpenAICompatible({
      name: 'provider-name',
      apiKey: process.env.CUSTOM_API_KEY,
      baseURL: 'https://api.custom.com/v1',
    }),

    // setup model name aliases
    anthropic: customProvider({
      languageModels: {
        fast: anthropic('claude-3-haiku-20240307'),

        // simple model
        writing: anthropic('claude-3-7-sonnet-20250219'),

        // extended reasoning model configuration:
        reasoning: wrapLanguageModel({
          model: anthropic('claude-3-7-sonnet-20250219'),
          middleware: defaultSettingsMiddleware({
            settings: {
              maxTokens: 100000, // example default setting
              providerMetadata: {
                anthropic: {
                  thinking: {
                    type: 'enabled',
                    budgetTokens: 32000,
                  },
                } satisfies AnthropicProviderOptions,
              },
            },
          }),
        }),
      },
      fallbackProvider: anthropic,
    }),

    // limit a provider to certain models without a fallback
    groq: customProvider({
      languageModels: {
        'gemma2-9b-it': groq('gemma2-9b-it'),
        'qwen-qwq-32b': groq('qwen-qwq-32b'),
      },
    }),
  },
  { separator: ' > ' },
);

// usage:
const model = registry.languageModel('anthropic > reasoning');
```

---
title: Error Handling
description: Learn how to handle errors in the AI SDK Core
---

# Error Handling

## Handling regular errors

Regular errors are thrown and can be handled using the `try/catch` block.

```ts highlight="3,8-10"
import { generateText } from 'ai';

try {
  const { text } = await generateText({
    model: yourModel,
    prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  });
} catch (error) {
  // handle error
}
```

See [Error Types](/docs/reference/ai-sdk-errors) for more information on the different types of errors that may be thrown.

## Handling streaming errors (simple streams)

When errors occur during streams that do not support error chunks,
the error is thrown as a regular error.
You can handle these errors using the `try/catch` block.

```ts highlight="3,12-14"
import { generateText } from 'ai';

try {
  const { textStream } = streamText({
    model: yourModel,
    prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
} catch (error) {
  // handle error
}
```

## Handling streaming errors (streaming with `error` support)

Full streams support error parts.
You can handle those parts similar to other parts.
It is recommended to also add a try-catch block for errors that
happen outside of the streaming.

```ts highlight="13-17"
import { generateText } from 'ai';

try {
  const { fullStream } = streamText({
    model: yourModel,
    prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  });

  for await (const part of fullStream) {
    switch (part.type) {
      // ... handle other part types

      case 'error': {
        const error = part.error;
        // handle error
        break;
      }
    }
  }
} catch (error) {
  // handle error
}
```

---
title: Testing
description: Learn how to use AI SDK Core mock providers for testing.
---

# Testing

Testing language models can be challenging, because they are non-deterministic
and calling them is slow and expensive.

To enable you to unit test your code that uses the AI SDK, the AI SDK Core
includes mock providers and test helpers. You can import the following helpers from `ai/test`:

- `MockEmbeddingModelV1`: A mock embedding model using the [embedding model v1 specification](https://github.com/vercel/ai/blob/main/packages/provider/src/embedding-model/v1/embedding-model-v1.ts).
- `MockLanguageModelV1`: A mock language model using the [language model v1 specification](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v1/language-model-v1.ts).
- `mockId`: Provides an incrementing integer ID.
- `mockValues`: Iterates over an array of values with each call. Returns the last value when the array is exhausted.
- [`simulateReadableStream`](/docs/reference/ai-sdk-core/simulate-readable-stream): Simulates a readable stream with delays.

With mock providers and test helpers, you can control the output of the AI SDK
and test your code in a repeatable and deterministic way without actually calling
a language model provider.

## Examples

You can use the test helpers with the AI Core functions in your unit tests:

### generateText

```ts
import { generateText } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';

const result = await generateText({
  model: new MockLanguageModelV1({
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      text: `Hello, world!`,
    }),
  }),
  prompt: 'Hello, test!',
});
```

### streamText

```ts
import { streamText, simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';

const result = streamText({
  model: new MockLanguageModelV1({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-delta', textDelta: 'Hello' },
          { type: 'text-delta', textDelta: ', ' },
          { type: 'text-delta', textDelta: `world!` },
          {
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { completionTokens: 10, promptTokens: 3 },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  }),
  prompt: 'Hello, test!',
});
```

### generateObject

```ts
import { generateObject } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { z } from 'zod';

const result = await generateObject({
  model: new MockLanguageModelV1({
    defaultObjectGenerationMode: 'json',
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      text: `{"content":"Hello, world!"}`,
    }),
  }),
  schema: z.object({ content: z.string() }),
  prompt: 'Hello, test!',
});
```

### streamObject

```ts
import { streamObject, simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { z } from 'zod';

const result = streamObject({
  model: new MockLanguageModelV1({
    defaultObjectGenerationMode: 'json',
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-delta', textDelta: '{ ' },
          { type: 'text-delta', textDelta: '"content": ' },
          { type: 'text-delta', textDelta: `"Hello, ` },
          { type: 'text-delta', textDelta: `world` },
          { type: 'text-delta', textDelta: `!"` },
          { type: 'text-delta', textDelta: ' }' },
          {
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { completionTokens: 10, promptTokens: 3 },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  }),
  schema: z.object({ content: z.string() }),
  prompt: 'Hello, test!',
});
```

### Simulate Data Stream Protocol Responses

You can also simulate [Data Stream Protocol](/docs/ai-sdk-ui/stream-protocol#data-stream-protocol) responses for testing,
debugging, or demonstration purposes.

Here is a Next example:

```ts filename="route.ts"
import { simulateReadableStream } from 'ai';

export async function POST(req: Request) {
  return new Response(
    simulateReadableStream({
      initialDelayInMs: 1000, // Delay before the first chunk
      chunkDelayInMs: 300, // Delay between chunks
      chunks: [
        `0:"This"\n`,
        `0:" is an"\n`,
        `0:"example."\n`,
        `e:{"finishReason":"stop","usage":{"promptTokens":20,"completionTokens":50},"isContinued":false}\n`,
        `d:{"finishReason":"stop","usage":{"promptTokens":20,"completionTokens":50}}\n`,
      ],
    }).pipeThrough(new TextEncoderStream()),
    {
      status: 200,
      headers: {
        'X-Vercel-AI-Data-Stream': 'v1',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}
```