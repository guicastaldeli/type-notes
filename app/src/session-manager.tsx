import React from 'react';
import { FC, SVGProps } from 'react';
import { _updateNoteStatus, _deleteNote } from './database';
import { NoteProps } from './note-component';

//Icons
import imgLogo from './assets/img/logo.png';

import activeHomeIcon from './assets/img/active-home-icon.svg';
import homeIcon from './assets/img/home-icon.svg';
import activeArchiveIcon from './assets/img/active-archive-icon.svg';
import archiveIcon from './assets/img/archive-icon.svg';
import activeDeletedIcon from './assets/img/active-deleted-icon.svg';
import deletedIcon from './assets/img/deleted-icon.svg';

import './styles/main/styles.scss';

export type Session = 'default' | 'archived' | 'deleted';

interface SessionManagerProps {
    currentSession: Session;
    onSessionChange: (session: Session) => void;
    onNotesUpdated: () => void;
}

interface IntProps {
    id: Session;
    label: string;
    activeIcon: FC<SVGProps<SVGSVGElement>>;
    icon: FC<SVGProps<SVGSVGElement>>;
}

export default function SessionManager({ currentSession, onSessionChange, onNotesUpdated }: SessionManagerProps) {
    const sessions: IntProps[] = [
        { 
            id: 'default', 
            label: 'All Notes',
            activeIcon: activeHomeIcon,
            icon: homeIcon
        },
        { 
            id: 'archived', 
            label: 'Archived Notes',
            activeIcon: activeArchiveIcon,
            icon: archiveIcon
        },
        { 
            id: 'deleted', 
            label: 'Deleted Notes',
            activeIcon: activeDeletedIcon,
            icon: deletedIcon
        }
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
                    <div id='__logo-handler'>
                        <img id='___logo' src={imgLogo} alt="logo" />
                    </div>
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
                                    <div id={`button-icon-${s.label.toLowerCase()}-container-${currentSession === s.id ? 'current' : 'inactive'}-`}>
                                        {currentSession === s.id ? (
                                            <s.activeIcon
                                                id={`icon-${s.label.toLowerCase()}-${currentSession === s.id ? 'current' : 'inactive'}---`}
                                                role='img'
    
                                            />
                                        ) : (
                                            <s.icon
                                                id={`icon-${s.label.toLowerCase()}-${currentSession === s.id ? 'current' : 'inactive'}---`}
                                                role='img'
                                            />
                                        )}
                                    </div>

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