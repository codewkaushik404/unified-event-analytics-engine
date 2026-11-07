
declare global{
    namespace Express{
        interface User{
            id: number;
            google_id: string;
            email: string;
            name: string;
            avatar_url: string | null;
            created_at: Date
        }
    }
}

export {};