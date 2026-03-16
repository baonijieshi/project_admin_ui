<template>
  <el-dialog
    :model-value="visible"
    width="960px"
    :show-close="true"
    destroy-on-close
    class="project-detail-dialog"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-main">
          <span class="dialog-title">{{ project?.name }}</span>
          <el-tag
            v-if="project"
            :type="project.status === '启用' ? 'success' : 'info'"
            size="small"
            effect="plain"
            round
          >{{ project.status }}</el-tag>
        </div>
        <span v-if="project" class="header-date">创建于 {{ formatDate(project.created_at) }}</span>
      </div>
    </template>

    <template v-if="project">
      <div class="detail-body">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane name="desc" label="项目描述" />
          <el-tab-pane name="versions">
            <template #label>
              关联版本
              <el-badge
                v-if="versionList.length"
                :value="versionList.length"
                :max="99"
                class="tab-badge"
              />
            </template>
          </el-tab-pane>
        </el-tabs>

        <div class="tab-content">
          <!-- 描述 -->
          <div v-if="activeTab === 'desc'" class="desc-panel">
            <div v-if="project.description" class="rich-text" v-html="project.description" />
            <div v-else class="empty-panel">
              <el-empty :image-size="80" description="暂无项目描述" />
            </div>
          </div>

          <!-- 版本进度 -->
          <div v-if="activeTab === 'versions'" class="version-panel">
            <div v-if="versionLoading" v-loading="true" class="loading-area" />
            <template v-else-if="versionList.length">
              <div class="version-grid">
                <div
                  v-for="ver in versionList"
                  :key="ver.id"
                  class="ver-card"
                  :class="statusClass(ver.status)"
                  @click="goToVersion(ver)"
                >
                  <!-- 头部：名称 + 状态 -->
                  <div class="ver-card__header">
                    <span class="ver-card__name">{{ ver.name }}</span>
                    <el-tag :type="statusType(ver.status)" size="small" effect="plain" round>
                      {{ ver.status }}
                    </el-tag>
                  </div>

                  <!-- 进度条 -->
                  <div class="ver-card__progress">
                    <el-progress
                      :percentage="ver.progress"
                      :color="progressColor(ver.progress)"
                      :stroke-width="8"
                      :show-text="false"
                    />
                    <span class="progress-text">{{ ver.progress }}%</span>
                  </div>

                  <!-- 统计 -->
                  <div class="ver-card__stats">
                    <div class="stat">
                      <span class="stat__value">{{ ver.task_done }}</span>
                      <span class="stat__sep">/</span>
                      <span class="stat__total">{{ ver.task_total }}</span>
                      <span class="stat__label">任务</span>
                    </div>
                    <div class="stat stat--bug">
                      <span class="stat__value">{{ ver.bug_count }}</span>
                      <span class="stat__label">Bug</span>
                    </div>
                  </div>

                  <!-- 周期 + 负责人 -->
                  <div class="ver-card__meta">
                    <span v-if="ver.start_date || ver.end_date" class="meta-chip">
                      <el-icon><Calendar /></el-icon>
                      {{ ver.start_date || '?' }} ~ {{ ver.end_date || '?' }}
                    </span>
                    <span v-if="ver.manager_name" class="meta-chip">
                      <el-avatar :size="16" :src="ver.manager_avatar || ''">
                        {{ ver.manager_name.charAt(0) }}
                      </el-avatar>
                      {{ ver.manager_name }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="empty-panel">
              <el-empty :image-size="80" description="暂未关联版本" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Calendar } from '@element-plus/icons-vue';
import { getVersionList } from '@/api/version';

const props = defineProps({
  visible: Boolean,
  project: { type: Object, default: null },
});

const emit = defineEmits(['update:visible']);

const activeTab = ref('desc');
const versionList = ref([]);
const versionLoading = ref(false);

