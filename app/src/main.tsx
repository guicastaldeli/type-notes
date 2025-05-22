import React from 'react';
import { useEffect, useState, useCallback  } from 'react';

import { NoteProps } from './note-component';
import { Session } from './session-manager';
import { _deleteNote, _updateNoteStatus, getNotes, initAssets, setDB, toggleFavoriteNote } from './database';
import Message from './helloworld';
import SessionManager from './session-manager';
import GlobalHeader from './global-header';
import NoteManager from './note-manager';

import './styles/main/styles.scss';

export default function Main() {
  const [isCreating, setIsCreating] = useState(false);
  const [editNote, setEditNote] = useState<NoteProps | null>(null);
  const [currentSession, setCurrentSession] = useState<Session>('default');
  const [filteredNotes, setFilteredNotes] = useState<NoteProps[]>([]);
  const [notes, setNotes] = useState<NoteProps[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchState, setSearchState] = useState({ isSearching: false, isEmpty: false, term: '' });

  //Load Notes
    useEffect(() => {
      async function init() {
        const db = await setDB();
        await initAssets(db);
        loadNotes();
      }

      init();
    }, [currentSession]);

    const loadNotes = useCallback(async (searchTerm?: string) => {
      if(searchActive && !searchTerm) return;
      
      try {
        const loadedNotes = await getNotes(currentSession);
        setNotes(loadedNotes);
      } catch(e) {
        console.error(e);
        setNotes([]);
      }
    }, [currentSession, searchActive]);

    const handleUpdateStatus = async(id: number, status: Session) => {
      try {
        await _updateNoteStatus(id, status);
        setNotes(prev => prev.map(note => note.id === id ? { ...note, status } : note));
        setFilteredNotes(prev => prev.map(note => note.id === id ? { ...note, status } : note));
        if(status !== currentSession) loadNotes();
      } catch(e) {
        console.error(e);
      }
    }

    const handleDeleteNote = async(id: number) => {
      try {
        await _deleteNote(id);

        setNotes(prev => prev.filter(note => note.id !== id));
        setFilteredNotes(prev => prev.filter(note => note.id !== id));

        if(editNote?.id === id) {
          setEditNote(null);
          setIsCreating(false);
        }
      } catch(e) {
        console.error(e);
      }
    }
  //

  //Session
    const handleSessionChange = async (session: Session) => {
      setCurrentSession(session);
      setIsCreating(false);
      setEditNote(null);
      handleClearSearch();
      await loadNotes();
    }

    const handleNotesUpdated = useCallback(() => {
      loadNotes();
    }, [loadNotes]);
  //

  //Add Note
  const handleAddNote = () => {
    setIsCreating(true);
    setEditNote(null);
  }

  //Note Created
  const noteCreated = () => {
    setIsCreating(false);
    setEditNote(null);
    loadNotes();
  }

  const handleNoteClick = (note: any) => {
    setEditNote(note);
    setIsCreating(false);
  }

  //Search
    const handleSearch = useCallback((filteredNotes: NoteProps[]) => {
      setFilteredNotes(filteredNotes);
      setSearchActive(true);
      setSearchState({
        isSearching: false,
        isEmpty: filteredNotes.length === 0,
        term: searchState.term
      });
    }, []);

    const handleSearchTermChange = useCallback((term: string) => {
      setSearchState(prev => ({
        ...prev,
        term,
        isSearching: term.trim() !== '',
        isEmpty: false
      }));
    }, []);

    const handleClearSearch = useCallback(() => {
      setFilteredNotes([]);
      setSearchActive(false);
      setSearchState(prev => ({
        isSearching: false,
        isEmpty: false,
        term: ''
      }));
    }, []);
  //

  //Favorite
    const handleToggleFavorite = async(id: number) => {
      try {
        await toggleFavoriteNote(id);
        loadNotes();
      } catch(e) {
        console.error(e);
      }
    }
  //

  return (
    <div className='main'>
      <div id="-global-container">
        <div id='--bar-container'>
          {/* Bar */}
          <div id="--bar">
            <SessionManager
              currentSession={currentSession}
              onSessionChange={handleSessionChange}
              onNotesUpdated={handleNotesUpdated}
            />
          </div>
        </div>

        <div id='-main-container'>
          <GlobalHeader
            notes={notes}
            currentSession={currentSession}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            onSearchTermChange={handleSearchTermChange}
          />

          <div id='--main-note-container'>
            {/* Notes Conteiner */}
            <div id="--notes-container">
              <div id="---add-container">
                <div id="_add-content">
                  <button 
                    id='__add-note-btn'
                    title='Add Note'
                    onClick={handleAddNote}>
                    <span>+</span>
                  </button>
                </div>
              </div>
              
              <div id='---notes-content'>
                <NoteManager
                  isCreating={false}
                  showNotes={true}
                  currentSession={currentSession}
                  notes={searchActive ? filteredNotes : notes}
                  onToggleFavorite={handleToggleFavorite}
                  onComplete={noteCreated}
                  onCancel={() => setIsCreating(false)}
                  onNoteClick={handleNoteClick}
                  onNotesUpdated={handleNotesUpdated}
                  onUpdateStatus={handleUpdateStatus}
                  onDeleteNote={handleDeleteNote}
                  isSearching={searchState.isSearching}
                  isEmptyRes={searchState.isEmpty}
                  searchTerm={searchState.term}
                  key={Date.now()}
                />
              </div>
            </div>
            {/* */}

            {/* Info */}
            <div id="--info">
              {isCreating || editNote ? (
                <NoteManager
                  isCreating={isCreating}
                  showNotes={false}
                  currentSession={currentSession}
                  notes={notes}
                  onComplete={noteCreated}
                  onCancel={() => {
                    setIsCreating(false);
                    setEditNote(null);
                  }}
                  editingNote={editNote}
                  key={editNote ? editNote.id : 'create'}
                />
              ) : (
                <Message />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
