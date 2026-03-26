<template>
  <div class="members-container">
    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <div v-if="deptFilter" style="margin-bottom: 12px">
        <el-tag closable @close="clearDeptFilter">
          部门：{{ deptFilter }}
        </el-tag>
      </div>
      <el-form :model="queryParams" inline>
        <el-form-item label="姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="queryParams.roleId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
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
            <el-icon><Plus /></el-icon>添加成员
          </el-button>
          <span class="total">共 {{ total }} 人</span>
        </div>
      </template>

      <el-table :data="members" style="width: 100%" row-key="id">
        <el-table-column type="index" label="" width="50" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="rid in row.roleIds"
              :key="rid"
              size="small"
              style="margin-right: 4px"
            >{{ getRoleName(rid) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dept" label="部门" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="加入时间" min-width="110" header-align="center" />
        <el-table-column label="操作" width="200" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="warning" @click="handleToggleStatus(row)">
              {{ row.status === '启用' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑成员弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="memberForm" :rules="formRules" label-width="70px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="memberForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号" prop="username">
              <el-input v-model="memberForm.username" placeholder="请输入账号" :disabled="!!editingId" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="memberForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="memberForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="部门" prop="dept">
              <el-select v-model="memberForm.dept" placeholder="请选择部门" style="width: 100%">
                <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="memberForm.status" style="width: 100%">
                <el-option label="启用" value="启用" />
                <el-option label="禁用" value="禁用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="角色" prop="roleIds">
              <el-select
                v-model="memberForm.roleIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择角色"
                style="width: 100%"
              >
                <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="!editingId" label="密码" prop="password">
              <el-input v-model="memberForm.password" type="password" show-password placeholder="请输入初始密码" />
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getMemberList,
  createMember,
  updateMember,
  deleteMember,
  toggleMemberStatus,
} from '@/api/member';
import { getDeptList } from '@/api/department';
import { getRoleList } from '@/api/role';

const route = useRoute();
const router = useRouter();

const deptFilter = ref('');

const clearDeptFilter = () => {
  deptFilter.value = '';
  queryParams.value.dept = '';
  router.replace({ path: route.path });
  fetchList();
};

const deptOptions = ref([]);

const fetchDeptOptions = async () => {
  try {
    const res = await getDeptList({ status: '启用' });
    deptOptions.value = (res.data || []).map((d) => d.name);
  } catch {
    // 获取部门列表失败
  }
};

const roles = ref([]);

const fetchRoles = async () => {
  try {
    const res = await getRoleList();
    roles.value = (res.data || []).map((r) => ({ id: r.id, name: r.name }));
  } catch {
    // 获取角色列表失败
  }
};

const getRoleName = (id) => {
  const role = roles.value.find((r) => r.id === id);
  return role ? role.name : '';
};

const members = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const queryParams = ref({
  name: '',
  roleId: '',
  status: '',
  dept: '',
});

const fetchList = async () => {
  try {
    const res = await getMemberList({
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    members.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch {
    // 获取成员列表失败
  }
};

onMounted(() => {
  if (route.query.dept) {
    deptFilter.value = route.query.dept;
    queryParams.value.dept = route.query.dept;
  }
  fetchDeptOptions();
  fetchRoles();
  fetchList();
});

const handleSearch = () => { currentPage.value = 1; fetchList(); };
const handleReset = () => {
  queryParams.value = {
    name: '',
    roleId: '',
    status: '',
    dept: '',
  };
  deptFilter.value = '';
  if (route.query.dept) {
    router.replace({ path: route.path });
  }
  currentPage.value = 1;
  fetchList();
};
const handleSizeChange = () => { currentPage.value = 1; fetchList(); };

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('添加成员');
const formRef = ref(null);
const editingId = ref(null);

const defaultForm = () => ({
  name: '',
  username: '',
  email: '',
  phone: '',
  roleIds: [],
  dept: '',
  status: '启用',
  password: '',
});

const memberForm = ref(defaultForm());

const formRules = computed(() => {
  const rules = {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
    ],
    roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }],
    dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  };
  if (!editingId.value) {
    rules.password = [{ required: true, message: '请输入初始密码', trigger: 'blur' }];
  }
  return rules;
});

const handleAdd = () => {
  editingId.value = null;
  dialogTitle.value = '添加成员';
  const form = defaultForm();
  if (deptFilter.value) {
    form.dept = deptFilter.value;
  }
  memberForm.value = form;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  editingId.value = row.id;
  dialogTitle.value = '编辑成员';
  memberForm.value = {
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    roleIds: [...row.roleIds],
    dept: row.dept,
    status: row.status,
    password: '',
  };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    if (editingId.value) {
      await updateMember(editingId.value, memberForm.value);
      ElMessage.success('成员已更新');
    } else {
      await createMember(memberForm.value);
      ElMessage.success('成员已添加');
    }
    dialogVisible.value = false;
    fetchList();
  } catch (e) {
    if (e?.response?.data?.message) {
      ElMessage.error(e.response.data.message);
    }
  }
};

const handleToggleStatus = async (row) => {
  try {
    const res = await toggleMemberStatus(row.id);
    row.status = res.data.status;
    ElMessage.success('已'.concat(row.status));
  } catch {
    ElMessage.error('操作失败');
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除成员「'.concat(row.name, '」？'), '提示', { type: 'warning' })
    .then(async () => {
      await deleteMember(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.members-container {
  padding: 20px;
}
</style>
