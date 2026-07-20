# 精神康复中心管理系统 (Rehab Management System)

一个基于 **React 19 + FastAPI + PostgreSQL 16** 的精神康复中心管理平台，支持学员建档、康复训练记录、入户探访、评估管理等核心业务。

---

## 界面截图

| 登录页面 | 办公桌面（数据看板） |
|:--------:|:-------------------:|
| ![登录](assets/screenshots/login.png) | ![数据看板](assets/screenshots/dashboard.png) |

| 数据统计中心 | 学员档案管理 |
|:--------:|:-------------------:|
| ![统计](assets/screenshots/statistics.png) | ![学员](assets/screenshots/students.png) |

| 新增学员表单 | 九大康复训练 |
|:--------:|:-------------------:|
| ![新增](assets/screenshots/student_add.png) | ![训练](assets/screenshots/trainings.png) |

| 入户探访记录 | 基线评估 |
|:--------:|:-------------------:|
| ![探访](assets/screenshots/visits.png) | ![评估](assets/screenshots/assessments.png) |

---

## 功能概览

| 模块 | 功能 |
|------|------|
| 登录认证 | JWT 认证 + 密码加密 + 5分钟心跳保活 |
| 数据看板 | 今日新增康复训练、训练总数对比、辖区统计核算表 |
| 学员管理 | 增删改查、CSV 导出、搜索筛选 |
| 康复训练 | 9大训练类型记录、新增/编辑/删除 |
| 入户探访 | 探访记录管理、用药检查、风险评估 |
| 评估管理 | 基线评估、过程评估、9大维度评分 |
| 个人中心 | 账号信息查看 |
| 通告管理 | 系统通告发布、关闭功能 |
| 统计报表 | 辖区各服务点信息录入率、累计恢复总数 |
| PDF上传 | 评估报告PDF附件上传与下载 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| UI组件 | Lucide React (图标) |
| 后端框架 | Python FastAPI |
| 数据库 | PostgreSQL 16 |
| ORM | psycopg2 (原生连接) |
| 认证 | JWT + bcrypt |
| 限流 | slowapi (5次/分钟登录限制) |

---

## 快速开始

### 前置条件

- Python 3.10+
- Node.js 18+
- PostgreSQL 16

### 1. 创建数据库

```sql
CREATE DATABASE rehab_db;
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，修改数据库密码：

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/rehab_db"
```

### 3. 安装 Python 依赖

```bash
pip install fastapi uvicorn psycopg2-binary bcrypt pyjwt python-multipart pydantic slowapi
```

### 4. 安装前端依赖

```bash
npm install
```

### 5. 启动

```bash
# 启动后端（自动建表 + 写入测试数据）
python server.py

# 新开终端，启动前端
npx vite --port 5173
```

浏览器打开 http://localhost:5173

默认管理员账号：`admin` / 密码：`admin123`

---

## 项目结构

```
├── server.py              # FastAPI 后端
├── init_schema.py         # 数据库建表脚本
├── generate_data.py       # 测试数据生成脚本
├── migration.py           # 数据库迁移脚本
├── src/
│   ├── App.tsx            # 主应用（路由/登录/数据流）
│   ├── main.tsx           # 入口
│   ├── types.ts           # TypeScript 类型
│   ├── data.ts            # 下拉常量
│   ├── lib/api.ts         # API 调用封装（React Query）
│   └── components/        # 页面组件
├── assets/screenshots/    # 界面截图
├── PYTHON_SETUP.md        # Python 环境配置指南
├── DB_TEST_DATA_GUIDE.md  # 数据库测试数据指南
└── HANDOFF.md             # 项目交接文档
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/login | 登录 |
| GET/POST | /api/v1/students | 学员列表/新增 |
| PUT/DELETE | /api/v1/students/{id} | 更新/删除学员 |
| GET/POST | /api/v1/assessments | 评估列表/新增 |
| GET/POST | /api/v1/trainings | 训练列表/新增 |
| GET/POST | /api/v1/visits | 探访列表/新增 |
| CRUD | /api/v1/announcements | 公告管理 |
| CRUD | /api/v1/users | 用户管理 |
| GET/POST | /api/v1/sites | 站点管理 |
| POST | /api/v1/upload/pdf | PDF上传 |

---

## 默认测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 超级管理员 | 全部权限 |
| sg_1 | admin123 | 社工 | A街道服务点 |
| sg_2 | admin123 | 社工 | B街道服务点 |
| ... | admin123 | 社工 | 其余各乡镇 |

社工账号仅能查看本乡镇数据。
