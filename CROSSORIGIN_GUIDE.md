# 跨域问题解决方案指南

## 问题描述
思源笔记插件在调用外部API（如AI服务）时可能遇到跨域(CORS)问题，导致请求失败。

## 解决方案

### 1. 使用思源笔记的 forwardProxy API

思源笔记提供了 `forwardProxy` API，允许插件通过思源笔记后端代理外部请求，从而绕过浏览器的CORS限制。

```typescript
import { forwardProxy } from "./api";

// 调用外部API的示例
const result = await forwardProxy(
  'https://api.example.com/data',      // 目标URL
  'POST',                              // HTTP方法
  requestData,                         // 请求体数据
  [                                    // 请求头（数组格式）
    {'Content-Type': 'application/json'},
    {'Authorization': `Bearer ${apiKey}`}
  ],
  30000,                              // 超时时间（毫秒）
  'application/json'                   // 响应内容类型
);
```

### 2. 在本插件中的具体应用

在 `ai-chat.ts` 文件中，所有对外部AI服务的调用都应该使用 `forwardProxy` 代替浏览器原生的 `fetch`。

### 3. 注意事项

- `forwardProxy` 不支持流式响应（Server-Sent Events），因此对于需要实时流式传输的AI服务，需要禁用流式传输或采用其他策略
- 超时时间应该设置得足够长，因为AI请求通常比较耗时
- 所有外部API调用都应该经过代理，而不是直接使用浏览器的 fetch

### 4. 实现细节

在 `src/ai-chat.ts` 文件中，我们已经将以下函数修改为使用 `forwardProxy`：
- `fetchModels`: 获取AI模型列表
- `chatOpenAIFormat`: 调用OpenAI兼容API
- `chatGeminiFormat`: 调用Gemini API

### 5. 错误处理

使用 `forwardProxy` 时，错误处理逻辑也需要相应调整，因为返回的数据格式可能与原生 fetch 不同。

## 测试验证

在开发过程中，可以通过以下步骤验证跨域问题是否已解决：

1. 确保思源笔记后端正在运行
2. 在插件中配置有效的AI服务API密钥
3. 尝试调用AI功能，观察是否仍有跨域错误
4. 检查浏览器控制台和思源笔记日志以获取更多信息