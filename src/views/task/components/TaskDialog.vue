<template>
  <el-dialog :model-value="visible" :title="title" width="720px" destroy-on-close @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" class="task-form">
      <!-- ── 基本信息 ── -->
      <div class="form-group">
        <div class="form-group__title">基本信息</div>
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属版本" prop="version">
              <el-select v-model="form.version" placeholder="请选择版本" filterable clearable style="width: 100%">
                <el-option v-for="v in versionList" :key="v.id" :label="v.name" :value="v.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
                <el-option label="开发" value="开发" />
                <el-option label="测试" value="测试" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── 人员与状态 ── -->
      <div class="form-group">
        <div class="form-group__title">人员与状态</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指派给">
              <el-select v-model="form.assignee" placeholder="请选择" clearable filterable style="width: 100%">
                <el-option v-for="u in userList" :key="u.id" :label="u.label" :value="u.id">
                  <div class="user-option">
                    <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                    <span>{{ u.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择" style="width: 100%">
                <el-option label="高" value="高" />
                <el-option label="中" value="中" />
                <el-option label="低" value="低" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="选择截止日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ── 进度与描述 ── -->
      <div class="form-group">
        <div class="form-group__title">进度与描述</div>
        <el-form-item label="进度">
          <div :class="['progress-slider', progressClass]" style="width: 100%">
            <el-slider
              v-model="form.progress"
              :step="5"
              show-stops
              :marks="{ 0: '0%', 50: '50%', 100: '100%' }"
              @change="onProgressChange"
            />
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="请输入任务描述" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createTask, updateTask } from '@/api/task';

const props = defineProps({
  visible: Boolean,
  editingId: { type: Number, default: null },
  initialForm: { type: Object, default: null },
  versionList: { type: Array, default: () => [] },
  userList: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('新建任务');
const statusOptions = ['未开始', '进行中', '已完成'];

const defaultForm = () => ({
  name: '',
  version: null,
  type: '开发',
  priority: '中',
  status: '未开始',
  assignee: null,
  deadline: '',
  progress: 0,
  description: '',
});

const form = ref(defaultForm());

const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  version: [{ required: true, message: '请选择所属版本', trigger: 'change' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
};

const progressClass = computed(() => {
  const p = form.value.progress || 0;
  if (p >= 100) return 'progress-done';
  if (p >= 70) return 'progress-high';
  if (p >= 30) return 'progress-mid';
  return 'progress-low';
});

const onProgressChange = (val) => {
  if (val === 100 && form.value.status !== '已完成') {
    form.value.status = '已完成';
    ElMessage.success('进度已满，状态自动更新为已完成');
  } else if (val < 100 && form.value.status === '已完成') {
    form.value.status = '进行中';
  }
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑任务' : '新建任务';
    form.value = props.initialForm ? { ...props.initialForm } : defaultForm();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (props.editingId) {
      await updateTask(props.editingId, form.value);
      ElMessage.success('任务已更新');
    } else {
      await createTask(form.value);
      ElMessage.success('任务已创建');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style scoped lang="scss">
.task-form {
  .form-group {
    margin-bottom: 20px;
    padding: 16px 16px 4px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid #f0f2f5;

    &:last-child {
      margin-bottom: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ebeef5;
    }
  }
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.progress-slider {
  &.progress-low :deep(.el-slider__bar) { background: #909399; }
  &.progress-mid :deep(.el-slider__bar) { background: #409eff; }
  &.progress-high :deep(.el-slider__bar) { background: #67c23a; }
  &.progress-done :deep(.el-slider__bar) { background: #67c23a; }

  &.progress-low :deep(.el-slider__button) { border-color: #909399; }
  &.progress-mid :deep(.el-slider__button) { border-color: #409eff; }
  &.progress-high :deep(.el-slider__button) { border-color: #67c23a; }
  &.progress-done :deep(.el-slider__button) { border-color: #67c23a; }
}
</style>
