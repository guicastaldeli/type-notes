import React from "react";
import { useState } from 'react';
import DOMPurify from "dompurify";
import useScreenSize from "./screen-resolution";

const iconSettings = require('./assets/img/settings-icon-img.png');
const iconActiveSettings = require('./assets/img/settings-icon-img-active.png')

type NoteStatus = 'default' | 'archived' | 'deleted';

export interface NoteProps {    
    id: number;
    content: string;
    status: NoteStatus;
    createdAt: string;
    updatedAt: string;
    isFavorite: boolean;
}

export interface NoteComponentProps {
    note: NoteProps;
    isSelected?: boolean;
    currentSession: NoteStatus;
    onUpdateStatus: (id: number, updStatus: NoteStatus) => void;
    onClick?: (e: React.MouseEvent) => void;
    onDelete: (id: number) => void;
    onToggleFavorite?: (id: number) => void;
}

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '?' : date.toLocaleString();
    } catch {
        return '??';
    }
}

export default function NoteComponent({ 
    note, 
    currentSession, 
    onUpdateStatus,
    onClick, 
    onDelete,
    onToggleFavorite,
    }: NoteComponentProps) {
    const [showActions, setShowActions] = useState(false);
    const { w } = useScreenSize();

    const getTruncationLength = () => {
        if(w >= 1850) return 15;
        if(w >= 1440) return 12;
        if(w >= 1024) return 8;
        if(w >= 768) return 5;
        if(w >= 480) return 3;
        return 3;
    }

    const truncateContent = (node: Node, maxLength: number): number => {
        let remLength = maxLength;

        for(const childNode of Array.from(node.childNodes)) {
            if(remLength <= 0) {
                node.removeChild(childNode);
                continue;
            }

            if(childNode.nodeType === Node.TEXT_NODE) {
                const textNode = childNode as Text;

                if(textNode.data.length > remLength) {
                    textNode.data = textNode.data.substring(0, remLength) + '...';
                    remLength = 0;
                } else {
                    remLength -= textNode.data.length;
                }
            } else if(childNode.nodeType === Node.ELEMENT_NODE) {
                remLength = truncateContent(childNode, remLength);
            }
        }

        return remLength;
    }

    //Favorite
    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onToggleFavorite) onToggleFavorite(note.id);
    }

    const processContent = (content: string) => {
        //Clear Content
        const clearContent = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['span', 'div'],
            ALLOWED_ATTR: ['id', 'style', 'color'],
        });

        //Truncate
        const truncLength = getTruncationLength();
        
        //Div
            const tempDiv = document.createElement('div');
            tempDiv.id = 'test'
            tempDiv.innerHTML = clearContent;
            
            const divs = tempDiv.querySelectorAll('div:not([id="empty-content-"])');
            divs.forEach(d => { truncateContent(d, truncLength) });

            if(divs.length > 1) {
                const fDiv = divs[0];
                Array.from(divs).slice(1).forEach(div => {
                    fDiv.innerHTML += div.innerHTML;
                    div.remove();
                });
            }
            
            if(divs.length > 1) {
                const divArray = Array.from(divs);

                for(let i = 1; i < divArray.length; i++) {
                    divs[i].remove();
                }
            }

            //Empty
                const hasContent = divs.length > 0 && Array.from(divs).some(div => div.textContent?.trim() !== '');
                const divsEmpty = !hasContent;

                if (divsEmpty) {
                    const emptyContent = '<div id="empty-content-">No additional text</div>';
                    tempDiv.insertAdjacentHTML('beforeend', emptyContent);
                }
            //

            //Root
            Array.from(tempDiv.childNodes).forEach(c => {
                if(c.nodeType === Node.TEXT_NODE) {
                    const textNode = c as Text;
                    if(textNode.data.length > truncLength) textNode.data = textNode.data.substring(0, truncLength) + '...';
                }
            });
        //
    
        //Colored
            const hasColor = tempDiv.querySelectorAll('span[style*="color"], font[color], *[style*="color"]');
            hasColor.forEach(el => { truncateContent(el, truncLength) });
        //

        const processedHtml = tempDiv.innerHTML;
        return hasColor ? processedHtml : `<span id="note-content-">${processedHtml}</span>`;
    }

    const wrappedContent = processContent(note.content);

    return (
        <div 
            id="_note-item"
            data-note-id={note.id}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}>
            <div id="__note-item-content">
                <div id="__note-content">
                    <div 
                        id="___note-content-el"
                        dangerouslySetInnerHTML={{ __html: wrappedContent }} 
                    />
                </div>

                <div 
                    id="__note-actions"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(!showActions);
                    }}>
                    <div id="___icon-container">
                        <div id="icon-content-">
                            <img id="icon-img--" src={showActions ? iconActiveSettings : iconSettings} alt="s" />
                        </div>
                    </div>
                    <div
                        id="___note-actions-content"
                        style={{ display: showActions ? 'flex' : 'none' }}>
                        <div id="___note-actions">
                            {/* Default */}
                            {currentSession === 'default' && (
                                <div id="___act-session-default">
                                    <div id="container-btn-archive-">
                                        <button 
                                            id="btn-archive--" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(note.id, 'archived');
                                            }}
                                        >
                                            Archive
                                        </button>
                                    </div>
                                    <div id="container-btn-delete-">
                                        <button 
                                            id="btn-delete--" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(note.id, 'deleted');
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div id="container-btn-favorite-">
                                        <button 
                                            id="btn-favorite--"
                                            onClick={toggleFavorite}
                                        >
                                            {note.isFavorite ? 'Unfavorite' : 'Favorite'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Archived */}
                            {currentSession === 'archived' && (
                                <div id="___act-session-archived">
                                    <div id="container-btn-restore-">
                                        <button 
                                            id="btn-restore--" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(note.id, 'default');
                                            }}
                                        >
                                            Restore
                                        </button>
                                    </div>
                                    <div id="container-btn-delete-">
                                        <button 
                                            id="btn-delete--" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onUpdateStatus(note.id, 'deleted'); 
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Deleted */}
                            {currentSession === 'deleted' && (
                                <div id="___act-session-deleted">
                                    <div id="container-btn-restore-">
                                        <button 
                                            id="btn-restore--" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateStatus(note.id, 'default');
                                            }}
                                        >
                                            Restore
                                        </button>
                                    </div>
                                    <div id="container-btn-delete-perm-">
                                        <button 
                                            id="btn-delete-perm" 
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                onDelete(note.id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Note Info */}
                            <div id="__note-info">
                                <div id="__note-info-content">
                                    <span id="___created-info">{formatDate(note.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}