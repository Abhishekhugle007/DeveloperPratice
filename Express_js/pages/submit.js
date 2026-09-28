export default function submit({ username, password }) {
    return `
        <h1>Submit Page</h1>
        <p>Username: ${username}</p>
        <p>Password: ${password}</p>
         <a href="/login">Login</a>
    `;
}