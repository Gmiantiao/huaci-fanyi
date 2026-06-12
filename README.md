# 📖 拾词 (Huaci)

> 浏览即拾词 — 划词翻译、收藏注释、高亮复习，中英双语皆是养分

一个轻量级 Chrome 扩展，让你在浏览网页时随手划词翻译、收藏生词，并在后续浏览中自动高亮显示，帮助自然习得词汇。

## ✨ 功能

### 🔤 划词翻译
- 在任意网页选中英文单词或短语，即时弹出翻译结果
- 自动获取 IPA 音标（使用免费词典 API，无需密钥）
- 支持 **中译英**：选中中文自动翻译成英文

### 📝 收藏与笔记
- 一键收藏词汇，附带上下文句子
- 支持为每个词条添加备注笔记
- 本地存储，离线可用

### 💡 AI 提问
- 选中文本后可向 AI 追问（基于 DeepSeek）
- 多轮对话，深入理解词汇用法
- 支持自定义 Prompt

### 🌈 高亮复习
- 已收藏的词汇在任意网页自动高亮
- 自定义高亮颜色
- 鼠标悬停查看释义和笔记

### ☁️ Notion 同步
- 将收藏词汇一键同步到 Notion 数据库
- 自动维护词条去重、笔记更新
- 支持全量补同步

### ⚙️ 灵活配置
- **多翻译引擎**：Google 翻译（免费）/ DeepSeek（需 API Key）
- **多目标语言**：简体中文、繁體中文、日本語、한국어、Español
- **开关控制**：一键开关划词功能、音标显示、AI 提问

## 📦 安装

1. 下载或克隆此仓库
2. 打开 Chrome，进入 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本仓库根目录

## 🛠 技术栈

- **Chrome Extension Manifest V3**
- 原生 JavaScript（无框架依赖）
- Service Worker 后台
- Content Script 页面注入
- Chrome Storage API 本地持久化

## 📁 项目结构

```
HuaciFanyi/
├── manifest.json           # 扩展配置
├── background/
│   └── service-worker.js   # 后台服务（翻译、Notion同步、词库管理）
├── content/
│   ├── index.js            # 页面注入脚本（划词、弹窗、高亮）
│   └── index.css           # 弹窗样式
├── popup/
│   ├── index.html          # 弹出面板（词汇列表、设置）
│   ├── index.js            # 面板逻辑
│   └── index.css           # 面板样式
├── options/
│   ├── index.html          # Notion 配置页
│   ├── index.js            # 配置逻辑
│   └── index.css           # 配置页样式
├── words/
│   ├── index.html          # 全部词汇浏览页
│   ├── index.js            # 词汇管理逻辑
│   └── index.css           # 词汇页样式
├── icons/                  # 扩展图标
└── promo/                  # 宣传页素材
```

## 🔑 API 配置

| 功能 | 是否需要密钥 | 说明 |
|------|:---:|------|
| Google 翻译 | ❌ | 内置免费使用 |
| DeepSeek 翻译 | ✅ | 需 [DeepSeek API Key](https://platform.deepseek.com/) |
| AI 提问 | ✅ | 与 DeepSeek 共用 Key |
| 音标查询 | ❌ | 免费词典 API |
| Notion 同步 | ✅ | 需 [Notion Integration](https://www.notion.so/my-integrations) |

## 📄 License

MIT
