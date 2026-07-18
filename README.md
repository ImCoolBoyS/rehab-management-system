# 精神康复中心管理系统

社区精神障碍康复服务信息化管理平台。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| **后端** | Python 3.11+ / FastAPI |
| **数据库** | PostgreSQL 16 |
| **认证** | JWT + bcrypt |
| **部署** | Docker / Nginx (可选) |

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- PostgreSQL 16

### 1. 安装依赖

`ash
npm install
pip install -r requirements.txt
`

### 2. 配置数据库

确保本地 PostgreSQL 运行，创建数据库：

`ash
createdb rehab_db
`

默认连接地址：postgresql://postgres:postgres@localhost:5432/rehab_db

### 3. 启动服务

`ash
# 终端1: 启动后端
python server.py

# 终端2: 启动前端
npm run dev
`

### 4. 生成测试数据

`ash
python generate_data.py
`

### 5. 访问系统

打开 http://localhost:5173

| 账号 | 密码 | 角色 |
|------|------|------|
| dmin | dmin123 | 管理员 |
| sg_1 | dmin123 | 社工 |

## 功能模块

- **办公桌面** — 业务概览看板，显示关键指标和趋势
- **学员档案管理** — 学员信息 CRUD，支持风险等级分类
- **基线评估** — 六大维度临床量表评估 (baseline/process1/process2)
- **九大康复训练** — 训练记录管理，支持多种训练类型
- **入户探访随访** — 探访记录管理
- **数据统计中心** — 按站点统计、训练类型比例分析
- **数据查询中心** — 学员维度数据聚合查询
- **系统公告** — 公告发布与管理
- **PDF 附件上传** — 评估量表扫描件上传存档

## 项目结构

`
├── server.py              # FastAPI 后端
├── src/                   # React 前端
│   ├── components/        # UI 组件
│   ├── lib/api.ts         # API 封装
│   ├── hooks/             # 自定义 hooks
│   └── types.ts           # TypeScript 类型定义
├── generate_data.py       # 测试数据生成脚本
├── tests/                 # API 测试
└── uploads/pdfs/          # PDF 附件存储
`

## 安全特性

- ✅ JWT 身份认证
- ✅ bcrypt 密码加密
- ✅ 行级数据隔离 (RLS)
- ✅ 审计日志
- ✅ SQL 注入防护
- ✅ 速率限制 (5次/分钟)
- ✅ XSS 过滤
