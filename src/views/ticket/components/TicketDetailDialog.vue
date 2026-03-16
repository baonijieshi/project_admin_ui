<template>
  <el-dialog
    :model-value="visible"
    title="工单详情"
    width="1200px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="row">
      <!-- 标题 + 标签 -->
      <div class="detail-section">
        <div class="detail-title">{{ row.title }}</div>
        <div class="detail-meta">
          <el-tag :type="typeTagType(row.ticket_type)" size="small">{{ row.ticket_type }}</el-tag>
          <el-tag :type="priorityTagType(row.priority)" size="small" style="margin-left:6px">{{ row.priority }}</el-tag>
          <span class="detail-meta-time">{{ row.created_at }}</span>
        </div>
      </div>

      <!-- 字段网格 -->
      <div class="detail-grid">
        <div class="detail-field">
          <span class="field-label">问题模块</span>
          <span class="field-value">{{ row.module_name || '-' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">当前处理人</span>
          <div class="field-value">
            <div v-if="row.assignee_name" class="user-cell">
              <el-avatar :size="20" :src="row.assignee_avatar || ''">{{ row.assignee_name ? row.assignee_name.charAt(0) : '' }}</el-avatar>
              <span>{{ row.assignee_name }}</span>
            </div>
            <span v-else>-</span>
          </div>
        </div>
        <div class="detail-field">
          <span class="field-label">测试处理人</span>
          <div class="field-value">
            <div v-if="row.test_assignee_name" class="user-cell">
              <el-avatar :size="20" :src="row.test_assignee_avatar || ''">{{ row.test_assignee_name ? row.test_assignee_name.charAt(0) : '' }}</el-avatar>
              <span>{{ row.test_assignee_name }}</span>
            </div>
            <span v-else>-</span>
          </div>
        </div>
        <div class="detail-field">
          <span class="field-label">研发处理人</span>
          <div class="field-value">
            <div v-if="row.dev_assignee_name" class="user-cell">
              <el-avatar :size="20" :src="row.dev_assignee_avatar || ''">{{ row.dev_assignee_name ? row.dev_assignee_name.charAt(0) : '' }}</el-avatar>
              <span>{{ row.dev_assignee_name }}</span>
            </div>
            <span v-else>-</span>
          </div>
        </div>
        <div class="detail-field">
          <span class="field-label">提交人</span>
          <div class="field-value">
            <div v-if="row.reporter_name" class="user-cell">
              <el-avatar :size="20" :src="row.reporter_avatar || ''">{{ row.reporter_name ? row.reporter_name.charAt(0) : '' }}</el-avatar>
              <span>{{ row.reporter_name }}</span>
            </div>
            <span v-else>-</span>
          </div>
        </div>
      </div>

      <!-- 步骤条 -->
      <el-steps
        :active="stepIndex(row.status)"
        finish-status="success"
        simple
        class="ticket-steps"
      >
        <el-step v-for="s in STEPS" :key="s" :title="s" />
      </el-steps>

      <!-- 描述 -->
      <div class="detail-block">
        <div class="block-label">问题描述</div>
        <div class="block-content rich-content" v-html="row.description || '-'" />
      </div>

      <!-- 解决方案 -->
      <div v-if="row.solution" class="detail-block">
        <div class="block-label">解决方案</div>
        <div class="block-content">{{ row.solution }}</div>
      </div>

      <!-- 备注 -->
      <div v-if="row.remark" class="detail-block">
        <div class="block-label">备注</div>
        <div class="block-content">{{ row.remark }}</div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import {
  STEPS, stepIndex, typeTagType, priorityTagType,
} from '../ticketConstants';

defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
});

defineEmits(['update:visible']);
</script>

<style scoped lang="scss">
.detail-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-meta-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.detail-field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.field-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  min-width: 64px;
}

.field-value {
  font-size: 13px;
  color: #303133;
}

.detail-block {
  margin-bottom: 16px;
}

.block-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.block-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  white-space: pre-wrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ticket-steps {
  margin-bottom: 16px;

  :deep(.el-step__title) {
    font-size: 12px;
  }
}

.rich-content {
  :deep(img) {
    max-width: 100%;
    cursor: zoom-in;
  }
}
</style>
