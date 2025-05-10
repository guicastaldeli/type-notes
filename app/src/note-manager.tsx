import React, { useCallback } from "react";
import { useState, useEffect } from 'react';

import { getNotes, _addNote, _updateNoteStatus, _deleteNote } from "./database";
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
    }
//

export default function NoteManager({ isCreating, showNotes = false, currentSession, onComplete, onCancel }: NoteManagerProps) {
    const [notes, setNotes] = useState<NoteProps[]>([]);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [refresh, setRefresh] = useState(0)

    //Load Notes
        const updateNotes = useCallback(async () => {
            try {
                const loadedNotes = await getNotes(currentSession);
                setNotes(loadedNotes);
            } catch(e) {
                console.error(e); 
            }
        }, [currentSession]);

        useEffect(() => {
            updateNotes();
        }, [currentSession, refresh]);
    //

    const addNote = async () => {
        if(!newNote.title.trim() || !newNote.content.trim()) return;
        
        try {
            await _addNote(newNote.title, newNote.content, currentSession);
            setNewNote({ title: '', content: '' });
            await updateNotes();
            onComplete();
        } catch(e) {
            console.error(e);
        }
    }

    const cancelCreation = () => {
        setNewNote({ title: '', content: '' });
        onCancel();
    }

    const updNoteStatus = async(id: number, updStatus: Session) => {
        try {
            await _updateNoteStatus(id, updStatus);
            await updateNotes();
        } catch(e) {
            console.error(e);
        }
    }

    const deleteNote = async(id: number) => {
        try {
            await _deleteNote(id);
            await updateNotes();
        } catch(e) {
            console.error(e);
        }
    }

    //Main...
        //Note List
        if(showNotes) {
            return (
                <div className="notes-list">
                    {notes.map((note) => (
                        <div id="_note" key={note.id}>
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

        //Note Creator/Editor
        if(isCreating) {
            return (
                <div className="note-manager">
                    {isCreating && (
                        <div id="---note-creator">
                            <div id="_note-actions">
                                <div id="__note-save-container">
                                    <button onClick={addNote}>Save</button>
                                </div>
                                <div id="__note-cancel-container">
                                    <button onClick={cancelCreation}>Cancel</button>
                                </div>
                            </div>
        
                            <div id="_note-title-container">
                                <textarea 
                                    id="__note-title" 
                                    value={newNote.title} 
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value})}
                                />
                            </div>
                            <div id="_note-content-container">
                                <textarea 
                                    id="__note-content"
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            )
        }
    //

    return null;
}