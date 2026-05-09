/**
 * Patched Fetch for streaming AI gateways
 *
 * Creates a patched fetch that fixes known issues with streaming gateway chunks.
 * Only needed when the configured AI gateway emits empty tool-call types.
 *
 * @example
 * ```ts
 * import { createOpenAI } from "@ai-sdk/openai";
 * import { createPatchedFetch } from "./_core/patchedFetch";
 *
 * const openai = createOpenAI({
 *   baseURL: `${process.env.AI_GATEWAY_URL}/v1`,
 *   apiKey: process.env.AI_GATEWAY_API_KEY,
 *   fetch: createPatchedFetch(fetch),
 * });
 * ```
 */

/**
 * Creates a patched fetch that fixes known issues with streaming gateways.
 *
 * Known issues fixed:
 * - Empty "type" field in tool call streaming chunks (should be "function")
 *
 * The fix properly buffers complete SSE events (terminated by \n\n) before patching,
 * ensuring we don't break JSON payloads that span multiple chunks.
 */
export function createPatchedFetch(originalFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await originalFetch(input, init);

    // Only patch streaming responses
    if (!response.body) return response;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();

          if (done) {
            // Flush any remaining buffer (shouldn't happen with well-formed SSE)
            if (buffer.length > 0) {
              const fixed = buffer.replace(/"type":""/g, '"type":"function"');
              controller.enqueue(encoder.encode(fixed));
            }
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by \n\n - only process complete events
          const eventSeparator = "\n\n";
          let separatorIndex: number;

          while ((separatorIndex = buffer.indexOf(eventSeparator)) !== -1) {
            // Extract the complete event (including the separator)
            const completeEvent = buffer.slice(
              0,
              separatorIndex + eventSeparator.length
            );
            buffer = buffer.slice(separatorIndex + eventSeparator.length);

            // Fix: Empty type field in tool calls
            // Some gateways send "type":"" instead of "type":"function".
            const fixedEvent = completeEvent.replace(
              /"type":""/g,
              '"type":"function"'
            );
            controller.enqueue(encoder.encode(fixedEvent));
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  };
}
