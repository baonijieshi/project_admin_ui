<template>
  <el-drawer
    :model-value="visible"
    :title="null"
    size="580px"
    :with-header="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="row">
      <!-- 顶部标题区 -->
      <div class="detail-header">
        <div class="header-top">
          <el-tag :type="row.type === '开发' ? '' : 'success'" size="small">{{ row.type }}</el-tag>
          <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}优先级</el-tag>
          <el-tag
            v-if="isOverdue"
            type="danger"
            size="small"
            effect="dark"
          >已延期</el-tag>
          <div class="header-actions">
            <el-button size="small" type="primary" plain @click="$emit('edit', row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
          </div>
        </div>
        <h3 class="task-title">{{ row.name }}</h3>
        <div class="header-meta">
          <span>{{ row.version_name || '未关联版本' }}</span>
          <el-divider direction="vertical" />
          <span>创建于 {{ row.created_at }}</span>
          <template v-if="row.updated_at">
            <el-divider direction="vertical" />
            <span>更新于 {{ row.updated_at }}</span>
          </template>
        </div>
      </div>

      <!-- 状态与进度 -->
      <div class="detail-section">
        <div class="section-title">状态与进度</div>
        <div class="status-progress-row">
          <div class="status-block">
            <span class="field-label">当前状态</span>
            <el-tag :type="statusType(row.status)" effect="dark">{{ row.status }}</el-tag>
          </div>
          <div class="progress-block">
            <div class="progress-header">
              <span class="field-label">完成进度</span>
              <span class="progress-value">{{ row.progress || 0 }}%</span>
            </div>
            <el-progress
              :percentage="row.progress || 0"
              :stroke-width="10"
              :color="progressColor"
            />
          </div>
        </div>
        <div v-if="row.deadline" class="deadline-row">
          <span class="field-label">截止日期</span>
          <span :class="['deadline-value', { overdue: isOverdue }]">
            {{ row.deadline }}
            <template v-if="isOverdue"> · 已延期 {{ overdueDays }} 天</template>
            <template v-else-if="daysLeft !== null"> · 剩余 {{ daysLeft }} 天</template>
          </span>
        </div>
      </div>

      <!-- 人员信息 -->
      <div class="detail-section">
        <div class="section-title">人员信息</div>
        <div class="people-row">
          <div class="person-card">
            <span class="field-label">指派给</span>
            <div v-if="row.assignee_name" class="person-info">
              <el-avatar :size="28" :src="row.assignee_avatar || ''">{{ row.assignee_name.charAt(0) }}</el-avatar>
              <span>{{ row.assignee_name }}</span>
            </div>
            <span v-else class="empty-text">未指派</span>
          </div>
          <div v-if="row.creator_name" class="person-card">
            <span class="field-label">创建人</span>
            <div class="person-info">
              <el-avatar :size="28" :src="row.creator_avatar || ''">{{ row.creator_name.charAt(0) }}</el-avatar>
              <span>{{ row.creator_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <div class="detail-section">
        <div class="section-title">任务描述</div>
        <div v-if="row.description" class="detail-desc">{{ row.description }}</div>
        <div v-else class="empty-text">暂无描述</div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { Edit } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean,
  row: { type: Object, default: null },
});

defineEmits(['update:visible', 'edit']);

const priorityType = (p) => ({ 高: 'danger', 中: 'warning', 低: 'info' }[p] || 'info');
const statusType = (s) => ({ 未开始: 'info', 进行中: 'warning', 已完成: 'success' }[s] || 'info');

const progressColor = computed(() => {
  const p = props.row?.progress || 0;
  if (p < 30) return '#909399';
  if (p < 70) return '#409eff';
  return '#67c23a';
});

const isOverdue = computed(() => {
  if (!props.row?.deadline || props.row?.status === '已完成') return false;
  return new Date(props.row.deadline) < new Date(new Date().toDateString());
});

const overdueDays = computed(() => {
  if (!isOverdue.value) return 0;
  const diff = Date.now() - new Date(props.row.deadline).getTime();
  return Math.ceil(diff / 86400000);
});

const daysLeft = computed(() => {
  if (!props.row?.deadline || props.row?.status === '已完成') return null;
  const diff = new Date(props.row.deadline).getTime() - Date.now();
  if (diff < 0) return null;
  return Math.ceil(diff / 86400000);
});
</script>

<style scoped lang="scss">
.detail-header {
  padding: 0 0 16px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 20px;

  .header-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .header-actions {
      margin-left: auto;
    }
  }

  .task-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px;
    line-height: 1.4;
  }

  .header-meta {
    font-size: 12px;
    color: #909399;
    display: flex;
    align-items: center;
  }
}

.detail-section {
  margin-bottom: 20px;

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f2f5;
  }
}

.status-progress-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;

  .status-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .progress-block {
    flex: 1;
    min-width: 0;

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .progress-value {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.deadline-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fafbfc;
  border-radius: 6px;

  .deadline-value {
    font-size: 13px;
    color: #606266;

    &.overdue {
      color: #f56c6c;
      font-weight: 500;
    }
  }
}

.field-label {
  font-size: 12px;
  color: #909399;
}

.people-row {
  display: flex;
  gap: 24px;

  .person-card {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .person-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-avatar {
        font-size: 12px;
        background: linear-gradient(135deg, #409eff, #66b1ff);
        color: #fff;
      }

      span {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.detail-desc {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
  color: #606266;
  padding: 12px;
  background: #fafbfc;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
}

.empty-text {
  font-size: 13px;
  color: #c0c4cc;
}
</style>
