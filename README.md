

![xtu-gong-plugin](https://socialify.git.ci/smr8890/xtu-gong-plugin/image?forks=1&issues=1&language=1&name=1&owner=1&pulls=1&stargazers=1&theme=Light)

# xtu-gong-plugin

- 一个提供湘潭大学课表、考试、成绩查询以及考试提醒的插件，适用于 [Yunzai 系列机器人框架](https://github.com/yhArcadia/Yunzai-Bot-plugins-index)

## 安装插件

#### 使用github

```bash
git clone --depth=1 https://github.com/smr8890/xtu-gong-plugin.git ./plugins/xtu-gong-plugin
```

#### 使用gitee

```bash
git clone --depth=1 https://gitee.com/smr8890/xtu-gong-plugin.git ./plugins/xtu-gong-plugin
```

安装完成后重启云崽即可使用

## 插件配置

插件查询所使用到的api接口来自[sky31studio/GongGong](https://github.com/sky31studio/GongGong)

搭建方法

#### 1.克隆项目

```bash
git clone https://github.com/sky31studio/GongGong.git
```

#### 2.使用Docker环境启动

```bash
cd GongGong
sudo docker-compose up -d
```

搭建完成后，将api地址`http://<你的服务器ip>:8000`填入config/config/config.yaml即可

## 功能列表

使用`#gg帮助`获取完整帮助

- [x] 课表查询
- [x] 考试查询
- [x] 成绩查询
- [ ] 空教室查询
- [x] 个人信息查询
- [x] 考试提醒
- [ ] 上课提醒

## 相关项目

- [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai)：Yunzai 应用端

- [GongGong](https://github.com/sky31studio/GongGong)：拱拱是一个基于网络爬虫的湘潭大学校园APP。本项目是GongGong的后端部分。