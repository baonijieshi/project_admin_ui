<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <span>通用设置</span>
      </template>

      <div class="settings-content">
        <el-empty description="通用设置功能开发中..." />
        <p class="tip">未来这里将包含系统的通用配置选项</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 通用设置页面
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px;

  .settings-content {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .tip {
      margin-top: 16px;
      color: #909399;
      font-size: 13px;
    }
  }
}
</style>
