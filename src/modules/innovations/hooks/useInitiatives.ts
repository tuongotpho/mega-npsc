import { useState, useEffect } from 'react';
import { dbSangkien } from "../services/firebase";
import { Initiative } from "../types";

export const useInitiatives = () => {
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Using compat API for Firestore query
        const unsubscribe = dbSangkien.collection("initiatives").orderBy("year", "desc").onSnapshot(
            (snapshot) => {
                const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Initiative));
                setInitiatives(items);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError("Lỗi kết nối dữ liệu.");
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    return { initiatives, loading, error };
};
