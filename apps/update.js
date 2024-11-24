import xmz from '#xmz';
import xmz_ from '#xmz_';
import { execSync } from 'child_process';
import { update } from '../../other/update.js';
const Plugin_Name = xmz_.name.en;

export class xmzPlugin_update extends plugin {
    constructor() {
        super({
            name: 'xtu-gg插件更新',
            dsc: '调用Yunzai自带更新模块进行插件更新',
            event: 'message',
            priority: 2000,
            rule: [
                {
                    reg: '^#?(xmz|小米粥)(插件)?(强制)?更新$',
                    fnc: 'update_plugin',
                }
            ]
        });
    }
    async update_plugin(e) {
        const state = await xmz.xmz(e);
        if (!state[0]) {
            e.reply(state[1], true);
            return true;
        }
        let Update_Plugin = new update();
        Update_Plugin.e = e;
        Update_Plugin.reply = e.reply;
        if (Update_Plugin.getPlugin(Plugin_Name)) {
            if (e.msg.includes('强制')) {
                await execSync('git reset --hard', { cwd: `${process.cwd()}/plugins/${Plugin_Name}/` });
            }
            await Update_Plugin.runUpdate(Plugin_Name);
            if (Update_Plugin.isUp) {
                setTimeout(() => Update_Plugin.restart(), 2000)
            }
        }
        return true;
    }
}