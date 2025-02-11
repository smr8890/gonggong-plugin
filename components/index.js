const _PATH = process.cwd().replace(/\\/g, "/");
const Plugin_Name = "gonggong-plugin";
const Plugin_Path = `${_PATH}/plugins/${Plugin_Name}`;
const userListPath = `${_PATH}/data/gonggong/userlist.json`;
import Config from './Config.js';
import YamlReader from './YamlReader.js';
import Utils from './Utils.js';

export { _PATH, Plugin_Name, Plugin_Path, userListPath, Config, YamlReader, Utils };