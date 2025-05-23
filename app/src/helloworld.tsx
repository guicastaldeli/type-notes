import React from 'react';
import { useEffect, useState } from 'react';
import { initDB, getSettings, setSettings, saveDB } from './database';

import './styles/main/styles.scss';

export default function Message() {
    const [showMessage, setShowMessage] = useState<boolean | null>(null);

    useEffect(() => {
        async function check() {
            try {
                const localStorageViewed = localStorage.getItem('has-viewed') === 'true';
                let hasViewed =  null;

                try {
                    const db = await initDB(db => getSettings(db, 'has-viewed'));
                    hasViewed = db;
                } catch(e) {
                    console.warn('Error helloworld');
                }

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
            localStorage.setItem('has-viewed', 'true');

            try {
                await initDB(db => {
                    setSettings(db, 'has-viewed', 'true');
                    saveDB(db);
                });
            } catch(e) {
                console.warn(e);
            }
        } catch(e) {
            console.error('Failed to update', e);
        }
    }

    //Main...
    function renderMessage() {
        if(showMessage === null) return null;
        if(!showMessage) return null;

        return (
            <div id='---message'>
                <div id="_content-message">
                    <div id="__container-text">
                        <div id="___content-text">
                            <p>Bem-vindo ao Notes!</p>
                            <span>Essa é sua primeira visita. Crie sua primeira nota clicando no botão <span id='pb'>+</span></span>
                        </div>
                        <div id="___content-button-container">
                            <div id='content-button-'>
                                <button onClick={checkBtn}>
                                    <div>
                                        <span>Entendido</span>
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