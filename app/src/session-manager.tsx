import React from 'react';
import { _updateNoteStatus, _deleteNote } from './database';
import { NoteProps } from './note-component';

import './styles/main/styles.scss';

export type Session = 'default' | 'archived' | 'deleted';

interface SessionManagerProps {
    currentSession: Session;
    onSessionChange: (session: Session) => void;
    onNotesUpdated: () => void;
}

export default function SessionManager({ currentSession, onSessionChange, onNotesUpdated }: SessionManagerProps) {
    const sessions: 
        { id: Session; label: string; icon?: string }[] = [
        { id: 'default', label: 'All Notes' },
        { id: 'archived', label: 'Archived Notes' },
        { id: 'deleted', label: 'Deleted Notes' }
    ];

    const updateNoteStatus = async(id: number, updStatus: Session) => {
        try {
            await _updateNoteStatus(id, updStatus);
            onNotesUpdated();
        } catch(e) {
            console.error(e);
        }
    }

    const deleteNote = async(id: number) => {
        try {
            await _deleteNote(id);
            onNotesUpdated();
        } catch(e) {
            console.error(e);
        }
    }

    //Main...
    return (
        <div id='---session-manager'>
            <div id='_s-content'>
                {sessions.map((s) => (
                    <div key={s.id} id='__s-content-container'>
                        <button
                            key={s.id}
                            id={`___button-session-${s.id}${currentSession === s.id ? '-current' : '-inactive'}`}
                            className={currentSession === s.id ? 'current' : 'inactive'}
                            onClick={() => onSessionChange(s.id)}
                        >
                            <span>
                                {s.label}
                            </span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}