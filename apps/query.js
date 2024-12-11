import fs from 'fs';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import { Config } from '../components/index.js';
import { Plugin_Path } from '../components/index.js';
const tokenPath = './data/xtu-gong/userlist.json';
const api_address = Config.getcfg.api_address;

export async function getResponse(token, type) {
    let data;
    for (let i = 0; i < 8; i++) {
        const response = await fetch(`${api_address}/${type}`, {
            method: 'GET',
            headers: {
                token: `${token}`
            }
        });
        data = await response.json();
        if (data.code === 1 && data.data) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return data;
}

export async function getToken(userId) {
    let userList = {};
    if (!fs.existsSync(tokenPath)) {
        fs.mkdirSync('./data/xtu-gong', { recursive: true });
        fs.writeFileSync(tokenPath, JSON.stringify({}), 'utf8');
    }
    userList = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    if (!userList[userId]) {
        return;
    }
    const { token } = userList[userId];
    return token;
}

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
        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            const result = await getResponse(token, 'courses');

            if (result.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }

            if (!result.data?.courses) {
                await e.reply('课表数据异常，请稍后重试。', true);
                return;
            }

            const courses = result.data.courses;
            const daysOfWeek = [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
            ];

            const groupedCourses = {};
            for (const day of daysOfWeek) {
                groupedCourses[day] = courses.filter(course => course.day === day);
            }

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
        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取课表时发生错误，请稍后再试。', true);
        }
    }

    async getExam(e) {
        const userId = e.user_id;
        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

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

            let exams = result.data.exams;

            if (exams.length === 0) {
                await e.reply('目前没有已知的考试安排。', true);
                return;
            }

            exams = exams.filter(exam => {
                if (!exam.start_time || !exam.end_time || !exam.location) return true;
                const endTime = new Date(exam.end_time);
                const now = new Date();
                return endTime >= now;
            }).map(exam => {
                if (!exam.type) {
                    exam.type = '考查';
                }

                if (!exam.start_time || !exam.end_time) {
                    exam.time = '无时间';
                } else {
                    const startTime = new Date(exam.start_time);
                    const endTime = new Date(exam.end_time);
                    const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                    const dayOfWeek = daysOfWeek[startTime.getDay()];
                    const formatTime = (time) => time.toString().padStart(2, '0');
                    exam.time = `${startTime.getFullYear()}/${startTime.getMonth() + 1}/${startTime.getDate()} ${formatTime(startTime.getHours())}:${formatTime(startTime.getMinutes())}-${formatTime(endTime.getHours())}:${formatTime(endTime.getMinutes())} ${dayOfWeek}`;
                }

                if (!exam.location) {
                    exam.location = '无地点';
                }

                if (exam.start_time && exam.end_time) {
                    const startTime = new Date(exam.start_time);
                    const nowDate = new Date();
                    const diff = startTime.setHours(0, 0, 0, 0) - nowDate.setHours(0, 0, 0, 0);
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    exam.countdown = days;
                } else {
                    exam.countdown = null;
                }

                return exam;
            });

            const base64 = await puppeteer.screenshot('xtu-gong-plugin', {
                saveId: 'exam',
                imgType: 'png',
                tplFile: `${Plugin_Path}/resources/query/exam.html`,
                exams: exams,
                Plugin_Path: Plugin_Path
            });
            return this.reply(base64);
        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取考试信息时发生错误，请稍后再试。', true);
        }
    }

    async getScore(e) {
        const userId = e.user_id;
        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            const result1 = await getResponse(token, 'scores');
            if (result1.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }
            if (!result1.data) {
                await e.reply('成绩数据异常，请稍后重试。', true);
                return;
            }
            const result2 = await getResponse(token, 'rank');
            if (result2.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }
            if (!result2.data) {
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
        } catch (error) {
            logger.error('Error fetching or parsing schedule:', error);
            await e.reply('获取成绩信息时发生错误，请稍后再试。', true);
        }
    }

    async getInfo(e) {
        const userId = e.user_id;
        const token = await getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token，发送 "#拱拱帮助" 查看token帮助。');
        }

        try {
            const result = await getResponse(token, 'info');

            if (result.code !== 1) {
                await e.reply('token已失效，请重新设置或刷新token。', true);
                return;
            }
            if (!result.data) {
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