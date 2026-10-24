import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from './server.js';

const app = express();
app.use(express.json());

app.post("/notemcp", async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });
    res.on("close", () => {
        transport.close();
        server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, "127.0.0.1", () =>
    console.error(`MCP listening on http://127.0.0.1:${port}/notemcp`)
);