import React from 'react';
import { motion } from 'framer-motion';

export function Lesson({ step, stepIndex, steps, setSteps }) {
    const addContentBlock = () => {
        const newSteps = [...steps];
        if (!newSteps[stepIndex].content) {
            newSteps[stepIndex].content = [];
        }
        newSteps[stepIndex].content.push({
            type: 'text-block',
            text: ''
        });
        setSteps(newSteps);
    };

    const removeContentBlock = (contentIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].content.splice(contentIndex, 1);
        setSteps(newSteps);
    };

    return (
        <div>
            <h3>Lesson Content</h3>
            {step.content && step.content.map((contentItem, contentIndex) => (
                <div key={contentIndex} className="mb-2 relative">
                    <motion.textarea
                        placeholder="Lesson Text"
                        value={contentItem.text}
                        onChange={(e) => {
                            const newSteps = [...steps];
                            newSteps[stepIndex].content[contentIndex].text = e.target.value;
                            setSteps(newSteps);
                        }}
                        style={{
                            width: '75%',
                            height: '250px',
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
                    {step.content.length > 1 && (
                        <motion.button
                            onClick={() => removeContentBlock(contentIndex)}
                            style={{ padding: '10px 20px', cursor: 'pointer', backgroundImage: 'radial-gradient(circle, rgba(255,0,56,1) 0%, rgba(167,4,4,1) 100%)', color:'white' }}
                            whileHover={{scale: 1.1}}
                        >
                            X
                        </motion.button>
                    )}
                </div>
            ))}
            <motion.button
                onClick={addContentBlock}
                style={{ padding: '10px 20px', cursor: 'pointer', background: 'radial-gradient(circle, rgba(10,96,214,1) 0%, rgba(0,14,255,1) 100%)', color:'white' }}
                whileHover={{
                    scale: '1.1'
                }}
            >
                Add Text Block
            </motion.button>
        </div>
    );
}