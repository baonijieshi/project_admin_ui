<template>
  <el-dialog
    :model-value="visible"
    :title="editingSnowId ? '编辑 Mock' : '新建 Mock'"
    width="700px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="应用名称" prop="app_name">
        <el-input v-model="form.app_name" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="接口地址" prop="path">
        <el-input v-model="form.path" placeholder="请输入接口地址，如 /api/user/info" />
      </el-form-item>
      <el-form-item label="返回值" prop="re_data">
        <el-input
          v-model="form.re_data"
          type="textarea"
          :rows="10"
          placeholder='请输入 JSON 格式的返回值，如 {"code":200,"data":{}}'
        />
        <div v-if="jsonError" class="json-error">{{ jsonError }}</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { createMock } from '@/api/mock';

const props = defineProps({
  visible: Boolean,
  editingSnowId: { type: String, default: null },
  initialForm: { type: Object, default: null },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);

const defaultForm = () => ({
  app_name: '',
  path: '',
  re_data: '',
});

const form = ref(defaultForm());

const rules = {
  app_name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入接口地址', trigger: 'blur' }],
  re_data: [{ required: true, message: '请输入返回值', trigger: 'blur' }],
};

const jsonError = computed(() => {
  if (!form.value.re_data) return '';
  try {
    JSON.parse(form.value.re_data);
    return '';
  } catch (e) {
    return 'JSON 格式不正确：' + e.message;
  }
});

watch(() => props.visible, (val) => {
  if (val) {
    form.value = props.initialForm
      ? { ...defaultForm(), ...props.initialForm }
      : defaultForm();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (jsonError.value) {
      ElMessage.warning('请检查返回值的 JSON 格式');
      return;
    }
    const payload = {
      ...form.value,
      re_data: form.value.re_data,
    };
    if (props.editingSnowId) {
      payload.snow_id = props.editingSnowId;
    }
    await createMock(payload);
    ElMessage.success(props.editingSnowId ? 'Mock 已更新' : 'Mock 已创建');
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style scoped>
.json-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}
</style>
