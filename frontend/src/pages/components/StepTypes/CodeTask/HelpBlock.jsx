import React from 'react';
import { motion } from 'framer-motion';

export function HelpBlock({ help, onChange }) {
    return (
        <div className="mb-4">
            <h4>Help Block</h4>
            <motion.textarea
                placeholder="Enter help text for students..."
                value={help}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '75%',
                    height: '150px',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#333333',
                    color: 'white',
                    outline: 'none',
                    resize: 'none',
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
        </div>
    );
} 