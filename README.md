# notemcp

A small [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that lets an MCP client such as Claude create, read, edit, move, rename, archive and delete notes.

It runs over stdio or Streamable HTTP and is written in TypeScript.

## Tools

Notes are stored as plain text files (`<name>.txt`, containing just the note text) under a base directory, organised in nested folders. Names and folder names are sanitised to letters, digits, `_` and `-` (whitespace becomes `-`) and truncated to 50 characters; a name with no valid characters is rejected. `create_note` fails if the note already exists.

| Tool | Inputs | Description |
| --- | --- | --- |
| `create_note` | `name`, `folders`, `body` | Create a new note, creating the folders if needed. |
| `read_note` | `name`, `folders` | Read an existing note. |
| `read_folder` | `folders` | Recursively list the subfolders and notes in a folder, returned as a JSON tree (`{ folders: { name: {...} }, notes: [...] }`). |
| `edit_note` | `name`, `folders`, `body` | Replace the body of an existing note. |
| `move_note` | `name`, `folders`, `newFolders` | Move a note to another folder, creating the destination folders if needed. An empty `newFolders` moves it to the root. Fails if a note with that name already exists there. |
| `rename_note` | `name`, `folders`, `newName` | Rename a note within its folder. Fails if a note with the new name already exists. |
| `archive_note` | `name`, `folders` | Move a note into the `archive` folder, keeping its folder structure (`a/b/note` becomes `archive/a/b/note`). Fails if it is already archived. |
| `delete_note` | `name`, `folders` | Delete an existing note. |
| `delete_folder` | `folders`, `recursive` | Delete a folder. With `recursive` false it only deletes an empty folder; with true it also deletes everything inside. `folders` must not be empty, so the root folder cannot be deleted. |

`folders` is a path of up to 5 folder names; each entry is nested in the previous one. Use an empty list for the root.

### Storage location

The base directory is read from `NOTES_DIR`. Copy [.env.example](.env.example) to `.env` in the project root and set it to where you want your notes stored. A real environment variable also works. The server refuses to start without it.

## Requirements

- Node.js 20.12 or newer
- npm

## Setup

```sh
npm install
npm run build
```

The build compiles `src/` to `build/`.

## Usage

The server supports two transports: stdio (the default, normally launched by an MCP client) and Streamable HTTP.

### Claude Desktop

Add it to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "notes": {
      "command": "node",
      "args": ["/absolute/path/to/notemcp/build/index.js"]
    }
  }
}
```

To fully close claude desktop on linux use:

```bash
  pkill -f -i claude
```

### Claude Code

```sh
claude mcp add notes -- node /absolute/path/to/notemcp/build/index.js
```

### HTTP

Start the HTTP server (no build needed, it uses `tsx`):

```sh
npm run start:http
```

It listens on `http://127.0.0.1:3000/notemcp` (localhost only). Set `PORT` to change the port:

```sh
PORT=8080 npm run start:http
```

The server is stateless: each `POST /notemcp` request gets its own server and transport instance. Connect a client to it, for example:

```sh
claude mcp add --transport http note http://127.0.0.1:3000/notemcp
```

### MCP Inspector

```sh
npx @modelcontextprotocol/inspector node build/index.js
```

## Project structure

```
src/
  index.ts    # Entry point: connects the server to a stdio transport
  http.ts     # Entry point: serves the MCP server over Streamable HTTP (Express)
  server.ts   # Builds the MCP server and registers the tools
  note.ts     # Note storage: create, read, edit, move, rename, archive and delete notes as plain text files
```

## Notes

- Logging goes to stderr, since stdout is reserved for the MCP protocol in stdio mode.

