/**
 * 网络请求工具 - 专为思源笔记插件设计，解决跨域问题
 */

import { forwardProxy } from "../api";

export interface NetworkRequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    responseType?: 'json' | 'text' | 'blob';
}

export interface NetworkResponse<T = any> {
    ok: boolean;
    status: number;
    statusText: string;
    data: T;
    headers: Record<string, string>;
}

/**
 * 使用思源笔记的 forwardProxy 发起网络请求，避免跨域问题
 */
export async function siyuanRequest<T = any>(options: NetworkRequestOptions): Promise<NetworkResponse<T>> {
    const {
        url,
        method = 'GET',
        headers = {},
        body,
        timeout = 30000,
        responseType = 'json'
    } = options;

    try {
        // 准备请求头 - 转换为 forwardProxy 需要的格式
        const formattedHeaders = Object.entries(headers).map(([key, value]) => ({
            [key]: value
        }));

        // 为 AI 相关请求添加合理的超时设置
        const aiDomains = ['nvidia.com', 'openai.com', 'google.com', 'azure.com'];
        const isAIDomain = aiDomains.some(domain => url.includes(domain));
        const requestTimeout = isAIDomain ? 300000 : timeout; // AI 请求设置 5 分钟超时

        // 发起请求
        const result = await forwardProxy(
            url,
            method,
            body || {},
            formattedHeaders,
            requestTimeout,
            headers['Content-Type'] || 'application/json'
        );

        // 处理响应
        if (result === null) {
            throw new Error('Network request failed: No response received');
        }

        // 根据 forwardProxy 的响应格式调整
        // 注意：forwardProxy 的返回格式可能与标准HTTP响应不同
        return {
            ok: true,
            status: 200, // forwardProxy 成功时通常表示为成功
            statusText: 'OK',
            data: result as T, // 根据 forwardProxy 实际返回格式调整
            headers: {}
        };
    } catch (error) {
        console.error('Network request failed:', error);
        throw error;
    }
}

/**
 * 专门用于调用 AI API 的函数
 */
export async function callAI_API<T = any>(
    url: string,
    apiKey: string,
    data: any,
    provider: string = 'openai'
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // 根据不同的 AI 提供商设置认证头
    switch (provider.toLowerCase()) {
        case 'gemini':
            headers['x-goog-api-key'] = apiKey;
            break;
        default:
            headers['Authorization'] = `Bearer ${apiKey}`;
            break;
    }

    try {
        const response = await siyuanRequest<T>({
            url,
            method: 'POST',
            headers,
            body: data,
            timeout: 120000 // AI 请求通常比较慢，设置较长超时时间
        });

        return response.data;
    } catch (error) {
        console.error(`Failed to call ${provider} API:`, error);
        throw error;
    }
}

/**
 * 检查 URL 是否可访问（通过 forwardProxy 代理）
 */
export async function checkUrlAccessibility(url: string): Promise<boolean> {
    try {
        await siyuanRequest({
            url,
            method: 'GET',
            timeout: 10000
        });
        return true;
    } catch (error) {
        console.warn(`URL not accessible: ${url}`, error);
        return false;
    }
}