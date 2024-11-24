import fs from 'fs';
import chalk from 'chalk';

// 日志信息
logger.info(chalk.cyan('----------\(≧▽≦)/---------'));
logger.info(chalk.yellow(`拱拱插件初始化~`));
logger.info(chalk.magenta('-------------------------'));

// 动态加载插件
const files = fs
    .readdirSync("./plugins/xtu-gong-plugin/apps")
    .filter((file) => file.endsWith(".js"));

let ret = [];
const apps = {};

files.forEach((file) => {
    ret.push(import(`./apps/${file}`));
});

try {
    ret = await Promise.allSettled(ret);
    for (let i in files) {
        const name = files[i].replace(".js", "");
        if (ret[i].status !== "fulfilled") {
            logger.error(`载入插件错误：${logger.red(name)}`);
            logger.error(ret[i].reason);
            continue;
        }
        apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
    }
} catch (error) {
    logger.error("动态加载插件时发生错误:", error);
}

export { apps };