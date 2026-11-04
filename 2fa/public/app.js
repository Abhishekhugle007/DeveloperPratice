"use strict";
function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`The required page element "${selector}" is missing.`);
    }
    return element;
}
const app = requireElement("#app");
const notice = requireElement("#notice");
let justActivated = false;
async function request(path, method = "GET", body) {
    const response = await fetch(`/v1/user${path}`, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    let result;
    try {
        result = (await response.json());
    }
    catch {
        throw new Error(`The server returned an invalid response (${response.status}).`);
    }
    if (!response.ok || !result.success || result.data === undefined) {
        throw new Error(result.message || `Request failed (${response.status}).`);
    }
    return result.data;
}
function showNotice(message, success = false) {
    notice.textContent = message;
    notice.classList.toggle("success", success);
    notice.hidden = !message;
}
function setBusy(busy) {
    app.querySelectorAll("button, input").forEach((item) => {
        item.disabled = busy;
    });
}
function renderAuth(mode = "login") {
    justActivated = false;
    showNotice("");
    app.innerHTML = `
    <h1>${mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p class="intro">${mode === "login" ? "Sign in to continue to your secure account." : "Register, then set up two-factor authentication."}</p>
    <form id="auth-form">
      ${mode === "register"
        ? '<label class="field">Name<input name="name" autocomplete="name" required minlength="1" /></label>'
        : ""}
      <label class="field">Email<input name="email" type="email" autocomplete="email" required /></label>
      <label class="field">Password<input name="password" type="password" autocomplete="${mode === "login" ? "current-password" : "new-password"}" minlength="${mode === "register" ? "8" : "1"}" maxlength="24" required /></label>
      <div class="actions"><button type="submit">${mode === "login" ? "Sign in" : "Create account"}</button></div>
    </form>
    <button class="text-button" id="toggle-auth" type="button">${mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button>
  `;
    app.querySelector("#auth-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        void submitAuth(new FormData(event.currentTarget), mode);
    });
    app.querySelector("#toggle-auth")?.addEventListener("click", () => {
        renderAuth(mode === "login" ? "register" : "login");
    });
}
async function submitAuth(formData, mode) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    setBusy(true);
    showNotice("");
    try {
        if (mode === "register") {
            await request("/register", "POST", { name, email, password });
        }
        await request("/login", "POST", { email, password });
        const user = await request("/me");
        renderAccount(user, mode === "register");
    }
    catch (error) {
        showNotice(error instanceof Error ? error.message : "Something went wrong.");
        setBusy(false);
    }
}
function renderAccount(user, registered = false) {
    showNotice(registered
        ? "Your account is ready. Set up two-factor authentication to protect it."
        : "", registered);
    if (user.twoFactorAuth?.activated) {
        renderVerification();
    }
    else {
        renderSetup();
    }
    setBusy(false);
}
function renderSetup() {
    app.innerHTML = `
    <h1>Set up two-factor authentication</h1>
    <p class="intro">Scan a QR code with an authenticator app, then enter its six-digit code to finish setup.</p>
    <div id="qr-area"></div>
    <form id="setup-form">
      <label class="field">Authenticator code<input name="totp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required /></label>
      <div class="actions">
        <button id="setup-button" type="button">Generate QR code</button>
        <button id="verify-button" type="submit" hidden>Verify and enable 2FA</button>
      </div>
    </form>
    <button class="text-button" id="logout-button" type="button">Sign out</button>
  `;
    app.querySelector("#setup-button")?.addEventListener("click", () => {
        void loadQRCode();
    });
    app.querySelector("#setup-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        void verifyCode(new FormData(event.currentTarget));
    });
    app.querySelector("#logout-button")?.addEventListener("click", logout);
}
async function loadQRCode() {
    setBusy(true);
    showNotice("");
    try {
        const data = await request("/activate-2fa", "POST");
        const area = app.querySelector("#qr-area");
        if (area) {
            const image = document.createElement("img");
            image.className = "qr-code";
            image.alt = "QR code for your authenticator app";
            image.src = data.qrDataUrl;
            area.replaceChildren(image);
        }
        const setupButton = app.querySelector("#setup-button");
        const verifyButton = app.querySelector("#verify-button");
        if (setupButton)
            setupButton.hidden = true;
        if (verifyButton)
            verifyButton.hidden = false;
        app.querySelector('input[name="totp"]')?.focus();
        setBusy(false);
    }
    catch (error) {
        showNotice(error instanceof Error ? error.message : "Could not load a QR code.");
        setBusy(false);
    }
}
function renderVerification() {
    app.innerHTML = `
    <h1>Verify your identity</h1>
    <p class="intro">Enter the six-digit code from your authenticator app. You can also use an unused recovery code.</p>
    <form id="verify-form">
      <label class="field">Authenticator code<input name="totp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required /></label>
      <div class="actions"><button type="submit">Verify code</button></div>
    </form>
    <form id="recovery-form">
      <label class="field">Or use a recovery code<input name="recoveryCode" autocomplete="off" minlength="10" maxlength="10" /></label>
      <div class="actions"><button class="secondary" type="submit">Use recovery code</button></div>
    </form>
    <button class="text-button" id="logout-button" type="button">Sign out</button>
  `;
    app.querySelector("#verify-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        void verifyCode(new FormData(event.currentTarget));
    });
    app.querySelector("#recovery-form")?.addEventListener("submit", (event) => {
        event.preventDefault();
        void useRecoveryCode(new FormData(event.currentTarget));
    });
    app.querySelector("#logout-button")?.addEventListener("click", logout);
}
async function verifyCode(formData) {
    const totp = String(formData.get("totp") ?? "").trim();
    setBusy(true);
    showNotice("");
    try {
        const result = await request("/verify-2fa", "POST", { totp });
        justActivated = result.recoveryCodes.length > 0;
        renderVerified(result.recoveryCodes);
    }
    catch (error) {
        showNotice(error instanceof Error ? error.message : "Verification failed.");
        setBusy(false);
    }
}
async function useRecoveryCode(formData) {
    const recoveryCode = String(formData.get("recoveryCode") ?? "").trim();
    if (!recoveryCode) {
        showNotice("Enter an unused recovery code.");
        return;
    }
    setBusy(true);
    showNotice("");
    try {
        await request("/recover-2fa", "PUT", { recoveryCode });
        renderVerified([]);
    }
    catch (error) {
        showNotice(error instanceof Error ? error.message : "Recovery failed.");
        setBusy(false);
    }
}
function renderVerified(recoveryCodes) {
    app.innerHTML = `
    <h1>${justActivated ? "Two-factor authentication enabled" : "You’re signed in"}</h1>
    <p class="intro">${justActivated ? "Save these recovery codes somewhere safe. Each code can only be used once." : "Your account is now verified."}</p>
    ${recoveryCodes.length ? '<div class="recovery-list" id="recovery-list"></div>' : ""}
    <div class="actions">
      ${recoveryCodes.length ? '<button class="secondary" id="copy-codes" type="button">Copy recovery codes</button>' : ""}
      <button id="logout-button" type="button">Sign out</button>
    </div>
  `;
    const list = app.querySelector("#recovery-list");
    if (list) {
        for (const code of recoveryCodes) {
            const item = document.createElement("span");
            item.textContent = code;
            list.append(item);
        }
    }
    app.querySelector("#copy-codes")?.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(recoveryCodes.join("\n"));
            showNotice("Recovery codes copied.", true);
        }
        catch {
            showNotice("Could not copy codes. Select and copy them manually.");
        }
    });
    app.querySelector("#logout-button")?.addEventListener("click", logout);
    setBusy(false);
}
async function logout() {
    setBusy(true);
    try {
        await request("/logout", "PUT");
        renderAuth();
        showNotice("You have signed out.", true);
        setBusy(false);
    }
    catch (error) {
        showNotice(error instanceof Error ? error.message : "Could not sign out.");
        setBusy(false);
    }
}
renderAuth();
