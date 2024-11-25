import { Plugin_Name } from "../components/index.js";
import { update as Update } from "../../other/update.js";

export class ggupdate extends plugin {
    constructor() {
        super({
            name: "拱拱插件更新",
            event: "message",
            priority: 1000,
            rule: [
                {
                    reg: /^#?(gg|拱拱)(插件)?(强制)?更新$/i,
                    fnc: "update",
                },
                {
                    reg: /^#?(gg|拱拱|)(插件)?更新日志$/i,
                    fnc: "updateLog",
                },
            ],
        });
    }

    async update(e = this.e) {
        const Type = e.msg.includes("强制") ? "#强制更新" : "#更新";
        e.msg = Type + Plugin_Name;
        const up = new Update(e);
        up.e = e;
        return up.update();
    }

    async updateLog(e = this.e) {
        e.msg = "#更新日志" + Plugin_Name;
        const up = new Update(e);
        up.e = e;
        return up.updateLog();
    }
}
