declare namespace NodeJs {
    interface processEnv{
        NODE_ENV: `development` | `production`
        PORT: string
        DATABASE_URI:string
        ACCESS_TOKEN_SECRET:string

    }
}