(() => {
    const TOKEN_KEY = "privateChatAccessToken";
    const elements = Object.fromEntries([
        "authPage", "chatApp", "authForm", "authTitle", "authSubtitle", "nameField",
        "nameInput", "emailInput", "passwordInput", "authSubmit", "authNotice",
        "togglePrompt", "toggleAuth", "profileAvatar", "profileName", "profileEmail",
        "userSearch", "userList", "filesButton", "logoutButton", "notificationPermissionButton",
        "notificationToasts", "adminTools", "importFile",
        "importButton", "templateButton", "exportButton", "chatHeader", "chatTitle", "chatPresence",
        "emptyState", "messages", "chatStatus", "composer", "messageInput",
        "attachmentButton", "attachmentInput", "sendButton", "forwardDialog", "forwardForm",
        "forwardRecipient", "forwardSubmit", "forwardCancel", "forwardClose", "filesDialog",
        "filesStatus", "fileList", "filesClose", "filesRefresh", "filePreviewDialog",
        "filePreviewTitle", "filePreviewContent", "filePreviewClose"
    ].map(id => [id, document.getElementById(id)]));

    let token = localStorage.getItem(TOKEN_KEY) || "";
    let currentUser = null;
    let socket = null;
    let registering = false;
    let users = [];
    let selectedUser = null;
    let cursor = null;
    let hasMore = false;
    let loadingHistory = false;
    let historyGeneration = 0;
    const renderedIds = new Set();
    const deliveredIds = new Set();
    const seenNotificationIds = new Set();
    const attachmentObjectUrls = new Set();
    let messageBeingForwarded = null;
    let filePreviewUrl = null;

    function setAuthMessage(message, isError = true) {
        elements.authNotice.textContent = message;
        elements.authNotice.style.color = isError ? "#a4262c" : "#237a32";
    }

    function setChatStatus(message) {
        elements.chatStatus.textContent = message;
    }

    function formatFileSize(size) {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    async function apiRequest(url, options = {}) {
        const headers = new Headers(options.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        if (options.body && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }
        const response = await fetch(url, { ...options, headers });
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.blob();
        if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
        return data;
    }

    function showAuth(message = "", isError = true) {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        token = "";
        currentUser = null;
        localStorage.removeItem(TOKEN_KEY);
        elements.chatApp.classList.add("hidden");
        elements.authPage.classList.remove("hidden");
        elements.passwordInput.value = "";
        if (message) setAuthMessage(message, isError);
    }

    function setRegistrationMode(enabled) {
        registering = enabled;
        elements.nameField.classList.toggle("hidden", !enabled);
        elements.nameInput.required = enabled;
        elements.passwordInput.autocomplete = enabled ? "new-password" : "current-password";
        elements.authTitle.textContent = enabled ? "Create your account" : "Welcome back";
        elements.authSubtitle.textContent = enabled
            ? "Register with your name, email, and a password."
            : "Sign in to continue to your conversations.";
        elements.authSubmit.textContent = enabled ? "Create account" : "Sign in";
        elements.togglePrompt.textContent = enabled ? "Already have an account?" : "New to Connect?";
        elements.toggleAuth.textContent = enabled ? "Sign in" : "Create an account";
        setAuthMessage("");
    }

    function nameParts(name) {
        return String(name || "?").trim().replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .split(/\s+/).filter(Boolean);
    }

    function initials(name) {
        return nameParts(name).slice(0, 2)
            .map(part => part.charAt(0).toUpperCase()).join("") || "?";
    }

    function matchesUserSearch(name, search) {
        if (!search) return true;
        const parts = nameParts(name);
        const normalizedName = parts.join(" ").toLowerCase();
        const searchInitials = parts
        .map(part => part.charAt(0))
        .join("")
        .toLowerCase();
        const matchesName = search.includes(" ")
            ? normalizedName.includes(search)
            : parts.some(part => part.toLowerCase().startsWith(search))
                || normalizedName.replace(/\s/g, "").startsWith(search);
        return matchesName || searchInitials === search;
    }

    function renderFormattedText(element, value) {
        const tokens = /(\*\*[^*\n]+\*\*|_[^_\n]+_|`[^`\n]+`)/g;
        const lines = String(value).split("\n");
        lines.forEach((line, lineIndex) => {
            if (lineIndex) element.appendChild(document.createElement("br"));
            let position = 0;
            for (const match of line.matchAll(tokens)) {
                const token = match[0];
                const offset = match.index;
                if (offset > position) {
                    element.appendChild(document.createTextNode(line.slice(position, offset)));
                }
                const tag = token.startsWith("**") ? "strong"
                    : token.startsWith("_") ? "em"
                        : "code";
                const formatted = document.createElement(tag);
                formatted.textContent = token.startsWith("**")
                    ? token.slice(2, -2)
                    : token.slice(1, -1);
                element.appendChild(formatted);
                position = offset + token.length;
            }
            if (position < line.length) {
                element.appendChild(document.createTextNode(line.slice(position)));
            }
        });
    }

    async function attachPreview(attachment, preview) {
        try {
            const blob = await apiRequest(attachment.url);
            if (!preview.isConnected) return;
            const objectUrl = URL.createObjectURL(blob);
            attachmentObjectUrls.add(objectUrl);
            preview.src = objectUrl;
        } catch (error) {
            preview.alt = "Preview unavailable. Use Download to access this attachment.";
            setChatStatus(error.message);
        }
    }

    function renderAttachment(container, attachment) {
        const card = document.createElement("div");
        card.className = "attachment-card";
        const details = document.createElement("div");
        details.className = "attachment-details";
        const icon = document.createElement("span");
        icon.className = "attachment-file-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = attachment.mimeType.startsWith("video/")
            ? "Video"
            : attachment.mimeType.startsWith("image/") ? "Image" : "File";
        const info = document.createElement("div");
        info.className = "attachment-file-info";
        const filename = document.createElement("span");
        filename.className = "attachment-filename";
        filename.textContent = attachment.filename;
        const size = document.createElement("div");
        size.className = "attachment-size";
        size.textContent = formatFileSize(attachment.size);
        info.append(filename, size);
        const download = document.createElement("button");
        download.type = "button";
        download.className = "attachment-download";
        download.textContent = "Download";
        download.addEventListener("click", async () => {
            download.disabled = true;
            try {
                const blob = await apiRequest(attachment.url);
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = objectUrl;
                link.download = attachment.filename;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            } catch (error) {
                setChatStatus(error.message);
            } finally {
                download.disabled = false;
            }
        });
        details.append(icon, info, download);
        card.appendChild(details);
        if (attachment.mimeType.startsWith("image/")) {
            const preview = document.createElement("img");
            preview.className = "attachment-preview";
            preview.alt = `Image preview: ${attachment.filename}`;
            preview.loading = "lazy";
            card.appendChild(preview);
            attachPreview(attachment, preview);
        } else if (attachment.mimeType.startsWith("video/")) {
            const preview = document.createElement("video");
            preview.className = "attachment-preview";
            preview.controls = true;
            preview.preload = "metadata";
            preview.setAttribute("aria-label", `Video: ${attachment.filename}`);
            card.appendChild(preview);
            attachPreview(attachment, preview);
        }
        container.appendChild(card);
    }

    function releaseAttachmentPreviews() {
        for (const objectUrl of attachmentObjectUrls) URL.revokeObjectURL(objectUrl);
        attachmentObjectUrls.clear();
    }

    async function editMessage(message) {
        const updatedText = window.prompt("Edit your message:", message.message);
        if (updatedText === null) return;
        try {
            const result = await apiRequest(`/api/messages/${encodeURIComponent(message.id)}`, {
                method: "PATCH",
                body: JSON.stringify({ message: updatedText })
            });
            updateMessageInConversation(result.message);
            setChatStatus("Message updated.");
        } catch (error) {
            setChatStatus(error.message);
        }
    }

    async function deleteMessage(message) {
        if (!window.confirm(message.attachment
            ? `Delete "${message.attachment.filename}" and its stored file?`
            : "Delete this message for everyone?")) return;
        try {
            const result = await apiRequest(`/api/messages/${encodeURIComponent(message.id)}`, {
                method: "DELETE"
            });
            updateMessageInConversation(result.message);
            setChatStatus(message.attachment ? "File and message deleted." : "Message deleted.");
        } catch (error) {
            setChatStatus(error.message);
        }
    }

    async function copyMessage(message) {
        try {
            await navigator.clipboard.writeText(message.message);
            setChatStatus("Message copied to clipboard.");
        } catch (error) {
            setChatStatus("Could not copy the message. Check clipboard permissions.");
        }
    }

    function openForwardDialog(message) {
        const recipients = users.filter(user => user.id !== currentUser.id);
        elements.forwardRecipient.replaceChildren();
        recipients.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent = user.name;
            elements.forwardRecipient.appendChild(option);
        });
        if (!recipients.length) {
            setChatStatus("There are no other users to forward this message to.");
            return;
        }
        messageBeingForwarded = message;
        elements.forwardDialog.showModal();
    }

    function renderMessageActions(message) {
        if (message.deleted) return null;
        const actions = document.createElement("details");
        actions.className = "message-actions";
        const summary = document.createElement("summary");
        summary.textContent = "•••";
        summary.setAttribute("aria-label", "Message options");
        const menu = document.createElement("div");
        menu.className = "message-action-list";
        menu.setAttribute("role", "group");
        menu.setAttribute("aria-label", "Message actions");
        const addAction = (label, action) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.addEventListener("click", () => {
                actions.open = false;
                action();
            });
            menu.appendChild(button);
        };
        if (message.from === currentUser.id && !message.attachment) {
            addAction("Edit message", () => editMessage(message));
        }
        if (message.from === currentUser.id) {
            addAction("Delete message", () => deleteMessage(message));
        }
        addAction("Forward", () => openForwardDialog(message));
        if (message.message) addAction("Copy text", () => copyMessage(message));
        actions.append(summary, menu);
        return actions;
    }

    function updateMessageInConversation(message) {
        if (
            !selectedUser ||
            ![message.from, message.to].includes(selectedUser.id)
        ) return;
        const previous = elements.messages.querySelector(
            `[data-message-id="${CSS.escape(message.id)}"]`
        );
        if (!previous) return;
        const next = previous.nextSibling;
        previous.remove();
        renderedIds.delete(String(message.id));
        renderMessage(message);
        const updated = elements.messages.querySelector(
            `[data-message-id="${CSS.escape(message.id)}"]`
        );
        if (updated && next?.parentNode === elements.messages) {
            elements.messages.insertBefore(updated, next);
        }
    }

    async function openFilePreview(file) {
        try {
            const blob = await apiRequest(file.url);
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            filePreviewUrl = URL.createObjectURL(blob);
            elements.filePreviewTitle.textContent = file.filename;
            elements.filePreviewContent.replaceChildren();
            let preview;
            if (file.mimeType.startsWith("image/")) {
                preview = document.createElement("img");
                preview.alt = file.filename;
            } else if (file.mimeType.startsWith("video/")) {
                preview = document.createElement("video");
                preview.controls = true;
            } else {
                preview = document.createElement("iframe");
                preview.title = file.filename;
            }
            preview.src = filePreviewUrl;
            elements.filePreviewContent.appendChild(preview);
            elements.filePreviewDialog.showModal();
        } catch (error) {
            elements.filesStatus.textContent = error.message;
        }
    }

    async function downloadSharedFile(file) {
        const blob = await apiRequest(file.url);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    async function loadSharedFiles() {
        elements.fileList.replaceChildren();
        elements.filesStatus.textContent = "Loading shared files…";
        elements.filesRefresh.disabled = true;
        try {
            const result = await apiRequest("/api/files");
            if (!result.files.length) {
                elements.filesStatus.textContent = "No shared files yet.";
                return;
            }
            elements.filesStatus.textContent = `${result.files.length} file(s), most recent first.`;
            result.files.forEach(file => {
                const item = document.createElement("li");
                item.className = "managed-file";
                const name = document.createElement("div");
                name.className = "managed-file-name";
                name.textContent = file.filename;
                const actions = document.createElement("div");
                actions.className = "managed-file-actions";
                if (/^(image\/|video\/|application\/pdf$)/.test(file.mimeType)) {
                    const preview = document.createElement("button");
                    preview.type = "button";
                    preview.textContent = "Preview";
                    preview.addEventListener("click", () => openFilePreview(file));
                    actions.appendChild(preview);
                }
                const download = document.createElement("button");
                download.type = "button";
                download.textContent = "Download";
                download.addEventListener("click", async () => {
                    download.disabled = true;
                    try {
                        await downloadSharedFile(file);
                    } catch (error) {
                        elements.filesStatus.textContent = error.message;
                    } finally {
                        download.disabled = false;
                    }
                });
                actions.appendChild(download);
                if (file.canDelete) {
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.textContent = "Delete";
                    remove.addEventListener("click", async () => {
                        if (!window.confirm(`Delete "${file.filename}" and its stored file?`)) return;
                        remove.disabled = true;
                        try {
                            await apiRequest(`/api/messages/${encodeURIComponent(file.id)}`, {
                                method: "DELETE"
                            });
                            item.remove();
                            elements.filesStatus.textContent = "File deleted.";
                            if (!elements.fileList.children.length) {
                                elements.filesStatus.textContent = "No shared files yet.";
                            }
                        } catch (error) {
                            elements.filesStatus.textContent = error.message;
                            remove.disabled = false;
                        }
                    });
                    actions.appendChild(remove);
                }
                const meta = document.createElement("div");
                meta.className = "managed-file-meta";
                meta.textContent = `${file.mimeType} · ${formatFileSize(file.size)} · ${new Date(file.timestamp).toLocaleString()} · Uploaded by ${file.owner.name} · Shared with ${file.sharedWith.name}`;
                item.append(name, actions, meta);
                elements.fileList.appendChild(item);
            });
        } catch (error) {
            elements.filesStatus.textContent = error.message;
        } finally {
            elements.filesRefresh.disabled = false;
        }
    }

    function renderUsers() {
        const search = elements.userSearch.value.trim().toLowerCase();
        const matching = users.filter(user => matchesUserSearch(user.name, search));
        elements.userList.replaceChildren();
        if (!matching.length) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.dataset.emptyConversation = "true";
            empty.textContent = search ? "No matching people." : "No other users yet.";
            elements.userList.appendChild(empty);
            return;
        }
        for (const user of matching) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `user-item${selectedUser?.id === user.id ? " active" : ""}`;
            button.setAttribute("aria-label", `${user.name}, ${user.online ? "online" : "offline"}`);
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = initials(user.name);
            const label = document.createElement("span");
            label.className = "user-label";
            label.textContent = user.name;
            const unreadBadge = document.createElement("span");
            unreadBadge.className = `user-unread${user.unreadCount ? "" : " hidden"}`;
            unreadBadge.textContent = user.unreadCount > 99 ? "99+" : String(user.unreadCount || "");
            unreadBadge.setAttribute("aria-label", `${user.unreadCount || 0} unread messages`);
            const dot = document.createElement("span");
            dot.className = `presence-dot${user.online ? " online" : ""}`;
            dot.setAttribute("aria-hidden", "true");
            button.append(avatar, label, unreadBadge, dot);
            button.addEventListener("click", () => selectUser(user));
            elements.userList.appendChild(button);
        }
    }

    async function refreshUsers() {
        try {
            const result = await apiRequest("/api/users");
            users = result.users;
            if (selectedUser) {
                selectedUser = users.find(user => user.id === selectedUser.id) || selectedUser;
            }
            renderUsers();
            updateConversationPresence();
        } catch (error) {
            setChatStatus(error.message);
        }
    }

    function updateConversationPresence() {
        if (!selectedUser) return;
        const online = users.find(user => user.id === selectedUser.id)?.online;
        elements.chatPresence.textContent = online ? "Online" : "Offline";
    }

    function showChat() {
        elements.authPage.classList.add("hidden");
        elements.chatApp.classList.remove("hidden");
        elements.profileAvatar.textContent = initials(currentUser.name);
        elements.profileName.textContent = currentUser.name;
        elements.profileEmail.textContent = currentUser.email;
        elements.adminTools.classList.toggle("hidden", currentUser.role !== "admin");
    }

    function ackDelivered(message) {
        if (message.to !== currentUser.id || message.status !== "sent" || !socket?.connected) return;
        socket.emit("messageDelivered", message.id);
    }

    function renderMessage(message, prepend = false) {
        if (message.id && renderedIds.has(String(message.id))) return false;
        if (message.id) renderedIds.add(String(message.id));
        const mine = message.from === currentUser.id;
        const sender = mine
            ? "You"
            : users.find(user => user.id === message.from)?.name || selectedUser?.name || "Team member";
        const row = document.createElement("article");
        row.className = `message-row${mine ? " mine" : ""}`;
        if (message.id) row.dataset.messageId = String(message.id);
        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        const author = document.createElement("div");
        author.className = "message-author";
        author.textContent = sender;
        const text = document.createElement("div");
        text.className = "message-text";
        if (message.deleted) {
            text.textContent = "This message was deleted.";
            text.classList.add("muted");
        } else if (message.message) renderFormattedText(text, message.message);
        const meta = document.createElement("div");
        meta.className = "message-meta";
        const time = new Date(message.timestamp);
        const isDelivered = message.status === "delivered" || deliveredIds.has(String(message.id));
        const senderStatus = message.status === "read"
            ? "Read"
            : isDelivered ? "Delivered" : "Sent";
        const editLabel = message.edited ? " · Edited" : "";
        meta.textContent = `${Number.isNaN(time.getTime()) ? "" : time.toLocaleString()}${editLabel}${mine ? ` · ${senderStatus}` : ""}`;
        bubble.append(author);
        if (message.forwarded) {
            const forwarded = document.createElement("div");
            forwarded.className = "forwarded-label";
            forwarded.textContent = "Forwarded";
            bubble.appendChild(forwarded);
        }
        if (message.message || message.deleted) bubble.append(text);
        if (message.attachment && !message.deleted) renderAttachment(bubble, message.attachment);
        bubble.append(meta);
        const actions = renderMessageActions(message);
        if (actions) bubble.appendChild(actions);
        row.appendChild(bubble);
        if (prepend) elements.messages.prepend(row);
        else {
            elements.messages.querySelector("[data-empty-conversation]")?.remove();
            elements.messages.appendChild(row);
        }
        return true;
    }

    function acknowledgeIncoming(messages) {
        messages.forEach(ackDelivered);
    }

    function updateUnreadCount(senderId, count) {
        const user = users.find(item => item.id === senderId);
        if (!user) return;
        user.unreadCount = Math.max(0, Number(count) || 0);
        renderUsers();
    }

    function openConversation(senderId) {
        const user = users.find(item => item.id === senderId);
        if (user) selectUser(user);
    }

    function showMessageToast(notification) {
        if (
            !notification?.id ||
            seenNotificationIds.has(String(notification.id)) ||
            notification.from === currentUser.id
        ) return;
        seenNotificationIds.add(String(notification.id));
        if (seenNotificationIds.size > 500) {
            const oldestId = seenNotificationIds.values().next().value;
            seenNotificationIds.delete(oldestId);
        }
        const toast = document.createElement("button");
        toast.type = "button";
        toast.className = "notification-toast";
        const title = document.createElement("strong");
        title.textContent = `New message from ${notification.senderName || "a teammate"}`;
        const preview = document.createElement("span");
        preview.textContent = notification.preview || "You received a message.";
        toast.append(title, preview);
        toast.addEventListener("click", () => {
            openConversation(notification.from);
            toast.remove();
        });
        elements.notificationToasts.appendChild(toast);
        window.setTimeout(() => toast.remove(), 8000);

        if (
            typeof Notification === "function" &&
            Notification.permission === "granted" &&
            (document.visibilityState !== "visible" || !document.hasFocus())
        ) {
            const browserNotification = new Notification(title.textContent, {
                body: preview.textContent,
                tag: `chat-message-${notification.id}`
            });
            browserNotification.onclick = () => {
                window.focus();
                openConversation(notification.from);
                browserNotification.close();
            };
        }
    }

    async function requestBrowserNotifications() {
        if (typeof Notification !== "function") {
            setChatStatus("Browser notifications are not supported here.");
            return;
        }
        if (Notification.permission === "granted") {
            setChatStatus("Browser notifications are already enabled.");
            return;
        }
        if (Notification.permission === "denied") {
            setChatStatus("Browser notifications are blocked. Allow them in your browser site settings.");
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setChatStatus(permission === "granted"
                ? "Browser notifications enabled."
                : "Browser notification permission was not granted.");
        } catch (error) {
            setChatStatus("Could not request browser notification permission.");
        }
    }

    async function markConversationRead(senderId) {
        if (!socket?.connected || !senderId || document.visibilityState !== "visible") return;
        try {
            const result = await socketRequest("markConversationRead", { from: senderId });
            updateUnreadCount(senderId, result.unreadCount);
        } catch (error) {
            setChatStatus(error.message);
        }
    }

    function socketRequest(eventName, payload) {
        return new Promise((resolve, reject) => {
            if (!socket?.connected) return reject(new Error("Reconnecting to chat. Please try again."));
            socket.timeout(10000).emit(eventName, payload, (timeoutError, result) => {
                if (timeoutError) return reject(new Error("The chat server did not respond."));
                if (!result?.ok) return reject(new Error(result?.error || "The request failed."));
                resolve(result);
            });
        });
    }

    async function loadHistory(loadOlder = false) {
        if (!selectedUser || !socket?.connected || loadingHistory) return;
        if (loadOlder && (!hasMore || !cursor)) return;
        const generation = historyGeneration;
        const currentId = selectedUser.id;
        const previousHeight = elements.messages.scrollHeight;
        loadingHistory = true;
        try {
            const request = { to: currentId };
            if (loadOlder) request.before = cursor;
            const result = await socketRequest("fetchMessages", request);
            if (generation !== historyGeneration || selectedUser?.id !== currentId) return;
            const batch = result.messages || [];
            const ordered = loadOlder ? batch.slice().reverse() : batch;
            ordered.forEach(message => renderMessage(message, loadOlder));
            acknowledgeIncoming(batch);
            if (!loadOlder) await markConversationRead(currentId);
            cursor = result.nextCursor;
            hasMore = Boolean(result.hasMore);
            if (!batch.length && !loadOlder) {
                const empty = document.createElement("p");
                empty.className = "muted";
                empty.textContent = `No messages with ${selectedUser.name} yet. Say hello!`;
                elements.messages.appendChild(empty);
            }
            if (loadOlder) {
                elements.messages.scrollTop = elements.messages.scrollHeight - previousHeight;
            } else {
                elements.messages.scrollTop = elements.messages.scrollHeight;
            }
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            if (generation === historyGeneration) loadingHistory = false;
        }
    }

    function selectUser(user) {
        selectedUser = user;
        historyGeneration += 1;
        cursor = null;
        hasMore = false;
        loadingHistory = false;
        renderedIds.clear();
        deliveredIds.clear();
        releaseAttachmentPreviews();
        elements.messages.replaceChildren();
        elements.attachmentInput.value = "";
        elements.chatTitle.textContent = user.name;
        elements.chatHeader.querySelector(".empty-icon").classList.add("hidden");
        elements.chatHeader.querySelector(".avatar").textContent = initials(user.name);
        elements.chatHeader.querySelector(".avatar").style.display = "grid";
        elements.emptyState.classList.add("hidden");
        elements.messages.classList.remove("hidden");
        elements.composer.classList.remove("hidden");
        elements.messageInput.disabled = !socket?.connected;
        elements.sendButton.disabled = !socket?.connected;
        elements.attachmentInput.disabled = !socket?.connected;
        elements.attachmentButton.setAttribute("aria-disabled", String(!socket?.connected));
        updateConversationPresence();
        renderUsers();
        elements.messageInput.focus();
        loadHistory();
    }

    function connectSocket() {
        if (socket) socket.disconnect();
        socket = io({ autoConnect: false, auth: { token } });
        socket.on("connect", () => {
            setChatStatus("");
            refreshUsers();
            elements.messageInput.disabled = !selectedUser;
            elements.sendButton.disabled = !selectedUser;
            elements.attachmentInput.disabled = !selectedUser;
            elements.attachmentButton.setAttribute("aria-disabled", String(!selectedUser));
            if (selectedUser) {
                historyGeneration += 1;
                cursor = null;
                hasMore = false;
                loadingHistory = false;
                renderedIds.clear();
                deliveredIds.clear();
                releaseAttachmentPreviews();
                elements.messages.replaceChildren();
                loadHistory();
            }
        });
        socket.on("connect_error", error => {
            if (/invalid|expired|authentication/i.test(error.message)) {
                showAuth("Your session expired or is no longer valid. Please sign in again.");
            } else {
                setChatStatus("Chat connection unavailable. Reconnecting…");
            }
        });
        socket.on("authError", data => showAuth(data?.error || "Please sign in again."));
        socket.on("disconnect", () => {
            elements.messageInput.disabled = true;
            elements.sendButton.disabled = true;
            elements.attachmentInput.disabled = true;
            elements.attachmentButton.setAttribute("aria-disabled", "true");
            if (currentUser) setChatStatus("Disconnected. Reconnecting…");
        });
        socket.on("privateMessage", message => {
            if (message.to !== currentUser.id) return;
            if (selectedUser?.id === message.from) {
                const atBottom = elements.messages.scrollHeight - elements.messages.scrollTop
                    <= elements.messages.clientHeight + 80;
                renderMessage(message);
                if (atBottom) elements.messages.scrollTop = elements.messages.scrollHeight;
                if (document.visibilityState === "visible") {
                    markConversationRead(message.from);
                }
            }
            ackDelivered(message);
        });
        socket.on("messageStatus", data => {
            if (!["delivered", "read"].includes(data?.status)) return;
            if (data.status === "delivered") deliveredIds.add(String(data.id));
            const row = elements.messages.querySelector(`[data-message-id="${CSS.escape(data.id)}"]`);
            const meta = row?.querySelector(".message-meta");
            if (meta) {
                const status = data.status === "read" ? "Read" : "Delivered";
                const timestamp = new Date(data.status === "read" ? data.readAt : data.deliveredAt);
                meta.textContent = `${Number.isNaN(timestamp.getTime()) ? "" : timestamp.toLocaleString()} · ${status}`;
            }
        });
        socket.on("messageUpdated", message => updateMessageInConversation(message));
        socket.on("messageDeleted", message => updateMessageInConversation(message));
        socket.on("messageNotification", notification => {
            if (notification.from === currentUser.id) return;
            updateUnreadCount(notification.from, notification.unreadCount);
            showMessageToast(notification);
        });
        socket.on("unreadCount", data => {
            if (data?.from) updateUnreadCount(data.from, data.count);
        });
        socket.on("presenceSnapshot", refreshUsers);
        socket.on("userPresence", refreshUsers);
        socket.connect();
    }

    async function enterChat(accessToken, user) {
        token = accessToken;
        currentUser = user;
        localStorage.setItem(TOKEN_KEY, token);
        showChat();
        await refreshUsers();
        connectSocket();
    }

    elements.toggleAuth.addEventListener("click", () => setRegistrationMode(!registering));
    elements.authForm.addEventListener("submit", async event => {
        event.preventDefault();
        const body = {
            email: elements.emailInput.value,
            password: elements.passwordInput.value
        };
        if (registering) body.name = elements.nameInput.value;
        elements.authSubmit.disabled = true;
        setAuthMessage("");
        try {
            const result = await apiRequest(registering ? "/api/auth/register" : "/api/auth/login", {
                method: "POST",
                body: JSON.stringify(body)
            });
            await enterChat(result.token, result.user);
        } catch (error) {
            setAuthMessage(error.message);
        } finally {
            elements.authSubmit.disabled = false;
        }
    });

    elements.logoutButton.addEventListener("click", async () => {
        try {
            await apiRequest("/api/auth/logout", { method: "POST" });
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            setRegistrationMode(false);
            showAuth("You have been signed out.", false);
        }
    });

    elements.userSearch.addEventListener("input", renderUsers);
    elements.notificationPermissionButton.addEventListener("click", requestBrowserNotifications);
    elements.filesButton.addEventListener("click", async () => {
        elements.filesDialog.showModal();
        await loadSharedFiles();
    });
    elements.filesClose.addEventListener("click", () => elements.filesDialog.close());
    elements.filesRefresh.addEventListener("click", loadSharedFiles);
    elements.forwardCancel.addEventListener("click", () => elements.forwardDialog.close());
    elements.forwardClose.addEventListener("click", () => elements.forwardDialog.close());
    elements.forwardForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!messageBeingForwarded) return;
        elements.forwardSubmit.disabled = true;
        try {
            const result = await apiRequest(
                `/api/messages/${encodeURIComponent(messageBeingForwarded.id)}/forward`,
                {
                    method: "POST",
                    body: JSON.stringify({ recipientId: elements.forwardRecipient.value })
                }
            );
            if (selectedUser?.id === result.message.to) renderMessage(result.message);
            elements.forwardDialog.close();
            setChatStatus("Message forwarded.");
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            messageBeingForwarded = null;
            elements.forwardSubmit.disabled = false;
        }
    });
    elements.filePreviewClose.addEventListener("click", () => elements.filePreviewDialog.close());
    elements.filePreviewDialog.addEventListener("close", () => {
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        filePreviewUrl = null;
        elements.filePreviewContent.replaceChildren();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && selectedUser) {
            markConversationRead(selectedUser.id);
        }
    });
    elements.composer.addEventListener("submit", async event => {
        event.preventDefault();
        const message = elements.messageInput.value.trim();
        if (!message || !selectedUser || !socket?.connected) return;
        elements.sendButton.disabled = true;
        try {
            const result = await socketRequest("privateMessage", {
                to: [selectedUser.id],
                message,
                clientMessageId: crypto.randomUUID()
            });
            result.messages.forEach(item => renderMessage(item));
            elements.messages.scrollTop = elements.messages.scrollHeight;
            elements.messageInput.value = "";
            setChatStatus("");
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            elements.sendButton.disabled = !selectedUser || !socket?.connected;
        }
    });

    let uploadingAttachment = false;
    async function uploadAttachment(file) {
        if (!file || uploadingAttachment) return;
        if (!selectedUser || !socket?.connected) {
            setChatStatus("Connect to a conversation before attaching a file.");
            elements.attachmentInput.value = "";
            return;
        }
        if (file.size > 25 * 1024 * 1024) {
            setChatStatus("Attachments must be 25 MB or smaller.");
            elements.attachmentInput.value = "";
            return;
        }
        const form = new FormData();
        form.append("recipientId", selectedUser.id);
        form.append("file", file);
        uploadingAttachment = true;
        elements.attachmentInput.disabled = true;
        elements.attachmentButton.setAttribute("aria-disabled", "true");
        setChatStatus(`Uploading ${file.name}…`);
        try {
            const result = await apiRequest("/api/attachments", {
                method: "POST",
                body: form
            });
            if (selectedUser?.id === result.message.to) {
                renderMessage(result.message);
                elements.messages.scrollTop = elements.messages.scrollHeight;
            }
            setChatStatus(`${file.name} shared with ${selectedUser?.name || "recipient"}.`);
            await refreshUsers();
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            uploadingAttachment = false;
            elements.attachmentInput.value = "";
            elements.attachmentInput.disabled = !socket?.connected || !selectedUser;
            elements.attachmentButton.setAttribute(
                "aria-disabled",
                String(!socket?.connected || !selectedUser)
            );
        }
    }

    elements.attachmentInput.addEventListener("change", () => {
        uploadAttachment(elements.attachmentInput.files[0]);
    });
    elements.messages.addEventListener("dragover", event => {
        if (!selectedUser || !event.dataTransfer?.types.includes("Files")) return;
        event.preventDefault();
        elements.messages.classList.add("drop-target");
    });
    elements.messages.addEventListener("dragleave", event => {
        if (!elements.messages.contains(event.relatedTarget)) {
            elements.messages.classList.remove("drop-target");
        }
    });
    elements.messages.addEventListener("drop", event => {
        if (!selectedUser || !event.dataTransfer?.files.length) return;
        event.preventDefault();
        elements.messages.classList.remove("drop-target");
        uploadAttachment(event.dataTransfer.files[0]);
    });

    elements.messageInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            elements.composer.requestSubmit();
        }
    });

    elements.messages.addEventListener("scroll", () => {
        if (elements.messages.scrollTop < 50) loadHistory(true);
    });

    elements.importButton.addEventListener("click", async () => {
        const file = elements.importFile.files[0];
        if (!file) return setChatStatus("Choose an .xlsx file to import.");
        const form = new FormData();
        form.append("file", file);
        elements.importButton.disabled = true;
        try {
            const result = await apiRequest("/api/admin/users/import", {
                method: "POST",
                body: form
            });
            const errorDetails = result.errors.slice(0, 3)
                .map(item => `Row ${item.row}: ${item.error}`)
                .join(" ");
            const remainingErrors = result.errors.length > 3
                ? ` And ${result.errors.length - 3} more error(s).`
                : "";
            setChatStatus(
                `Import complete: ${result.successfulRows} imported, ${result.skippedRows} skipped.` +
                (errorDetails ? ` ${errorDetails}${remainingErrors}` : "")
            );
            await refreshUsers();
            elements.importFile.value = "";
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            elements.importButton.disabled = false;
        }
    });

    async function downloadExcel(url, filename, successMessage) {
        const file = await apiRequest(url);
        const objectUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        setChatStatus(successMessage);
    }

    elements.templateButton.addEventListener("click", async () => {
        elements.templateButton.disabled = true;
        try {
            await downloadExcel(
                "/api/admin/users/import-template",
                "user-import-template.xlsx",
                "Import template downloaded. Fill in a password for every new user before importing."
            );
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            elements.templateButton.disabled = false;
        }
    });

    elements.exportButton.addEventListener("click", async () => {
        elements.exportButton.disabled = true;
        try {
            await downloadExcel(
                "/api/admin/users/export",
                "registered-users.xlsx",
                "User export downloaded. Passwords are not included."
            );
        } catch (error) {
            setChatStatus(error.message);
        } finally {
            elements.exportButton.disabled = false;
        }
    });

    async function restoreSession() {
        if (!token) return;
        try {
            const result = await apiRequest("/api/auth/me");
            currentUser = result.user;
            showChat();
            await refreshUsers();
            connectSocket();
        } catch (error) {
            showAuth("Your saved session is no longer valid. Please sign in.");
        }
    }

    setRegistrationMode(false);
    restoreSession();
})();
