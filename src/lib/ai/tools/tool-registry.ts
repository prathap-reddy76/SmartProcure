import { FunctionDeclaration } from "@google/genai";

export interface AITool {
  declaration: FunctionDeclaration;
  // Handler receives the validated input and the authenticated session farmerId
  execute: (input: Record<string, unknown>, farmerId: string) => Promise<unknown>;
}

export const AI_TOOLS: Record<string, AITool> = {};

export function registerTool(tool: AITool) {
  AI_TOOLS[tool.declaration.name!] = tool;
}
