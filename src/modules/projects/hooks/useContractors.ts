
import { useState, useEffect } from 'react';
import { db } from '../services/firebase.ts';
import { Contractor } from '../types.ts';

export const useContractors = () => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.collection('contractors').onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor));
            setContractors(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addContractor = async (contractor: Omit<Contractor, 'id'>) => {
        // Check for duplicates based on name (case-insensitive)
        const exists = contractors.some(c => c.name.toLowerCase() === contractor.name.toLowerCase());
        if (!exists) {
            await db.collection('contractors').add(contractor);
        }
    };

    return { contractors, loading, addContractor };
};
