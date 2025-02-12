import lodash from 'lodash';
import path from 'path';
import { Config } from './components/index.js';
import { Plugin_Path } from './components/index.js';

export function supportGuoba() {
    return {
        pluginInfo: {
            name: 'gonggong-plugin',
            title: 'gonggong-plugin',
            author: '@smr8890',
            authorLink: 'https://github.com/smr8890',
            link: 'https://github.com/smr8890/gonggong-plugin',
            isV3: true,
            isV2: false,
            description: '提供湘潭大学课表、考试、成绩查询以及考试提醒',
            icon: 'mdi:stove',
            iconPath: path.join(Plugin_Path, '/resources/img/icon.png'),
        },
        configInfo: {
            schemas: [
                {
                    field: 'api_address',
                    label: 'api接口地址',
                    bottomHelpMessage: '请填写接口地址',
                    component: 'Input',
                    componentProps: {
                        placeholder: '请填写接口地址',
                    }
                },
                {
                    field: 'exam_time',
                    label: '考试提醒时间',
                    bottomHelpMessage: '请填写考试提醒时间，cron表达式',
                    component: 'Input',
                    componentProps: {
                        placeholder: '请填写考试提醒时间',
                    }
                },
                {
                    field: 'advance_days',
                    label: '提前开始提醒的天数',
                    bottomHelpMessage: '请填写提前开始提醒的天数',
                    component: 'Input',
                    componentProps: {
                        placeholder: '请填写提前开始提醒的天数',
                    }
                }
            ],
            getConfigData() {
                return Config.getConfig('config');
            },
            setConfigData(data, { Result }) {
                const config = Config.getConfig('config');

                for (const key in data) {
                    const split = key.split('.');
                    const configName = 'config';
                    const configKey = split[0];

                    if (lodash.isEqual(config[configKey], data[key])) continue;
                    Config.modify(configName, configKey, data[key]);
                }
                return Result.ok({}, '配置已更新成功');
            }
        }
    }
}