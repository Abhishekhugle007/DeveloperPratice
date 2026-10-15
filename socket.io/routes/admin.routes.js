"use strict";
function registerRoutes(dependencies){
 const {app,validateRegistration,normalizeEmail,UserModel,bcrypt,XLSX,upload,MAX_IMPORT_ROWS,BCRYPT_ROUNDS,authenticateHttp,requireAdmin}=dependencies;

    app.post("/api/admin/users/import", authenticateHttp, requireAdmin, (req, res, next) => {
        upload(req, res, error => {
            if (error) return next(error);
            next();
        });
    }, async (req, res) => {
        if (
            !req.file ||
            !/\.xlsx$/i.test(req.file.originalname) ||
            ![
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/octet-stream"
            ].includes(req.file.mimetype)
        ) {
            return res.status(400).json({ ok: false, error: "Upload one .xlsx file in the file field." });
        }
        const summary = { successfulRows: 0, skippedRows: 0, errors: [] };
        let rows;
        try {
            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!firstSheet) {
                return res.status(400).json({ ok: false, error: "The workbook contains no worksheet." });
            }
            rows = XLSX.utils.sheet_to_json(firstSheet, {
                header: 1,
                defval: "",
                raw: false
            });
        } catch (error) {
            console.error("Could not parse the user import workbook.");
            return res.status(400).json({ ok: false, error: "Could not read the .xlsx workbook." });
        }
        if (!rows.length) {
            return res.status(400).json({ ok: false, error: "The worksheet is empty." });
        }
        if (rows.length - 1 > MAX_IMPORT_ROWS) {
            return res.status(400).json({
                ok: false,
                error: `The worksheet may contain at most ${MAX_IMPORT_ROWS} data rows.`
            });
        }
        const headers = rows[0].map(value => String(value).trim().toLowerCase());
        const columns = ["name", "email", "password"];
        const headerIndexes = Object.fromEntries(
            columns.map(column => [column, headers.indexOf(column)])
        );
        const missing = columns.filter(column => headerIndexes[column] < 0);
        if (missing.length || new Set(headers).size !== headers.length) {
            return res.status(400).json({
                ok: false,
                error: missing.length
                    ? missing.includes("password")
                        ? "This workbook is missing the password column. Exported user lists intentionally omit passwords and cannot be imported as-is. Download the import template and provide a valid password for each new user."
                        : `Missing required columns: ${missing.join(", ")}.`
                    : "Worksheet column names must be unique."
            });
        }

        const seenEmails = new Set();
        for (let index = 1; index < rows.length; index += 1) {
            const row = rows[index];
            if (row.every(value => String(value).trim() === "")) {
                summary.skippedRows += 1;
                continue;
            }
            const name = String(row[headerIndexes.name] ?? "").trim();
            const email = normalizeEmail(String(row[headerIndexes.email] ?? ""));
            const password = String(row[headerIndexes.password] ?? "");
            const rowNumber = index + 1;
            const validation = validateRegistration({ name, email, password });
            if (validation.error) {
                summary.skippedRows += 1;
                summary.errors.push({ row: rowNumber, error: validation.error });
                continue;
            }
            if (seenEmails.has(email)) {
                summary.skippedRows += 1;
                summary.errors.push({ row: rowNumber, error: "Duplicate email in this worksheet." });
                continue;
            }
            seenEmails.add(email);
            try {
                const exists = await UserModel.exists({ email });
                if (exists) {
                    summary.skippedRows += 1;
                    summary.errors.push({ row: rowNumber, error: "Email is already registered." });
                    continue;
                }
                const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
                await UserModel.create({ name, email, password: passwordHash });
                summary.successfulRows += 1;
            } catch (error) {
                if (error && error.code === 11000) {
                    summary.skippedRows += 1;
                    summary.errors.push({ row: rowNumber, error: "Email is already registered." });
                    continue;
                }
                console.error(`User import failed at worksheet row ${rowNumber}.`);
                return res.status(500).json({
                    ok: false,
                    error: "Could not complete the user import.",
                    ...summary
                });
            }
        }
        return res.json({ ok: true, ...summary });
    });

    app.get("/api/admin/users/import-template", authenticateHttp, requireAdmin, (req, res) => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([
            ["name", "email", "password"],
            ["", "", ""]
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet, "Users");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="user-import-template.xlsx"',
            "Cache-Control": "no-store"
        });
        res.send(buffer);
    });

    app.get("/api/admin/users/export", authenticateHttp, requireAdmin, async (req, res) => {
        try {
            const users = await UserModel.find({})
                .select("name email createdAt")
                .sort({ createdAt: 1, _id: 1 })
                .lean()
                .exec();
            const escapeSpreadsheetValue = value => {
                const text = String(value ?? "");
                return /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
            };
            const sheet = XLSX.utils.aoa_to_sheet([
                ["Name", "Email", "Registration date"],
                ...users.map(user => [
                    escapeSpreadsheetValue(user.name),
                    escapeSpreadsheetValue(user.email),
                    user.createdAt ? new Date(user.createdAt).toISOString() : ""
                ])
            ]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, sheet, "Users");
            const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
            res.set({
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="registered-users.xlsx"',
                "Cache-Control": "no-store"
            });
            res.send(buffer);
        } catch (error) {
            console.error("Could not export registered users.");
            res.status(500).json({ ok: false, error: "Could not export users." });
        }
    });

}
module.exports=registerRoutes;
