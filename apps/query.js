import fs from 'fs';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import { Config } from '../components/index.js';
import { Plugin_Path } from '../components/index.js';
const tokenPath = './data/xtu-gong/userlist.json';
const api_address = Config.getcfg.api_address;

export class Query extends plugin {
    constructor() {
        super({
            name: '查询',
            dsc: '查询课表、考试、成绩等信息',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^#?课表查询$',
                    fnc: 'getSchedule'
                },
                {
                    reg: '^#?考试查询$',
                    fnc: 'getExam'
                },
                {
                    reg: '^#?成绩查询$',
                    fnc: 'getScore'
                },
                {
                    reg: '^#?我是谁$',
                    fnc: 'getInfo'
                }
            ]
        });
    }

    async getSchedule(e) {
        const userId = e.user_id;
        let userList = {};
        if (!fs.existsSync(tokenPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }
        const { token } = userList[userId];
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            // 请求服务器获取课表数据
            const response = await fetch(`${api_address}/courses`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });

            if (!response.ok) {
                await e.reply(`获取课表失败：${response.status} ${response.statusText}`, true);
                return;
            }

            const result = await response.json();

            //检查数据是否正常
            if (result.code !== 1 || !result.data?.courses) {
                await e.reply('课表数据异常，请稍后重试。', true);
                return;
            }

            // 解析课程数据
            const courses = result.data.courses;

            // 按照星期分组
            const daysOfWeek = [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
            ];

            const groupedCourses = {};
            for (const day of daysOfWeek) {
                groupedCourses[day] = courses.filter(course => course.day === day);
            }

            // 构建课表消息
            let replyMsg = [];
            replyMsg.push({ message: `【${e.nickname || userId}的课表】`, nickname: Bot.nickname, user_id: Bot.uin });

            const dayNames = {
                'Monday': '星期一',
                'Tuesday': '星期二',
                'Wednesday': '星期三',
                'Thursday': '星期四',
                'Friday': '星期五',
                'Saturday': '星期六',
                'Sunday': '星期日'
            };

            for (const [day, dayCourses] of Object.entries(groupedCourses)) {
                let msg = '';
                if (dayCourses.length === 0) continue;

                msg += `【${dayNames[day]}】\n`;
                for (const course of dayCourses) {
                    msg += `- ${course.name}\n`;
                    msg += `  教师: ${course.teacher}\n`;
                    msg += `  教室: ${course.classroom}\n`;
                    msg += `  周次: ${course.weeks}\n`;
                    msg += `  时间: 第 ${course.start_time}-${course.start_time + course.duration - 1} 节课\n\n`;
                }
                replyMsg.push({ message: msg.trim(), nickname: Bot.nickname, user_id: Bot.uin });
            }

            let forwardMsg = Bot.makeForwardMsg(replyMsg);
            await e.reply(forwardMsg);
        } catch {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取课表时发生错误，请稍后再试。', true);
        }
    }

    async getExam(e) {
        const userId = e.user_id;
        let userList = {};
        if (!fs.existsSync(tokenPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }
        const { token } = userList[userId];
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            // 请求服务器获取考试数据
            const response = await fetch(`${api_address}/exams`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });

            if (!response.ok) {
                await e.reply(`获取考试失败：${response.status} ${response.statusText}`, true);
                return;
            }

            const result = await response.json();

            // 检查数据是否正常
            if (result.code !== 1 || !result.data) {
                await e.reply('考试数据异常，请稍后重试。', true);
                return;
            }

            const exams = result.data.exams;

            if (exams.length === 0) {
                await e.reply('目前没有已知的考试安排。', true);
                return;
            }

            // 格式化考试信息，去除已经结束的考试，但保留待定的考试
            let replyMsg = [];
            replyMsg.push({ message: `【${e.nickname || userId}的考试安排】`, nickname: Bot.nickname, user_id: Bot.uin });
            let msg = '';
            const now = new Date();
            exams.forEach((exam) => {
                if (exam.start_time && exam.end_time && exam.location) {
                    const startTime = new Date(exam.start_time);
                    const endTime = new Date(exam.end_time);
                    if (endTime > now) {
                        msg += `- ${exam.name}\n`;
                        msg += `  时间: ${startTime.toLocaleString('zh-CN', { hour12: false })} ~ ${endTime.toLocaleString('zh-CN', { hour12: false })}\n`;
                        msg += `  地点: ${exam.location}\n`;
                        msg += `  类型: ${exam.type}\n`;
                        const timeDiff = startTime.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
                        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        msg += `  倒计时: ${daysLeft} 天\n`;
                        msg += '\n';
                    }
                } else {
                    msg += `- ${exam.name} (待定)\n`;
                    msg += '\n';
                }
            });

            replyMsg.push({ message: msg.trim(), nickname: Bot.nickname, user_id: Bot.uin });
            let forwardMsg = Bot.makeForwardMsg(replyMsg);
            await e.reply(forwardMsg);
        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取考试信息时发生错误，请稍后再试。', true);
        }
    }

    async getScore(e) {
        const userId = e.user_id;
        let userList = {};
        if (!fs.existsSync(tokenPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }
        const { token } = userList[userId];
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            // 请求服务器获取成绩数据
            const response1 = await fetch(`${api_address}/scores`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });
            if (!response1.ok) {
                await e.reply(`获取成绩失败：${response1.status} ${response1.statusText}`, true);
                return;
            }

            // 请求服务器获取排名数据
            const response2 = await fetch(`${api_address}/rank`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });
            if (!response2.ok) {
                await e.reply(`获取排名失败：${response2.status} ${response2.statusText}`, true);
                return;
            }

            const result1 = await response1.json();
            const result2 = await response2.json();

            // 检查数据是否正常
            if (result1.code !== 1 || !result1.data) {
                await e.reply('成绩数据异常，请稍后重试。', true);
                return;
            }
            if (result2.code !== 1 || !result2.data) {
                await e.reply('排名数据异常，请稍后重试。', true);
                return;
            }

            let scores = result1.data.scores;
            const rank = result2.data;
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
            return this.reply(base64);
            // // 按学期分组
            // const terms = [
            //     '大一上', '大一下', '大二上', '大二下',
            //     '大三上', '大三下', '大四上', '大四下'
            // ];

            // const groupedScores = {};
            // for (const term of terms) {
            //     groupedScores[term] = { 必修: [], 选修: [] };
            // }

            // scores.forEach(score => {
            //     const term = terms[score.term - 1];
            //     const type = score.type === '必修' ? '必修' : '选修';
            //     groupedScores[term][type].push(score);
            // });

            // // 构建成绩消息
            // // let msg = `【${e.nickname || userId}的成绩单】\n`;
            // // msg += '━━━━━━━━━━━━━━\n';

            // const reversedTerms = terms.slice().reverse();
            // let replyMsg = [];
            // replyMsg.push({ message: `【${e.nickname || userId}的成绩单】`, nickname: Bot.nickname, user_id: Bot.uin });
            // let msg = '';
            // msg += `平均成绩：${rank.average_score}\n`;
            // msg += `平均绩点：${rank.gpa}\n`;
            // msg += `班级排名：${rank.class_rank}\n`;
            // msg += `专业排名：${rank.major_rank}`;
            // replyMsg.push({ message: msg.trim(), nickname: Bot.nickname, user_id: Bot.uin });
            // for (const term of reversedTerms) {
            //     let msg = '';
            //     const termScores = groupedScores[term];
            //     if (termScores.必修.length === 0 && termScores.选修.length === 0) continue;

            //     msg += `【${term}】\n`;
            //     for (const [type, scores] of Object.entries(termScores)) {
            //         if (scores.length === 0) continue;

            //         msg += ` 【${type}】\n`;
            //         scores.forEach(score => {
            //             msg += `  - ${score.name}\n`;
            //             msg += `    成绩: ${score.score}\n`;
            //             msg += `    学分: ${score.credit}\n\n`;
            //         });
            //     }
            //     replyMsg.push({ message: msg.trim(), nickname: Bot.nickname, user_id: Bot.uin });
            // }

            // let forwardMsg = Bot.makeForwardMsg(replyMsg);
            // await e.reply(forwardMsg);

        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取成绩信息时发生错误，请稍后再试。', true);
        }
    }

    async getInfo(e) {
        const userId = e.user_id;
        let userList = {};
        if (!fs.existsSync(tokenPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        if (!userList[userId]) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }
        const { token } = userList[userId];
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            // 请求服务器获取个人信息
            const response = await fetch(`${api_address}/info`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });

            if (!response.ok) {
                await e.reply(`获取个人信息失败：${response.status} ${response.statusText}`, true);
                return;
            }

            const result = await response.json();

            // 检查数据是否正常
            if (result.code !== 1 || !result.data) {
                await e.reply('个人信息异常，请稍后重试。', true);
                return;
            }

            const info = result.data;

            // 构建个人信息消息
            let msg = '';
            msg += `姓名：${info.name}\n`;
            msg += `性别：${info.gender}\n`;
            msg += `班级：${info.class_}\n`;
            msg += `生日：${info.birthday}\n`;

            await e.reply(msg.trim());
        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取个人信息时发生错误，请稍后再试。', true);
        }
    }
}