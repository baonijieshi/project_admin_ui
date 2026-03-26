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
        <div class="header-row">
          <div class="header-left">
            <span class="dialog-title">{{ version?.name }}</span>
            <el-tag v-if="version" :type="statusType(version.status)" size="small" effect="dark" round>
              {{ version.status }}
            </el-tag>
          </div>
          <div v-if="version" class="header-right">
            <span v-if="version.startDate || version.endDate" class="meta-chip">
              <el-icon><Calendar /></el-icon>
              {{ version.startDate || '?' }} ~ {{ version.endDate || '?' }}
            </span>
            <span v-if="remainDays !== null" :class="['meta-chip', remainDays < 0 ? 'meta-chip--danger' : 'meta-chip--safe']">
              {{ remainDays < 0 ? `已逾期 ${-remainDays} 天` : `剩余 ${remainDays} 天` }}
            </span>
          </div>
        </div>
        <!-- 关联需求 + 关联项目 -->
        <div v-if="version" class="header-tags">
          <span v-if="version.storyTitle" class="tag-chip tag-chip--story">
            <el-icon><Document /></el-icon>{{ version.storyTitle }}
          </span>
          <el-tag
            v-for="p in (version.projectNames || []).slice(0, 4)"
            :key="p"
            size="small"
            type="info"
            effect="plain"
            round
          >{{ p }}</el-tag>
        </div>
      </div>
    </template>

    <template v-if="version">
      <div class="detail-body">
        <!-- 概览区：团队 + 统计卡片 -->
        <div class="overview-section">
          <!-- 团队成员 -->
          <div class="team-row">
            <div v-if="version.manager" class="member-chip">
              <el-avatar :size="28" :src="version.managerAvatar || ''">{{ version.manager.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">产品经理</span>
                <span class="member-name">{{ version.manager }}</span>
              </div>
            </div>
            <div v-if="version.devLeader" class="member-chip">
              <el-avatar :size="28" :src="version.devLeaderAvatar || ''">{{ version.devLeader.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">开发负责人</span>
                <span class="member-name">{{ version.devLeader }}</span>
              </div>
            </div>
            <div v-for="(tl, idx) in (version.testLeaderNames || [])" :key="'tl'+idx" class="member-chip">
              <el-avatar :size="28" :src="(version.testLeaderAvatars || [])[idx] || ''">{{ tl.charAt(0) }}</el-avatar>
              <div class="member-text">
                <span class="member-role">测试负责人</span>
                <span class="member-name">{{ tl }}</span>
              </div>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="stat-cards">
            <div class="stat-card">
              <div class="stat-card__icon stat-card__icon--primary">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="stat-card__body">
                <span class="stat-card__value">{{ taskDone }}/{{ taskTotal }}</span>
                <span class="stat-card__label">任务完成</span>
              </div>
              <el-progress
                type="circle"
                :percentage="taskTotal ? Math.round(taskDone * 100 / taskTotal) : 0"
                :width="36"
                :stroke-width="3"
                :show-text="false"
                color="#409eff"
              />
            </div>
            <div class="stat-card" style="cursor:pointer" @click="goToBugPage">
              <div class="stat-card__icon stat-card__icon--danger">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="stat-card__body">
                <span class="stat-card__value">{{ bugCount }}</span>
                <span class="stat-card__label">关联 Bug</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card__icon stat-card__icon--success">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-card__body">
                <span class="stat-card__value">{{ version.progress }}%</span>
                <span class="stat-card__label">整体进度</span>
              </div>
              <el-progress
                type="circle"
                :percentage="version.progress"
                :width="36"
                :stroke-width="3"
                :show-text="false"
                :color="progressColor(version.progress)"
              />
            </div>
          </div>
        </div>

        <!-- 标签页 -->
        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane name="desc">
            <template #label>
              <span class="tab-label"><el-icon><Document /></el-icon>描述</span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="all">
            <template #label>
              <span class="tab-label">全部任务<el-badge :value="taskTotal" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="dev">
            <template #label>
              <span class="tab-label">开发<el-badge :value="devTaskCount" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="test">
            <template #label>
              <span class="tab-label">测试<el-badge :value="testTaskCount" :max="99" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="bug">
            <template #label>
              <span class="tab-label">Bug<el-badge :value="bugCount" :max="99" type="danger" class="tab-badge" /></span>
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- 内容区 -->
        <div class="tab-content">
          <!-- 描述 -->
          <div v-if="activeTab === 'desc'" class="desc-panel">
            <div v-if="version.desc" class="rich-text" v-html="version.desc" />
            <div v-else class="empty-desc">
              <el-empty :image-size="80" description="暂无版本描述" />
            </div>
          </div>

          <!-- 任务 -->
          <div v-if="activeTab === 'all' || activeTab === 'dev' || activeTab === 'test'" class="table-panel">
            <div class="task-toolbar">
              <el-button type="primary" size="small" @click="handleAddTask">
                <el-icon><Plus /></el-icon>新建任务
              </el-button>
            </div>
            <el-table :data="filteredTasks" size="small" style="width:100%" height="100%" stripe>
              <el-table-column type="index" label="#" width="45" />
              <el-table-column prop="name" label="任务名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="70">
                <template #default="{ row }">
                  <el-tag :type="row.type === '开发' ? '' : 'success'" size="small" effect="plain">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="负责人" width="120">
                <template #default="{ row }">
                  <span v-if="row.assignee_names && row.assignee_names.length">{{ row.assignee_names.join('、') }}</span>
                  <span v-else class="text-muted">未指派</span>
                </template>
              </el-table-column>
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
              <el-table-column prop="deadline" label="截止" width="100">
                <template #default="{ row }">
                  <span v-if="row.deadline">{{ row.deadline }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="进度" width="200">
                <template #default="{ row }">
                  <div v-if="isAutoProgressTask(row)" class="auto-progress">
                    <el-progress :percentage="row.progress" :stroke-width="6" :show-text="false" />
                    <span class="auto-progress__text">{{ row.progress }}%<el-tag size="small" type="info" effect="plain" round>自动</el-tag></span>
                  </div>
                  <div v-else>
                    <el-tooltip :disabled="row.status !== '未开始'" content="请先将状态改为「进行中」" placement="top">
                      <div :class="['progress-wrap', progressClass(row.progress)]" style="width:100%">
                        <el-slider v-model="row.progress" :step="5" size="small" :disabled="row.status === '未开始'" @change="(val) => handleProgressChange(row, val)" />
                      </div>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="110" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button size="small" link type="primary" @click="handleEditTask(row)">编辑</el-button>
                  <el-button size="small" link type="danger" @click="handleDeleteTask(row)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <div class="empty-task">
                  <el-icon :size="32" color="#dcdfe6"><Tickets /></el-icon>
                  <p>暂无任务</p>
                  <el-button type="primary" size="small" @click="handleAddTask">新建任务</el-button>
                </div>
              </template>
            </el-table>
          </div>

          <!-- Bug -->
          <div v-if="activeTab === 'bug'" class="table-panel">
            <el-table :data="localBugs" size="small" style="width:100%" height="100%" stripe>
              <el-table-column type="index" label="#" width="45" />
              <el-table-column prop="title" label="Bug 标题" min-width="200" show-overflow-tooltip />
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
              <el-table-column prop="assignee_name" label="指派给" width="80">
                <template #default="{ row }">
                  <span v-if="row.assignee_name || (row.assignee_names && row.assignee_names.length)">{{ row.assignee_names ? row.assignee_names.join('、') : row.assignee_name }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <template #empty>
                <div class="empty-task">
                  <el-icon :size="32" color="#dcdfe6"><WarningFilled /></el-icon>
                  <p>暂无关联 Bug</p>
                </div>
              </template>
            </el-table>
          </div>
        </div>
      </div>
    </template>

    <TaskDialog
      v-model:visible="taskDialogVisible"
      :editing-id="taskEditingId"
      :initial-form="taskEditingForm"
      :version-list="versionListForTask"
      :user-list="userList"
      :progress-disabled="taskProgressDisabled"
      @saved="onTaskSaved"
    />
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Calendar, Document, Plus, Tickets, WarningFilled, CircleCheckFilled,
} from '@element-plus/icons-vue';
import { updateTask, deleteTask, getTaskList } from '@/api/task';
import { getUserList } from '@/api/user';
import { getBugList } from '@/api/bug';
import TaskDialog from '@/views/task/components/TaskDialog.vue';

const props = defineProps({
  visible: Boolean,
  version: { type: Object, default: null },
});

const emit = defineEmits(['update:visible', 'refreshList']);

const router = useRouter();
const activeTab = ref('desc');

const localTasks = ref([]);
const localBugs = ref([]);
const userList = ref([]);

const taskTotal = computed(() => localTasks.value.length);
const taskDone = computed(() => localTasks.value.filter((t) => t.status === '已完成').length);
const bugCount = computed(() => localBugs.value.length);
const devTaskCount = computed(() => localTasks.value.filter((t) => t.type === '开发').length);
const testTaskCount = computed(() => localTasks.value.filter((t) => t.type === '测试').length);

const remainDays = computed(() => {
  if (!props.version?.endDate) return null;
  const end = new Date(props.version.endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

const filteredTasks = computed(() => {
  if (activeTab.value === 'dev') return localTasks.value.filter((t) => t.type === '开发');
  if (activeTab.value === 'test') return localTasks.value.filter((t) => t.type === '测试');
  return localTasks.value;
});

const isAutoProgressTask = (row) => row.type === '测试' && row.name && row.name.includes('一轮测试');

const loadData = async () => {
  if (!props.version) return;
  try {
    const [taskRes, bugRes, userRes] = await Promise.all([
      getTaskList({ versionId: props.version.id, page: 1, pageSize: 999 }),
      getBugList({ versionId: props.version.id, page: 1, pageSize: 999 }),
      getUserList(),
    ]);
    localTasks.value = (taskRes.data.list || []).map((t) => ({
      ...t,
      assignee_names: t.assignee_names || [],
    }));
    localBugs.value = (bugRes.data.list || []).map((b) => ({
      ...b,
      assignee_name: b.assignee_name || '',
    }));
    userList.value = (userRes.data || []).map((u) => ({
      id: u.id,
      label: u.first_name || u.username,
      avatar: u.avatar || '',
      dept: u.dept || '',
    }));
  } catch { /* ignore */ }
};

watch(() => props.visible, (val) => { if (val) { activeTab.value = 'desc'; loadData(); } });

const versionListForTask = computed(() => {
  if (!props.version) return [];
  return [{ id: props.version.id, name: props.version.name }];
});

// ── 任务 CRUD ──
const taskDialogVisible = ref(false);
const taskEditingId = ref(null);
const taskEditingForm = ref(null);
const taskProgressDisabled = ref(false);

const handleAddTask = () => {
  taskEditingId.value = null;
  taskProgressDisabled.value = false;
  taskEditingForm.value = {
    name: '',
    version: props.version?.id || null,
    type: '开发',
    priority: '中',
    status: '未开始',
    assignee: [],
    deadline: props.version?.endDate || '',
    progress: 0,
    description: '',
  };
  taskDialogVisible.value = true;
};

const handleEditTask = (row) => {
  taskEditingId.value = row.id;
  taskProgressDisabled.value = isAutoProgressTask(row);
  taskEditingForm.value = {
    name: row.name,
    version: row.version || props.version?.id || null,
    type: row.type || '开发',
    priority: row.priority,
    status: row.status,
    assignee: row.assignee_ids || [],
    deadline: row.deadline || '',
    progress: row.progress || 0,
    description: row.description || '',
  };
  taskDialogVisible.value = true;
};

const handleDeleteTask = (row) => {
  ElMessageBox.confirm(`确定删除任务「${row.name}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteTask(row.id);
      ElMessage.success('已删除');
      loadData();
      emit('refreshList');
    })
    .catch(() => {});
};

const handleProgressChange = async (row, val) => {
  try {
    const payload = { progress: val };
    if (val === 100 && row.status !== '已完成') {
      payload.status = '已完成';
      row.status = '已完成';
      ElMessage.success('进度已满，状态自动更新为已完成');
    } else if (val < 100 && row.status === '已完成') {
      payload.status = '进行中';
      row.status = '进行中';
    }
    await updateTask(row.id, payload);
    emit('refreshList');
  } catch { /* ignore */ }
};

const onTaskSaved = () => { loadData(); emit('refreshList'); };

const goToBugPage = () => {
  router.push({ path: '/test/bug', query: { versionId: props.version.id, versionName: props.version.name } });
};

const progressColor = (p) => {
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
};
const progressClass = (p) => {
  if (p >= 100) return 'progress-done';
  if (p >= 70) return 'progress-high';
  if (p >= 30) return 'progress-mid';
  return 'progress-low';
};

const statusType = (s) => ({
  未开始: 'info',
  进行中: 'primary',
  已完成: 'success',
  已暂停: 'warning',
}[s] || 'info');
const taskStatusType = (s) => ({
  未开始: 'info',
  进行中: 'primary',
  已完成: 'success',
}[s] || 'info');
const taskPriorityType = (p) => ({
  高: 'danger',
  中: 'warning',
  低: 'info',
}[p] || 'info');
const bugSeverityType = (s) => ({
  致命: 'danger',
  严重: 'danger',
  一般: 'warning',
  轻微: 'info',
  建议: '',
}[s] || 'info');
const bugPriorityType = (p) => ({
  P0: 'danger',
  P1: 'warning',
  P2: '',
  P3: 'info',
}[p] || 'info');
const bugStatusType = (s) => ({
  待处理: 'info',
  处理中: 'warning',
  已解决: 'success',
  已关闭: '',
  已拒绝: 'danger',
}[s] || 'info');
</script>

<style scoped lang="scss">
.version-detail-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;

  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;

  &--story {
    color: #409eff;
    font-weight: 500;
  }
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 10px;
  border-radius: 12px;

  .el-icon {
    font-size: 14px;
  }

  &--danger {
    color: #f56c6c;
    background: #fef0f0;
  }

  &--safe {
    color: #67c23a;
    background: #f0f9eb;
  }
}

.detail-body {
  display: flex;
  flex-direction: column;
  height: 560px;
}

.overview-section {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.team-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 14px;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.member-role {
  font-size: 11px;
  color: #909399;
}

.member-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.stat-cards {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;

    &--primary {
      background: #ecf5ff;
      color: #409eff;
    }

    &--danger {
      background: #fef0f0;
      color: #f56c6c;
    }

    &--success {
      background: #f0f9eb;
      color: #67c23a;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
  }

  &__label {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }
}

.detail-tabs {
  padding: 0 24px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.tab-badge {
  margin-left: 4px;

  :deep(.el-badge__content) {
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 5px;
  }
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.desc-panel {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.rich-text {
  font-size: 14px;
  line-height: 1.7;
  color: #303133;

  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;

    td,
    th {
      border: 1px solid #dcdfe6;
      padding: 6px 10px;
      font-size: 13px;
    }
  }
}

.empty-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.table-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px 16px;
  overflow: hidden;
}

.task-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

.empty-task {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;

  p {
    color: #909399;
    font-size: 13px;
    margin: 0;
  }
}

.auto-progress {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-progress {
    flex: 1;
  }

  &__text {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
  }
}

.progress-wrap {
  :deep(.el-slider__runway) {
    height: 6px;
  }

  :deep(.el-slider__bar) {
    height: 6px;
  }

  :deep(.el-slider__button-wrapper) {
    top: -14px;
  }

  :deep(.el-slider__button) {
    width: 14px;
    height: 14px;
  }
}

.progress-done :deep(.el-slider__bar) {
  background-color: #67c23a;
}

.progress-high :deep(.el-slider__bar) {
  background-color: #409eff;
}

.progress-mid :deep(.el-slider__bar) {
  background-color: #e6a23c;
}

.progress-low :deep(.el-slider__bar) {
  background-color: #909399;
}

.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}
</style>
