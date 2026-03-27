export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/mcp" || url.pathname === "/sse") {
			// 创建一个新的请求，确保包含正确的 Accept 头
			const modifiedRequest = new Request(request, {
				headers: new Headers(request.headers)
			});
			
			// 如果请求没有 Accept 头或不是 SSE，强制添加
			const accept = request.headers.get("Accept");
			if (!accept || !accept.includes("text/event-stream")) {
				modifiedRequest.headers.set("Accept", "text/event-stream");
			}
			
			return MyMCP.serve("/mcp").fetch(modifiedRequest, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
