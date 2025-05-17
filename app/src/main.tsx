import React from 'react';
import { useEffect, useState, useCallback  } from 'react';

import { NoteProps } from './note-component';
import { Session } from './session-manager';
import { _deleteNote, _updateNoteStatus, getNotes } from './database';
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
      loadNotes();
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
        if(status !== currentSession) loadNotes();
      } catch(e) {
        console.error(e);
      }
    }

    const handleDeleteNote = async(id: number) => {
      try {
        await _deleteNote(id);
        loadNotes();
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

  //Resize
    const [panelWidths, setPanelWidths] = useState({
      bar: 8,
      notes: 20,
      info: 72
    });

    const handleResize = (panel: 'bar' | 'notes', newWidth: number) => {
      const totalWidth = panel === 'bar'
      ? newWidth + panelWidths.notes + panelWidths.info
      : panelWidths.bar + newWidth + panelWidths.info;

      const barPercent = panel === 'bar'
      ? (newWidth / totalWidth) * 100
      : (panelWidths.bar / totalWidth) * 100;

      const notesPercent = panel === 'notes'
      ? (newWidth / totalWidth) * 100
      : (panelWidths.notes / totalWidth) * 100;

      const infoPercent = 100 - barPercent - notesPercent;

      setPanelWidths({
        bar: barPercent,
        notes: notesPercent,
        info: infoPercent
      });
    }
  //

  return (
    <div className='main'>
      <GlobalHeader
        notes={notes}
        currentSession={currentSession}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onSearchTermChange={handleSearchTermChange}
      />

      <div id="-global-container">
        {/* Bar */}
        <div id="--bar">
          <SessionManager
            currentSession={currentSession}
            onSessionChange={handleSessionChange}
            onNotesUpdated={handleNotesUpdated}
          />
        </div>

        {/* Notes Conteiner */}
        <div id="--notes-container">
          <div id="---add-container">
            <div id="_add-content">
              <button id='__add-note-btn' onClick={handleAddNote}>
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
  );
}
