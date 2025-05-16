import React from 'react';
import { NoteProps } from './note-component';
import { Session } from './session-manager';
import SearchManager from './search-manager';

import './styles/main/styles.scss';

interface GlobalHeaderProps {
    notes: NoteProps[];
    currentSession: Session;
    onSearch: (filteredNotes: NoteProps[]) => void;
    onClearSearch: () => void;
}

export default function GlobalHeader({ notes, currentSession, onSearch, onClearSearch }: GlobalHeaderProps) {
    return (
        <div id="-global-header">
            <div id="--header-content">
                {/* Logo */}
                <div id="---logo-container">
                    <div id="_logo-content">
                        <p>LOGO</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div id="---search-bar-container">
                    <div id="_search-bar-content-container">
                        <div id="__search-bar-content">
                            <SearchManager
                                notes={notes}
                                currentSession={currentSession}
                                onSearch={onSearch}
                                onClearSearch={onClearSearch}
                            />
                        </div>
                    </div>
                </div>

                {/* info */}
                <div id='---bar-info'>info</div>
            </div>
        </div>
    )
}