"use strict";
function registerRoutes(dependencies){
 const {app,UserModel,MessageModel,onlineUsers,authenticateHttp}=dependencies;

    app.get("/api/users", authenticateHttp, async (req, res) => {
        try {
            const [users, unreadCounts] = await Promise.all([
                UserModel.find({ _id: { $ne: req.user.id } })
                    .select("name")
                    .sort({ name: 1, _id: 1 })
                    .lean()
                    .exec(),
                MessageModel.aggregate([
                    { $match: { to: req.user.id, status: { $ne: "read" }, deletedAt: null } },
                    { $group: { _id: "$from", count: { $sum: 1 } } }
                ]).exec()
            ]);
            const unreadBySender = new Map(
                unreadCounts.map(item => [item._id, item.count])
            );
            res.json({
                ok: true,
                users: users.map(user => ({
                    id: String(user._id),
                    name: user.name,
                    online: onlineUsers.has(String(user._id)),
                    unreadCount: unreadBySender.get(String(user._id)) || 0
                }))
            });
        } catch (error) {
            console.error("Could not load registered users.");
            res.status(500).json({ ok: false, error: "Could not load users." });
        }
    });

    app.get("/api/files", authenticateHttp, async (req, res) => {
        try {
            const messages = await MessageModel.find({
                attachment: { $exists: true },
                deletedAt: null,
                $or: [{ from: req.user.id }, { to: req.user.id }]
            })
                .select("from to timestamp attachment")
                .sort({ timestamp: -1, _id: -1 })
                .lean()
                .exec();
            const userIds = [...new Set(messages.flatMap(message => [message.from, message.to]))];
            const people = await UserModel.find({ _id: { $in: userIds } })
                .select("name")
                .lean()
                .exec();
            const names = new Map(people.map(person => [String(person._id), person.name]));
            return res.json({
                ok: true,
                files: messages.map(message => ({
                    id: String(message._id),
                    filename: message.attachment.originalFilename,
                    mimeType: message.attachment.mimeType,
                    size: message.attachment.fileSize,
                    timestamp: message.timestamp,
                    url: `/api/attachments/${String(message._id)}`,
                    owner: {
                        id: message.from,
                        name: names.get(message.from) || "Unknown user"
                    },
                    sharedWith: {
                        id: message.to,
                        name: names.get(message.to) || "Unknown user"
                    },
                    canDelete: message.from === req.user.id
                }))
            });
        } catch (error) {
            console.error("Could not load shared files.");
            return res.status(500).json({ ok: false, error: "Could not load shared files." });
        }
    });

}
module.exports=registerRoutes;
