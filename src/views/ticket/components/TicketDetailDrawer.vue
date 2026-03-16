<template>
  <div>
    <el-drawer
      :model-value="visible"
      title="工单详情"
      size="720px"
      destroy-on-close
      @update:model-value="$emit('update:visible', $event)"
    >
      <div v-if="row" class="drawer-body">

        <!-- 标题行 -->
        <div class="ticket-header">
          <span :class="['type-dot', `type-${row.ticket_type}`]" :title="row.ticket_type" />
          <span class="ticket-title">{{ row.title }}</span>
          <span :class="['step-badge', stepBadgeClass(row.status)]">{{ row.status }}</span>
        </div>

        <div class="ticket-id-row">
          <span class="ticket-id">{{ row.ticket_id }}</span>
          <span class="ticket-time">{{ row.created_at }}</span>
        </div>

        <!-- 基本信息 -->
        <div class="section">
          <div class="section-title">基本信息</div>
          <div class="desc-list">
            <div class="desc-row">
              <span class="desc-label">类型</span>
              <span class="desc-value">
                <span :class="['type-tag', `type-tag-${row.ticket_type}`]">{{ row.ticket_type }}</span>
              </span>
              <span class="desc-label">优先级</span>
              <span class="desc-value">
                <span :class="['pri-tag', `pri-${row.priority?.toLowerCase()}`]">{{ row.priority }}</span>
              </span>
            </div>
            <div class="desc-row">
              <span class="desc-label">问题模块</span>
              <span class="desc-value">{{ row.module_name || '-' }}</span>
              <span class="desc-label">提交人</span>
              <span class="desc-value">
                <span v-if="row.reporter_name" class="user-cell">
                  <el-avatar :size="18" :src="row.reporter_avatar || ''">
                    <span>{{ String(row.reporter_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ row.reporter_name }}
                </span>
                <span v-else>-</span>
              </span>
            </div>
            <div class="desc-row">
              <span class="desc-label">当前处理人</span>
              <span class="desc-value">
                <span v-if="row.assignee_name" class="user-cell">
                  <el-avatar :size="18" :src="row.assignee_avatar || ''">
                    <span>{{ String(row.assignee_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ row.assignee_name }}
                </span>
                <span v-else>-</span>
              </span>
              <span class="desc-label">测试处理人</span>
              <span class="desc-value">
                <span v-if="row.test_assignee_name" class="user-cell">
                  <el-avatar :size="18" :src="row.test_assignee_avatar || ''">
                    <span>{{ String(row.test_assignee_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ row.test_assignee_name }}
                </span>
                <span v-else>-</span>
              </span>
            </div>
            <div class="desc-row">
              <span class="desc-label">研发处理人</span>
              <span class="desc-value">
                <span v-if="row.dev_assignee_name" class="user-cell">
                  <el-avatar :size="18" :src="row.dev_assignee_avatar || ''">
                    <span>{{ String(row.dev_assignee_name).charAt(0) }}</span>
                  </el-avatar>
                  {{ row.dev_assignee_name }}
                </span>
                <span v-else>-</span>
              </span>
              <span class="desc-label" />
              <span class="desc-value" />
            </div>
          </div>
        </div>

        <!-- 流程进度 -->
        <div class="section">
          <div class="section-title">处理进度</div>
          <div class="steps-track">
            <div
              v-for="(s, i) in STEPS"
              :key="s"
              :class="['step-node', {
                done: i < currentStepIndex,
                active: i === currentStepIndex,
              }]"
            >
              <div class="step-circle">{{ i + 1 }}</div>
              <div class="step-label">{{ s }}</div>
            </div>
          </div>
        </div>

        <!-- 问题描述 -->
        <div class="section">
          <div class="section-title">问题描述</div>
          <div
            v-if="row.description"
            class="rich-block"
            v-html="row.description"
          />
          <div v-else class="empty-block">暂无描述</div>
        </div>

        <!-- 解决方案 -->
        <div v-if="row.solution" class="section">
          <div class="section-title">解决方案</div>
          <div class="text-block">{{ row.solution }}</div>
        </div>

        <!-- 备注 -->
        <div v-if="row.remark" class="section">
          <div class="section-title">备注</div>
          <div class="text-block">{{ row.remark }}</div>
        </div>

      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="$emit('update:visible', false)">关闭</el-button>
          <el-button type="primary" plain @click="$emit('edit', row)">编辑</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { STEPS, stepIndex } from '../ticketConstants';

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
});

