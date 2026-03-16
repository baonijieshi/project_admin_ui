<template>
  <el-dialog
    :model-value="visible"
    width="1200px"
    :show-close="true"
    destroy-on-close
    class="version-detail-dialog"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-main">
          <span class="dialog-title">{{ version?.name }}</span>
          <el-tag v-if="version" :type="statusType(version.status)" size="small">
            {{ version.status }}
          </el-tag>
        </div>
        <div v-if="version" class="header-meta">
          <span v-if="version.startDate || version.endDate" class="meta-chip">
            <el-icon><Calendar /></el-icon>
            {{ version.startDate || '?' }} ~ {{ version.endDate || '?' }}
          </span>
          <span v-if="version.storyTitle" class="meta-chip meta-chip--link">
            <el-icon><Document /></el-icon>
            {{ version.storyTitle }}
          </span>
        </div>
      </div>
    </template>

    <template v-if="version">
      <div class="detail-body">
        <!-- 顶部：团队 + 进度 + 关联项目 -->
        <div class="overview-bar">
          <div class="team-area">
            <div v-if="version.manager" class="member-chip">
              <el-avatar :size="24" :src="version.managerAvatar || ''">{{ version.manager.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">PM</span>
                <span class="member-name">{{ version.manager }}</span>
              </div>
            </div>
            <div v-if="version.devLeader" class="member-chip">
              <el-avatar :size="24" :src="version.devLeaderAvatar || ''">{{ version.devLeader.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">Dev</span>
                <span class="member-name">{{ version.devLeader }}</span>
              </div>
            </div>
            <div v-if="version.testLeader" class="member-chip">
              <el-avatar :size="24" :src="version.testLeaderAvatar || ''">{{ version.testLeader.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">QA</span>
                <span class="member-name">{{ version.testLeader }}</span>
              </div>
            </div>
          </div>

          <div class="stats-area">
            <div class="stat-item">
              <span class="stat-value">{{ taskTotal }}</span>
              <span class="stat-label">任务</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item stat-item--success">
              <span class="stat-value">{{ taskDone }}</span>
              <span class="stat-label">完成</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item stat-item--danger" style="cursor: pointer" @click="goToBugPage">
              <span class="stat-value">{{ bugCount }}</span>
              <span class="stat-label">Bug</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item stat-item--primary">
              <span class="stat-value">{{ version.progress }}%</span>
              <span class="stat-label">进度</span>
            </div>
          </div>

          <div v-if="version.projectNames && version.projectNames.length" class="project-area">
            <el-tag
              v-for="p in version.projectNames"
              :key="p"
              size="small"
              type="info"
              effect="plain"
              round
            >{{ p }}</el-tag>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar-wrap">
          <el-progress
            :percentage="version.progress"
            :color="progressColor(version.progress)"
            :stroke-width="8"
            :show-text="false"
          />
        </div>

        <!-- 标签页：描述 / 任务 / Bug -->
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane name="desc">
            <template #label>
              <el-icon><Document /></el-icon>
              版本描述
            </template>
          </el-tab-pane>
          <el-tab-pane name="all">
            <template #label>
              全部任务
              <el-badge :value="taskTotal" :max="99" class="tab-badge" />
            </template>
          </el-tab-pane>
          <el-tab-pane name="dev">
            <template #label>
              开发任务
              <el-badge :value="devTaskCount" :max="99" class="tab-badge" />
            </template>
          </el-tab-pane>
          <el-tab-pane name="test">
            <template #label>
              测试任务
              <el-badge :value="testTaskCount" :max="99" class="tab-badge" />
            </template>
          </el-tab-pane>
          <el-tab-pane name="bug">
            <template #label>
              关联Bug
              <el-badge :value="bugCount" :max="99" type="danger" class="tab-badge" />
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- 内容区 -->
        <div class="tab-content">
          <!-- 描述 Tab -->
          <div v-if="activeTab === 'desc'" class="desc-panel">
            <div v-if="version.desc" class="rich-text" v-html="version.desc" />
            <div v-else class="empty-desc">
              <el-empty :image-size="80" description="暂无版本描述" />
            </div>
          </div>

          <!-- 任务 Tab -->
          <div v-if="activeTab === 'all' || activeTab === 'dev' || activeTab === 'test'" class="table-panel">
            <el-table :data="filteredTasks" size="small" style="width: 100%" height="100%">
              <el-table-column type="index" label="" width="45" />
              <el-table-column prop="name" label="任务名称" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="70">
                <template #default="{ row }">
                  <el-tag :type="row.type === '开发' ? '' : 'success'" size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assignee_name" label="负责人" width="80" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="taskStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="70">
                <template #default="{ row }">
                  <el-tag :type="taskPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="deadline" label="截止日期" width="100" />
              <el-table-column prop="progress" label="进度" width="60" align="center">
                <template #default="{ row }">{{ row.progress }}%</template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Bug Tab -->
          <div v-if="activeTab === 'bug'" class="table-panel">
            <el-table :data="version.bugs || []" size="small" style="width: 100%" height="100%">
              <el-table-column type="index" label="" width="45" />
              <el-table-column prop="title" label="Bug标题" show-overflow-tooltip />
              <el-table-column prop="severity" label="严重程度" width="90">
                <template #default="{ row }">
                  <el-tag :type="bugSeverityType(row.severity)" size="small">{{ row.severity }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="priority" label="优先级" width="70">
                <template #default="{ row }">
                  <el-tag :type="bugPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="bugStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assignee_name" label="指派给" width="80" />
            </el-table>
          </div>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Calendar, Document } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean,
  version: { type: Object, default: null },
});

defineEmits(['update:visible']);

const router = useRouter();
const activeTab = ref('desc');

const taskTotal = computed(() => (props.version?.tasks || []).length);
const taskDone = computed(() => (props.version?.tasks || []).filter((t) => t.status === '已完成').length);
const bugCount = computed(() => (props.version?.bugs || []).length);
const devTaskCount = computed(() => (props.version?.tasks || []).filter((t) => t.type === '开发').length);
const testTaskCount = computed(() => (props.version?.tasks || []).filter((t) => t.type === '测试').length);

const filteredTasks = computed(() => {
  const tasks = props.version?.tasks || [];
  if (activeTab.value === 'dev') return tasks.filter((t) => t.type === '开发');
  if (activeTab.value === 'test') return tasks.filter((t) => t.type === '测试');
  return tasks;
});

const goToBugPage = () => {
  router.push({
    path: '/test/bug',
    query: { versionId: props.version.id, versionName: props.version.name },
  });
};

const progressColor = (p) => {
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
};

const statusType = (s) => ({
  未开始: 'info', 进行中: 'primary', 已完成: 'success', 已暂停: 'warning'
}[s] || 'info');
const taskStatusType = (s) => ({ 未开始: 'info', 进行中: 'primary', 已完成: 'success' }[s] || 'info');
const taskPriorityType = (p) => ({ 高: 'danger', 中: 'warning', 低: 'info' }[p] || 'info');
const bugSeverityType = (s) => ({
  致命: 'danger', 严重: 'danger', 一般: 'warning', 轻微: 'info', 建议: ''
}[s] || 'info');
const bugPriorityType = (p) => ({
  P0: 'danger', P1: 'warning', P2: '', P3: 'info'
}[p] || 'info');
const bugStatusType = (s) => ({
  待处理: 'info', 处理中: 'warning', 已解决: 'success', 已关闭: '', 已拒绝: 'danger'
}[s] || 'info');
</script>

<style scoped lang="scss">
.version-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
    overflow: hidden;
  }
  :deep(.el-dialog__header) {
    padding: 16px 24px;
    border-bottom: 1px solid #ebeef5;
    margin-right: 0;
  }
}

/* ── 头部 ── */
.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  .el-icon { font-size: 13px; }
  &--link { color: #606266; }
}

/* ── 概览栏 ── */
.detail-body {
  display: flex;
  flex-direction: column;
  height: 640px;
  overflow: hidden;
}
.overview-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.team-area {
  display: flex;
  align-items: center;
  gap: 16px;
}
.member-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  .el-avatar {
    font-size: 11px;
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
  }
}
.member-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.member-role {
  font-size: 10px;
  color: #909399;
}
.member-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.stats-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.stat-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.stat-item--success .stat-value { color: #67c23a; }
.stat-item--danger .stat-value { color: #f56c6c; }
.stat-item--primary .stat-value { color: #409eff; }
.stat-divider {
  width: 1px;
  height: 28px;
  background: #e4e7ed;
}

.project-area {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* ── 进度条 ── */
.progress-bar-wrap {
  padding: 0 24px;
  flex-shrink: 0;
}

/* ── 标签页 ── */
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

/* ── 内容区 ── */
.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.desc-panel {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}
.table-panel {
  height: 100%;
  padding: 12px 24px 24px;
  overflow: hidden;
}
.empty-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 0 0 12px;
  }
  :deep(li) { margin-bottom: 4px; }
  :deep(a) {
    color: #409eff;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }
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
  :deep(pre code) {
    background: none;
    padding: 0;
  }
}
</style>
