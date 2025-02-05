import fs from 'fs';
import { Config } from '../components/index.js';
import { Utils } from '../components/index.js';
const api_address = Config.getcfg.api_address;
const tmpPath = './data/xtu-gong/tmp';

export class Ics extends plugin {
    constructor() {
        super({
            name: '获取日历ics',
            dsc: '获取日历ics',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^#?课表日历$',
                    fnc: 'getCoursesIcs'
                },
                {
                    reg: '^#?考试日历$',
                    fnc: 'getExamsIcs'
                }
            ]
        });

        this.task = {
            cron: '0 0 0 * * ?',
            name: '[xtu-gong]清理临时文件',
            fnc: () => this.clearTmp()
        }
    }

    async getCoursesIcs(e) {
        const userId = e.user_id;

        try {
            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath, { recursive: true });
            }

            const filePath = `${tmpPath}/${e.sender.nickname}的课表.ics`;
            const { code, buffer } = await Utils.getIcs(userId, 'icalendar/courses');
            if (code === -1) {
                return this.reply('token已失效，请重新设置或刷新token。', true);
            } else if (code === -2) {
                return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。', true);
            } else if (code === 0) {
                return this.reply('获取课表日程失败，请稍后重试。', true);
            }
            fs.writeFileSync(filePath, Buffer.from(buffer));

            if (e.isGroup) {
                e.group.fs.upload(filePath);
            } else {
                e.friend.sendFile(filePath);
            }
            return;
        } catch (error) {
            logger.error('获取课表日程失败', error);
            this.reply('获取课表日程失败');
        }
    }

    async getExamsIcs(e) {
        const userId = e.user_id;

        try {
            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath, { recursive: true });
            }

            const filePath = `${tmpPath}/${e.sender.nickname}的考试.ics`;
            const { code, buffer } = await Utils.getIcs(userId, 'icalendar/exams');
            if (code === -1) {
                return this.reply('token已失效，请重新设置或刷新token。', true);
            } else if (code === -2) {
                return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。', true);
            } else if (code === 0) {
                return this.reply('获取考试日程失败，请稍后重试。', true);
            }
            fs.writeFileSync(filePath, Buffer.from(buffer));

            if (e.isGroup) {
                e.group.fs.upload(filePath);
            } else {
                e.friend.sendFile(filePath);
            }
            return;
        } catch (error) {
            logger.error('获取考试日程失败', error);
            this.reply('获取考试日程失败');
        }
    }

    async clearTmp() {
        if (fs.existsSync(tmpPath)) {
            const files = fs.readdirSync(tmpPath);
            for (const file of files) {
                fs.unlinkSync(`${tmpPath}/${file}`);
            }
        }
    }
}

// async function getIcs(token, type) {
//     const url = `${api_address}/${type}`;
//     for (let i = 0; i < 8; i++) {
//         const response = await fetch(url, {
//             headers: {
//                 'token': token
//             }
//         });
//         const contentType = response.headers.get('content-type');
//         if (contentType.includes('application/json')) {
//             await new Promise(resolve => setTimeout(resolve, 1000));
//             continue;
//         } else {
//             const buffer = await response.arrayBuffer();
//             return buffer;
//         }
//     }
// }