import { Hand } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiService = {
    getHands: async (): Promise<Hand[]> => {
        const response = await fetch(`${API_BASE_URL}/hands`);
        if (!response.ok) {
            throw new Error('Failed to fetch hand history');
        }
        return response.json();
    },


    saveHand: async (handData: object): Promise<Hand> => {
        const response = await fetch(`${API_BASE_URL}/hands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(handData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save hand');
        }
        return response.json();
    },
};