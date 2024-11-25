import fs from 'fs';
import { Config } from '../components/index.js';
const api_address = Config.getConfig().api_address;

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
        const path = './data/xtu-gong/userlist.json';

        let userList = {};
        if (!fs.existsSync(path)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(path, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        userList[userId] = {
            username: username,
            password: password,
            token: ''
        };

        const response = await fetch(`${api_address}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            return this.reply('登录失败，请检查账号和密码');
        }

        const result = await response.json();
        if (result.code !== 1) {
            return this.reply('登录失败，请检查账号和密码');
        }

        userList[userId].token = result.data.token;
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
        const path = './data/xtu-gong/userlist.json';

        let userList = {};
        if (!fs.existsSync(path)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(path, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        if (!userList[userId]) {
            userList[userId] = {
                username: '',
                password: '',
                token: token
            };
        } else {
            userList[userId].token = token;
        }

        fs.writeFileSync(path, JSON.stringify(userList, null, 2), 'utf8');
        return this.reply('设置成功');
    }

    async updateToken(e) {
        const userId = e.user_id;
        const path = './data/xtu-gong/userlist.json';

        if (!fs.existsSync(path)) {
            return this.reply('请先设置账号和密码');
        }

        const userList = JSON.parse(fs.readFileSync(path, 'utf8'));

        if (!userList[userId] || !userList[userId].username || !userList[userId].password) {
            return this.reply('请先设置账号和密码');
        }

        const { username, password } = userList[userId];

        const response = await fetch(`${api_address}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            return this.reply('刷新token失败，请检查账号和密码');
        }

        const result = await response.json();
        if (result.code !== 1) {
            return this.reply('刷新token失败，请检查账号和密码');
        }

        userList[userId].token = result.data.token;
        fs.writeFileSync(path, JSON.stringify(userList, null, 2), 'utf8');
        return this.reply('token刷新成功');
    }

    async deleteAccount(e) {
        const userId = e.user_id;
        const path = './data/xtu-gong/userlist.json';

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
}
