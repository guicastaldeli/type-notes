import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import { NoteProps } from "./note-component";
import { Session } from "./session-manager";
import { searchNotes } from "./database";

interface SearchManagerProps {
    notes: NoteProps[];
    currentSession: Session;
    onSearch: (filteredNotes: NoteProps[]) => void;
    onClearSearch: () => void;
}

export default function SearchManager({ notes, currentSession, onSearch, onClearSearch }: SearchManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        onClearSearch();
        setIsSearching(false);
    }, [onClearSearch]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const search = async () => {
            //Empty
            if(!searchTerm.trim()) {
                handleClearSearch();
                return;
            }
    
            //Filtered
                setIsSearching(true);
                setSearchError(null);
        
                try {
                    const filtered = await searchNotes(searchTerm, currentSession);
                    if(isMounted) onSearch(filtered);
                } catch(e) {
                    if(isMounted) {
                        console.error(e);
                        setSearchError('Failed');
                        onSearch([]);
                    }
                } finally {
                    if(isMounted) setIsSearching(false);
                }
            //
        }

        const timer = setTimeout(() => {
            search();
        }, 500);

        return () => {
            isMounted = false;
            controller.abort();
            clearTimeout(timer);
        }
    }, [
        searchTerm,
        currentSession, 
        handleClearSearch, 
        onSearch
    ]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }

    //Session Display
    const sessionDisplay = () => {
        if(currentSession === 'default') return '';
        if(currentSession === 'archived') return 'Archived';
        if(currentSession === 'deleted') return 'Deleted';

        return currentSession;
    }

    //Main...
    return (
        <>
            <div id="input-search-container-content-">
                <input 
                    type="search"
                    id="input-search--"
                    placeholder={`Search for${sessionDisplay() ? ' ' + sessionDisplay() : ''} Notes...`}
                    value={searchTerm}
                    onChange={handleSearchChange} 
                />
            </div>

            {/* Loading */}
            {isSearching && (
                <div className="search-loading-container">
                    <div id="-search-loading-content">
                        <span id="--search-loading">
                            Searching...
                        </span>
                    </div>
                </div>
            )}

            {/* Error */}
            {searchError && (
                <div className="search-error">
                    <div id="-search-error-content">
                        {searchError}
                    </div>
                </div>
            )}
        </>
    )
}