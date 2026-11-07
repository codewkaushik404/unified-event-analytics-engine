class ApiError extends Error{

    constructor(
        public statusCode: number,
        public message: string,
        public errors?: {} | unknown[],
    ){
        super(message);
    }
}

export default ApiError;