<template>
  <div class="project-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">项目管理</h2>
        <span class="page-subtitle">{{ filteredProjects.length }} 个项目</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新建项目</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="queryParams.name"
        placeholder="搜索项目名称"
        clearable
        :prefix-icon="Search"
        style="width: 220px"
        @input="handleSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="queryParams.status"
        placeholder="全部状态"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option label="启用" value="启用" />
        <el-option label="禁用" value="禁用" />
      </el-select>
      <el-button
        v-if="queryParams.name || queryParams.status"
        link
        type="primary"
        @click="handleReset"
      >清除筛选</el-button>
    </div>

    <!-- 项目卡片网格 -->
    <div v-if="filteredProjects.length > 0" v-loading="loading" class="project-grid">
      <div
        v-for="proj in filteredProjects"
        :key="proj.id"
        class="project-card"
        :class="{ 'is-disabled': proj.status === '禁用' }"
        @click="handleDetail(proj)"
      >
        <div class="project-card__header">
          <div class="project-card__title-row">
            <span class="project-card__name">{{ proj.name }}</span>
            <el-tag
              :type="proj.status === '启用' ? 'success' : 'info'"
              size="small"
              effect="plain"
              round
            >{{ proj.status }}</el-tag>
          </div>
          <div class="project-card__actions" @click.stop>
            <el-button size="small" link type="primary" @click="handleEdit(proj)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(proj)">删除</el-button>
          </div>
        </div>

        <div v-if="proj.description" class="project-card__desc" v-html="proj.description" />
        <p v-else class="project-card__desc project-card__desc--empty">暂无描述</p>

        <div class="project-card__footer">
          <div class="version-tags">
            <template v-if="proj.version_names && proj.version_names.length">
              <el-tag
                v-for="v in proj.version_names.slice(0, 3)"
                :key="v"
                size="small"
                effect="plain"
                round
              >{{ v }}</el-tag>
              <span v-if="proj.version_names.length > 3" class="more-count">
                +{{ proj.version_names.length - 3 }}
              </span>
            </template>
            <span v-else class="no-version">未关联版本</span>
          </div>
          <span class="project-card__date">{{ formatDate(proj.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading" class="empty-state">
      <el-empty :image-size="120" description="">
        <template #description>
          <p class="empty-title">{{ hasFilter ? '没有匹配的项目' : '还没有项目' }}</p>
          <p class="empty-desc">{{ hasFilter ? '试试调整筛选条件' : '创建第一个项目来开始' }}</p>
        </template>
        <el-button v-if="!hasFilter" type="primary" @click="handleAdd">新建项目</el-button>
        <el-button v-else @click="handleReset">清除筛选</el-button>
      </el-empty>
    </div>

    <!-- 编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      size="640px"
      direction="rtl"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="projectForm"
        :rules="formRules"
        label-width="80px"
        label-position="top"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="如 SLA预警通知、用户中心" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="projectForm.status">
            <el-radio-button label="启用" value="启用" />
            <el-radio-button label="禁用" value="禁用" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联版本">
          <el-select
            v-model="projectForm.versionIds"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择关联版本（可多选）"
            style="width: 100%"
          >
            <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述">
          <div class="editor-wrap">
            <Toolbar :editor="editorRef" :default-config="toolbarConfig" style="border-bottom: 1px solid #dcdfe6" />
            <Editor
              v-model="projectForm.description"
              :default-config="editorConfig"
              style="height: 260px; overflow-y: hidden"
              @on-created="onEditorCreated"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-drawer>

    <ProjectDetailDialog
      v-model:visible="detailVisible"
      :project="detailProject"
    />
  </div>
</template>

<script setup>
import {
  ref, computed, onMounted, shallowRef, onBeforeUnmount,
} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import {
  getProjectList, createProject, updateProject, deleteProject,
} from '@/api/project';
import { getVersionList } from '@/api/version';
import request from '@/utils/request';
import ProjectDetailDialog from './components/ProjectDetailDialog.vue';

const loading = ref(false);
const submitting = ref(false);
const projects = ref([]);
const versionOptions = ref([]);
const queryParams = ref({ name: '', status: '' });

// 富文本编辑器
const editorRef = shallowRef(null);
const toolbarConfig = {};
const editorConfig = {
  placeholder: '描述本项目的定位、目标、范围...',
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
onBeforeUnmount(() => { if (editorRef.value) editorRef.value.destroy(); });

const hasFilter = computed(() => queryParams.value.name || queryParams.value.status);

const filteredProjects = computed(() => projects.value.filter((p) => {
  if (queryParams.value.name && !p.name.includes(queryParams.value.name)) return false;
  if (queryParams.value.status && p.status !== queryParams.value.status) return false;
  return true;
}));

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getProjectList({});
    projects.value = res.data || [];
  } catch { /* ignore */ } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  fetchList();
  try {
    const res = await getVersionList({ page: 1, pageSize: 999 });
    versionOptions.value = (res.data.list || []).map((v) => ({
      id: v.id,
      name: v.name,
    }));
  } catch { /* ignore */ }
});

const handleSearch = () => {};
const handleReset = () => {
  queryParams.value = { name: '', status: '' };
};

/* ── 抽屉表单 ── */
const drawerVisible = ref(false);
const drawerTitle = ref('新建项目');
const formRef = ref(null);
const editingId = ref(null);
const defaultForm = () => ({
  name: '',
  description: '',
  status: '启用',
  versionIds: [],
});
const projectForm = ref(defaultForm());
const formRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
};

