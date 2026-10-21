const test = require("node:test");
const assert = require("node:assert/strict");
const { register } = require("../src/controllers/authController");
const authorize = require("../src/middleware/authorize");
const app = require("../src/app");

function createResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

async function startApp(t) {
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}`;
}

test("health endpoint responds without a database connection", async (t) => {
    const baseUrl = await startApp(t);
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
});

test("root serves the sign-in page", async (t) => {
    const baseUrl = await startApp(t);
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(html, /Your account/);
});

test("root page loads its local authentication script", async (t) => {
    const baseUrl = await startApp(t);
    const response = await fetch(`${baseUrl}/app.js`);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /javascript/);
});

test("malformed JSON receives a client error response", async (t) => {
    const baseUrl = await startApp(t);
    const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message: "Request body must be valid JSON." });
});

test("registration rejects invalid email before accessing the database", async () => {
    const response = createResponse();

    await register({ body: { email: "not-an-email", password: "password123" } }, response, (error) => {
        throw error;
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, "Enter a valid email address.");
});

test("registration rejects passwords over bcrypt's UTF-8 byte limit", async () => {
    const response = createResponse();

    await register({ body: { email: "user@example.com", password: "a".repeat(71) + "é" } }, response, (error) => {
        throw error;
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /72 UTF-8 bytes/);
});

test("authorization rejects unauthenticated requests", () => {
    const response = createResponse();
    let continued = false;

    authorize("admin")({}, response, () => {
        continued = true;
    });

    assert.equal(response.statusCode, 401);
    assert.equal(continued, false);
});

test("authorization blocks users without the required role", () => {
    const response = createResponse();
    let continued = false;

    authorize("admin")({ user: { role: "user" } }, response, () => {
        continued = true;
    });

    assert.equal(response.statusCode, 403);
    assert.equal(continued, false);
});

test("authorization continues for an allowed role", () => {
    let continued = false;

    authorize("admin")({ user: { role: "admin" } }, createResponse(), () => {
        continued = true;
    });

    assert.equal(continued, true);
});
