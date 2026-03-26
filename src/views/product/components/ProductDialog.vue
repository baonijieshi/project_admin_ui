<template>
  <el-dialog :model-value="visible" :title="title" width="520px" destroy-on-close @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="产品代号">
        <el-input v-model="form.code" placeholder="请输入产品代号" />
      </el-form-item>
      <el-form-item label="产品线">
        <el-input v-model="form.line" placeholder="请输入产品线" />
      </el-form-item>
      <el-form-item label="负责人">
        <UserCascader v-model="form.owner" :user-list="userOptions" placeholder="请选择负责人" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option label="活跃" value="活跃" />
          <el-option label="已关闭" value="已关闭" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入产品描述" />
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
import { createProduct, updateProduct } from '@/api/product';
import UserCascader from '@/components/UserCascader.vue';

const props = defineProps({
  visible: Boolean,
  editingId: { type: Number, default: null },
  initialForm: { type: Object, default: null },
  userOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('新建产品');

const defaultForm = () => ({
  name: '',
  code: '',
  line: '',
  owner: null,
  status: '活跃',
  description: '',
});

const form = ref(defaultForm());

const formRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑产品' : '新建产品';
    form.value = props.initialForm ? { ...props.initialForm } : defaultForm();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (props.editingId) {
      await updateProduct(props.editingId, form.value);
      ElMessage.success('产品已更新');
    } else {
      await createProduct(form.value);
      ElMessage.success('产品已创建');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style scoped lang="scss">
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>
