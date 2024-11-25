import YAML from 'yaml'
import fs from 'node:fs'
import chokidar from 'chokidar'
// import YamlReader from './YamlReader.js'

const path = process.cwd()
const pluginName = 'xtu-gong-plugin';
const pluginPath = `${path}/plugins/${pluginName}`;

class Config {
    constructor() {
        this.config = {}
        /** 监听文件 */
        this.watcher = { config: {}, defSet: {} }

        this.initCfg()
    }

    /** 初始化配置 */
    initCfg() {
        const pathCfg = `${pluginPath}/config/config/`
        if (!fs.existsSync(pathCfg)) fs.mkdirSync(pathCfg)
        const pathDef = `${pluginPath}/config/default/`
        const file = 'config.yaml'
        const ignore = []

        if (!fs.existsSync(`${pathCfg}${file}`)) {
            fs.copyFileSync(`${pathDef}${file}`, `${pathCfg}${file}`)
        } else {
            const config = YAML.parse(fs.readFileSync(`${pathCfg}${file}`, 'utf8'))
            const defaultConfig = YAML.parse(fs.readFileSync(`${pathDef}${file}`, 'utf8'))
            let isChange = false
            const saveKeys = []
            const merge = (defValue, value, prefix = '') => {
                const defKeys = Object.keys(defValue)
                const configKeys = Object.keys(value || {})
                if (defKeys.length !== configKeys.length) {
                    isChange = true
                }
                for (const key of defKeys) {
                    switch (typeof defValue[key]) {
                        case 'object':
                            if (!Array.isArray(defValue[key]) && !ignore.includes(`${file.replace('.yaml', '')}.${key}`)) {
                                defValue[key] = merge(defValue[key], value[key], key + '.')
                                break
                            }
                        // eslint-disable-next-line no-fallthrough
                        default:
                            if (!configKeys.includes(key)) {
                                isChange = true
                            } else {
                                defValue[key] = value[key]
                            }
                            saveKeys.push(`${prefix}${key}`)
                    }
                }
                return defValue
            }
            const value = merge(defaultConfig, config)
            if (isChange) {
                fs.copyFileSync(`${pathDef}${file}`, `${pathCfg}${file}`)
                for (const key of saveKeys) {
                    this.modify(file.replace('.yaml', ''), key, key.split('.').reduce((obj, key) => obj[key], value))
                }
            }
        }
        this.watch(`${pathCfg}${file}`, file.replace('.yaml', ''), 'config')

    }

    /** 默认配置 */
    getdefSet() {
        return this.getYaml('default', 'config')
    }

    /** 用户配置 */
    getConfig() {
        return this.getYaml('config', 'config')
    }

    /**
     * 获取配置yaml
     * @param type 默认跑配置-defSet，用户配置-config
     * @param name 名称
     */
    getYaml(type, name) {
        const file = `${pluginPath}/config/${type}/${name}.yaml`
        const key = `${type}.${name}`

        if (this.config[key]) return this.config[key]

        this.config[key] = YAML.parse(
            fs.readFileSync(file, 'utf8')
        )

        this.watch(file, name, type)

        return this.config[key]
    }

    /** 获取所有配置 */
    getCfg() {
        return {
            ...this.files.map(file => this.getDefOrConfig(file.replace('.yaml', ''))).reduce((obj, item) => {
                return { ...obj, ...item }
            }, {})
        }
    }

    /** 监听配置文件 */
    watch(file, name, type = 'default') {
        const key = `${type}.${name}`
        if (this.watcher[key]) return

        const watcher = chokidar.watch(file)
        watcher.on('change', async pathCfg => {
            delete this.config[key]
            logger.info(`[${pluginName}][修改配置文件][${type}][${name}]`)
        })

        this.watcher[key] = watcher
    }

    // /**
    //  * 修改设置
    //  * @param {String} name 文件名
    //  * @param {String} key 修改的key值
    //  * @param {String|Number} value 修改的value值
    //  * @param {'config'|'default'} type 配置文件或默认
    //  */
    // modify(name, key, value, type = 'config') {
    //     const pathCfg = `${Version.pluginPath}/config/${type}/${name}.yaml`
    //     new YamlReader(pathCfg).set(key, value)
    //     delete this.config[`${type}.${name}`]
    // }
}
export default new Config()