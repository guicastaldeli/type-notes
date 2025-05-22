import React, { useEffect, useState } from 'react';
import { _updateNoteStatus, _deleteNote } from './database';
import { getAsset } from './database';

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
    activeIcon: string;
    icon: string;
}

export default function SessionManager({ currentSession, onSessionChange, onNotesUpdated }: SessionManagerProps) {
    const [assets, setAssets] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadAssets() {
            try {
                const assetNames = [
                    'logo',
                    'active-home-icon', 'home-icon',
                    'active-archive-icon', 'archive-icon',
                    'active-deleted-icon', 'deleted-icon'
                ];

                const loadedAssets: Record<string, string> = {}

                await Promise.all(
                    assetNames.map(async (name) => {
                        try {
                            const asset = await getAsset(name);
                            if(asset?.content) loadedAssets[name] = asset.content;
                        } catch(e) {
                            console.warn('Failed')
                        }
                    })
                );

                setAssets(loadedAssets);
            } catch(e) {
                console.error('Error loading assets', e);
            } finally {
                setIsLoading(false);
            }
        }

        loadAssets();
    }, []);

    const sessions: IntProps[] = [
        { 
            id: 'default', 
            label: 'All Notes',
            activeIcon: assets['active-home-icon'],
            icon: assets['home-icon']
        },
        { 
            id: 'archived', 
            label: 'Archived Notes',
            activeIcon: assets['active-archive-icon'],
            icon: assets['archive-icon']
        },
        { 
            id: 'deleted', 
            label: 'Deleted Notes',
            activeIcon: assets['active-deleted-icon'],
            icon: assets['deleted-icon']
        }
    ];

    if(isLoading) return <div>Loading...</div>

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
                        {assets['logo'] ? (
                            <img id='___logo' src={assets['logo']} alt="logo" />
                        ) : null}
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
                                    <div id={`button-icon-${s.label.toLowerCase()}-container-${currentSession === s.id ? 'current' : 'inactive'}-`} className='btn-icon-handler'>
                                        {currentSession === s.id ? (
                                            <div id='active-img-content--'>
                                                <img id='active-img---' src={s.activeIcon} alt="logo" />
                                            </div>
                                        ) : (
                                            <div id='icon-img-content--'>
                                                <img id='icon-img---' src={s.icon} alt="logo" />
                                            </div>
                                        )}
                                    </div>

                                    <div id={`button-label-${s.label.toLowerCase()}-container-`} className='id-handler'>
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