import React, { useState } from "react";
import DOMPurify from "dompurify";

type NoteStatus = 'default' | 'archived' | 'deleted';

export interface NoteProps {    
    id: number;
    content: string;
    status: NoteStatus;
    createdAt: string;
    updatedAt: string;
}

export interface NoteComponentProps {
    note: NoteProps;
    currentSession: NoteStatus;
    onUpdateStatus: (id: number, updStatus: NoteStatus) => void;
    onClick?: (e: React.MouseEvent) => void;
    onDelete: (id: number) => void;
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
    }: NoteComponentProps) {
    const [showActions, setShowActions] = useState(false);

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

    const processContent = (content: string) => {
        //Clear Content
        const clearContent = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['span', 'div'],
            ALLOWED_ATTR: ['id', 'style', 'color'],
        });
        
        //Div
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = clearContent;
            
            const divs = tempDiv.querySelectorAll('div:not([id="empty-content-"])');
            divs.forEach(d => { truncateContent(d, 5) });
            
            if(divs.length > 1) {
                const divArray = Array.from(divs);

                for(let i = 1; i < divArray.length; i++) {
                    divs[i].remove();
                }
            }

            //Root
            Array.from(tempDiv.childNodes).forEach(c => {
                if(c.nodeType === Node.TEXT_NODE) {
                    const textNode = c as Text;
                    if(textNode.data.length > 5) textNode.data = textNode.data.substring(0, 5) + '...';
                }
            });
        //
    
        //Colored
            const hasColor = tempDiv.querySelectorAll('span[style*="color"], font[color], *[style*="color"]');
            hasColor.forEach(el => { truncateContent(el, 5) });
        //

        const processedHtml = tempDiv.innerHTML;
        return hasColor ? processedHtml : `<span id="note-content-">${processedHtml}</span>`;
    }

    const wrappedContent = processContent(note.content);

    return (
        <div 
            id="_note-item"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}>
            <div id="__note-item-content">
                <div id="__note-content">
                    <div 
                        id="___note-content-el"
                        style={{ fontSize: '21px' }} 
                        dangerouslySetInnerHTML={{ __html: wrappedContent }} 
                    />
                </div>

                <div 
                    id="__note-actions"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowActions(!showActions);
                    }}>
                    <div
                        id="___note-actions-content"
                        style={{ display: showActions ? 'block' : 'none' }}>
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
                                        Delete!
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
    )
}