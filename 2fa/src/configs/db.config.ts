import mongoose from "mongoose"
import envConfig from "./env.config"

export const connectDb =() =>{
    const databaseUri = envConfig.DATABASE_URI
    if (!databaseUri) {
      return Promise.reject(new Error("DATABASE_URI is not configured"))
    }

    return new Promise((resolve,reject)=>{
      mongoose
      .connect(databaseUri)
      .then(() => resolve(mongoose.connection.name))
      .catch((err)=> reject(err))
    })
}