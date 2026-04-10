# cc-hub

一个终端 TUI 工具，用于管理 Claude Code 的模型配置。无需手动编辑配置文件，即可在不同 LLM 提供商和模型之间切换。

## 功能

- 一键切换当前使用的模型
- 管理多个提供商和模型
- 将 Claude Code 的角色别名（opus/sonnet/haiku/subagent）映射到任意模型
- 原子写入配置，防止文件损坏
- 配置文件支持 JSON5（可写注释）

## 安装

```bash
npm install -g cc-hub
```

或者不安装直接运行：

```bash
npx cc-hub
```

## 使用

启动 TUI：

```bash
cc-hub
```

### 快捷键

| 按键 | 操作 |
|------|------|
| `↑` `↓` | 导航模型列表 |
| `Enter` | 切换到选中的模型 |
| `d` | 删除选中的模型 |
| `s` | 场景别名映射 |
| `q` | 退出 |

### 场景映射

按 `s` 将 Claude Code 内置别名映射到你的模型：

| 别名 | 环境变量 |
|------|---------|
| Opus | `ANTHROPIC_DEFAULT_OPUS_MODEL` |
| Sonnet | `ANTHROPIC_DEFAULT_SONNET_MODEL` |
| Haiku | `ANTHROPIC_DEFAULT_HAIKU_MODEL` |
| Subagent | `CLAUDE_CODE_SUBAGENT_MODEL` |

## 配置

编辑 `~/.cc-hub/config.json` 添加提供商：

```jsonc
{
  "providers": [
    {
      "id": "dashscope",
      "name": "DashScope",
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "sk-your-api-key",
      "models": ["qwen3.6-plus", "qwen-max"]
    },
    {
      "id": "deepseek",
      "name": "DeepSeek",
      "baseUrl": "https://api.deepseek.com/v1",
      "apiKey": "sk-your-api-key",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    }
  ],
  "scenarioModels": {}
}
```

选中模型后，cc-hub 会将提供商的凭证和模型 ID 写入 `~/.claude/settings.json`。**需要重启 Claude Code 才能生效。**

## 开发

```bash
pnpm run dev        # 构建并运行
pnpm run dev:watch  # 监听文件变更自动重建
```

## 许可证

MIT
