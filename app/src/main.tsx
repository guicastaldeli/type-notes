import React from 'react';
import { useEffect } from 'react';

import './styles/main/styles.scss';

import Message from './helloworld';
import GlobalHeader from './global-header';

export default function Main() {
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
                <button id='__add-note-btn'>+</button>
              </div>
            </div>
          </div>
          {/* */}

          {/* Info */}
          <div id="--info">
            <Message />
          </div>
        </div>
      </div>
    );
}
