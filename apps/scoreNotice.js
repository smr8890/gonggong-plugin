import fs from 'fs';
import { Config } from '../components/index.js';
import { Utils } from '../components/index.js';
import { Plugin_Path } from '../components/index.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import { userListPath } from '../components/index.js';
const exam_time = Config.getcfg.exam_time;
const DataPath = './data/xtu-gong';
const userScorePath = `${DataPath}/scores`;

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

        let userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        try {
            const result = await Utils.getResponse(userId, 'scores');

            if (result.code === -2) {
                await e.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。', true);
                return;
            }
            if (result.code === -1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }
            if (result.code === 0) {
                await e.reply('获取成绩数据时出错，请稍后再试。', true);
                return;
            }


            const scores = result.data.scores;
            if (!fs.existsSync(userScorePath)) {
                fs.mkdirSync(userScorePath, { recursive: true });
            }
            fs.writeFileSync(`${userScorePath}/${userId}.json`, JSON.stringify(scores, null, 2), 'utf8');

            userList[userId].scoreNotice = true;
            fs.writeFileSync(userListPath, JSON.stringify(userList, null, 2), 'utf8');
            await e.reply('成绩提醒已开启，成绩数据已更新。', true);

        } catch (error) {
            logger.error('Error fetching score data:', error);
            this.reply('获取成绩数据时出错，请稍后再试。');
        }
    }

    async closeScoreNotice(e) {
        const userId = e.user_id;

        let userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        if (!fs.existsSync(userListPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(userListPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('你尚未开启成绩提醒，无需关闭。');
        }
        if (!userList[userId].scoreNotice) {
            return this.reply('你尚未开启成绩提醒，无需关闭。');
        }
        userList[userId].scoreNotice = false;
        fs.writeFileSync(userListPath, JSON.stringify(userList, null, 2), 'utf8');
        this.reply('成绩提醒已关闭。');
    }

    async noticeTask() {
        if (fs.existsSync(userListPath)) {
            const userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
            for (const userId in userList) {
                if (userList[userId].scoreNotice) {
                    const scoreFilePath = `${userScorePath}/${userId}.json`;
                    if (fs.existsSync(scoreFilePath)) {
                        let result1 = await Utils.getResponse(userId, 'scores');
                        // if (result1.code === 0 || result1.code === -1) {
                        //     const updated = await updateToken(userId);
                        //     if (updated) {
                        //         token = await Utils.getToken(userId);
                        //         result1 = await Utils.getResponse(token, 'scores');
                        //     }
                        // }
                        if (result1.code !== 1 || !result1.data) {
                            continue;
                        }
                        let scores = result1.data.scores;
                        const scores2 = JSON.parse(fs.readFileSync(scoreFilePath, 'utf8'));
                        if (JSON.stringify(scores) !== JSON.stringify(scores2)) {
                            const result2 = await Utils.getResponse(userId, 'rank');
                            if (result2.code !== 1 || !result2.data) {
                                continue;
                            }
                            const rank = result2.data;
                            fs.writeFileSync(scoreFilePath, JSON.stringify(scores, null, 2), 'utf8');

                            // 对 scores 进行预处理，按学期和课程类型分组
                            function getTermName(termNumber) {
                                const terms = [
                                    '大一上', '大一下', '大二上', '大二下',
                                    '大三上', '大三下', '大四上', '大四下'
                                ];
                                return terms[termNumber - 1] || '未知学期';
                            }

                            const termsMap = {};

                            scores.forEach(score => {
                                const termName = getTermName(score.term);
                                if (!termsMap[termName]) {
                                    termsMap[termName] = {};
                                }
                                const type = score.type === '必修' ? '必修' : '选修';
                                if (!termsMap[termName][type]) {
                                    termsMap[termName][type] = [];
                                }
                                termsMap[termName][type].push({
                                    name: score.name,
                                    score: score.score,
                                    credit: score.credit
                                });
                            });

                            const processedScores = Object.keys(termsMap).sort((a, b) => {
                                const termOrder = [
                                    '大一上', '大一下', '大二上', '大二下',
                                    '大三上', '大三下', '大四上', '大四下'
                                ];
                                return termOrder.indexOf(b) - termOrder.indexOf(a);
                            }).map(termName => {
                                const types = ['必修', '选修'].filter(type => termsMap[termName][type]).map(type => {
                                    return {
                                        type: type,
                                        scores: termsMap[termName][type]
                                    };
                                });
                                return {
                                    term: termName,
                                    data: types
                                };
                            });

                            scores = processedScores;
                            const base64 = await puppeteer.screenshot('xtu-gong-plugin', {
                                saveId: 'score',
                                imgType: 'png',
                                tplFile: `${Plugin_Path}/resources/query/score.html`,
                                scores: scores,
                                rank: rank,
                            });
                            Bot.pickUser(userId).sendMsg(`你有新的成绩出炉啦！`);
                            Bot.pickUser(userId).sendMsg(base64);
                        }
                    }
                }
            }
        }
    }
}