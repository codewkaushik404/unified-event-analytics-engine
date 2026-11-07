class ApiResponse{
    
    success: boolean = true;

    constructor(
        public statusCode: number,
        public message: string,
        public data?: {} | unknown[],
    ){}
}

export default ApiResponse;