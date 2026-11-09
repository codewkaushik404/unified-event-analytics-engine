declare global{
    namespace Express{
        interface Request{
            apiKeyApp?: {
                app_id: number,
                owner_id: number
            }
        }
    }
}

export {};