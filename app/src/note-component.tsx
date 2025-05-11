import React from "react";
import DOMPurify from "dompurify";

type NoteStatus = 'default' | 'archived' | 'deleted';

export interface NoteProps {    
    id: number;
    title: string;
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
        ALLOWED_ATTR: ['style']
    });

    return (
        <div id="_note-item">
            <div id="__note-title">
                <p id="___note-title-el">{note.title}</p>
            </div>
            <div id="__note-content">
                <div 
                    id="___note-content-el"
                    dangerouslySetInnerHTML={{ __html: cleanContent }} 
                />
            </div>

            <div id="__note-actions">
                {currentSession === 'default' && (
                    <div id="___act-session-default">
                        <div id="container-btn-archive-">
                            <button id="btn-archive--" onClick={() => onUpdateStatus(note.id, 'archived')}>Archive</button>
                        </div>
                        <div id="container-btn-delete-">
                            <button id="btn-delete--" onClick={() => onUpdateStatus(note.id, 'deleted')}>Delete</button>
                        </div>
                    </div>
                )}
                {currentSession === 'archived' && (
                    <div id="___act-session-archived">
                        <div id="container-btn-restore-">
                            <button id="btn-restore--" onClick={() => onUpdateStatus(note.id, 'default')}>Restore</button>
                        </div>
                        <div id="container-btn-delete-">
                            <button id="btn-delete--" onClick={() => onUpdateStatus(note.id, 'deleted')}>Delete</button>
                        </div>
                    </div>
                )}
                {currentSession === 'deleted' && (
                    <div id="___act-session-deleted">
                        <div id="container-btn-restore-">
                            <button id="btn-restore--" onClick={() => onUpdateStatus(note.id, 'default')}>Restore</button>
                        </div>
                        <div id="container-btn-delete-perm-">
                            <button id="btn-delete-perm" onClick={() => onDelete(note.id)}>Delete!</button>
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