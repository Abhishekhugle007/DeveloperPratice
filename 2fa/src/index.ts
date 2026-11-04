
import app from "./app";
import envConfig from "./configs/env.config";
import { connectDb } from "./configs/db.config";

const startApplication = async() =>{
    try{

        //DatabASE CONNECTION
        const dbName = await connectDb()
        console.info(`Database connected`, dbName)

        //Server connection
        const server = app.listen(envConfig.PORT)
        server.timeout = envConfig.SERVER_REQUEST_TIMEOUT
        console.info(`Server started on port`,envConfig.PORT)
    }catch(err){
        console.log(`Application error`, err);
        
    }
}

 void startApplication()