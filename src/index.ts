import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// 定义 MCP Agent - 必须导出
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
	}
}

// 导出 fetch 处理程序 - 这是 Worker 的入口点
export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// 接受 /mcp 或 /sse 端点
		if (url.pathname === "/mcp" || url.pathname === "/sse") {
			// 创建修改后的请求，确保 Accept 头正确
			const modifiedRequest = new Request(request, {
				headers: new Headers(request.headers)
			});
			
			const accept = request.headers.get("Accept");
			if (!accept || !accept.includes("text/event-stream")) {
				modifiedRequest.headers.set("Accept", "text/event-stream");
			}
			
			// 使用 serve 方法并传入正确的路径
			return MyMCP.serve("/mcp").fetch(modifiedRequest, env, ctx);
		}

		// 根路径返回信息
		if (url.pathname === "/") {
			return new Response("MCP Server is running. Connect to /mcp endpoint", {
				status: 200,
				headers: { "Content-Type": "text/plain" }
			});
		}

		return new Response("Not found", { status: 404 });
	},
};
