import React, { useCallback, useRef } from "react";
import { useState, useEffect } from "react";
import { NoteProps } from "./note-component";
import { Session } from "./session-manager";
import { searchNotes } from "./database";

import searchIcon from './assets/img/search-icon.svg';

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
                <div id="serch-icon-content--">
                    <div id="search-icon---">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgb(105, 105, 105)" className="bi bi-search" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                        </svg>
                    </div>
                </div>

                <div id="input-search-content--">
                    <input 
                        type="search"
                        id="input-search--"
                        title={`Search${sessionDisplay() ? ' ' + sessionDisplay() : ''} Notes`}
                        placeholder={`Search for${sessionDisplay() ? ' ' + sessionDisplay() : ''} Notes...`}
                        value={searchTerm}
                        onChange={handleSearchChange} 
                    />
                </div>
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