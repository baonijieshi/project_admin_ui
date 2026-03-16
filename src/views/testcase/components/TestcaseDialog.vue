<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="750px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="关联版本">
            <el-select
              v-model="form.versionId"
              placeholder="请选择版本（可选）"
              clearable
              style="width: 100%"
            >
              <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属模块">
            <el-select
              v-model="form.module"
              placeholder="请选择模块（可选）"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option v-for="m in moduleOptions" :key="m.id" :label="m.name" :value="m.name" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用例类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
              <el-option label="功能测试" value="功能测试" />
              <el-option label="性能测试" value="性能测试" />
              <el-option label="接口测试" value="接口测试" />
              <el-option label="安全测试" value="安全测试" />
              <el-option label="兼容性测试" value="兼容性测试" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择" style="width: 100%">
              <el-option label="P0 - 最高" value="P0" />
              <el-option label="P1 - 高" value="P1" />
              <el-option label="P2 - 中" value="P2" />
              <el-option label="P3 - 低" value="P3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="用例标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入用例标题" />
      </el-form-item>
      <el-form-item label="关联需求">
        <el-select
          v-model="form.storyId"
          placeholder="请选择关联需求"
          clearable
          style="width: 100%"
        >
          <el-option v-for="s in storyOptions" :key="s.id" :label="s.title" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="前置条件">
        <el-input v-model="form.precondition" type="textarea" :rows="2" placeholder="请输入前置条件" />
      </el-form-item>
      <el-form-item label="测试步骤">
        <div class="steps-wrapper">
          <el-table :data="form.steps" size="small">
            <el-table-column label="步骤" width="60" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="步骤描述" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.desc" placeholder="输入步骤描述" />
              </template>
            </el-table-column>
            <el-table-column label="预期结果" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.expect" placeholder="输入预期结果" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  link
                  type="danger"
                  :disabled="form.steps.length <= 1"
                  @click="removeStep($index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button class="add-step-btn" size="small" @click="addStep">
            <el-icon><Plus /></el-icon>添加步骤
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createTestcase, updateTestcase } from '@/api/testcase';

const props = defineProps({
  visible: Boolean,
  editingId: { type: Number, default: null },
  initialForm: { type: Object, default: null },
  versionOptions: { type: Array, default: () => [] },
  storyOptions: { type: Array, default: () => [] },
  moduleOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('新建用例');

const defaultForm = () => ({
  versionId: null,
  module: '',
  type: '功能测试',
  title: '',
  priority: 'P1',
  storyId: null,
  precondition: '',
  steps: [{ desc: '', expect: '' }],
  remark: '',
});

const form = ref(defaultForm());

const formRules = {
  title: [{ required: true, message: '请输入用例标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择用例类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑用例' : '新建用例';
    form.value = props.initialForm
      ? { ...props.initialForm, steps: props.initialForm.steps.map((s) => ({ ...s })) }
      : defaultForm();
  }
});

const addStep = () => { form.value.steps.push({ desc: '', expect: '' }); };
const removeStep = (i) => { form.value.steps.splice(i, 1); };

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const payload = {
      ...form.value,
      version: form.value.versionId || null,
      story: form.value.storyId || null,
    };
    delete payload.versionId;
    delete payload.storyId;
    if (props.editingId) {
      await updateTestcase(props.editingId, payload);
      ElMessage.success('用例已更新');
    } else {
      await createTestcase(payload);
      ElMessage.success('用例已创建');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style scoped lang="scss">
.steps-wrapper {
  width: 100%;

  .add-step-btn {
    margin-top: 8px;
  }
}
</style>
