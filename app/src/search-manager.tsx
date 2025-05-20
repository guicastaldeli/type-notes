import React, { useCallback, useRef } from "react";
import { useState, useEffect } from "react";
import { NoteProps } from "./note-component";
import { Session } from "./session-manager";
import { searchNotes } from "./database";

interface SearchManagerProps {
    notes: NoteProps[];
    currentSession: Session;
    onSearch: (filteredNotes: NoteProps[]) => void;
    onClearSearch: () => void;
    onSearchTermChange: (term: string) => void;
}

export default function SearchManager({ notes, currentSession, onSearch, onClearSearch, onSearchTermChange }: SearchManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isEmptyRes, setIsEmptyRes] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClearSearch = useCallback(() => {
        setSearchError(null);
        setIsSearching(false);
        onClearSearch();
        setSearchTerm('');
    }, [onClearSearch]);

    const search = useCallback(async (term: string) => {
        //Empty
        if(!term.trim()) {
            handleClearSearch();
            setIsEmptyRes(false);
            return;
        }
    
        //Filtered
            setIsSearching(true);
            setSearchError(null);
        
            try {
                await new Promise(res => setTimeout(res, 0));
                const filtered = await searchNotes(term, currentSession);
                onSearch(filtered);
                setIsEmptyRes(filtered.length === 0);
            } catch(e) {
                console.error(e);
                setSearchError('Failed');
                onSearch([]);
            } finally {
                setIsSearching(false);
            }
        //
    }, [currentSession, handleClearSearch, onSearch, onSearchTermChange]);

    useEffect(() => {
        if(debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        if(searchTerm.trim()) {
            debounceTimeoutRef.current = setTimeout(() => {
               search(searchTerm) 
            }, 100);
        } else {
            handleClearSearch();
        }

        return () => {
            if(debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        }
    }, [searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        onSearchTermChange(term);
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
                    title={`Search${sessionDisplay() ? ' ' + sessionDisplay() : ''} Notes`}
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