defineEmits(['update:visible', 'edit']);

const currentStepIndex = computed(() => stepIndex(props.row?.status));

const stepBadgeClass = (status) => {
  if (status === '处理完成') return 'done';
  if (['研发解决中', '测试验收中'].includes(status)) return 'progress';
  if (['测试完成待发布', '交付验收中'].includes(status)) return 'review';
  return 'pending';
};
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 4px 0 24px;
}

/* 标题 */
.ticket-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.type-dot {
  display: inline-block;
  width: 4px;
  min-height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 3px;

  &.type-问题 { background: #f56c6c; }
  &.type-需求 { background: #409eff; }
  &.type-咨询 { background: #e6a23c; }
  &.type-其他 { background: #909399; }
}

.ticket-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.5;
  word-break: break-all;
}

.step-badge {
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  &.done    { background: #e8ffea; color: #00b42a; }
  &.progress { background: #fff7e8; color: #ff7d00; }
  &.review  { background: #e8f3ff; color: #165dff; }
  &.pending { background: #f2f3f5; color: #86909c; }
}

.ticket-id-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ticket-id {
  font-size: 12px;
  color: #409eff;
  font-family: monospace;
  background: #ecf5ff;
  padding: 1px 6px;
  border-radius: 3px;
}

.ticket-time {
  font-size: 12px;
  color: #86909c;
}

/* 分区 */
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #86909c;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f2f3f5;
}

/* 描述列表 */
.desc-list {
  display: flex;
  flex-direction: column;
}

.desc-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px 1fr;
  align-items: center;
  min-height: 36px;
  border-bottom: 1px solid #f7f8fa;

  &:last-child { border-bottom: none; }
}

.desc-label {
  font-size: 13px;
  color: #86909c;
  padding: 8px 12px 8px 0;
  white-space: nowrap;
}

.desc-value {
  font-size: 13px;
  color: #1d2129;
  padding: 8px 16px 8px 0;
}

/* tags */
.type-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;

  &.type-tag-问题 { background: #ffece8; color: #f53f3f; }
  &.type-tag-需求 { background: #e8f3ff; color: #165dff; }
  &.type-tag-咨询 { background: #fff7e8; color: #ff7d00; }
  &.type-tag-其他 { background: #f2f3f5; color: #86909c; }
}

.pri-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;

  &.pri-p0 { background: #ffece8; color: #f53f3f; }
  &.pri-p1 { background: #fff7e8; color: #ff7d00; }
  &.pri-p2 { background: #e8f3ff; color: #165dff; }
  &.pri-p3 { background: #f2f3f5; color: #86909c; }
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1d2129;
}

/* 进度轨道 */
.steps-track {
  display: flex;
  align-items: flex-start;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 4px;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 60px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: calc(-50% + 12px);
    right: calc(50% + 12px);
    height: 2px;
    background: #e4e7ed;
  }

  &:first-child::before { display: none; }

  &.done::before { background: #67c23a; }
  &.active::before { background: #409eff; }

  .step-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e4e7ed;
    color: #909399;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    transition: all 0.2s;
  }

  &.done .step-circle {
    background: #67c23a;
    color: #fff;
  }

  &.active .step-circle {
    background: #409eff;
    color: #fff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
  }

  .step-label {
    font-size: 11px;
    color: #909399;
    margin-top: 4px;
    text-align: center;
    line-height: 1.3;
    word-break: keep-all;
  }

  &.done .step-label { color: #67c23a; }
  &.active .step-label { color: #409eff; font-weight: 600; }
}

/* 内容块 */
.rich-block {
  font-size: 13px;
  line-height: 1.8;
  color: #1d2129;
  background: #f7f8fa;
  border-radius: 6px;
  padding: 12px 16px;

  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
    cursor: zoom-in;
  }
  :deep(p) { margin: 4px 0; }
  :deep(pre) {
    background: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
}

.text-block {
  font-size: 13px;
  line-height: 1.8;
  color: #1d2129;
  background: #f7f8fa;
  border-radius: 6px;
  padding: 12px 16px;
  white-space: pre-wrap;
}

.empty-block {
  font-size: 13px;
  color: #c9cdd4;
  padding: 12px 0;
}

/* footer */
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>
