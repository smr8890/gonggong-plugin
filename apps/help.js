import { Plugin_Path } from "../components/index.js";
import puppeteer from '../../../lib/puppeteer/puppeteer.js'

export class Help extends plugin {
    constructor() {
        super({
            name: "拱拱插件帮助",
            event: "message",
            priority: 1000,
            rule: [
                {
                    reg: /^#?(gg|拱拱)(插件)?帮助$/i,
                    fnc: "help",
                }
            ]
        });
    }

    async help(e) {
        // let msg = '';
        // msg += `欢迎使用xtu-gong插件，以下是插件的使用说明：\n\n`;

        // msg += `账号相关:\n`;
        // msg += `1. 使用 "#设置账号 账号 密码" 来设置账号\n`;
        // msg += `2. 使用 "#设置token <你的token>" 来设置token。\n`;
        // msg += `3. 使用 "#刷新token" 来刷新token。\n`;
        // msg += `4. 使用 "#删除账号" 来删除账号。\n\n`;

        // msg += `查询相关：\n`;
        // msg += `1. 使用 "#课表查询" 来查询课表。\n`;
        // msg += `2. 使用 "#考试查询" 来查询考试。\n`;
        // msg += `3. 使用 "#成绩查询" 来查询成绩。\n`;
        // msg += `4. 使用 "#我是谁" 来查询自己的个人信息。\n\n`;

        // msg += `提醒相关：\n`;
        // msg += `1. 使用 "#开启/关闭考试提醒" 来开启或关闭考试提醒。`;
        // return this.reply(msg);
        const base64 = await puppeteer.screenshot('xtu-gong-plugin', {
            saveId: 'help',
            imgType: 'png',
            tplFile: `${Plugin_Path}/resources/help/help.html`,
        })
        return this.reply(base64);
    }
}