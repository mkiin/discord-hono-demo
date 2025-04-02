// run AnthropicAI as background stream
async function runChatStreamInBackground(
  input: string,
  interaction_token: string,
  discord_channel_id: string,
  env: Env,
  model: string,
  system: string,
) {
  const startedAt = Date.now();

  const history = await loadHistory(env, discord_channel_id);
  const anthropic = createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  // start stream
  let currentText = '';
  let ended = false;
  let intervalId: null | NodeJS.Timeout = null;
  let timeoutId: null | NodeJS.Timeout = null;
  const onStreamEnd = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  try {
    const prefixed = input
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
    await createMessage(`${prefixed}\n\n...`, {
      token: interaction_token,
      appId: env.DISCORD_APPLICATION_ID,
    });

    const { fullStream } = await streamText({
      model: anthropic(model, {
        cacheControl: true,
      }),

      tools: {
        search: tool({
          description: `Search the web for information by tavily. Call me if you don't know something.`,
          parameters: z.object({
            query: z.string().describe('The query to search for'),
          }),
          async execute({ query }) {
            if (env.TAVILY_API_KEY === undefined) {
              throw new Error('TAVILY_API_KEY is not set');
            }
            // console.log('[tools:tavily]:', query);
            try {
              const result = await searchByTavily(env.TAVILY_API_KEY, query);
              return result;
            } catch (e) {
              console.error(e);
              throw e;
            }
          },
        }),
      },
      maxSteps: 5,
      toolChoice: 'auto',
      maxTokens: 1024,
      system,
      messages: [
        ...history,
        {
          role: 'user',
          content: input,
        },
      ],
    });

    // update message every 1.5 seconds
    intervalId = setInterval(async () => {
      await updateMessage(`${prefixed}\n\n${currentText}`, {
        token: interaction_token,
        appId: env.DISCORD_APPLICATION_ID,
      });
    }, 1500);

    // timeout after 27 seconds
    timeoutId = setTimeout(async () => {
      if (!ended) {
        await updateMessage(
          `${prefixed}\n\n${currentText}\n[timeout:${Date.now() - startedAt}ms]`,
          { token: interaction_token, appId: env.DISCORD_APPLICATION_ID },
        );
        await fullStream.cancel();
      }
    }, 27000);

    for await (const part of fullStream) {
      const readableStringify = (obj: any) => JSON.stringify(obj, null, 2);
      switch (part.type) {
        case 'text-delta': {
          currentText += part.textDelta;
          break;
        }
        case 'tool-call': {
          currentText += `\n[tool-call:${part.toolName}]`;
          // currentText += `\n[tool-call:${part.toolName}] ${readableStringify(
          //   part.args,
          // )}`;
          break;
        }
        case 'tool-result': {
          currentText += `\n[tool-result:${part.toolName}]`;
          // currentText += `\n[tool-result:${part.toolName}] ${readableStringify(
          //   part.result,
          // )}`;
          break;
        }
        case 'error': {
          currentText += `\n[error] ${readableStringify(part.error)}`;
          break;
        }
      }
    }
    ended = true;
    onStreamEnd();
    const newHistory = [
      ...history,
      { role: 'user', content: input },
      { role: 'assistant', content: currentText },
    ] as CoreMessage[];
    await Promise.allSettled([
      updateMessage(`${prefixed}\n\n${currentText}`, {
        token: interaction_token,
        appId: env.DISCORD_APPLICATION_ID,
      }),
      saveHistory(env, discord_channel_id, newHistory),
    ]);
  } catch (e) {
    console.error(e);
    onStreamEnd();
    if (e instanceof Error) {
      await updateMessage(`Internal Error: ${e.stack}`, {
        token: interaction_token,
        appId: env.DISCORD_APPLICATION_ID,
      });
    }
  }
}