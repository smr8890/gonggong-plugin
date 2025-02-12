import fs from 'fs';
import { Config } from '../components/index.js';
import { Utils } from '../components/index.js';
const api_address = Config.getcfg.api_address;

export class GetToken extends plugin {
    constructor() {
        super({
            name: '获取Token',
            dsc: '根据学号和密码获取Token或者手动输入Token',
            event: 'message',
            priority: 10,
            rule: [
                {
                    reg: '^#?设置账号(?:\\s+\\S+\\s+\\S+)?$',
                    fnc: 'setAccount'
                },
                {
                    reg: '^#?设置token\\s+\\S+$',
                    fnc: 'setToken'
                },
                {
                    reg: '^#?刷新token$',
                    fnc: 'updateToken'
                },
                {
                    reg: '^#?我的token$',
                    fnc: 'myToken'
                },
                {
                    reg: '^#?删除账号$',
                    fnc: 'deleteAccount'
                }
            ]
        });
    }

    async setAccount(e) {
        const userId = e.user_id;
        //#设置账号 学号 密码
        const [username, password] = e.raw_message.split(/\s+/).slice(1);
        if (!username || !password) {
            return this.reply('请正确输入账号和密码');
        }
        const path = './data/gonggong/userlist.json';

        let userList = {};
        if (!fs.existsSync(path)) {
            fs.mkdirSync('./data/gonggong', { recursive: true });
            fs.writeFileSync(path, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        userList[userId] = {
            username: username,
            password: password,
            token: '',
            examNotice: false
        };

        const response = await fetch(`${api_address}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ username, password }).toString()
        });

        if (!response.ok) {
            return this.reply('登录失败，请检查账号和密码');
        }

        const result = await response.json();

        userList[userId].token = result.access_token;
        const encodedUsername = Buffer.from(username).toString('base64');
        const encodedPassword = Buffer.from(password).toString('base64');

        userList[userId].username = encodedUsername;
        userList[userId].password = encodedPassword;
        fs.writeFileSync(path, JSON.stringify(userList, null, 2), 'utf8');
        return this.reply('登录成功');
    }

    async setToken(e) {
        const userId = e.user_id;
        //#设置Token token
        const token = e.raw_message.split(/\s+/).slice(1)[0];
        if (!token) {
            return this.reply('请正确输入token');
        }
        const path = './data/gonggong/userlist.json';

        let userList = {};
        if (!fs.existsSync(path)) {
            fs.mkdirSync('./data/gonggong', { recursive: true });
            fs.writeFileSync(path, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        if (!userList[userId]) {
            userList[userId] = {
                username: '',
                password: '',
                token: token,
                examNotice: false
            };
        } else {
            userList[userId].token = token;
        }

        fs.writeFileSync(path, JSON.stringify(userList, null, 2), 'utf8');
        return this.reply('设置成功');
    }

    async updateToken(e) {
        const userId = e.user_id;
        const updated = await Utils.updateToken(userId);
        if (updated === 1) {
            return this.reply('token刷新成功');
        } else if (updated === -1) {
            return this.reply('请先设置账号和密码，方法：#设置账号 学号 密码');
        } else if (updated === -2) {
            return this.reply('账号密码错误');
        } else if (updated === -3) {
            return this.reply('账户未初始化，请检查教务系统是否需要更改密码');
        } else {
            return this.reply('系统超时，请稍后再试');
        }
    }

    async deleteAccount(e) {
        const userId = e.user_id;
        const path = './data/gonggong/userlist.json';

        if (!fs.existsSync(path)) {
            return this.reply('没有账号可以删除');
        }

        const userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        if (!userList[userId]) {
            return this.reply('没有账号可以删除');
        }

        delete userList[userId];
        fs.writeFileSync(path, JSON.stringify(userList, null, 2), 'utf8');
        return this.reply('账号删除成功');
    }

    async myToken(e) {
        const userId = e.user_id;
        const token = await Utils.getToken(userId);
        if (!token) {
            return this.reply('未找到您的 token');
        }
        return this.reply(token);
    }
}
