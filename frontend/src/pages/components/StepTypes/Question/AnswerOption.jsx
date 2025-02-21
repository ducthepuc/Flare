import React from 'react';
import {motion} from 'framer-motion';

export function AnswerOption({
                                 answer,
                                 index,
                                 questionType,
                                 onTextChange,
                                 onCorrectChange,
                                 onRemove
                             }) {
    return (
        <div className="flex items-center mb-2">
            <motion.input
                type="text"
                placeholder={`Answer ${index + 1}`}
                value={answer.text}
                onChange={(e) => onTextChange(e.target.value)}
                style={{
                    width: '60%',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#333333',
                    color: 'white',
                    outline: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                }}
                whileHover={{
                    backgroundColor: '#444444',
                }}
                whileFocus={{
                    backgroundColor: '#555555',
                    border: '1px solid #FF7F4F',
                }}
            />
            <motion.input
                type={questionType === 'true-false' ? 'radio' : 'checkbox'}
                checked={answer.correct}
                onChange={onCorrectChange}
                style={{
                    accentColor: '#333333',
                    width: '2vw',
                    height: '2vh',
                    borderRadius: '5px',
                    backgroundColor: '#2196F3',
                    transition: 'opacity 0.2s ease'
                }}
                whileHover={{ scale: 1.1 }}
            />
            <motion.button
                onClick={onRemove}
                style={{ padding: '10px 20px', cursor: 'pointer', backgroundImage: 'radial-gradient(circle, rgba(255,0,56,1) 0%, rgba(167,4,4,1) 100%)', color:'white' }}
                whileHover={{scale: 1.1}}
            >
                X
            </motion.button>
        </div>
    );
}