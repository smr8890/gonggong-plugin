import fs from 'fs';
import Config from "./Config.js";
import { userListPath } from './index.js';

const api_address = Config.getcfg.api_address;

class Utils {
    async getResponse(userId, type) {
        /*  -  1：成功请求
            - -1：token过期
            - -2：token不存在
            -  0：请求失败  */
        let token = await this.getToken(userId);
        let data;
        if (!token) {
            return { code: -2 };
        }
        for (let i = 0; i < 8; i++) {
            const response = await fetch(`${api_address}/${type}`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });
            if (response.status === 203) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            if (response.status === 401 || response.status === 423) {
                const updated = await this.updateToken(userId);
                if (updated === 1) {
                    token = await this.getToken(userId);
                    continue;
                } else {
                    data = { code: -1 };
                    break;
                }
            }
            if (response.status === 200) {
                data = await response.json();
                break;
            }
            data = { code: 0 };
            // if (data.code === 0 || data.code === -1) {
            //     const updated = await this.updateToken(userId);
            //     if (updated) {
            //         token = await this.getToken(userId);
            //         continue;
            //     } else {
            //         break;
            //     }
            // }
            // if (data.code === 1 && data.data) {
            //     break;
            // }
            // await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return data;
    }

    async getToken(userId) {
        let userList = {};
        if (!fs.existsSync(userListPath)) {
            fs.mkdirSync('./data/xtu-gong', { recursive: true });
            fs.writeFileSync(userListPath, JSON.stringify({}), 'utf8');
        }
        userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        if (!userList[userId]) {
            return;
        }
        const { token } = userList[userId];
        return token;
    }

    async updateToken(userId) {
        /*  -  1：成功更新token
            - -1：账号密码不存在
            - -2：账号密码错误
            - -3：账户未初始化
            - -4：教务系统超时
            -  0：其他错误  */
        const userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        if (!userList[userId] || !userList[userId].username || !userList[userId].password) {
            return -1;
        }

        let { username, password } = userList[userId];
        username = Buffer.from(username, 'base64').toString('utf8');
        password = Buffer.from(password, 'base64').toString('utf8');

        const response = await fetch(`${api_address}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.status === 401) {
            return -2;
        }
        if (response.status === 409) {
            return -3;
        }
        if (response.status === 503) {
            return -4;
        }

        if (response.status !== 200) {
            return 0;
        }
        const result = await response.json();
        // if (result.code !== 1) {
        //     return false;
        // }

        userList[userId].token = result.data.token;
        fs.writeFileSync(userListPath, JSON.stringify(userList, null, 2), 'utf8');
        return 1;
    }
}

export default new Utils();