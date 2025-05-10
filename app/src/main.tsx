import React from 'react';
import { useEffect, useState } from 'react';

import './styles/main/styles.scss';

import Message from './helloworld';
import GlobalHeader from './global-header';
import NoteManager from './note-manager';
import { Session } from './note-manager';
import { NoteProps } from './note-component';

export default function Main() {
  const [isCreating, setIsCreating] = useState(false);
  const [editNote, setEditNote] = useState<NoteProps | null>(null);
  const currentSession: Session = 'default';

  //Add Note
  const handleAddNote = () => {
    setIsCreating(true);
    setEditNote(null);
  }

  //Note Created
  const noteCreated = () => {
    setIsCreating(false);
    setEditNote(null);
  }

  const handleNoteClick = (note: any) => {
    setEditNote(note);
    setIsCreating(false);
  }

  return (
    <div className='main'>
      <GlobalHeader />

      <div id="-global-container">
        {/* Bar */}
        <div id="--bar"></div>

        {/* Notes Conteiner */}
        <div id="--notes-container">
          <div id="---add-container">
            <div id="_add-content">
              <button id='__add-note-btn' onClick={handleAddNote}>+</button>
            </div>
          </div>
          
          <div id='---notes-content'>
            <NoteManager
              isCreating={false}
              showNotes={true}
              currentSession={currentSession}
              onComplete={noteCreated}
              onCancel={() => setIsCreating(false)}
              onNoteClick={handleNoteClick}
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
