<template>
  <div class="module-container">
    <el-card class="filter-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="模块名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入模块名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="启用" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="handleAdd(null)">
            <el-icon><Plus /></el-icon>新建模块
          </el-button>
          <span class="total">共 {{ flatModules.length }} 个模块</span>
        </div>
      </template>

      <el-table
        :data="modules"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="name" label="模块名称" min-width="240">
          <template #default="{ row }">
            <span class="module-id-badge">{{ row.id }}</span>
            <span>{{ row.name }}</span>
            <span class="xmind-hint">【{{ row.id }}】|| {{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleAdd(row)">添加子模块</el-button>
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="父模块">
          <el-cascader
            v-model="form.parentPath"
            :options="moduleTreeOptions"
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children', emitPath: true }"
            placeholder="无（顶级模块）"
            clearable
            filterable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="模块名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" value="启用" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getModuleList,
  getModuleFlatList,
  createModule,
  updateModule,
  deleteModule,
} from '@/api/module';

const queryParams = ref({ name: '', status: '' });
const modules = ref([]);
const flatModules = ref([]);

// 将树形模块数据转为 cascader 所需格式（排除当前编辑的节点，避免自引用，最多 3 层可选作为父级）
const moduleTreeOptions = computed(() => {
  const buildOptions = (nodes, depth = 1) => nodes
    .filter((n) => n.id !== editingId.value)
    .map((n) => ({
      id: n.id,
      name: n.name,
      // 父级最多选到第 3 层（子模块挂上去就是第 4 层）
      children: n.children && n.children.length && depth < 3
        ? buildOptions(n.children, depth + 1)
        : undefined,
    }));
  return buildOptions(modules.value);
});

const fetchList = async () => {
  try {
    const params = {};
    if (queryParams.value.name) params.name = queryParams.value.name;
    if (queryParams.value.status) params.status = queryParams.value.status;
    const res = await getModuleList(params);
    modules.value = res.data || [];
  } catch {
    // 获取模块列表失败
  }
};

const fetchFlatList = async () => {
  try {
    const res = await getModuleFlatList();
    flatModules.value = res.data || [];
  } catch {
    // 获取扁平模块列表失败
  }
};

onMounted(() => {
  fetchList();
  fetchFlatList();
});

const handleSearch = () => { fetchList(); };
const handleReset = () => {
  queryParams.value = { name: '', status: '' };
  fetchList();
};

const dialogVisible = ref(false);
const dialogTitle = ref('新建模块');
const formRef = ref(null);
const editingId = ref(null);

const form = ref({
  parentPath: [],
  name: '',
  description: '',
  status: '启用',
});

const formRules = {
  name: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
};

// 根据 parent id 在树中找完整路径
const findParentPath = (nodes, targetId, path = []) => nodes.reduce((result, node) => {
  if (result) return result;
  if (node.id === targetId) return [...path, node.id];
  if (node.children) return findParentPath(node.children, targetId, [...path, node.id]);
  return null;
}, null);

const handleAdd = (parentRow) => {
  editingId.value = null;
  dialogTitle.value = '新建模块';
  form.value = {
    parentPath: parentRow ? findParentPath(modules.value, parentRow.id) || [parentRow.id] : [],
    name: '',
    description: '',
    status: '启用',
  };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  editingId.value = row.id;
  dialogTitle.value = '编辑模块';
  form.value = {
    parentPath: row.parent ? findParentPath(modules.value, row.parent) || [row.parent] : [],
    name: row.name,
    description: row.description || '',
    status: row.status,
  };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    const payload = {
      name: form.value.name,
      description: form.value.description,
      parent: form.value.parentPath && form.value.parentPath.length
        ? form.value.parentPath[form.value.parentPath.length - 1]
        : null,
      status: form.value.status,
    };
    if (editingId.value) {
      await updateModule(editingId.value, payload);
      ElMessage.success('模块已更新');
    } else {
      await createModule(payload);
      ElMessage.success('模块已创建');
    }
    dialogVisible.value = false;
    fetchList();
    fetchFlatList();
  } catch {
    // 校验失败或请求失败
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定删除模块「'.concat(row.name, '」？删除后子模块也将一并删除。'),
    '提示',
    { type: 'warning' },
  )
    .then(async () => {
      await deleteModule(row.id);
      ElMessage.success('已删除');
      fetchList();
      fetchFlatList();
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.module-container {
  padding: 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total {
  color: #909399;
  font-size: 13px;
}

.xmind-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #c0c4cc;
}

.module-id-badge {
  display: inline-block;
  min-width: 28px;
  margin-right: 8px;
  padding: 0 5px;
  height: 18px;
  line-height: 18px;
  font-size: 11px;
  border-radius: 3px;
  background: #f0f2f5;
  color: #909399;
  text-align: center;
  vertical-align: middle;
}
</style>
