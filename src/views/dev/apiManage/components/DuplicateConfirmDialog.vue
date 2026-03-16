<template>
  <el-dialog
    :model-value="visible"
    title="检测到重复接口"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @closed="strategy = 'skip'"
  >
    <div class="duplicate-body">
      <!-- 统计摘要 -->
      <div class="summary">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <span>
          本次共导入 <strong>{{ total }}</strong> 个接口，其中
          <strong class="dup-count">{{ duplicateCount }}</strong> 个与已有接口重复（路径 + 方法相同）
        </span>
      </div>

      <!-- 重复接口列表 -->
      <el-table :data="duplicates" size="small" max-height="220" class="dup-table">
        <el-table-column label="接口名称" prop="name" min-width="140" show-overflow-tooltip />
        <el-table-column label="路径" prop="path" min-width="160" show-overflow-tooltip />
        <el-table-column label="方法" prop="method" width="80">
          <template #default="{ row }">
            <el-tag :type="methodTagType(row.method)" size="small" effect="plain">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 处理策略选择 -->
      <div class="strategy-section">
        <p class="strategy-label">请选择处理方式：</p>
        <el-radio-group v-model="strategy" class="strategy-group">
          <el-radio value="overwrite" class="strategy-radio">
            <span class="radio-title">覆盖重复接口</span>
            <span class="radio-desc">用新数据覆盖已有记录</span>
          </el-radio>
          <el-radio value="skip" class="strategy-radio">
            <span class="radio-title">跳过重复接口</span>
            <span class="radio-desc">保留已有记录，只导入新接口</span>
          </el-radio>
        </el-radio-group>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { Warning } from '@element-plus/icons-vue';

defineProps({
  visible: { type: Boolean, default: false },
  duplicates: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  duplicateCount: { type: Number, default: 0 },
});
const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const strategy = ref('skip');

const METHOD_TAG_TYPE = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'info',
  DELETE: 'danger',
};
const methodTagType = (m) => METHOD_TAG_TYPE[(m || '').toUpperCase()] || '';

function handleVisibleChange(val) {
  if (!val) handleCancel();
}

function handleCancel() {
  emit('cancel');
  emit('update:visible', false);
}

function handleConfirm() {
  emit('confirm', strategy.value);
  emit('update:visible', false);
}
</script>

<style scoped lang="scss">
.duplicate-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  padding: 12px 14px;

  .warning-icon {
    font-size: 18px;
    color: #e6a23c;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .dup-count {
    color: #e6a23c;
  }
}

.dup-table {
  border-radius: 4px;
}

.strategy-section {
  .strategy-label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 10px;
  }

  .strategy-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .strategy-radio {
    display: flex;
    align-items: center;
    gap: 6px;
    height: auto;

    .radio-title {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
    }

    .radio-desc {
      font-size: 12px;
      color: #909399;
      margin-left: 4px;
    }
  }
}
</style>