const handleAdd = () => {
  editingId.value = null;
  drawerTitle.value = '新建项目';
  projectForm.value = defaultForm();
  drawerVisible.value = true;
};
const handleEdit = (row) => {
  editingId.value = row.id;
  drawerTitle.value = `编辑项目 · ${row.name}`;
  projectForm.value = {
    name: row.name,
    description: row.description || '',
    status: row.status,
    versionIds: row.version_ids || [],
  };
  drawerVisible.value = true;
};
const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    submitting.value = true;
    const payload = {
      ...projectForm.value,
      version_ids: projectForm.value.versionIds,
    };
    if (editingId.value) {
      await updateProject(editingId.value, payload);
      ElMessage.success('项目已更新');
    } else {
      await createProject(payload);
      ElMessage.success('项目已创建');
    }
    drawerVisible.value = false;
    fetchList();
  } catch { /* ignore */ } finally {
    submitting.value = false;
  }
};
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除项目「${row.name}」？删除后不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
    .then(async () => {
      await deleteProject(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};

/* ── 详情 ── */
const detailVisible = ref(false);
const detailProject = ref(null);
const handleDetail = (proj) => {
  detailProject.value = { ...proj };
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.project-page {
  padding: 24px;
}

/* ── 页头 ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.page-subtitle {
  font-size: 13px;
  color: #909399;
}

/* ── 筛选栏 ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* ── 项目卡片网格 ── */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.project-card {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &.is-disabled {
    background: #fafbfc;
    opacity: 0.7;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }
  &:hover &__actions { opacity: 1; }

  &__desc {
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
    margin: 0 0 auto;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
    word-break: break-word;

    :deep(p) { margin: 0; }
    :deep(img) { display: none; }
    :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
      font-size: inherit;
      margin: 0;
      font-weight: 500;
    }
    :deep(ul), :deep(ol) { margin: 0; padding-left: 16px; }
    :deep(table) { display: none; }
    :deep(blockquote) { margin: 0; padding: 0; border: none; }

    &--empty {
      color: #c0c4cc;
      font-style: italic;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-extra-light);
    gap: 8px;
  }
  &__date {
    font-size: 12px;
    color: #c0c4cc;
    flex-shrink: 0;
  }
}

/* ── 版本标签 ── */
.version-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.no-version {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
}
.more-count {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

/* ── 空状态 ── */
.empty-state {
  padding: 60px 0;
}
.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 4px;
}
.empty-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px;
}

/* ── 富文本编辑器 ── */
.editor-wrap {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  width: 100%;
  overflow: hidden;
}
</style>

<style src="@wangeditor/editor/dist/css/style.css" />
