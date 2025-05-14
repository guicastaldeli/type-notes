import React from "react";
import DOMPurify from "dompurify";

type NoteStatus = 'default' | 'archived' | 'deleted';

export interface NoteProps {    
    id: number;
    content: string;
    status: NoteStatus;
    createdAt: string;
    updatedAt: string;
}

export interface NoteComponentProps {
    note: NoteProps;
    currentSession: NoteStatus;
    onUpdateStatus: (id: number, updStatus: NoteStatus) => void;
    onDelete: (id: number) => void;
}

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '?' : date.toLocaleString();
    } catch {
        return '??';
    }
}

export default function NoteComponent({ note, currentSession, onUpdateStatus, onDelete }: NoteComponentProps) {
    const cleanContent = DOMPurify.sanitize(note.content, {
        ALLOWED_TAGS: ['span'],
        ALLOWED_ATTR: ['id', 'style', 'color']
    });

    const hasColor = () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanContent;
        return tempDiv.querySelector('span[style*="color"], font[color], *[style*="color"]') !== null;
    }

    const wrappedContent = hasColor() 
        ? cleanContent
        : `<span id="note-content-">${cleanContent}</span>`
    ;

    return (
        <div id="_note-item">
            <div id="__note-content">
                <div 
                    id="___note-content-el"
                    style={{ fontSize: `21px` }} 
                    dangerouslySetInnerHTML={{ __html: wrappedContent }} 
                />
            </div>

            <div id="__note-actions">
                {/* Default */}
                {currentSession === 'default' && (
                    <div id="___act-session-default">
                        <div id="container-btn-archive-">
                            <button 
                                id="btn-archive--" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(note.id, 'archived');
                                }}
                            >
                                Archive
                            </button>
                        </div>
                        <div id="container-btn-delete-">
                            <button 
                                id="btn-delete--" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(note.id, 'deleted');
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Archived */}
                {currentSession === 'archived' && (
                    <div id="___act-session-archived">
                        <div id="container-btn-restore-">
                            <button 
                                id="btn-restore--" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(note.id, 'default');
                                }}
                            >
                                Restore
                            </button>
                        </div>
                        <div id="container-btn-delete-">
                            <button 
                                id="btn-delete--" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onUpdateStatus(note.id, 'deleted'); 
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Deleted */}
                {currentSession === 'deleted' && (
                    <div id="___act-session-deleted">
                        <div id="container-btn-restore-">
                            <button 
                                id="btn-restore--" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(note.id, 'default');
                                }}
                            >
                                Restore
                            </button>
                        </div>
                        <div id="container-btn-delete-perm-">
                            <button 
                                id="btn-delete-perm" 
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    onDelete(note.id);
                                }}
                            >
                                Delete!
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div id="__note-info">
                <div id="__note-info-content">
                    <span id="___created-info">{formatDate(note.createdAt)}</span>
                </div>
            </div>
        </div>
    )
}