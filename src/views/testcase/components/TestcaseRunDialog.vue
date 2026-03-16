<template>
  <el-drawer
    :model-value="visible"
    size="760px"
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="run-header">
        <div class="run-title">
          执行用例
          <el-tag v-if="batchQueue.length > 1" size="small" type="info" style="margin-left:8px">
            {{ batchIndex + 1 }} / {{ batchQueue.length }}
          </el-tag>
        </div>
        <div v-if="runCase" class="run-case-name">{{ runCase.title }}</div>
        <div v-if="runCase?.precondition" class="run-precondition">
          <el-icon><InfoFilled /></el-icon>前置条件：{{ runCase.precondition }}
        </div>
      </div>
    </template>

    <!-- 进度条（批量执行时） -->
    <div v-if="batchQueue.length > 1" class="batch-progress">
      <el-progress
        :percentage="Math.round((batchIndex / batchQueue.length) * 100)"
        :stroke-width="4"
        :show-text="false"
      />
    </div>

    <!-- 步骤列表 -->
    <div class="steps-run-list">
      <div
        v-for="(step, idx) in runSteps"
        :key="idx"
        class="step-run-item"
        :class="{ 'is-pass': step.result === '通过', 'is-fail': step.result === '失败', 'is-block': step.result === '阻塞' }"
      >
        <div class="step-run-header">
          <div class="step-run-num">{{ idx + 1 }}</div>
          <div class="step-run-info">
            <div class="step-run-desc">{{ step.desc }}</div>
            <div class="step-run-expect">预期：{{ step.expect }}</div>
          </div>
          <!-- 快捷结果按钮 -->
          <div class="step-run-actions">
            <el-button
              size="small"
              :type="step.result === '通过' ? 'success' : 'default'"
              :plain="step.result !== '通过'"
              @click="step.result = '通过'"
            >通过</el-button>
            <el-button
              size="small"
              :type="step.result === '失败' ? 'danger' : 'default'"
              :plain="step.result !== '失败'"
              @click="step.result = '失败'"
            >失败</el-button>
            <el-button
              size="small"
              :type="step.result === '阻塞' ? 'warning' : 'default'"
              :plain="step.result !== '阻塞'"
              @click="step.result = '阻塞'"
            >阻塞</el-button>
          </div>
        </div>

        <!-- 失败时展开实际结果 + 提Bug -->
        <div v-if="step.result === '失败' || step.result === '阻塞'" class="step-run-actual">
          <el-input
            v-model="step.actual"
            :placeholder="`实际结果（选填）`"
            size="small"
            style="flex:1"
          />
          <el-button
            v-if="step.result === '失败'"
            size="small"
            type="danger"
            plain
            @click="$emit('submit-bug-from-step', idx)"
          >
            <el-icon><Warning /></el-icon>提 Bug
          </el-button>
        </div>
      </div>
    </div>

    <!-- 汇总 -->
    <div v-if="runSteps.length > 0" class="run-summary">
      <span class="summary-item pass">通过 {{ passCount }}</span>
      <span class="summary-item fail">失败 {{ failCount }}</span>
      <span class="summary-item block">阻塞 {{ blockCount }}</span>
      <span class="summary-item pending">未填 {{ pendingCount }}</span>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button v-if="hasFailedStep" type="danger" plain @click="$emit('submit-bug-from-run')">
        <el-icon><Warning /></el-icon>提交整体 Bug
      </el-button>
      <el-button type="primary" :disabled="pendingCount > 0" @click="handleSubmit">
        {{ batchQueue.length > 1 && batchIndex < batchQueue.length - 1 ? '提交并执行下一条' : '提交结果' }}
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled, Warning } from '@element-plus/icons-vue';
import { runTestcase } from '@/api/testcase';

const props = defineProps({
  visible: Boolean,
  runCase: { type: Object, default: null },
  runSteps: { type: Array, default: () => [] },
  batchQueue: { type: Array, default: () => [] },
  batchIndex: { type: Number, default: 0 },
});

const emit = defineEmits(['update:visible', 'next', 'done', 'submit-bug-from-step', 'submit-bug-from-run']);

const passCount = computed(() => props.runSteps.filter((s) => s.result === '通过').length);
const failCount = computed(() => props.runSteps.filter((s) => s.result === '失败').length);
const blockCount = computed(() => props.runSteps.filter((s) => s.result === '阻塞').length);
const pendingCount = computed(() => props.runSteps.filter((s) => !s.result).length);
const hasFailedStep = computed(() => failCount.value > 0);

function getFinalResult() {
  if (failCount.value > 0) return '失败';
  if (blockCount.value > 0) return '阻塞';
  return '通过';
}

const handleSubmit = async () => {
  if (pendingCount.value > 0) { ElMessage.warning('请为每个步骤选择执行结果'); return; }
  const finalResult = getFinalResult();
  try {
    await runTestcase(props.runCase.id, { result: finalResult });
    ElMessage.success(`执行完成，结果：${finalResult}`);
    const nextIndex = props.batchIndex + 1;
    if (props.batchQueue.length > 0 && nextIndex < props.batchQueue.length) {
      emit('next', nextIndex);
    } else {
      emit('done');
      emit('update:visible', false);
    }
  } catch { ElMessage.error('提交执行结果失败'); }
};
</script>

<style scoped lang="scss">
.run-header {
  flex: 1;
}

.run-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.run-case-name {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.run-precondition {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 4px 8px;
  border-radius: 4px;
}

.batch-progress { margin-bottom: 16px; }

.steps-run-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-run-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color 0.2s, background 0.2s;

  &.is-pass  { border-color: #b3e19d; background: #f0f9eb; }
  &.is-fail  { border-color: #fab6b6; background: #fef0f0; }
  &.is-block { border-color: #f3d19e; background: #fdf6ec; }
}

.step-run-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.step-run-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-run-info {
  flex: 1;
  min-width: 0;
}

.step-run-desc {
  font-size: 13px;
  color: #303133;
  margin-bottom: 3px;
}

.step-run-expect {
  font-size: 12px;
  color: #909399;
}

.step-run-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.step-run-actual {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.run-summary {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;

  .summary-item {
    font-weight: 500;
    &.pass  { color: #67c23a; }
    &.fail  { color: #f56c6c; }
    &.block { color: #e6a23c; }
    &.pending { color: #909399; }
  }
}
</style>
