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
    onSearchTermChange: (term: string) => void;
}

export default function GlobalHeader({ notes, currentSession, onSearch, onClearSearch, onSearchTermChange }: GlobalHeaderProps) {
    return (
        <div id="-global-header">
            <div id="--header-content">
                {/* Logo */}


                {/* Search Bar */}
                <div id="---search-bar-container">
                    <div id="_search-bar-content-container">
                        <div id="__search-bar-content">
                            <SearchManager
                                notes={notes}
                                currentSession={currentSession}
                                onSearch={onSearch}
                                onClearSearch={onClearSearch}
                                onSearchTermChange={onSearchTermChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}