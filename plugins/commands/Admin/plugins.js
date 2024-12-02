import { Assets } from "../../../core/handlers/assets.js";
import { loadPlugins } from "../../../core/var/modules/loader.js";
import fs from "fs";
import path from "path";
import axios from "axios";

const config = {
    name: "plugins",
    aliases: ["pl", "plg", "plugin"],
    description: "Manage plugins",
    usage: "[reload]/[list]/[add]/[del]",
    permissions: [2], // Admin Bot Only
    credits: "XaviaTeam",
};

const langData = {
    en_US: {
        "result.reload": "Reloaded plugins, check console for more details",
        "result.list":
            "Commands: {commands}\nEvents: {events}\nOnMessage: {onMessage}\nCustoms: {customs}",
        "result.add.folder_created": "Folder '{folder}' has been created.",
        "result.add.file_added": "File '{file}' has been successfully added in '{folder}'.",
        "result.del.file_deleted": "File '{file}' has been successfully deleted from '{folder}'.",
        "error.add.fetch_content": "Failed to fetch content from the provided link.",
        "error.del.file_not_found": "File '{file}' does not exist in '{folder}'.",
        "error.del.folder_not_found": "Folder '{folder}' does not exist.",
        "invalid.query": "Invalid query!",
        "invalid.args": "Invalid arguments. Usage:\n{usage}",
        "error.unknown": "An error occurred, check console for more details",
    },
    vi_VN: {
        // Translate based on your requirements
    },
    ar_SY: {
        // Translate based on your requirements
    },
};

/** @type {TOnCallCommand} */
async function onCall({ message, args, getLang, xDB: xDatabase }) {
    try {
        const query = args[0]?.toLowerCase();
        const pluginsPath = path.join(__dirname, "../../../plugins/commands");

        if (query === "reload") {
            global.plugins.commands.clear();
            global.plugins.commandsAliases.clear();
            global.plugins.commandsConfig.clear();
            global.plugins.customs = 0;
            global.plugins.events.clear();
            global.plugins.onMessage.clear();

            for (const lang in global.data.langPlugin) {
                for (const plugin in global.data.langPlugin[lang]) {
                    if (plugin == config.name) continue;
                    delete global.data.langPlugin[lang][plugin];
                }
            }

            delete global.data.temps;
            global.data.temps = new Array();

            await loadPlugins(xDatabase, Assets.gI());
            return message.reply(getLang("result.reload"));
        } else if (query === "list") {
            return message.reply(
                getLang("result.list", {
                    commands: global.plugins.commands.size,
                    events: global.plugins.events.size,
                    onMessage: global.plugins.onMessage.size,
                    customs: global.plugins.customs,
                })
            );
        } else if (query === "add") {
            const [_, folder, file, ...contentParts] = args.join(" ").split("|").map(a => a.trim());
            if (!folder || !file || contentParts.length === 0) {
                return message.reply(getLang("invalid.args", { usage: config.usage }));
            }

            const folderPath = path.join(pluginsPath, folder);
            const filePath = path.join(folderPath, file);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                message.reply(getLang("result.add.folder_created", { folder }));
            }

            let content = contentParts.join(" ");
            if (content.startsWith("http")) {
                try {
                    const response = await axios.get(content);
                    content = response.data;
                } catch (error) {
                    return message.reply(getLang("error.add.fetch_content"));
                }
            }

            fs.writeFileSync(filePath, content);
            message.reply(getLang("result.add.file_added", { folder, file }));
        } else if (query === "del") {
            const [_, folder, file] = args.join(" ").split("|").map(a => a.trim());
            if (!folder || !file) {
                return message.reply(getLang("invalid.args", { usage: config.usage }));
            }

            const folderPath = path.join(pluginsPath, folder);
            const filePath = path.join(folderPath, file);

            if (!fs.existsSync(folderPath)) {
                return message.reply(getLang("error.del.folder_not_found", { folder }));
            }
            if (!fs.existsSync(filePath)) {
                return message.reply(getLang("error.del.file_not_found", { folder, file }));
            }

            fs.unlinkSync(filePath);
            message.reply(getLang("result.del.file_deleted", { folder, file }));
        } else {
            message.reply(getLang("invalid.query"));
        }
    } catch (e) {
        console.error(e);
        message.reply(getLang("error.unknown"));
    }
}

export default {
    config,
    langData,
    onCall,
};
