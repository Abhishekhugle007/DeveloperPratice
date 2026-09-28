 export default function login(){
    return ` <form action="/submit" method="POST">
            <input type="text" name="username" placeholder="Username" />
            <input type="password" name="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
         <a href="/login">Login</a>`
}