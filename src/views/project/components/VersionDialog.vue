<template>
  <el-dialog :model-value="visible" :title="title" width="720px" destroy-on-close @update:model-value="$emit('update:visible', $event)">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" class="version-form">
      <div class="form-group">
        <div class="form-group__title">基本信息</div>
        <el-form-item label="版本名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入版本名称" />
        </el-form-item>
        <el-form-item label="关联需求">
          <el-select v-model="form.story" placeholder="请选择关联需求（可选）" clearable filterable style="width: 100%">
            <el-option v-for="s in storyOptions" :key="s.id" :label="s.title" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="form.projectIds" placeholder="请选择关联项目（可多选）" multiple clearable filterable style="width: 100%">
            <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </div>
      <div class="form-group">
        <div class="form-group__title">团队与状态</div>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="产品经理" prop="manager">
              <el-select v-model="form.manager" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="u in pmUserList" :key="u.id" :label="u.label" :value="u.id">
                  <div class="user-option">
                    <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                    <span>{{ u.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option label="未开始" value="未开始" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
                <el-option label="已暂停" value="已暂停" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="开发负责人" prop="devLeader">
              <el-select v-model="form.devLeader" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="u in devUserList" :key="u.id" :label="u.label" :value="u.id">
                  <div class="user-option">
                    <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                    <span>{{ u.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测试负责人" prop="testLeader">
              <el-select v-model="form.testLeader" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="u in testUserList" :key="u.id" :label="u.label" :value="u.id">
                  <div class="user-option">
                    <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                    <span>{{ u.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      <div class="form-group">
        <div class="form-group__title">周期与描述</div>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="选择开始日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="选择结束日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="版本描述">
          <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="请输入版本描述" />
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
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createVersion, updateVersion } from '@/api/version';

const props = defineProps({
  visible: Boolean,
  editingId: { type: Number, default: null },
  initialForm: { type: Object, default: null },
  storyOptions: { type: Array, default: () => [] },
  projectOptions: { type: Array, default: () => [] },
  pmUserList: { type: Array, default: () => [] },
  devUserList: { type: Array, default: () => [] },
  testUserList: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'saved']);

const formRef = ref(null);
const title = ref('新建版本');

const defaultForm = () => ({
  name: '',
  story: null,
  projectIds: [],
  manager: null,
  devLeader: null,
  testLeader: null,
  status: '未开始',
  startDate: '',
  endDate: '',
  desc: '',
});

const form = ref(defaultForm());

const formRules = {
  name: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    title.value = props.editingId ? '编辑版本' : '新建版本';
    form.value = props.initialForm ? { ...props.initialForm } : defaultForm();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const payload = {
      name: form.value.name,
      story: form.value.story || null,
      project_ids: form.value.projectIds || [],
      manager: form.value.manager || null,
      dev_leader: form.value.devLeader || null,
      test_leader: form.value.testLeader || null,
      status: form.value.status,
      start_date: form.value.startDate || null,
      end_date: form.value.endDate || null,
      description: form.value.desc || '',
    };
    if (props.editingId) {
      await updateVersion(props.editingId, payload);
      ElMessage.success('版本已更新');
    } else {
      await createVersion(payload);
      ElMessage.success('版本已创建');
    }
    emit('update:visible', false);
    emit('saved');
  } catch {
    // validation or request failed
  }
};
</script>

<style scoped lang="scss">
.version-form {
  .form-group {
    margin-bottom: 20px;
    padding: 16px 16px 4px;
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid #f0f2f5;

    &:last-child { margin-bottom: 0; }

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
</style>
