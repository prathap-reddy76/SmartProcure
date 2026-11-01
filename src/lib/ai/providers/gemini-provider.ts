import { GoogleGenAI, FunctionCall } from "@google/genai";
import { AIProvider, AIRequest, AIResponse } from "../types";
import { getSystemInstructions } from "../prompts";
import { AI_TOOLS } from "../tools";

export class GeminiAIProvider implements AIProvider {
  name = "GEMINI_PROVIDER";
  private MAX_TOOL_CALLS = 5;

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini AI is not configured.");
    }
    // We can just proxy to stream and collect it if this is ever called
    throw new Error("Use generateStream for Gemini");
  }

  async generateStream(request: AIRequest): Promise<{ stream: ReadableStream; providerName: "gemini" | "mock" }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini AI is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.AI_MODEL || "gemini-2.5-flash";
    const systemInstruction = getSystemInstructions();
    const contextJson = JSON.stringify(request.contextData, null, 2);

    const initialPrompt = `
User Question: "${request.message}"

---
Available SmartProcure Context (JSON):
${contextJson}
---

Please provide a helpful, concise answer based ONLY on the context provided above and any tool calls.
`;

    const encoder = new TextEncoder();
    let isCancelled = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const tools = [{
            functionDeclarations: Object.values(AI_TOOLS).map(t => t.declaration)
          }];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentContents: any[] = [
            { role: "user", parts: [{ text: initialPrompt }] }
          ];

          let toolCallsCount = 0;
          let finalStreamGenerated = false;

          while (toolCallsCount < 5 && !finalStreamGenerated && !isCancelled) {
            const streamResult = await ai.models.generateContentStream({
              model: modelName,
              contents: currentContents,
              config: {
                systemInstruction,
                temperature: 0.2,
                tools
              }
            });

            let toolCallCaught: FunctionCall | null = null;

            for await (const chunk of streamResult) {
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                toolCallCaught = chunk.functionCalls[0];
                break; // Stop processing this stream, we have a tool call
              }
              if (chunk.text) {
                finalStreamGenerated = true;
                controller.enqueue(encoder.encode(chunk.text));
              }
            }

            if (toolCallCaught) {
              const toolName = toolCallCaught.name as string;
              const args = toolCallCaught.args || {};

              controller.enqueue(encoder.encode(`\n_[Checking ${toolName.replace(/_/g, ' ')}...]_ \n\n`));

              const tool = AI_TOOLS[toolName];
              let result;

              if (tool) {
                try {
                  result = await tool.execute(args as Record<string, unknown>, request.farmerId);
                } catch (err: unknown) {
                  const errorMsg = err instanceof Error ? err.message : "Tool execution failed";
                  result = { error: errorMsg };
                }
              } else {
                result = { error: `Tool ${toolName} not found or unauthorized` };
              }

              currentContents.push({
                role: "model",
                parts: [{ functionCall: toolCallCaught }]
              });

              currentContents.push({
                role: "user",
                parts: [{
                  functionResponse: {
                    name: toolName,
                    response: result
                  }
                }]
              });

              toolCallsCount++;
            } else {
              // No tool call in the entire stream
              finalStreamGenerated = true;
            }
          }

          if (toolCallsCount >= 5) {
            controller.enqueue(encoder.encode("\n\n*Note: Reached maximum tool calls. Halting further search.*"));
          }
          
        } catch (error: unknown) {
          console.error("Gemini API Error:", error);
          controller.enqueue(encoder.encode(`\n\nError: The AI service is temporarily unavailable. Please try again.`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        isCancelled = true;
      }
    });

    return { stream, providerName: "gemini" };
  }
}
