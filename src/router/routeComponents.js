/**
 * perm_id → component 映射表
 * 用 perm_id 而非 path 作为 key，path 可在后台随意修改而不影响组件绑定
 */
import Layout from '@/layout/index.vue';

const views = {
  dashboard: () => import('@/views/dashboard/index.vue'),
  project: () => import('@/views/project/versions.vue'),
  'project-list': () => import('@/views/project/versions.vue'),
  'project-versions': () => import('@/views/project/index.vue'),
  product: () => import('@/views/product/index.vue'),
  story: () => import('@/views/story/index.vue'),
  task: () => import('@/views/task/index.vue'),
  'test-testcase': () => import('@/views/testcase/index.vue'),
  'test-bug': () => import('@/views/bug/index.vue'),
  'test-autotest': () => import('@/views/autotest/index.vue'),
  'test-autotest-report': () => import('@/views/autotest/report.vue'),
  'dev-api-manage': () => import('@/views/dev/apiManage/index.vue'),
  'delivery-ticket': () => import('@/views/ticket/index.vue'),
  'mock-center': () => import('@/views/mock/index.vue'),
  'settings-theme': () => import('@/views/settings/theme.vue'),
  'settings-members': () => import('@/views/settings/members.vue'),
  'settings-roles': () => import('@/views/settings/roles.vue'),
  'settings-departments': () => import('@/views/settings/departments.vue'),
  'settings-modules': () => import('@/views/settings/modules.vue'),
  'settings-menus': () => import('@/views/settings/menus.vue'),
};

export { Layout };

/**
 * 根据后端菜单树生成 vue-router 路由配置
 * 后端菜单结构: [{ perm_id, path, title, icon, children? }]
 */
export function buildRoutes(menuTree) {
  return menuTree.reduce((routes, item) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      const children = buildRoutes(item.children);
      if (children.length > 0) {
        routes.push({
          path: item.path,
          component: Layout,
          meta: { title: item.title, icon: item.icon },
          redirect: children[0].path,
          children,
        });
      }
    } else {
      const component = views[item.perm_id];
      if (component) {
        const segments = item.path.replace(/^\//, '').split('/');
        if (segments.length === 1) {
          routes.push({
            path: item.path,
            component: Layout,
            meta: { title: item.title, icon: item.icon },
            children: [{ path: '', component, meta: { title: item.title, icon: item.icon } }],
          });
        } else {
          routes.push({
            path: item.path,
            component,
            meta: { title: item.title, icon: item.icon },
          });
        }
      }
    }

    return routes;
  }, []);
}
