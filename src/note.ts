import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

if (!process.env.NOTES_DIR) {
    throw new Error("NOTES_DIR is not set. Copy .env.example to .env and set it.");
}

const BASE_PATH: string = process.env.NOTES_DIR;

interface Note {
    name: string;
    folders: string[];
    writtenAt: string;
    body: string;
}

export function toNote(name: string, folders: string[], body: string): Note {
    return {
        name: getSafeString(name),
        folders: getSafeStrings(folders),
        writtenAt: new Date().toISOString(),
        body: body
    };
}

export async function createNote(note: Note) {
    ensureDirExists(note.folders);
    const filePath = getFilePath(note.name, note.folders);

    if (existsSync(filePath)) {
        throw new Error("Note already exists. Use edit_note to change it.");
    }
    const jsonNote = JSON.stringify(note, null, 2);
    writeFileSync(filePath, jsonNote);
    return "Created note: " + jsonNote;
}

export async function readNote(name: string, folders: string[]): Promise<string> {
    const filePath = getFilePath(name, folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found")
    }
    return readFileSync(filePath, "utf-8");
}

export async function readFolder(folders: string[]): Promise<string> {

    const path = getPath(folders);

    if (!existsSync(path)) {
        if (folders.length === 0) return JSON.stringify({ folders: {}, notes: [] }, null, 2);
        throw new Error("Folder not found.");
    }

    return JSON.stringify(readFolderTree(path), null, 2);
}

interface FolderTree {
    folders: { [name: string]: FolderTree };
    notes: string[];
}

function readFolderTree(path: string): FolderTree {
    const tree: FolderTree = { folders: {}, notes: [] };

    for (const entry of readdirSync(path, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            tree.folders[entry.name] = readFolderTree(join(path, entry.name));
        }
        if (entry.isFile() && entry.name.endsWith(".json")) {
            tree.notes.push(entry.name.replace(/\.json$/, ""));
        }
    }

    return tree;
}

export async function editNote(note: Note): Promise<string> {
    const filePath = getFilePath(note.name, note.folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found. (To change the location of a note use move_note. To change the name of a note use rename_note)");
    }

    const oldNote = readFileSync(filePath, "utf-8");

    writeFileSync(filePath, JSON.stringify(note, null, 2));

    return "Note edited. Old note was: " + oldNote;
}

export async function moveNote(note: Note) {
    //todo
}

export async function archiveNote(note: Note) {
    //todo
}

export async function deleteNote(name: string, folders: string[]): Promise<string> {
    const filePath = getFilePath(name, folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found.");
    }
    const oldNote = readFileSync(filePath, "utf-8");
    rmSync(filePath);
    return "Deleted the following note: " + oldNote;
}

export async function deleteFolder(folders: string[], recursive: boolean): Promise<string> {
    if (folders.length === 0) {
        throw new Error("Provide the folders you want to delete.");
    }

    const path = getPath(folders);

    if (!existsSync(path)) {
        throw new Error("Folder not found.");
    }

    if (!recursive && readdirSync(path).length > 0) {
        throw new Error("Folder is not empty. Set recursive to true to delete it together with its contents.");
    }

    rmSync(path, { recursive: true });
    return "Deleted folder: " + folders.join("/");
}

function ensureDirExists(folders: string[]) {
    const path = getPath(folders);
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function getFilePath(name: string, folders: string[]): string {
    return join(getPath(folders), getSafeString(name) + ".json");
}

function getPath(folders: string[]): string {
    const path = getSafeStrings(folders).join("/");
    return join(BASE_PATH, "/", path);
}

function getSafeStrings(strings: string[]): string[] {
    let safe = [];
    for (const string of strings) {
        safe.push(getSafeString(string));
    }
    return safe;
}

function getSafeString(string: string): string {
    const safe = string.trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 50);
    if (safe === "") {
        throw new Error(`"${string}" has no valid characters. Use letters, digits, spaces, _ or -.`);
    }
    return safe;
}