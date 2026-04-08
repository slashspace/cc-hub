// src/config/presets.ts

import { Preset } from "../types.js";

export const PRESETS: Preset[] = [
  {
    id: "qwen-plus",
    name: "Qwen 3.6 Plus",
    baseUrl: "https://coding.dashscope.aliyuncs.com/apps/anthropic",
    modelId: "qwen3.6-plus",
  },
  {
    id: "qwen-max",
    name: "Qwen Max",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    modelId: "qwen-max",
  },
  {
    id: "kimi-k2",
    name: "Kimi K2.5",
    baseUrl: "https://api.moonshot.cn/v1",
    modelId: "kimi-k2-0905",
  },
  {
    id: "minimax-m2",
    name: "MiniMax M2.7",
    baseUrl: "https://api.minimax.chat/v1",
    modelId: "MiniMax-M2.7",
  },
  {
    id: "glm-5",
    name: "GLM 5.1",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    modelId: "glm-5",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-chat",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-reasoner",
  },
  {
    id: "siliconflow-qwen",
    name: "SiliconFlow Qwen",
    baseUrl: "https://api.siliconflow.cn/v1",
    modelId: "Qwen/Qwen2.5-72B-Instruct",
  },
];
