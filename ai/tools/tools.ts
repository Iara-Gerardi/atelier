import { z } from "zod";
import { generateText } from "ai";
import { generateFrameTool } from "./generate-frame";

export const generateTextTool = {
  name: "generateText",
  description: "Generate text using the OpenAI API",
  parameters: z.object({
    prompt: z.string(),
  }),
  execute: async ({ prompt }: { prompt: string }) => {
    const result = await generateText({ model: "gpt-4o-mini", prompt });
    return result.text;
  },
};

export { generateFrameTool };
