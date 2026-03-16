<template>
  <div v-if="!item.hidden">
    <!-- 有子菜单 -->
    <el-sub-menu v-if="item.children && item.children.length > 0" :index="resolvePath(item.path)">
      <template #title>
        <el-icon v-if="item.meta && item.meta.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta.title }}</span>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(item.path)"
      />
    </el-sub-menu>

    <!-- 无子菜单 -->
    <el-menu-item v-else :index="resolvePath(item.path)">
      <el-icon v-if="item.meta && item.meta.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <template #title>
        <span>{{ item.meta.title }}</span>
      </template>
    </el-menu-item>
  </div>
</template>

<script setup>
import path from 'path-browserify';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
});

const resolvePath = (routePath) => {
  if (routePath.startsWith('/')) {
    return routePath;
  }
  return path.resolve(props.basePath, routePath);
};
</script>
