import fs from 'fs';
import { Config } from '../components/index.js';
import { getResponse } from './query.js';
import { getToken } from './query.js';
const tokenPath = './data/xtu-gong/userlist.json';
const api_address = Config.getcfg.api_address;
const exam_time = Config.getcfg.exam_time;
const examDir = './data/xtu-gong/exams';
const advance_days = Config.getcfg.advance_days;

export class ExamNotice extends plugin {
    constructor() {
        super({
            name: '考试通知',
            dsc: '获取考试通知',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^#?开启考试提醒$',
                    fnc: 'openExamNotice'
                },
                {
                    reg: '^#?关闭考试提醒$',
                    fnc: 'closeExamNotice'
                }
            ]
        });

        this.task = {
            cron: exam_time,
            name: '考试提醒',
            fnc: () => this.noticeTask()
        }
    }

    async openExamNotice(e) {
        const userId = e.user_id;

        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        let userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

        try {
            const result = await getResponse(token, 'exams');

            if (result.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }

            if (!result.data) {
                await e.reply('考试数据异常，请稍后重试。', true);
                return;
            }

            const exams = result.data.exams;

            if (exams.length === 0) {
                await e.reply('目前没有已知的考试安排。', true);
                return;
            }

            exams.forEach(exam => {
                exam.reminders = advance_days.map(num => ({ num, reminded: false }));
            });

            if (!fs.existsSync(examDir)) {
                fs.mkdirSync(examDir, { recursive: true });
            }

            fs.writeFileSync(`${examDir}/${userId}.json`, JSON.stringify(exams, null, 2), 'utf-8');

            userList[userId].examNotice = true;
            fs.writeFileSync(tokenPath, JSON.stringify(userList, null, 2), 'utf8');

            this.reply('考试提醒已开启，数据已更新。');
        } catch (error) {
            logger.error('Error fetching exam data:', error);
            this.reply('获取考试数据时出错，请稍后再试。');
        }
    }

    async closeExamNotice(e) {
        const userId = e.user_id;
        let userList = {};
        if (!fs.existsSync(tokenPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('你尚未开启考试提醒，无需关闭。');
        }
        if (!userList[userId].examNotice) {
            return this.reply('你尚未开启考试提醒，无需关闭。');
        }
        userList[userId].examNotice = false;
        fs.writeFileSync(tokenPath, JSON.stringify(userList, null, 2), 'utf8');
        this.reply('考试提醒已关闭。');
    }

    async noticeTask() {
        if (fs.existsSync(tokenPath)) {
            const userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
            for (const userId in userList) {
                if (userList[userId].examNotice) {
                    const examFilePath = `${examDir}/${userId}.json`;
                    if (fs.existsSync(examFilePath)) {
                        const exams = JSON.parse(fs.readFileSync(examFilePath, 'utf8'));
                        const now = new Date();
                        exams.forEach(exam => {
                            const examDate = new Date(exam.start_time);
                            const daysUntilExam = Math.ceil((examDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
                            exam.reminders.forEach(reminder => {
                                if (daysUntilExam === reminder.num && !reminder.reminded) {
                                    let msg = '您有即将到来的考试！\n';
                                    msg += `科目: ${exam.name}\n`;
                                    msg += `时间: ${new Date(exam.start_time).toLocaleString('zh-CN', { hour12: false })} ~ ${new Date(exam.end_time).toLocaleString('zh-CN', { hour12: false })}\n`;
                                    msg += `地点: ${exam.location}\n`;
                                    msg += `类型: ${exam.type}\n`;
                                    msg += `倒计时: ${reminder.num} 天\n`;
                                    reminder.reminded = true;
                                    Bot.pickUser(userId).sendMsg(msg.trim());
                                }
                            });
                            //考试当天默认提醒
                            if (daysUntilExam === 0) {
                                let msg = '您今天有考试！\n';
                                msg += `科目: ${exam.name}\n`;
                                msg += `时间: ${new Date(exam.start_time).toLocaleString('zh-CN', { hour12: false })} ~ ${new Date(exam.end_time).toLocaleString('zh-CN', { hour12: false })}\n`;
                                msg += `地点: ${exam.location}\n`;
                                msg += `类型: ${exam.type}\n`;
                                Bot.pickUser(userId).sendMsg(msg.trim());
                            }
                        });
                        fs.writeFileSync(examFilePath, JSON.stringify(exams, null, 2), 'utf-8');
                    }
                }
            }
        }
    }
}