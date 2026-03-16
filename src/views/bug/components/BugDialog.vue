<template>
  <el-dialog :model-value="visible" :title="title" width="750px" destroy-on-close @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="bugForm" :rules="bugFormRules" label-width="90px">
      <el-form-item label="Bug标题" prop="title">
        <el-input v-model="bugForm.title" placeholder="请输入Bug标题" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Bug类型" prop="bugType">
            <el-select v-model="bugForm.bugType" placeholder="请选择类型" style="width: 100%">
              <el-option label="代码错误" value="代码错误" />
              <el-option label="界面优化" value="界面优化" />
              <el-option label="设计缺陷" value="设计缺陷" />
              <el-option label="性能问题" value="性能问题" />
              <el-option label="安全相关" value="安全相关" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属模块">
            <el-select v-model="bugForm.module" placeholder="请选择模块（可选）" clearable filterable style="width: 100%">
              <el-option v-for="m in moduleOptions" :key="m.id" :label="m.fullName" :value="m.name" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="严重程度" prop="severity">
            <el-select v-model="bugForm.severity" placeholder="请选择" style="width: 100%">
              <el-option v-for="s in severityOptions" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="bugForm.priority" placeholder="请选择" style="width: 100%">
              <el-option label="P0 - 最高" value="P0" />
              <el-option label="P1 - 高" value="P1" />
              <el-option label="P2 - 中" value="P2" />
              <el-option label="P3 - 低" value="P3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="指派给" prop="assignee">
            <el-select v-model="bugForm.assignee" placeholder="请选择" filterable style="width: 100%">
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
          <el-form-item label="所属项目">
            <el-select v-model="bugForm.project" placeholder="请选择项目（可选）" clearable filterable style="width: 100%">
              <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="关联版本">
            <el-select v-model="bugForm.versionId" placeholder="请选择版本（可选）" clearable filterable style="width: 100%">
              <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关联用例">
            <el-input v-model="bugForm.caseId" placeholder="关联的测试用例ID" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="重现步骤" prop="stepsToReproduce">
        <div style="border: 1px solid #dcdfe6; border-radius: 4px; width: 100%; overflow: visible; position: relative; z-index: 1">
          <Toolbar :editor="editorRef" :default-config="toolbarConfig" style="border-bottom: 1px solid #dcdfe6" />
          <Editor
            v-model="bugForm.stepsToReproduce"
            :default-config="editorConfig"
            style="height: 300px; overflow-y: hidden"
            mode="simple"
            @on-created="onEditorCreated"
          />
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="bugForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
import '@wangeditor/editor/dist/css/style.css';
import { createBug, updateBug } from '@/api/bug';
import { getModuleFlatList } from '@/api/module';
import request from '@/utils/request';

const props = defineProps({
  visible: Boolean,
  editingId: {
    type: Number,
    default: null,
  },
  initialForm: {
    type: Object,
    default: null,
  },
  userList: {
    type: Array,
    default: () => [],
  },
  projectList: {
    type: Array,
    default: () => [],
  },
  versionOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('提交Bug');
const severityOptions = ['致命', '严重', '一般', '轻微', '建议'];

const moduleOptions = ref([]);
const fetchModules = async () => {
  try {
    const res = await getModuleFlatList();
    moduleOptions.value = res.data || [];
  } catch {
    // 获取模块列表失败
  }
};

const editorRef = shallowRef(null);
const toolbarConfig = {};
const editorConfig = {
  placeholder: '请详细描述重现步骤，支持直接粘贴图片...',
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

const onEditorCreated = (editor) => { editorRef.value = editor; };

onBeforeUnmount(() => {
  if (editorRef.value) editorRef.value.destroy();
});

const defaultBugForm = () => ({
  title: '',
  module: '',
  bugType: '代码错误',
  severity: '一般',
  priority: 'P1',
  assignee: null,
  project: null,
  versionId: null,
  caseId: null,
  stepsToReproduce: '',
  remark: '',
});

const bugForm = ref(defaultBugForm());

const bugFormRules = {
  title: [{ required: true, message: '请输入Bug标题', trigger: 'blur' }],
  bugType: [{ required: true, message: '请选择Bug类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  assignee: [{ required: true, message: '请选择指派人', trigger: 'change' }],
  stepsToReproduce: [{ required: true, message: '请输入重现步骤', trigger: 'blur' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑Bug' : '提交Bug';
    bugForm.value = props.initialForm ? { ...defaultBugForm(), ...props.initialForm } : defaultBugForm();
    fetchModules();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const payload = {
      title: bugForm.value.title,
      module: bugForm.value.module || '',
      bug_type: bugForm.value.bugType,
      severity: bugForm.value.severity,
      priority: bugForm.value.priority,
      assignee: bugForm.value.assignee,
      project: bugForm.value.project || null,
      version: bugForm.value.versionId || null,
      case: bugForm.value.caseId,
      steps_to_reproduce: bugForm.value.stepsToReproduce,
      remark: bugForm.value.remark,
    };
    if (props.editingId) {
      await updateBug(props.editingId, payload);
      ElMessage.success('Bug已更新');
    } else {
      await createBug(payload);
      ElMessage.success('Bug已提交');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // 校验失败或请求失败
  }
};
</script>

<style scoped>
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
