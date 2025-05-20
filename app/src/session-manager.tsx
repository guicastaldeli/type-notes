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

    const backHome = () => {
        onSessionChange('default');
    }

    //Main...
    return (
        <div id='---bar-content'>
            <div 
                id="---logo-container"
                title="Home"
                onClick={() => backHome()}>
                <div id="_logo-content">
                    <p>LOGO</p>
                </div>
            </div>
            
            <div id='---session-manager'>
                <div id='_s-content'>
                    <div id='_s-handler'>
                        {sessions.map((s) => (
                            <div key={s.id} id='__s-content-container'>
                                <button
                                    key={s.id}
                                    title={s.label}
                                    id={`___button-session-${s.id}${currentSession === s.id ? '-current' : '-inactive'}`}
                                    className={currentSession === s.id ? 'current' : 'inactive'}
                                    onClick={() => onSessionChange(s.id)}
                                >
                                    <div id={`button-label-${s.label.toLowerCase()}-container-`}>
                                        <span id={`button-label-${s.label.toLowerCase()}-content_`}>
                                            {s.label}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}