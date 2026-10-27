import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(ENV_PATH)) {
    process.loadEnvFile(ENV_PATH);
}

if (!process.env.NOTES_DIR) {
    throw new Error("NOTES_DIR is not set. Copy .env.example to .env and set it.");
}

const BASE_PATH: string = process.env.NOTES_DIR;

export function createNote(name: string, folders: string[], body: string) {
    ensureDirExists(folders);
    const filePath = getFilePath(name, folders);

    if (existsSync(filePath)) {
        throw new Error("Note already exists. Use edit_note to change it.");
    }
    
    writeFileSync(filePath, body);
    return "Created note: " + body;
}

export function readNote(name: string, folders: string[]): string {
    const filePath = getFilePath(name, folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found")
    }
    return readFileSync(filePath, "utf-8");
}

export function readFolder(folders: string[]): string {

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
        if (entry.isFile() && entry.name.endsWith(".txt")) {
            tree.notes.push(entry.name.replace(/\.txt$/, ""));
        }
    }

    return tree;
}

export function editNote(name: string, folders: string[], body: string): string {
    const filePath = getFilePath(name, folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found. (To change the location of a note use move_note. To change the name of a note use rename_note)");
    }

    const oldNote = readFileSync(filePath, "utf-8");

    writeFileSync(filePath, body);

    return "Note edited. Old note was: " + oldNote;
}

export function moveNote(name: string, folders: string[], newFolders: string[]): string {
    const oldPath = getFilePath(name, folders);
    const newPath = getFilePath(name, newFolders);

    if (!existsSync(oldPath)) {
        throw new Error("Note not found.");
    }
    if (existsSync(newPath)) {
        throw new Error("A note with this name already exists in the destination folder.");
    }

    ensureDirExists(newFolders);
    renameSync(oldPath, newPath);
    return `Moved note from ${folders.join("/") || "/"} to ${newFolders.join("/") || "/"}`;
}

export function archiveNote(name: string, folders: string[]): string {
    const oldPath = getFilePath(name, folders);
    const archiveFolders = ["archive", ...folders];
    const archiveFilePath = getFilePath(name, archiveFolders);

    if (!existsSync(oldPath)) {
        throw new Error("Note not found.");
    }
    if (existsSync(archiveFilePath)) {
        throw new Error("A note with this name is already archived in this folder.");
    }

    ensureDirExists(archiveFolders);
    renameSync(oldPath, archiveFilePath);
    return `Archived note to ${archiveFolders.join("/")}`;
}

export function deleteNote(name: string, folders: string[]): string {
    const filePath = getFilePath(name, folders);

    if (!existsSync(filePath)) {
        throw new Error("Note not found.");
    }
    const oldNote = readFileSync(filePath, "utf-8");
    rmSync(filePath);
    return "Deleted the following note: " + oldNote;
}

export function deleteFolder(folders: string[], recursive: boolean): string {
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
    return join(getPath(folders), getSafeString(name) + ".txt");
}

function getPath(folders: string[]): string {
    return join(BASE_PATH, ...folders.map(getSafeString));
}

function getSafeString(string: string): string {
    const safe = string.trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "").slice(0, 50);
    if (safe === "") {
        throw new Error(`"${string}" has no valid characters. Use letters, digits, spaces, _ or -.`);
    }
    return safe;
}