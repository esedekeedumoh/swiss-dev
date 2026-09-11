"use client";
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, MessageSquarePlus } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';

export default function PlanArtifact({ content }) {
    const { id } = useParams();
    const [selectedText, setSelectedText] = useState("");
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState("");
    
    const saveComment = useMutation(api.workspace.SavePlanComment);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 5) {
            setSelectedText(text);
            setShowCommentBox(true);
        }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        await saveComment({
            workspaceId: id,
            textSelector: selectedText,
            comment: commentText,
            author: "User", // would be session.user.name from next-auth
        });
        setCommentText("");
        setShowCommentBox(false);
        window.getSelection().removeAllRanges();
    };

    return (
        <div className="my-4 border border-googleAnti-blue/30 bg-[#12141c] rounded-xl overflow-hidden relative">
            <div className="flex items-center px-4 py-2 bg-googleAnti-blue/10 border-b border-googleAnti-blue/20">
                <FileText className="h-4 w-4 text-googleAnti-blue mr-2" />
                <span className="text-sm font-semibold text-googleAnti-blue">Implementation Plan</span>
            </div>
            <div 
                className="p-4 prose prose-invert prose-sm max-w-none text-gray-300"
                onMouseUp={handleMouseUp}
            >
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>

            {showCommentBox && (
                <div className="absolute top-12 right-4 bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-2xl w-64 z-10 transition-all">
                    <p className="text-xs text-gray-400 mb-2 truncate bg-gray-800 p-1 rounded">"{selectedText}"</p>
                    <textarea 
                        className="w-full bg-gray-800 text-sm text-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-googleAnti-blue resize-none h-20"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={() => setShowCommentBox(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={submitComment} className="text-xs bg-googleAnti-blue px-2 py-1 rounded text-white font-medium flex items-center">
                            <MessageSquarePlus className="h-3 w-3 mr-1" /> Comment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