watch(() => props.visible, async (val) => {
  if (val && props.project) {
    activeTab.value = 'desc';
    versionList.value = [];
    if (props.project.version_ids?.length) {
      versionLoading.value = true;
      try {
        const res = await getVersionList({ page: 1, pageSize: 999 });
        const allVersions = res.data.list || [];
        const idSet = new Set(props.project.version_ids);
        versionList.value = allVersions.filter((v) => idSet.has(v.id));
      } catch { /* ignore */ } finally {
        versionLoading.value = false;
      }
    }
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.slice(0, 10);
};

const statusType = (s) => ({
  未开始: 'info', 进行中: 'primary', 已完成: 'success', 已暂停: 'warning',
}[s] || 'info');

const statusClass = (s) => ({
  进行中: 'is-active', 已完成: 'is-done', 已暂停: 'is-paused',
}[s] || '');

const progressColor = (p) => {
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
};

const router = useRouter();
const goToVersion = (ver) => {
  emit('update:visible', false);
  router.push({ path: '/project/versions', query: { openId: ver.id } });
};
</script>

<style scoped lang="scss">
.project-detail-dialog {
  :deep(.el-dialog__body) { padding: 0; overflow: hidden; }
  :deep(.el-dialog__header) {
    padding: 16px 24px;
    border-bottom: 1px solid #ebeef5;
    margin-right: 0;
  }
}
.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}
.header-date {
  font-size: 12px;
  color: #909399;
}

.detail-body {
  display: flex;
  flex-direction: column;
  height: 560px;
  overflow: hidden;
}
.detail-tabs {
  flex-shrink: 0;
  padding: 0 24px;
  :deep(.el-tabs__header) { margin-bottom: 0; }
  :deep(.el-tabs__nav-wrap::after) { height: 1px; }
}
.tab-badge {
  :deep(.el-badge__content) {
    position: static;
    transform: none;
    margin-left: 4px;
    vertical-align: middle;
  }
}
.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── 描述面板 ── */
.desc-panel {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}
.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.loading-area {
  height: 200px;
}

/* ── 版本面板 ── */
.version-panel {
  height: 100%;
  overflow-y: auto;
  padding: 20px 24px;
}
.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
}

/* ── 版本卡片 ── */
.ver-card {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  border-left: 3px solid #dcdfe6;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: var(--el-color-primary-light-5);
  }
  &.is-active { border-left-color: #409eff; }
  &.is-done { border-left-color: #67c23a; }
  &.is-paused { border-left-color: #e6a23c; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  &__name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  &__progress {
    display: flex;
    align-items: center;
    gap: 10px;
    .el-progress { flex: 1; }
  }
  &__stats {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  &__meta {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  min-width: 36px;
  text-align: right;
}
.stat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: #f0f2f5;
  color: #606266;

  &__value { font-weight: 600; }
  &__sep { color: #c0c4cc; }
  &__total { color: #909399; }
  &__label { color: #909399; margin-left: 2px; }

  &--bug {
    background: #fef0f0;
    color: #f56c6c;
    .stat__value { color: #f56c6c; }
    .stat__label { color: #f89898; }
  }
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  .el-icon { font-size: 13px; }
  .el-avatar {
    font-size: 9px;
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
  }
}

/* ── 富文本 ── */
.rich-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
  word-break: break-word;

  :deep(p) { margin: 0 0 12px; }
  :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
    margin: 16px 0 8px;
    color: #303133;
    font-weight: 600;
  }
  :deep(h1) { font-size: 20px; }
  :deep(h2) { font-size: 18px; }
  :deep(h3) { font-size: 16px; }
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 8px 0;
  }
  :deep(ul), :deep(ol) { padding-left: 24px; margin: 0 0 12px; }
  :deep(li) { margin-bottom: 4px; }
  :deep(a) {
    color: #409eff;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
  :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; }
  :deep(th), :deep(td) {
    border: 1px solid #ebeef5;
    padding: 8px 12px;
    font-size: 13px;
    text-align: left;
  }
  :deep(th) { background: #fafbfc; font-weight: 600; }
  :deep(blockquote) {
    margin: 12px 0;
    padding: 12px 16px;
    border-left: 4px solid #409eff;
    background: #f5f7fa;
    border-radius: 0 6px 6px 0;
    color: #606266;
  }
  :deep(pre) {
    background: #f5f7fa;
    padding: 14px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;
    margin: 8px 0;
  }
  :deep(code) {
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  :deep(pre code) { background: none; padding: 0; }
}
</style>
