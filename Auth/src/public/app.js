const authForm = document.getElementById("authForm");
const feedback = document.getElementById("feedback");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authPanel = document.getElementById("authPanel");
const accountPanel = document.getElementById("accountPanel");
const accountMessage = document.getElementById("accountMessage");
let authMode = "login";

function showFeedback(message, isSuccess = false) {
    feedback.textContent = message;
    feedback.classList.toggle("success", isSuccess);
}

function setAuthMode(mode) {
    authMode = mode;
    const isLogin = mode === "login";
    loginTab.classList.toggle("active", isLogin);
    registerTab.classList.toggle("active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    registerTab.setAttribute("aria-selected", String(!isLogin));
    passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
    submitButton.textContent = isLogin ? "Sign in" : "Create account";
    showFeedback("");
}

async function requestJson(url, options = {}) {
    let response;

    try {
        response = await fetch(url, {
            ...options,
            credentials: "same-origin",
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            }
        });
    } catch {
        throw new Error("Could not reach the server. Check that the API is running.");
    }

    if (response.status === 204) {
        return null;
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || "The request could not be completed.");
    }

    return result;
}

function showSignedIn(user) {
    authPanel.hidden = true;
    accountPanel.hidden = false;
    accountMessage.textContent = `Signed in as ${user.email} (${user.role}).`;
    showFeedback("");
}

function showSignedOut() {
    accountPanel.hidden = true;
    authPanel.hidden = false;
}

loginTab.addEventListener("click", () => setAuthMode("login"));
registerTab.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFeedback("");
    submitButton.disabled = true;

    try {
        const formData = new FormData(authForm);
        const result = await requestJson(`/api/auth/${authMode}`, {
            method: "POST",
            body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password")
            })
        });
        authForm.reset();
        showSignedIn(result.user);
    } catch (error) {
        showFeedback(error.message);
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await requestJson("/api/auth/logout", { method: "POST" });
        showSignedOut();
        showFeedback("You have signed out.", true);
    } catch (error) {
        showFeedback(error.message);
    }
});

document.getElementById("adminButton").addEventListener("click", async () => {
    try {
        const result = await requestJson("/api/admin");
        showFeedback(result.message, true);
    } catch (error) {
        showFeedback(error.message);
    }
});

requestJson("/api/auth/me")
    .then((result) => showSignedIn(result.user))
    .catch((error) => {
        showSignedOut();
        if (error.message !== "Authentication is required.") {
            showFeedback(error.message);
        }
    });
