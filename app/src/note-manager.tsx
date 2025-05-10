import React, { useCallback } from "react";
import { useState, useEffect } from 'react';

import { getNotes, _addNote, _updateNoteStatus, _updateNote, _deleteNote } from "./database";
import { NoteProps } from "./note-component";
import NoteComponent from "./note-component";

//Props
    export type Session = 'default' | 'archived' | 'deleted';

    interface NoteManagerProps {
        isCreating: boolean;
        showNotes?: boolean;
        currentSession: Session;
        onComplete: () => void;
        onCancel: () => void
        onNoteClick?: (note: NoteProps) => void;
        editingNote?: NoteProps | null;
    }
//

export default function NoteManager({ isCreating, showNotes = false, currentSession, onComplete, onCancel, onNoteClick, editingNote: initialEditNote }: NoteManagerProps) {
    const [notes, setNotes] = useState<NoteProps[]>([]);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [editNote, setEditNote] = useState<NoteProps | null>(initialEditNote || null);

    //Load Notes
        const loadNotes = useCallback(async () => {
            try {
                const loadedNotes = await getNotes(currentSession);
                setNotes(loadedNotes);
            } catch(e) {
                console.error(e); 
            }
        }, [currentSession]);

        useEffect(() => {
            loadNotes();
        }, [currentSession]);

        useEffect(() => {
            if(initialEditNote) setEditNote(initialEditNote);
        }, [initialEditNote]);
    //

    //Add Note
    const addNote = async () => {
        if(!newNote.title.trim() || !newNote.content.trim()) return;
        
        try {
            await _addNote(newNote.title, newNote.content, currentSession);
            setNewNote({ title: '', content: '' });
            await loadNotes();
            onComplete();
        } catch(e) {
            console.error(e);
        }
    }

    const cancelCreation = () => {
        setNewNote({ title: '', content: '' });
        setEditNote(null);
        onCancel();
    }

    const updateNote = async () => {
        if(!editNote || !editNote.title.trim() || !editNote.content.trim()) return;

        try {
            await _updateNote(editNote.id, editNote.title, editNote.content);
            setEditNote(null);
            await loadNotes();
            onComplete();
        } catch(e) {
            console.error(e);
        }
    }

    //Update Status
    const updNoteStatus = async(id: number, updStatus: Session) => {
        try {
            await _updateNoteStatus(id, updStatus);
            await loadNotes();
        } catch(e) {
            console.error(e);
        }
    }

    //Delete Note
    const deleteNote = async(id: number) => {
        try {
            await _deleteNote(id);
            await loadNotes();
        } catch(e) {
            console.error(e);
        }
    }

    //Main...
        //Note Creator/Editor
        const renderContent = () => {
            const isEditing = !!editNote;
            const noteData = isEditing ? editNote : newNote;
            const saveHandler = isEditing ? updateNote : addNote;

            return (
                <div className="note-manager">
                    <div id="---note-creator">
                        <div id="_note-actions">
                            <div id="__note-save-container">
                                <button onClick={saveHandler}>Save</button>
                            </div>
                            <div id="__note-cancel-container">
                                <button onClick={cancelCreation}>Cancel</button>
                            </div>
                        </div>
        
                        <div id="_note-title-container">
                            <textarea 
                                id="__note-title" 
                                value={noteData.title} 
                                onChange={(e) => {
                                    if(isEditing) {
                                        setEditNote({ ...editNote, title: e.target.value });
                                    } else {
                                        setNewNote({ ...newNote, title: e.target.value})}
                                    }
                                }
                            />
                        </div>
                        <div id="_note-content-container">
                            <textarea 
                                id="__note-content"
                                value={noteData.content}
                                onChange={(e) => {
                                    if(isEditing) {
                                        setEditNote({ ...editNote, content: e.target.value });
                                    } else {
                                        setNewNote({ ...newNote, content: e.target.value })} 
                                    }
                                }
                            />
                        </div>
                    </div>
                </div>
            )
        }

        if(isCreating || editNote) return renderContent();

        //Note List
        if(showNotes) {
            return (
                <div className="notes-list">
                    {notes.map((note) => (
                        <div 
                            id="_note"
                            key={note.id} 
                            onClick={() => { 
                                    if(onNoteClick) 
                                    onNoteClick(note) 
                                }
                            }>
                            <NoteComponent
                                key={`note-${note.id}`}
                                note={note}
                                currentSession={currentSession}
                                onUpdateStatus={updNoteStatus}
                                onDelete={deleteNote}
                            />
                        </div>
                    ))}
                </div>
            )
        }
    //

    return null;
}