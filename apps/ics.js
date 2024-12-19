import fs from 'fs';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import { Config } from '../components/index.js';
import { Plugin_Path } from '../components/index.js';
import { getResponse } from './query.js';
import { getToken } from './query.js';
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
                    reg: '^#?课表日程$',
                    fnc: 'getCoursesIcs'
                },
                {
                    reg: '^#?考试日程$',
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

        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath, { recursive: true });
            }

            const filePath = `${tmpPath}/${e.nickname}的课表.ics`;
            const buffer = await getIcs(token, 'courses.ics');
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

        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            if (!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath, { recursive: true });
            }

            const filePath = `${tmpPath}/${e.nickname}的考试.ics`;
            const buffer = await getIcs(token, 'exams.ics');
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

async function getIcs(token, type) {
    const url = `${api_address}/${type}?token=${token}`;
    for (let i = 0; i < 8; i++) {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        if (contentType.includes('application/json')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        } else {
            const buffer = await response.arrayBuffer();
            return buffer;
        }
    }
}