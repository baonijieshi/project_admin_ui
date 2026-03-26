<template>
  <div class="dept-container">
    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="部门名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入部门名称"
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

    <!-- 表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新建部门
          </el-button>
          <span class="total">共 {{ departments.length }} 个部门</span>
        </div>
      </template>

      <el-table :data="departments" style="width: 100%" row-key="id">
        <el-table-column type="index" label="" width="50" />
        <el-table-column prop="name" label="部门名称" min-width="120">
          <template #default="{ row }">
            <el-button type="text" @click="goToMembers(row)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="部门描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="leaderName" label="负责人" min-width="100" />
        <el-table-column prop="memberCount" label="成员数" min-width="80" align="center" />
        <el-table-column prop="sort_order" label="排序" min-width="70" align="center" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑部门弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="deptForm" :rules="formRules" label-width="80px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="deptForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门描述">
          <el-input v-model="deptForm.description" type="textarea" :rows="2" placeholder="请输入部门描述" />
        </el-form-item>
        <el-form-item label="负责人">
          <UserCascader v-model="deptForm.leader" :user-list="userOptions" placeholder="请选择负责人" />
        </el-form-item>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="deptForm.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="deptForm.status" style="width: 100%">
                <el-option label="启用" value="启用" />
                <el-option label="禁用" value="禁用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getDeptList,
  createDept,
  updateDept,
  deleteDept,
} from '@/api/department';
import { getUserList } from '@/api/user';
import UserCascader from '@/components/UserCascader.vue';

const router = useRouter();

const departments = ref([]);
const userOptions = ref([]);

const queryParams = ref({ name: '', status: '' });

const fetchList = async () => {
  try {
    const res = await getDeptList(queryParams.value);
    departments.value = res.data || [];
  } catch {
    // 获取部门列表失败
  }
};

const fetchUsers = async () => {
  try {
    const res = await getUserList();
    userOptions.value = (res.data || []).map((u) => ({
      id: u.id,
      name: u.first_name || u.username,
      label: u.first_name || u.username,
      dept: u.dept || '',
    }));
  } catch {
    // 获取用户列表失败
  }
};

onMounted(() => {
  fetchList();
  fetchUsers();
});

const handleSearch = () => { fetchList(); };

const goToMembers = (row) => {
  router.push({ path: '/settings/members', query: { dept: row.name } });
};
const handleReset = () => {
  queryParams.value = { name: '', status: '' };
  fetchList();
};

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('新建部门');
const formRef = ref(null);
const editingId = ref(null);

const defaultForm = () => ({
  name: '',
  description: '',
  leader: null,
  sort_order: 0,
  status: '启用',
});

const deptForm = ref(defaultForm());

const formRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

const handleAdd = () => {
  editingId.value = null;
  dialogTitle.value = '新建部门';
  deptForm.value = defaultForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  editingId.value = row.id;
  dialogTitle.value = '编辑部门';
  deptForm.value = {
    name: row.name,
    description: row.description,
    leader: row.leader,
    sort_order: row.sort_order,
    status: row.status,
  };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (editingId.value) {
      await updateDept(editingId.value, deptForm.value);
      ElMessage.success('部门已更新');
    } else {
      await createDept(deptForm.value);
      ElMessage.success('部门已创建');
    }
    dialogVisible.value = false;
    fetchList();
  } catch {
    // 校验失败或请求失败
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除部门「'.concat(row.name, '」？'), '提示', { type: 'warning' })
    .then(async () => {
      await deleteDept(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.dept-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
