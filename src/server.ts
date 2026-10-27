import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createNote, readNote, readFolder, editNote, moveNote, renameNote, archiveNote, deleteNote, deleteFolder } from './note.js';

const name = z.string().min(1).max(50).describe("Title of the note");
const folderEntry = z.string().min(1).max(50).describe("Folder in which the note should be stored.");
const folders = z.array(folderEntry).max(5).describe("Path of folders. Adding more than one entry lets you indicate nested folders. For example, a list of 3 entries represents folder 3 nested in folder 2 nested in folder 1.");
const body = z.string().min(1).describe("The content of the note");

const text = (text: string) => ({ content: [{ type: "text" as const, text }] });

export function buildServer() {
    const server = new McpServer({
        name: "notemcp",
        version: "1.0.0"
    });

    server.registerTool(
        "create_note",
        { title: "Create a new note", inputSchema: { name, folders, body } },
        async (args) => text(createNote(args.name, args.folders, args.body))
    );

    server.registerTool(
        "read_note",
        { title: "Read an existing note", inputSchema: { name, folders } },
        async (args) => text(readNote(args.name, args.folders))
    );

    server.registerTool(
        "read_folder",
        { title: "Read the contents of an existing folder", inputSchema: { folders } },
        async (args) => text(readFolder(args.folders))
    );

    server.registerTool(
        "edit_note",
        { title: "Edit an existing note", inputSchema: { name, folders, body } },
        async (args) => text(editNote(args.name, args.folders, args.body))
    );

    server.registerTool(
        "move_note",
        {
            title: "Move an existing note to another folder",
            inputSchema: { name, folders, newFolders: folders.describe("Path of the destination folders. An empty list moves the note to the root.") }
        },
        async (args) => text(moveNote(args.name, args.folders, args.newFolders))
    );

    server.registerTool(
        "rename_note",
        {
            title: "Rename an existing note",
            inputSchema: { name, folders, newName: name.describe("New title of the note") }
        },
        async (args) => text(renameNote(args.name, args.folders, args.newName))
    );

    server.registerTool(
        "archive_note",
        { title: "Archive an existing note (moves it to the archive folder, keeping its folder structure)", inputSchema: { name, folders } },
        async (args) => text(archiveNote(args.name, args.folders))
    );

    server.registerTool(
        "delete_note",
        { title: "Delete an existing note", inputSchema: { name, folders } },
        async (args) => text(deleteNote(args.name, args.folders))
    );

    server.registerTool(
        "delete_folder",
        {
            title: "Delete an existing folder",
            inputSchema: {
                folders: folders.min(1),
                recursive: z.boolean().describe("If true, delete the folder together with all notes and subfolders in it. If false, only delete the folder when it is empty.")
            },
        },
        async (args) => text(deleteFolder(args.folders, args.recursive))
    );

    return server;
}
