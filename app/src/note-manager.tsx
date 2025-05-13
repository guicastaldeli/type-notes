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
    const [showSizePicker, setShowSizePicker] = useState(false);
    const [showFormatPicker, setShowFormatPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);
    const isEditing = !!editNote;

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
        if(!newNote.content.trim()) return;
        
        try {
            const clearContent = DOMPurify.sanitize(newNote.content)
            await _addNote(clearContent, currentSession);
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
        if(!editNote || !editNote.content.trim()) return;

        try {
            await _updateNote(editNote.id, editNote.content);
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
            if(editNote?.id === id) {
                setEditNote(null);
                onComplete();
            }
            
            await _deleteNote(id);
            await loadNotes();
        } catch(e) {
            console.error(e);
        }
    }

    //Size
        //Size Options
            const sizeOptions = Array.from({ length: 48 }, (_, i) => i + 1);
        //

        const applyTextSize = useCallback((size: number, e: React.MouseEvent) => {
            e.preventDefault();

            const savedRange = savedSelectionRef.current;
            if(!savedRange) return;

            const selection = window.getSelection();
            if(selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);

                document.execCommand('styleWithCSS', false, 'true');
                document.execCommand('fontSize', false, '7');
            }

            if(contentRef.current) {
                const newContent = contentRef.current.innerHTML;

                if(editNote) {
                    setEditNote({ ...editNote, content: newContent });
                } else {
                    setNewNote({ ...newNote, content: newContent });
                }
            }
        }, [editNote, newNote])
    //

    //Format
        //Format Options
            const formatOptions = [
                {
                    name: 'bold',
                    title: 'Bold',
                    command: 'bold',
                    label: 'B',
                    style: { fontWeight: 'bold' }
                },
                {
                    name: 'italic',
                    title: 'Italic',
                    command: 'italic',
                    label: 'I',
                    style: { fontStyle: 'italic' }
                },
                {
                    name: 'underline',
                    title: 'Underline',
                    command: 'underline',
                    label: 'U',
                    style: { textDecoration: 'underline' }
                }
            ];
        //

        const applyTextFormat = useCallback((command: string, e: React.MouseEvent) => {
            e.preventDefault();

            const savedRange = savedSelectionRef.current;
            if(!savedRange) return;

            const selection = window.getSelection();
            if(selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }

            document.execCommand(command, false, '');

            if(contentRef.current) {
                const newContent = contentRef.current.innerHTML;

                if(editNote) {
                    setEditNote({ ...editNote, content: newContent });
                } else {
                    setNewNote({ ...newNote, content: newContent });
                }
            }
        }, [editNote, newNote]);
    //
    
    //Color
        //Color Options
            const colorOptions = [
                { name: 'Black', value: 'rgb(0, 0, 0)' },
                { name: 'Red', value: 'rgb(189, 33, 33)' },
                { name: 'Green', value: 'rgb(67, 188, 56)' },
                { name: 'Blue', value: 'rgb(26, 118, 197)' },
                { name: 'Yellow', value: 'rgb(241, 187, 9)' },
                { name: 'Purple', value: 'rgb(153, 21, 205)' },
                { name: 'Cyan', value: 'rgb(29, 181, 201)' }
            ];
        //

        const applyTextColor = useCallback((value: string, e: React.MouseEvent) => {
            e.preventDefault();
            
            const savedRange = savedSelectionRef.current;
            if(!savedRange) return;

            const selection = window.getSelection();
            if(selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }

            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand('foreColor', false, value);

            if(contentRef.current) {
                const newContent = contentRef.current.innerHTML;

                if(editNote) {
                    setEditNote({ ...editNote, content: newContent });
                } else {
                    setNewNote({ ...newNote, content: newContent });
                }
            }

            setShowColorPicker(false);
        }, [editNote, newNote]);
    //

    //Content
        useEffect(() => {
            if(contentRef.current) {
                const exContent = isEditing ? editNote?.content || '' : newNote.content;
                if(contentRef.current.innerHTML !== exContent) contentRef.current.innerHTML = exContent;
            }
        }, [isEditing, editNote?.content, newNote.content]);

        const handleTextSelection = useCallback(() => {
            const selection = window.getSelection();
            if(!selection || selection.rangeCount === 0) {
                setShowSizePicker(false);
                setShowFormatPicker(false);
                setShowColorPicker(false);
                return;
            }

            savedSelectionRef.current = selection.getRangeAt(0);
            const isSelected = !selection.isCollapsed;
            setShowSizePicker(isSelected);
            setShowFormatPicker(isSelected);
            setShowColorPicker(isSelected);
        }, []);

        //New Line
            const insertLine = () => {
                const selection = window.getSelection();
                const range = selection?.getRangeAt(0);
                const br = document.createElement('br');
                range?.insertNode(br);
                handleContentInput();
            }

            const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
                if(e.key === ' ') {
                    e.preventDefault();
                    insertLine();
                }
            }
        //

        const handleContentInput = useCallback(() => {
            if(!contentRef.current) return;
            let newContent = contentRef.current.innerHTML;

            if(isEditing) {
                setEditNote({ ...editNote, content: newContent });
            } else {
                setNewNote({ ...newNote, content: newContent });
            }
        }, [isEditing, editNote, newNote]);
    //

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

    //Main...
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
                                <div id="___note-content-container">
                                    <div
                                        id="note-content-"
                                        ref={contentRef}
                                        contentEditable="true"
                                        onSelect={handleTextSelection}
                                        onClick={handleTextSelection}
                                        onInput={handleContentInput}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>

                            <div id="__toolbar">
                                {/* Size Picker */}
                                {showSizePicker && (
                                    <div id="___size-picker">
                                        <select 
                                            id="select-size-"
                                            onChange={(e) => applyTextSize(Number(e.target.value), e as any)}
                                            value=""
                                        >
                                            {sizeOptions.map(size => (
                                                <option 
                                                    id="option-size--"
                                                    key={size}
                                                    value={size}
                                                >
                                                    {size}px
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {/* Format Picker */}
                                {showFormatPicker && (
                                    <div id='___format-picker'>
                                        {formatOptions.map((opt) => (
                                            <button
                                                id={`button-option-${opt.name}-`}
                                                key={opt.name}
                                                onClick={(e) => applyTextFormat(opt.command, e)}
                                                title={opt.title}
                                                style={opt.style}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Color Picker */}
                                {showColorPicker && (
                                    <div id='___color-picker'>
                                        {colorOptions.map(value => (
                                            <div
                                                className="color-option-"
                                                id={`color-option-${value.value}-`}
                                                title={value.name}
                                                key={value.value}
                                                style={{ backgroundColor: value.value }}
                                                onClick={(e) => applyTextColor(value.value, e)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        //Exec...
        if(isCreating || editNote) return renderContent();
    //

    return null;
}