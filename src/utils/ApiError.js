class ApiError extends Error{
    constructor(
        statuscode,
        message,
        stack="",
        errors=[]
    ){
        super(message)
        this.statuscode=statuscode,
        this.message=message
        this.errors=errors,
        this.success= false
        this.data=null

        if(!stack){
            Error.captureStackTrace(this,this.constructor)
        }else{
            this.stack=stack
        }
    }
}

export default ApiError