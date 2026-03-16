<template>
  <div class="roles-container">
    <el-row :gutter="20">
      <!-- 左侧：角色列表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>角色列表</span>
              <el-button type="primary" size="small" @click="handleAddRole">
                <el-icon><Plus /></el-icon>新建角色
              </el-button>
            </div>
          </template>
          <el-table
            :data="roles"
            style="width: 100%"
            highlight-current-row
            @current-change="onRoleSelect"
          >
            <el-table-column type="index" label="" width="50" />
            <el-table-column prop="name" label="角色名称" min-width="100" />
            <el-table-column prop="memberCount" label="成员数" min-width="70" align="center" />
            <el-table-column label="操作" width="100" fixed="right" header-align="center">
              <template #default="{ row }">
                <el-button
                  size="small" link type="primary"
                  :disabled="row.isSystem"
                  @click.stop="handleEditRole(row)"
                >编辑</el-button>
                <el-button
                  size="small" link type="danger"
                  :disabled="row.isSystem"
                  @click.stop="handleDeleteRole(row)"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：权限配置 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>菜单权限配置{{ currentRole ? ' - '.concat(currentRole.name) : '' }}</span>
              <el-button
                v-if="currentRole"
                type="primary"
                size="small"
                @click="handleSavePermissions"
              >
                <el-icon><Check /></el-icon>保存权限
              </el-button>
            </div>
          </template>

          <div v-if="currentRole" class="permission-content">
            <div class="permission-toolbar">
              <el-checkbox
                v-model="checkAll"
                :indeterminate="isIndeterminate"
                @change="handleCheckAll"
              >全选 / 全不选</el-checkbox>
              <el-tag size="small" type="info">
                已选 {{ checkedCount }} / {{ totalMenuCount }} 项
              </el-tag>
            </div>

            <el-tree
              ref="treeRef"
              :data="menuTree"
              :props="treeProps"
              show-checkbox
              node-key="id"
              :default-checked-keys="currentRole.permissions"
              :default-expand-all="true"
              check-strictly
              @check="onTreeCheck"
            >
              <template #default="{ data }">
                <span class="tree-node">
                  <el-icon v-if="data.icon" style="margin-right: 4px">
                    <component :is="data.icon" />
                  </el-icon>
                  <span>{{ data.label }}</span>
                </span>
              </template>
            </el-tree>
          </div>

          <el-empty v-else description="请选择左侧角色查看权限配置" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建/编辑角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="450px" destroy-on-close>
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleFormRules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  ref, computed, nextTick, onMounted,
} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  saveRolePermissions,
  getMenuTree,
} from '@/api/role';

// 菜单树（从后端动态加载）
const menuTree = ref([]);
const allMenuIds = ref([]);
const totalMenuCount = ref(0);

function collectIds(items) {
  items.forEach((item) => {
    allMenuIds.value.push(item.id);
    if (item.children) collectIds(item.children);
  });
}

function toTreeShape(items) {
  return items.map((item) => ({
    id: item.perm_id,
    label: item.title,
    icon: item.icon,
    children: item.children ? toTreeShape(item.children) : undefined,
  }));
}

const fetchMenuTree = async () => {
  const res = await getMenuTree();
  const shaped = toTreeShape(res.data || []);
  menuTree.value = shaped;
  allMenuIds.value = [];
  collectIds(shaped);
  totalMenuCount.value = allMenuIds.value.length;
};

const treeProps = { children: 'children', label: 'label' };

// 角色数据（从后端加载）
const roles = ref([]);

const fetchRoles = async () => {
  try {
    const res = await getRoleList();
    roles.value = res.data || [];
  } catch {
    // 获取角色列表失败
  }
};

onMounted(() => {
  fetchRoles();
  fetchMenuTree();
});

// 当前选中角色
const currentRole = ref(null);
const treeRef = ref(null);

const onRoleSelect = (row) => {
  currentRole.value = row;
  nextTick(() => {
    if (treeRef.value && row) {
      treeRef.value.setCheckedKeys(row.permissions || []);
    }
  });
};

// 全选逻辑
const checkedCount = computed(() => {
  if (!currentRole.value) return 0;
  return (currentRole.value.permissions || []).length;
});

const checkAll = computed({
  get() {
    return checkedCount.value === totalMenuCount.value && totalMenuCount.value > 0;
  },
  set() {},
});

const isIndeterminate = computed(
  () => checkedCount.value > 0 && checkedCount.value < totalMenuCount.value,
);

const handleCheckAll = (val) => {
  if (!treeRef.value || !currentRole.value) return;
  if (val) {
    treeRef.value.setCheckedKeys(allMenuIds.value);
    currentRole.value.permissions = [...allMenuIds.value];
  } else {
    treeRef.value.setCheckedKeys([]);
    currentRole.value.permissions = [];
  }
};

const onTreeCheck = () => {
  if (!treeRef.value || !currentRole.value) return;
  currentRole.value.permissions = treeRef.value.getCheckedKeys();
};

const handleSavePermissions = async () => {
  if (!currentRole.value) return;
  try {
    await saveRolePermissions(currentRole.value.id, currentRole.value.permissions || []);
    ElMessage.success('权限已保存');
  } catch {
    ElMessage.error('保存权限失败');
  }
};

// 角色弹窗
const roleDialogVisible = ref(false);
const roleDialogTitle = ref('新建角色');
const roleFormRef = ref(null);
const editingRoleId = ref(null);

const roleForm = ref({ name: '', description: '' });

const roleFormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
};

const handleAddRole = () => {
  editingRoleId.value = null;
  roleDialogTitle.value = '新建角色';
  roleForm.value = { name: '', description: '' };
  roleDialogVisible.value = true;
};

const handleEditRole = (row) => {
  editingRoleId.value = row.id;
  roleDialogTitle.value = '编辑角色';
  roleForm.value = { name: row.name, description: row.description };
  roleDialogVisible.value = true;
};

const handleSubmitRole = async () => {
  if (!roleFormRef.value) return;
  try {
    await roleFormRef.value.validate();
    if (editingRoleId.value) {
      await updateRole(editingRoleId.value, roleForm.value);
      ElMessage.success('角色已更新');
    } else {
      await createRole({ ...roleForm.value, permissions: ['dashboard'] });
      ElMessage.success('角色已创建');
    }
    roleDialogVisible.value = false;
    fetchRoles();
  } catch {
    // 校验失败或请求失败
  }
};

const handleDeleteRole = (row) => {
  ElMessageBox.confirm(
    '确定删除角色「'.concat(row.name, '」？删除后该角色下的成员将失去对应权限。'),
    '提示',
    { type: 'warning' },
  )
    .then(async () => {
      await deleteRole(row.id);
      if (currentRole.value && currentRole.value.id === row.id) {
        currentRole.value = null;
      }
      ElMessage.success('已删除');
      fetchRoles();
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.roles-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-content {
  .permission-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }
}

.tree-node {
  display: flex;
  align-items: center;
}
</style>
