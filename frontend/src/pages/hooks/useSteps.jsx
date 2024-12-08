import { useState } from 'react';

export function useSteps() {
    const [steps, setSteps] = useState([]);

    const addStep = (type) => {
        const newStep = {
            type,
            content: type === 'lesson' ? [{type: 'text-block', text: ''}] : [],
            questionText: '',
            questionType: type === 'true-false' ? 'true-false' : 'multiple-choice',
            answers: [],
            ...(type === 'code-task' && {
                task: '',
                help: '',
                exampleCode: '',
                acceptedAnswers: [{code: ''}],
            }),
        };
        setSteps([...steps, newStep]);
        return newStep;
    };

    const removeStep = (stepIndex) => {
        const newSteps = [...steps];
        newSteps.splice(stepIndex, 1);
        setSteps(newSteps);
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    return {
        steps,
        setSteps,
        addStep,
        removeStep,
        updateStep
    };
}