# 精神康复中心管理系统 (Rehab Management System)

一个基于 **React 19 + FastAPI + PostgreSQL 16** 的精神康复中心管理平台，支持学员建档、康复训练记录、入户探访、评估管理等核心业务。

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
createdb -U postgres rehab_db
```

### 2. 安装后端依赖

```bash
pip install -r requirements.txt
```

### 3. 安装前端依赖

```bash
npm install
```

### 4. 启动服务

**终端 1 - 启动后端:**

```bash
python server.py
```

启动时自动完成了三件事:
- 连接 PostgreSQL
- 检查/创建数据库表结构
- 如果数据库为空则自动生成测试数据(13个站点、29个学员、评估/训练/探访数据)

**终端 2 - 启动前端:**

```bash
npm run dev
```

### 5. 访问系统

浏览器打开 `http://localhost:5173`

---

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 站点管理员 |
| sg_1 ~ sg_13 | admin123 | 社工用户 |

---

## 项目结构

```
├── server.py              # FastAPI 后端服务（含自动建表 + 数据初始化）
├── init_schema.py         # 数据库表结构定义
├── generate_data.py       # 测试数据生成
├── requirements.txt       # Python 依赖
├── vite.config.ts         # Vite 配置
├── src/
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   ├── data.ts            # 下拉选项常量
│   ├── hooks/
│   │   └── useAppMutations.ts  # 数据操作 hooks
│   └── components/
│       ├── LoginPage.tsx       # 登录页面
│       ├── Dashboard.tsx       # 数据看板
│       ├── StudentsList.tsx    # 学员列表
│       ├── TrainingsList.tsx   # 康复训练
│       ├── VisitsList.tsx      # 入户探访
│       ├── AssessmentsList.tsx # 评估管理
│       ├── Profile.tsx         # 个人中心
│       └── ...
└── tests/
    └── test_api.py        # API 测试
```

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/login | 用户登录 |
| GET | /api/v1/students | 获取学员列表(支持搜索/筛选) |
| POST | /api/v1/students | 新增学员 |
| PUT | /api/v1/students/{id} | 更新学员 |
| DELETE | /api/v1/students/{id} | 删除学员(有关联数据时拒绝) |
| GET | /api/v1/trainings | 获取训练列表 |
| POST | /api/v1/trainings | 新增训练 |
| PUT | /api/v1/trainings/{id} | 更新训练 |
| DELETE | /api/v1/trainings/{id} | 删除训练 |
| GET | /api/v1/visits | 获取探访列表 |
| POST | /api/v1/visits | 新增探访 |
| GET | /api/v1/assessments | 获取评估列表 |
| POST | /api/v1/assessments | 新增评估 |
| GET | /api/v1/sites | 获取站点列表 |
| POST | /api/v1/users | 新增用户 |
| GET | /api/v1/announcements | 获取通告列表 |
| POST | /api/v1/announcements | 新增通告 |
| POST | /api/v1/upload/pdf | 上传PDF附件 |
| GET | /api/v1/files/{path} | 下载文件 |
| POST | /api/v1/heartbeat | 心跳保活 |
| GET | /api/v1/dashboard/town-stats | 辖区统计核算表 |

---

## 截图

> 截图示例(页面加载后补充):
> - 登录页: 简洁的账号密码登录界面
> - 数据看板: 今日新增训练数、训练总数对比、辖区统计核算表
> - 学员列表: 分页展示、搜索筛选、CSV导出
> - 康复训练: 训练类型、训练方法、时长记录

---

## 许可证

Apache-2.0
