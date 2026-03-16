<template>
  <div class="task-container">
    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="所属版本">
          <el-select v-model="queryParams.version" placeholder="全部" clearable filterable style="width: 160px">
            <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.type" placeholder="全部" clearable style="width: 100px">
            <el-option label="开发" value="开发" />
            <el-option label="测试" value="测试" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryParams.priority" placeholder="全部" clearable style="width: 100px">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派给">
          <el-select v-model="queryParams.assignee" placeholder="全部" clearable filterable style="width: 140px">
            <el-option v-for="u in userList" :key="u.id" :label="u.label" :value="u.label">
              <div class="user-option">
                <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                <span>{{ u.label }}</span>
              </div>
            </el-option>
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
            <el-icon><Plus /></el-icon>新建任务
          </el-button>
          <span class="total">共 {{ total }} 条任务</span>
        </div>
      </template>

      <el-table :data="tasks" style="width: 100%" row-key="id">
        <el-table-column type="index" label="" width="60" />
        <el-table-column prop="name" label="任务名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="version_name" label="所属版本" min-width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === '开发' ? '' : 'success'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="指派给" min-width="110">
          <template #default="{ row }">
            <div v-if="row.assignee_name" class="user-cell">
              <el-avatar :size="20" :src="row.assignee_avatar || ''">{{ row.assignee_name.charAt(0) }}</el-avatar>
              <span>{{ row.assignee_name }}</span>
            </div>
            <span v-else style="color: #c0c4cc">未指派</span>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" min-width="180">
          <template #default="{ row }">
            <el-tooltip
              :disabled="row.status !== '未开始'"
              content="请先将状态改为「进行中」后再调整进度"
              placement="top"
            >
              <div :class="['progress-wrap', progressClass(row.progress)]">
                <el-slider
                  v-model="row.progress"
                  :step="5"
                  size="small"
                  :disabled="row.status === '未开始'"
                  @change="(val) => handleProgressChange(row, val)"
                />
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" min-width="130">
          <template #default="{ row }">
            <span v-if="!row.deadline" style="color: #c0c4cc">未设置</span>
            <span v-else>
              {{ row.deadline }}
              <el-tag
                v-if="isOverdue(row)"
                type="danger"
                size="small"
                style="margin-left: 4px"
              >延期</el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><Tickets /></el-icon>
            <p>暂无任务记录</p>
            <el-button type="primary" size="small" @click="handleAdd">创建第一个任务</el-button>
          </div>
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <TaskDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :initial-form="editingForm"
      :version-list="versionList"
      :user-list="userList"
      @saved="fetchList"
    />

    <TaskDetailDrawer
      v-model:visible="detailVisible"
      :row="detailRow"
      @edit="handleEdit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Tickets } from '@element-plus/icons-vue';
import { getTaskList, updateTask, deleteTask } from '@/api/task';
import { getUserList } from '@/api/user';
import { getVersionList } from '@/api/version';
import TaskDialog from './components/TaskDialog.vue';
import TaskDetailDrawer from './components/TaskDetailDrawer.vue';

const route = useRoute();
const tasks = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

const versionOptions = ref([]);
const versionList = ref([]);
const userList = ref([]);

const queryParams = ref({
  name: '',
  version: '',
  type: '',
  priority: '',
  status: '',
  assignee: '',
});

const statusOptions = ['未开始', '进行中', '已完成'];

const fetchOptions = async () => {
  try {
    const [versionRes, userRes] = await Promise.all([
      getVersionList({ page: 1, pageSize: 999 }),
      getUserList(),
    ]);
    const vers = versionRes.data.list || [];
    versionList.value = vers.map((v) => ({ id: v.id, name: v.name }));
    versionOptions.value = vers.map((v) => ({ id: v.id, name: v.name }));
    userList.value = (userRes.data || []).map((u) => ({
      id: u.id,
      label: u.first_name || u.username,
      avatar: u.avatar || '',
    }));
  } catch {
    // 加载选项失败
  }
};

const fetchList = async () => {
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const res = await getTaskList(params);
    tasks.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch {
    // 获取任务列表失败
  }
};

onMounted(async () => {
  await fetchOptions();
  await fetchList();
  const { openId } = route.query;
  if (openId) {
    const target = tasks.value.find((t) => String(t.id) === String(openId));
    if (target) handleDetail(target);
  }
});

const handleSearch = () => { currentPage.value = 1; fetchList(); };
const handleReset = () => {
  queryParams.value = {
    name: '',
    version: '',
    type: '',
    priority: '',
    status: '',
    assignee: '',
  };
  currentPage.value = 1;
  fetchList();
};

const isOverdue = (row) => {
  if (!row.deadline || row.status === '已完成') return false;
  return new Date(row.deadline) < new Date(new Date().toDateString());
};

const priorityType = (p) => ({ 高: 'danger', 中: 'warning', 低: 'info' }[p] || 'info');
const statusType = (s) => ({ 未开始: 'info', 进行中: 'warning', 已完成: 'success' }[s] || 'info');

const progressClass = (percentage) => {
  if (percentage >= 100) return 'progress-done';
  if (percentage >= 70) return 'progress-high';
  if (percentage >= 30) return 'progress-mid';
  return 'progress-low';
};

const handleProgressChange = async (row, val) => {
  try {
    const payload = { progress: val };
    if (val === 100 && row.status !== '已完成') {
      payload.status = '已完成';
      row.status = '已完成';
      ElMessage.success('进度已满，状态自动更新为已完成');
    } else if (val < 100 && row.status === '已完成') {
      payload.status = '进行中';
      row.status = '进行中';
    }
    await updateTask(row.id, payload);
  } catch {
    // 更新进度失败
  }
};

// 弹窗
const dialogVisible = ref(false);
const editingId = ref(null);
const editingForm = ref(null);

const handleAdd = () => {
  editingId.value = null;
  editingForm.value = null;
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  detailVisible.value = false;
  editingId.value = row.id;
  editingForm.value = {
    name: row.name,
    version: row.version || null,
    type: row.type || '开发',
    priority: row.priority,
    status: row.status,
    assignee: row.assignee || null,
    deadline: row.deadline || '',
    progress: row.progress || 0,
    description: row.description || '',
  };
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除任务「'.concat(row.name, '」？'), '提示', { type: 'warning' })
    .then(async () => {
      await deleteTask(row.id);
      ElMessage.success('已删除');
      fetchList();
    })
    .catch(() => {});
};

// 详情
const detailVisible = ref(false);
const detailRow = ref(null);

const handleDetail = (row) => {
  detailRow.value = row;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.task-container {
  padding: 20px;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .el-avatar {
    flex-shrink: 0;
    font-size: 11px;
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #fff;
  }

  span {
    font-size: 13px;
    color: #303133;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #909399;

  p {
    margin: 12px 0;
    font-size: 14px;
  }
}

.progress-wrap {
  width: 100%;

  &.progress-low :deep(.el-slider__bar) { background: #909399; }
  &.progress-mid :deep(.el-slider__bar) { background: #409eff; }
  &.progress-high :deep(.el-slider__bar) { background: #67c23a; }
  &.progress-done :deep(.el-slider__bar) { background: #67c23a; }

  &.progress-low :deep(.el-slider__button) { border-color: #909399; }
  &.progress-mid :deep(.el-slider__button) { border-color: #409eff; }
  &.progress-high :deep(.el-slider__button) { border-color: #67c23a; }
  &.progress-done :deep(.el-slider__button) { border-color: #67c23a; }
}
</style>
