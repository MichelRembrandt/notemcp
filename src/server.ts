import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toNote, createNote, readNote, readFolder, editNote, deleteNote } from './note.js';


const NAME_DESCRIPTION = "Title of the note";
const FOLDER_DESCRIPTION = "Folder in which the note should be stored.";
const FOLDERS_DESCRIPTION = "Path of folders. Adding more than one entry lets you indicate nested folders. For example, a list of 3 entries represents folder 3 nested in folder 2 nested in folder 1."
const BODY_DESCRIPTION = "The content of the note";

export function buildServer() {
    const server = new McpServer({
        name: 'task-server',
        version: '1.0.0'
    });

    server.registerTool(
        'create_note',
        {
            title: 'Create a new note',
            inputSchema: {
                name: z.string().min(1).max(50).describe(NAME_DESCRIPTION),
                folders: z.array(z.string().min(1).max(50).describe(FOLDER_DESCRIPTION)).max(5).describe(FOLDERS_DESCRIPTION),
                body: z.string().min(1).describe(BODY_DESCRIPTION)
            },
        },
        async ({ name, folders, body }) => {
            const note = toNote(name, folders, body);
            const response = createNote(note);

            return {
                content: [{ type: 'text', text: JSON.stringify(response) }]
            };
        }
    );

    server.registerTool(
        'read_note',
        {
            title: 'Read an existing note',
            inputSchema: {
                name: z.string().min(1).max(50).describe(NAME_DESCRIPTION),
                folders: z.array(z.string().min(1).max(50).describe(FOLDER_DESCRIPTION)).max(5).describe(FOLDERS_DESCRIPTION)
            },
        },
        async ({ name, folders }) => {
            const note = toNote(name, folders);
            const response = readNote(note);

            return {
                content: [{ type: 'text', text: JSON.stringify(response) }]
            };
        }
    );

    server.registerTool(
        'read_folder',
        {
            title: 'Read the contents of an existing folder',
            inputSchema: {
                folders: z.array(z.string().min(1).max(50).describe(FOLDER_DESCRIPTION)).max(5).describe(FOLDERS_DESCRIPTION)
            },
        },
        async ({ folders }) => {
            const response = readFolder(folders);

            return {
                content: [{ type: 'text', text: JSON.stringify(response) }]
            };
        }
    );

    server.registerTool(
        'edit_note',
        {
            title: 'Edit an existing note',
            inputSchema: {
                name: z.string().min(1).max(50).describe(NAME_DESCRIPTION),
                folders: z.array(z.string().min(1).max(50).describe(FOLDER_DESCRIPTION)).max(5).describe(FOLDERS_DESCRIPTION),
                body: z.string().min(1).describe(BODY_DESCRIPTION)
            },
        },
        async ({ name, folders, body }) => {
            const note = toNote(name, folders, body);
            const response = editNote(note);

            return {
                content: [{ type: 'text', text: JSON.stringify(response) }]
            };
        }
    );

    server.registerTool(
        'delete_note',
        {
            title: 'Delete an existing note',
            inputSchema: {
                name: z.string().min(1).max(50).describe(NAME_DESCRIPTION),
                folders: z.array(z.string().min(1).max(50).describe(FOLDER_DESCRIPTION)).max(5).describe(FOLDERS_DESCRIPTION)
            },
        },
        async ({ name, folders }) => {
            const note = toNote(name, folders);
            const response = deleteNote(note);

            return {
                content: [{ type: 'text', text: JSON.stringify(response) }]
            };
        }
    );

    return server;
}

