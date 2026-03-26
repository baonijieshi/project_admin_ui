<template>
  <div class="sidebar-wrapper">
    <div class="sidebar-logo-container" :style="{ background: themeTitleColor }">
      <div class="sidebar-logo-link">
        <h1 class="sidebar-title">旭辉项目管理平台</h1>
      </div>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :background-color="themeColor"
        :text-color="menuTextColor"
        :active-text-color="menuActiveTextColor"
        mode="vertical"
        router
      >
        <sidebar-item
          v-for="r in filteredRoutes"
          :key="r.path"
          :item="r"
          :base-path="r.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import SidebarItem from './SidebarItem.vue';

const route = useRoute();
const store = useStore();

// 后端返回的菜单树，格式：[{ path, title, icon, children? }]
// 转换为 SidebarItem 期望的 { path, meta: { title, icon }, children? } 格式
function toRouteShape(items) {
  return items.map((item) => {
    const node = {
      path: item.path,
      meta: { title: item.title, icon: item.icon },
    };
    if (item.children?.length) {
      node.children = toRouteShape(item.children);
    }
    return node;
  });
}

const filteredRoutes = computed(() => toRouteShape(store.getters.menus || []));

const activeMenu = computed(() => route.path);

const themeColor = computed(() => store.state.settings.themeColor);
const themeTitleColor = computed(() => store.state.settings.themeTitleColor);
const menuTextColor = computed(() => store.state.settings.menuTextColor);
const menuActiveTextColor = computed(() => store.state.settings.menuActiveTextColor);
</script>

<style lang="scss" scoped>
.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b3a4a;
  text-align: center;
  overflow: hidden;
  flex-shrink: 0;

  .sidebar-logo-link {
    height: 100%;
    width: 100%;

    .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 50px;
      font-size: 16px;
      vertical-align: middle;
    }
  }
}

.el-scrollbar {
  height: calc(100% - 50px);
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.el-menu {
  border: none;
  height: 100%;
  width: 100% !important;
}
</style>
