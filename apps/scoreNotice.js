import fs from 'fs';
import { Config } from '../components/index.js';
import { getResponse } from './query.js';
import { getToken } from './query.js';
const tokenPath = './data/xtu-gong/userlist.json';
const api_address = Config.getcfg.api_address;
const exam_time = Config.getcfg.exam_time;
const DataPath = './data/xtu-gong';

export class ScoreNotice extends plugin {
    constructor() {
        super({
            name: '成绩更新提醒',
            dsc: '获取成绩通知',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^#?开启成绩提醒$',
                    fnc: 'openScoreNotice'
                },
                {
                    reg: '^#?关闭成绩提醒$',
                    fnc: 'closeScoreNotice'
                }
            ]
        });

        this.task = {
            cron: exam_time,
            name: '成绩更新提醒',
            fnc: () => this.noticeTask()
        }
    }

    async openScoreNotice(e) {
        const userId = e.user_id;

        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        let userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        try {
            const result = await getResponse(token, 'scores');

            if (result.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }

            if (!result.data) {
                await e.reply('成绩数据异常，请稍后重试。', true);
                return;
            }
            const userScorePath = `${DataPath}/scores/${userId}.json`;
            fs.writeFileSync(userScorePath, JSON.stringify(result.data, null, 2), 'utf8');
            await e.reply('成绩提醒已开启，成绩数据已保存。', true);
            const existingScores = fs.existsSync(userScorePath) ? JSON.parse(fs.readFileSync(userScorePath, 'utf8')) : null;
            if (JSON.stringify(existingScores) !== JSON.stringify(result.data)) {
                // Perform the next step operation here
                await e.reply('成绩有更新，请注意查看。', true);
            } else {
                await e.reply('成绩未发生变化。', true);
            }

        } catch (error) {
            logger.error('Error fetching score data:', error);
            this.reply('获取成绩数据时出错，请稍后再试。');
        }
    }
}