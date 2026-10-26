#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from './server.js';

async function main() {
    await buildServer().connect(new StdioServerTransport());
    console.error('notemcp running on stdio');
}

main().catch(error => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
