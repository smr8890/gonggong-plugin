import fs from 'fs';
import Config from "./Config.js";
import { userListPath } from './index.js';

const api_address = Config.getcfg.api_address;

class Utils {
    async getResponse(userId, type) {
        let token = await this.getToken(userId);
        let data;
        for (let i = 0; i < 8; i++) {
            const response = await fetch(`${api_address}/${type}`, {
                method: 'GET',
                headers: {
                    token: `${token}`
                }
            });
            data = await response.json();
            if (data.code === 0 || data.code === -1) {
                const updated = await this.updateToken(userId);
                if (updated) {
                    token = await this.getToken(userId);
                    continue;
                } else {
                    break;
                }
            }
            if (data.code === 1 && data.data) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        const userList = JSON.parse(fs.readFileSync(userListPath, 'utf8'));
        if (!userList[userId] || !userList[userId].username || !userList[userId].password) {
            return false;
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

        if (!response.ok) {
            return false;
        }

        const result = await response.json();
        if (result.code !== 1) {
            return false;
        }

        userList[userId].token = result.data.token;
        fs.writeFileSync(userListPath, JSON.stringify(userList, null, 2), 'utf8');
        return true;
    }
}

export default new Utils();