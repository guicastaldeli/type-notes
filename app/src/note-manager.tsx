import React, { useCallback, useRef } from "react";
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

import { getNotes, _updateNote, _addNote, initTextOptions, getTextOptions } from "./database";
import { NoteProps } from "./note-component";
import { Session } from "./session-manager";
import SessionManager from "./session-manager";
import NoteComponent from "./note-component";

//Props
    interface NoteManagerProps {
        isCreating: boolean;
        showNotes?: boolean;
        currentSession: Session;
        notes: NoteProps[];
        onComplete: () => void;
        onCancel: () => void;
        onNoteClick?: (note: NoteProps) => void;
        onNotesUpdated?: () => void;
        editingNote?: NoteProps | null;
        onUpdateStatus?: (id: number, status: Session) => Promise<void>;
        onDeleteNote?: (id: number) => Promise<void>;
        isSearching?: boolean;
        isEmptyRes?: boolean;
        searchTerm?: string;
    }
//

export default function NoteManager({ 
    isCreating, 
    showNotes = false, 
    currentSession,
    notes: propNotes,
    onComplete, 
    onCancel, 
    onNoteClick,
    onNotesUpdated,
    editingNote: initialEditNote,
    onUpdateStatus, 
    onDeleteNote,
    isSearching = false,
    isEmptyRes = false,
    searchTerm = ''
    }: NoteManagerProps) {
    const [notes, setNotes] = useState<NoteProps[]>([]);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [editNote, setEditNote] = useState<NoteProps | null>(initialEditNote || null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);
    const [selectedSize, setSelectedSize] = useState<number>(21);
    const [showFormatPicker, setShowFormatPicker] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);
    const isEditing = !!editNote;

    useEffect(() => {
        setNotes(propNotes);
    }, [propNotes]);

    useEffect(() => {
        if(initialEditNote) setEditNote(initialEditNote);
    }, [initialEditNote]);

    //Load Options
        interface SizeOption { 
            value: string; 
            name: string;
            label: string; 
            style: React.CSSProperties 
        }

        interface FormatOption { 
            name: string; 
            value: string; 
            title: string; 
            command: string; 
            label: string; 
            style: React.CSSProperties; 
        }

        interface ColorOption { 
            name: string;  
            value: string 
        }

        interface TextOption { 
            sizeOptions: SizeOption[]; 
            formatOptions: FormatOption[]; 
            colorOptions: ColorOption[]; 
        }

        const [textOptions, setTextOptions] = useState<TextOption>({
            sizeOptions: [],
            formatOptions: [],
            colorOptions: []
        });

        useEffect(() => {
            const loadOptions = async () => {
                await initTextOptions();

                const [sizes, formats, colors] = await Promise.all([
                    getTextOptions('size'),
                    getTextOptions('format'),
                    getTextOptions('color')
                ]);

                setTextOptions({
                    sizeOptions: sizes,
                    formatOptions: formats,
                    colorOptions: colors
                });
            }
            
            loadOptions().catch(console.error);
        }, []);
    //

    //Add Note
    const addNote = async () => {
        const currentContent = contentRef.current?.innerHTML || newNote.content;

        if(!currentContent.trim()) {
            cancelCreation();
            return;
        }

        //Empty Content
            const contentEl = /<div[^>]*>/i.test(currentContent);

            if(!contentEl) {
                const updContent = currentContent + '<div id="empty-content-">No additional text</div>';
                if(contentRef.current) contentRef.current.innerHTML = updContent;

                setNewNote(prev => ({
                    ...prev,
                    content: updContent
                }));
            }
        //

        try {
            const finalContent = contentRef.current?.innerHTML || newNote.content;
            const clearContent = DOMPurify.sanitize(finalContent);

            await _addNote(clearContent, currentSession);
            setNewNote({ title: '', content: '' });
            onComplete();
            if(onNotesUpdated) onNotesUpdated();
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
        if(!editNote) return;

        const currentContent = contentRef.current?.innerHTML || editNote.content;
        const isEmpty = !currentContent.trim() || 
                        currentContent.replace(/<br\s*\/?>/gi, '').trim() === '' ||
                        currentContent.includes('empty-content-');

        if(isEmpty && editNote.id) {
            try {
                if(onDeleteNote) await onDeleteNote(editNote.id);
                setEditNote(null);
                onComplete();
                return;
            } catch(e) {
                console.error(e);
            }
        }

        try {
            const clearContent = DOMPurify.sanitize(currentContent);
            await _updateNote(editNote.id, clearContent);
            if(editNote.status !== currentSession && onUpdateStatus) await onUpdateStatus(editNote.id, currentSession);

            setEditNote(null);
            onComplete();
            if(onNotesUpdated) onNotesUpdated();
        } catch(e) {
            console.error(e);
        }
    }

    //Size
        const applyTextSize = useCallback((size: number, e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
            e.preventDefault();

            const savedRange = savedSelectionRef.current;
            if(!savedRange) return;

            const selection = window.getSelection();
            if(selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);

                const execFontSize = Math.min(Math.max(Math.ceil(size / 7), 1), 7);
                document.execCommand('styleWithCSS', false, 'true');
                document.execCommand('fontSize', false, execFontSize.toString());

                const selectedNode = selection.focusNode?.parentNode;
                if(selectedNode && selectedNode.nodeType === Node.ELEMENT_NODE) {
                    (selectedNode as HTMLElement).style.fontSize = `${size}px`;
                }

                savedSelectionRef.current = selection.getRangeAt(0);
            }

            if(contentRef.current) {
                const newContent = contentRef.current.innerHTML;
                setSelectedSize(size);

                if(editNote) {
                    setEditNote({ ...editNote, content: newContent });
                } else {
                    setNewNote({ ...newNote, content: newContent });
                }
            }
        }, [editNote, newNote]);
    //

    //Format
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

            const spans = contentRef.current?.querySelectorAll('span[style*=color]');
            const spanId = `note-content-wc-${value}`;
            spans?.forEach(s => s.id = spanId);

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
                let exContent = isEditing ? editNote?.content || '' : newNote.content;
                if(exContent.includes('empty-content-')) exContent = exContent.replace(/<div id="empty-content-">No additional text<\/div>/g, '');
                
                if(contentRef.current.innerHTML !== exContent) {
                    contentRef.current.innerHTML = exContent;

                    if(isEditing && contentRef.current.firstChild) {
                        const firstEl = contentRef.current.querySelector('*');

                        if(firstEl) {
                            const computedSize = window.getComputedStyle(firstEl).fontSize;
                            const sizeValue = parseInt(computedSize);
                            if(!isNaN(sizeValue)) setSelectedSize(sizeValue);
                        }
                    }
                }
            }
        }, [isEditing, editNote?.content, newNote.content]);

        const handleTextSelection = useCallback(() => {
            const selection = window.getSelection();
            if(!selection || selection.rangeCount === 0) {
                setShowToolbar(false);
                setShowSizePicker(false);
                setShowFormatPicker(false);
                setShowColorPicker(false);
                return;
            }

            savedSelectionRef.current = selection.getRangeAt(0);
            const isSelected = !selection.isCollapsed;
            setShowToolbar(isSelected);
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
                if(e.key === '') {
                    e.preventDefault();
                    insertLine();
                }
            }
        //

        const handleContentInput = useCallback(() => {
            if(!contentRef.current) return;
            let newContent = contentRef.current.innerHTML;
            const isEmpty = !newContent.trim() || newContent.replace(/<br\s*\/?>/gi, '').trim() === '';

            if(isEditing) {
                setEditNote({ ...editNote, content: isEmpty ? '' : newContent });
            } else {
                setNewNote({ ...newNote, content: isEditing ? '' : newContent });
            }
        }, [isEditing, editNote, newNote]);
    //
    
    //Note List
    const noteRef = useRef<Record<number, HTMLDivElement>>({})

    if(showNotes) {
        return (
            <div className="notes-list">
                {isEmptyRes && !searchTerm.trim() ? (
                    <div id="_empty-note-container">
                        <div id="__empty-note-content">
                            <span id="___empty-note">
                                No matching notes found.
                            </span>
                        </div>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            id="_note"
                            key={note.id}
                            ref={(el) => {
                                if(el) {
                                    noteRef.current[note.id] = el;
                                }
                            }}>
                            <NoteComponent
                                key={`note-${note.id}`}
                                note={note}
                                currentSession={currentSession}
                                onUpdateStatus={(id, updStatus) => {
                                    const ec = document.querySelector('#note-content-.edit');
                                    if(onUpdateStatus) onUpdateStatus(id, updStatus);
                                    if(ec) onComplete();
                                }}
                                onClick={(e) => {
                                    document.querySelectorAll('#_note-item').forEach(el => {
                                    el.classList.remove('current');
                                });
                                
                                // Add 'current' class to the clicked note
                                const clickedEl = noteRef.current[note.id]?.querySelector('#_note-item');
                                clickedEl?.classList.add('current');
                                
                                // Call the onNoteClick callback
                                if(onNoteClick) onNoteClick(note);
                                }}
                                onDelete={onDeleteNote || (() => Promise.resolve())}
                            />
                        </div>
                    ))
                )}
            </div>
        )
    }

    //Main...
        const renderContent = () => {
            const saveHandler = isEditing ? updateNote : addNote;
            const isViewOnly = currentSession === 'deleted' || currentSession === 'archived';

            return (
                <div className="note-manager">
                    <div id="---note-creator">
                        <div id="_note-actions">
                            <div id="__note-save-container">
                                <button onClick={saveHandler}>
                                    { 
                                        (currentSession == 'default' ? 'Home' : '') || 
                                        (currentSession == 'archived' || 'deleted' ? 'Back' : '') 
                                    }
                                </button>
                            </div>
                        </div>
        
                        <div id="_note-main">
                            <div id="__note-container">
                                <div id="___note-content-container">
                                    <div
                                        id="note-content-"
                                        className={isEditing ? 'edit' : ''}
                                        ref={contentRef}
                                        contentEditable={!isViewOnly}
                                        onSelect={isViewOnly ? undefined : handleTextSelection}
                                        onClick={isViewOnly ? undefined : handleTextSelection}
                                        onInput={isViewOnly ? undefined : handleContentInput}
                                        onKeyDown={isViewOnly ? undefined : handleKeyDown}
                                    />
                                </div>
                            </div>

                            {/* Toolbar */}
                            {showToolbar && (
                                <div id="__toolbar">
                                    <div id="items">
                                        <div id="text-custom">
                                            {/* Size Picker */}
                                            {showSizePicker && (
                                                <div id="___size-picker">
                                                    <select 
                                                        id="select-size-"
                                                        onChange={(e) => {
                                                            const size = Number(e.target.value);
                                                            setSelectedSize(size);
                                                            applyTextSize(size, e);
                                                        }}
                                                        value={selectedSize}
                                                    >
                                                        {textOptions.sizeOptions.map(option => (
                                                            <option 
                                                                id="option-size--"
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Format Picker */}
                                            {showFormatPicker && (
                                                <div id='___format-picker'>
                                                    {textOptions.formatOptions.map((option) => (
                                                        <button
                                                            id={`button-option-${option.name}-`}
                                                            key={option.name}
                                                            onClick={(e) => applyTextFormat(option.command, e)}
                                                            title={option.title}
                                                            style={option.style}
                                                        >
                                                            {option.label}
                                                        </button>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Color Picker */}
                                        {showColorPicker && (
                                            <div id='___color-picker'>
                                                {textOptions.colorOptions.map(value => (
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
                            )}
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