# 项目管理系统

基于 Vue 3 + Element Plus 开发的项目管理系统，仿照禅道（Zentao）的模块设计，采用 vue-admin-template 标准项目结构。

## 功能模块

### 核心模块
- **首页** - 数据统计概览、待办任务、最新Bug
- **项目管理** - 项目列表、创建项目、项目进度跟踪
- **产品管理** - 产品列表、产品线管理
- **需求管理** - 需求列表、需求优先级、需求状态
- **任务管理** - 任务分配、任务状态、截止日期
- **Bug管理** - Bug提交、严重程度、处理状态
- **测试用例** - 用例管理、测试执行、测试结果
- **文档管理** - 文档库、文档分类
- **统计报表** - 项目统计、Bug趋势、任务完成率

## 技术栈

- Vue 3.2
- Vue Router 4
- Vuex 4
- Element Plus 2.x
- Axios
- Sass
- NProgress

## 项目结构

```
src/
├── api/                    # API接口
│   ├── bug.js
│   ├── task.js
│   ├── project.js
│   ├── product.js
│   ├── story.js
│   └── user.js
├── assets/                 # 静态资源
├── components/             # 公共组件
├── layout/                 # 布局组件
│   ├── components/
│   │   ├── AppMain.vue
│   │   ├── Navbar.vue
│   │   ├── Breadcrumb.vue
│   │   ├── Sidebar/
│   │   │   ├── index.vue
│   │   │   └── SidebarItem.vue
│   │   └── index.js
│   └── index.vue
├── router/                 # 路由配置
│   └── index.js
├── store/                  # Vuex状态管理
│   ├── modules/
│   │   ├── app.js
│   │   └── user.js
│   ├── getters.js
│   └── index.js
├── styles/                 # 全局样式
│   ├── index.scss
│   └── variables.module.scss
├── utils/                  # 工具函数
│   ├── request.js          # axios封装
│   ├── validate.js         # 验证函数
│   └── index.js            # 通用工具
├── views/                  # 页面视图
│   ├── dashboard/
│   │   └── index.vue
│   ├── project/
│   │   └── index.vue
│   ├── product/
│   │   └── index.vue
│   ├── story/
│   │   └── index.vue
│   ├── task/
│   │   └── index.vue
│   ├── bug/
│   │   └── index.vue
│   ├── testcase/
│   │   └── index.vue
│   ├── doc/
│   │   └── index.vue
│   ├── report/
│   │   └── index.vue
│   └── redirect/
│       └── index.vue
├── App.vue                 # 根组件
├── main.js                 # 入口文件
├── permission.js           # 权限控制
└── settings.js             # 全局配置
```

## 安装依赖

```bash
pnpm install
```

## 开发运行

```bash
pnpm run serve
```

访问地址：http://localhost:8080

## 生产构建

```bash
pnpm run build
```

## 代码检查

```bash
pnpm run lint
```

## 核心特性

### 1. 布局系统
- 采用经典的侧边栏 + 顶部导航布局
- 响应式设计，支持移动端
- 面包屑导航自动生成
- 页面切换动画效果

### 2. 路由管理
- 基于 Vue Router 4
- 支持路由懒加载
- 路由权限控制
- 页面重定向功能

### 3. 状态管理
- 使用 Vuex 4 模块化管理
- 用户信息管理
- 应用状态管理
- 持久化存储

### 4. 请求封装
- Axios 统一封装
- 请求/响应拦截器
- 错误统一处理
- Token 自动注入

### 5. 样式管理
- Sass 预处理器
- 变量统一管理
- 主题色配置
- 全局样式重置

## 开发规范

### 目录命名
- 文件夹使用小写字母，多个单词用中划线分隔
- 组件文件使用 PascalCase 命名
- 工具函数文件使用 camelCase 命名

### 组件规范
- 使用 Vue 3 Composition API
- 使用 `<script setup>` 语法
- Props 和 Emits 需要定义类型
- 组件需要添加注释说明

### API 规范
- 按模块划分 API 文件
- 统一使用 request 工具发起请求
- 接口函数需要添加注释

### 样式规范
- 使用 scoped 限制样式作用域
- 使用 Sass 变量管理主题色
- 避免使用内联样式

## 后续开发建议

### 功能增强
1. **完善表单验证** - 为各个模块的表单添加完整的验证规则
2. **集成图表库** - 在统计报表模块集成 ECharts
3. **权限管理** - 添加用户角色和权限控制
4. **富文本编辑器** - 在文档和需求模块集成富文本编辑器
5. **文件上传** - 添加附件上传功能
6. **消息通知** - 实现站内消息和邮件通知
7. **搜索功能** - 添加全局搜索和高级筛选
8. **导出功能** - 支持数据导出为 Excel
9. **看板视图** - 为任务和Bug添加看板视图
10. **甘特图** - 为项目添加甘特图展示

### 性能优化
1. 路由懒加载
2. 组件按需加载
3. 图片懒加载
4. 虚拟滚动
5. 请求防抖节流

### 工程化
1. ESLint 代码规范
2. Prettier 代码格式化
3. Git Hooks 提交检查
4. 单元测试
5. E2E 测试

## 配置说明

### 环境变量

创建 `.env.development` 文件（开发环境）：
```
VUE_APP_BASE_API=/api
```

创建 `.env.production` 文件（生产环境）：
```
VUE_APP_BASE_API=https://your-api-server.com/api
```

### 代理配置

在 `vue.config.js` 中配置开发服务器代理：
```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
```

## License

MIT
