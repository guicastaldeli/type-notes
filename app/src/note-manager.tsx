import React, { useCallback, useRef } from "react";
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

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
    const [showColorPicker, setShowColorPicker] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);

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
            const clearContent = DOMPurify.sanitize(newNote.content)
            await _addNote(newNote.title, clearContent, currentSession);
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
    
    //Color
        const isEditing = !!editNote;

        useEffect(() => {
            if(contentRef.current) {
                contentRef.current.innerHTML = isEditing
                    ? (editNote?.content || '')
                    : newNote.content
                ;
            }
        }, [isEditing, editNote, newNote.content]);

        const handleTextSelection = useCallback(() => {
            const selection = window.getSelection();

            if(!selection || selection.rangeCount === 0) {
                setShowColorPicker(false);
                return;
            }

            savedSelectionRef.current = selection.getRangeAt(0);
            setShowColorPicker(!selection.isCollapsed);
        }, []);

        const applyTextColor = useCallback((color: string, e: React.MouseEvent) => {
            e.stopPropagation();

            const selection = savedSelectionRef.current;
            if(!selection) return;

            const newSelection = window.getSelection();
            newSelection?.removeAllRanges();
            newSelection?.addRange(selection.cloneRange());

            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand('insertHTML', false, `<span style="color:${color}">${selection}</span>`);

            if(contentRef.current) {
                const newContent = contentRef.current.innerHTML;

                if(editNote) {
                    setEditNote({ ...editNote, content: newContent });
                } else {
                    setNewNote({ ...newNote, content: newContent });
                }
            }

            setShowColorPicker(false);
            contentRef.current?.focus();
        }, [editNote, newNote]);
    //

    //Title and Content
        const handleTitleInput = (e: React.FormEvent<HTMLDivElement>) => {
            const newTitle = e.currentTarget.innerText;

            if(isEditing) {
                setEditNote({ ...editNote, title: newTitle });
            } else {
                setNewNote(prev => ({ ...prev, title: newTitle }));
            }
        }

        const handleContentInput = () => {
            if(!contentRef.current) return;
            const newContent = contentRef.current.innerText;

            if(isEditing) {
                setEditNote({ ...editNote, content: newContent });
            } else {
                setNewNote({ ...newNote, content: newContent });
            }
        }
    //

    //Main...
        //Note Creator/Editor
        const renderContent = () => {
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
        
                        <div id="_note-main">
                            <div id="__note-container">
                                {/* Title */}
                                {isCreating && (
                                    <div id="___note-title-container">
                                        <div
                                            id="note-title-" 
                                            ref={titleRef}
                                            contentEditable
                                            style={{ color: 'red', fontWeight: 'bolder' }}
                                            onInput={handleTitleInput}
                                            dangerouslySetInnerHTML={{ __html: noteData.title || '' }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div id="___note-content-container">
                                    <div
                                        id="note-content-"
                                        ref={contentRef}
                                        contentEditable
                                        onSelect={handleTextSelection}
                                        onClick={handleTextSelection}
                                        onInput={handleContentInput}
                                        dangerouslySetInnerHTML={{ __html: noteData.content || '' }}
                                    />
                                </div>
                            </div>

                            {/* Color Picker */}
                            {showColorPicker && (
                                <div className='color-picker'>
                                    {[ '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF' ].map(color => (
                                        <div
                                            className='-color-option'
                                            key={color}
                                            style={{ backgroundColor: color }}
                                            onClick={(e) => applyTextColor(color, e)}
                                        />
                                    ))}
                                </div>
                            )}
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