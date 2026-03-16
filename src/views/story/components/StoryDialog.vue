<template>
  <el-dialog :model-value="visible" :title="title" width="800px" destroy-on-close @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
      <el-form-item label="需求标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入需求标题" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属产品" prop="product">
            <el-select v-model="form.product" placeholder="请选择产品" clearable style="width: 100%">
              <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
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
              <el-option label="激活" value="激活" />
              <el-option label="开发中" value="开发中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="已关闭" value="已关闭" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="指派给">
            <el-select v-model="form.assignee" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="u in userList" :key="u.id" :label="u.label" :value="u.id">
                <div class="user-option">
                  <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                  <span>{{ u.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="预估工时">
        <el-input v-model="form.estimate" placeholder="如：2h、0.5d、3d" style="width: 200px" />
      </el-form-item>
      <el-form-item label="描述">
        <div style="border: 1px solid #dcdfe6; border-radius: 4px; width: 100%">
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" style="border-bottom: 1px solid #dcdfe6" />
          <Editor
            v-model="form.description"
            :default-config="editorConfig"
            style="height: 260px; overflow-y: hidden"
            @on-created="onEditorCreated"
          />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {
  ref, watch, shallowRef, onBeforeUnmount,
} from 'vue';
import { ElMessage } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import { createStory, updateStory } from '@/api/story';
import request from '@/utils/request';

const props = defineProps({
  visible: Boolean,
  editingId: { type: Number, default: null },
  initialForm: { type: Object, default: null },
  productList: { type: Array, default: () => [] },
  userList: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('新建需求');
const editorRef = shallowRef(null);

const toolbarConfig = {};
const editorConfig = {
  placeholder: '请输入需求描述...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await request({
            url: '/upload/image',
            method: 'post',
            data: formData,
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
          });
          if (res.code === 200 && res.data?.url) {
            insertFn(res.data.url, file.name, res.data.url);
          } else {
            ElMessage.error('图片上传失败');
          }
        } catch {
          ElMessage.error('图片上传失败，请重试');
        }
      },
    },
  },
};

const onEditorCreated = (editor) => {
  editorRef.value = editor;
};

onBeforeUnmount(() => {
  if (editorRef.value) editorRef.value.destroy();
});

const defaultForm = () => ({
  title: '',
  product: null,
  priority: '中',
  status: '激活',
  assignee: null,
  estimate: '',
  description: '',
});

const form = ref(defaultForm());

const formRules = {
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑需求' : '新建需求';
    form.value = props.initialForm ? { ...props.initialForm } : defaultForm();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (props.editingId) {
      await updateStory(props.editingId, form.value);
      ElMessage.success('需求已更新');
    } else {
      await createStory(form.value);
      ElMessage.success('需求已创建');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style src="@wangeditor/editor/dist/css/style.css" />

<style scoped lang="scss">
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>
