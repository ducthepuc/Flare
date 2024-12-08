import React from 'react';
import { AcceptedAnswers } from './AcceptedAnswers.jsx';
import { ExampleCode } from './ExampleCode.jsx';
import { HelpBlock } from './HelpBlock.jsx';
import { motion } from 'framer-motion';

export function CodeTask({
    step,
    stepIndex,
    handleStepChange,
    addAcceptedAnswer,
    removeAcceptedAnswer,
    handleAcceptedAnswerChange,
}) {
    return (
        <div>
            <h3>Coding Task</h3>
            <motion.textarea
                placeholder="Task Description"
                value={step.task}
                onChange={(e) => handleStepChange(stepIndex, 'task', e.target.value)}
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

            <HelpBlock
                help={step.help}
                onChange={(value) => handleStepChange(stepIndex, 'help', value)}
            />

            <ExampleCode
                code={step.exampleCode}
                onChange={(value) => handleStepChange(stepIndex, 'exampleCode', value)}
            />

            <AcceptedAnswers
                answers={step.acceptedAnswers}
                onAdd={() => addAcceptedAnswer(stepIndex)}
                onRemove={(answerIndex) => removeAcceptedAnswer(stepIndex, answerIndex)}
                onChange={(answerIndex, value) => handleAcceptedAnswerChange(stepIndex, answerIndex, value)}
            />
        </div>
    );
}