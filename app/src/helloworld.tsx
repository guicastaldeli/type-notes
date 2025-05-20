import React from 'react';
import { useEffect, useState } from 'react';
import { initDB, getSettings, setSettings, saveDB } from './database';

import './styles/main/styles.scss';

export default function Message() {
    const [showMessage, setShowMessage] = useState<boolean | null>(null);

    useEffect(() => {
        async function check() {
            try {
                const hasViewed = await initDB(db => getSettings(db, 'has-viewed'));
                const localStorageViewed = localStorage.getItem('has-viewed') === 'true';
                setShowMessage(hasViewed !== 'true' && !localStorageViewed);
            } catch(e) {
                console.error('Database error:', e);
                setShowMessage(!localStorage.getItem('has-viewed'));
            }
        }

        check();
    }, []);

    //Button Check
    async function checkBtn() {
        try {
            setShowMessage(false);
            await initDB(db => {
                setSettings(db, 'has-viewed', 'true');
                saveDB(db);
            });
            localStorage.setItem('has-viewed', 'true');
        } catch(e) {
            console.error('Failed to update', e);
        }
    }

    //Main...
    function renderMessage() {
        if(!showMessage) return null;

        return (
            <div id='---message'>
                <div id="_content-message">
                    <div id="__container-text">
                        <div id="___content-text">
                            <p>Welcome to Notes!</p>
                            <span>This is your first visit. Create your first note by clicking the <span id='pb'>+</span> button.</span>
                        </div>
                        <div id="___content-button-container">
                            <div id='content-button-'>
                                <button onClick={checkBtn}>
                                    <div>
                                        <span>Got it</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return renderMessage();
}