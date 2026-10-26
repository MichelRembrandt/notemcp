import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const BASE_PATH = "/Users/micheldesmet/Documents/Notes"

interface Note {
    name: string;
    folders: string[];
    writtenAt: string;
    body: string;
}

export function toNote(name: string, folders: string[], body: string = "n/a"): Note {
    return {
        name: name,
        folders: folders,
        writtenAt: new Date().toISOString(),
        body: body
    };
}

export async function createNote(note: Note) {
    ensureDirExists(note.folders);
    const filePath = getFilePath(note);
    const jsonNote = JSON.stringify(note, null, 2);
    writeFileSync(filePath, jsonNote);
    return "Created note: " + jsonNote;
}

export async function readNote(note: Note): Promise<string> {
    const filePath = getFilePath(note); 

    if (!existsSync(filePath)) {
        throw new Error("Note not found")
    }
    return JSON.parse(readFileSync(filePath, "utf-8"));
}

export async function readFolder(folders: string[]): Promise<string> {

    //todo: 1 remove file extention from note names, 2. add tree support

    const path = getPath(folders);

    if (!existsSync(path)) {
        throw new Error("Folder not found.");
    }

    const entries = readdirSync(path, { withFileTypes: true });

    let foundFolders = [];
    let foundNotes = [];
    
    for (const entry of entries ) {

        if (entry.isDirectory()) {
            foundFolders.push(entry.name);
        }
        if (entry.isFile()) {
            foundNotes.push(entry.name);
        }
    }

    const result = {
        folders: foundFolders,
        notes: foundNotes
    };

    return JSON.stringify(result, null, 2);
}

export async function editNote(note: Note): Promise<string> {
    const filePath = getFilePath(note); 

    if (!existsSync(filePath)) {
        throw new Error("Note not found. (To change the location of a note use move_note. To change the name of a note use rename_note)");
    }

    const oldNote = JSON.parse(readFileSync(filePath, "utf-8"));

    writeFileSync(filePath, JSON.stringify(note, null, 2));

    return "Note edited. Old note was: " + oldNote;
}

export async function moveNote(note: Note) {
    //todo
}

export async function archiveNote(note: Note) {
    //todo
}

export async function deleteNote(note: Note): Promise<string> {
    const filePath = getFilePath(note); 

    if (!existsSync(filePath)) {
        throw new Error("Note not found.");
    }
    const oldNote = JSON.parse(readFileSync(filePath, "utf-8"));
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

function getFilePath(note: Note): string {
    const path = getPath(note.folders);
    return join(path, getSafeString(note.name) + ".json");
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
    return string.replace(/[^\w-]/g, "").slice(0, 50);
}