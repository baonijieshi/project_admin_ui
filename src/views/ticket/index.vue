<template>
  <div class="ticket-view">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div
        class="stat-card"
        :class="{ active: viewMode === 'all' }"
        @click="switchView('all')"
      >
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">全部工单</div>
      </div>
      <div
        class="stat-card primary"
        :class="{ active: viewMode === 'mine' }"
        @click="switchView('mine')"
      >
        <div class="stat-value">{{ stats.mine }}</div>
        <div class="stat-label">指派给我</div>
      </div>
      <div
        class="stat-card info"
        :class="{ active: viewMode === 'created' }"
        @click="switchView('created')"
      >
        <div class="stat-value">{{ stats.created }}</div>
        <div class="stat-label">我创建的</div>
      </div>
      <div
        class="stat-card warning"
        :class="{ active: viewMode === 'open' }"
        @click="switchView('open')"
      >
        <div class="stat-value">{{ stats.open }}</div>
        <div class="stat-label">未关闭</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.urgent }}</div>
        <div class="stat-label">P0 紧急</div>
      </div>
    </div>

    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.ticket_id"
            placeholder="搜索工单 ID / 标题..."
            clearable
            style="width:220px"
            @input="debounceFetch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select
            v-model="queryParams.ticket_type"
            placeholder="类型"
            clearable
            style="width:100px"
            @change="handleSearch"
          >
            <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
          </el-select>

          <el-select
            v-model="queryParams.priority"
            placeholder="优先级"
            clearable
            style="width:90px"
            @change="handleSearch"
          >
            <el-option v-for="p in ['P0','P1','P2','P3']" :key="p" :label="p" :value="p" />
          </el-select>

          <el-select
            v-model="queryParams.status"
            placeholder="进度"
            clearable
            style="width:130px"
            @change="handleSearch"
          >
            <el-option v-for="s in STEPS" :key="s" :label="s" :value="s" />
          </el-select>

          <!-- 更多筛选 -->
          <el-popover placement="bottom-start" :width="400" trigger="click">
            <template #reference>
              <el-button :type="hasMoreFilter ? 'primary' : 'default'" plain>
                <el-icon><Filter /></el-icon>更多
                <el-badge
                  v-if="moreFilterCount > 0"
                  :value="moreFilterCount"
                  class="filter-badge"
                />
              </el-button>
            </template>
            <el-form :model="queryParams" label-width="80px" size="small">
              <el-form-item label="问题模块">
                <el-select
                  v-model="queryParams.module"
                  placeholder="全部"
                  clearable
                  filterable
                  style="width:100%"
                >
                  <el-option
                    v-for="m in moduleList"
                    :key="m.id"
                    :label="m.fullName || m.name"
                    :value="m.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="当前处理人">
                <UserCascader v-model="queryParams.assignee" :user-list="userList" placeholder="全部" />
              </el-form-item>
              <el-form-item label="测试处理人">
                <UserCascader v-model="queryParams.test_assignee" :user-list="testUserList" placeholder="全部" />
              </el-form-item>
              <el-form-item label="研发处理人">
                <UserCascader v-model="queryParams.dev_assignee" :user-list="devUserList" placeholder="全部" />
              </el-form-item>
              <el-form-item label="提交人">
                <UserCascader v-model="queryParams.reporter" :user-list="userList" placeholder="全部" />
              </el-form-item>
              <div style="text-align:right; margin-top:4px">
                <el-button size="small" @click="handleReset">重置</el-button>
                <el-button size="small" type="primary" @click="handleSearch">应用</el-button>
              </div>
            </el-form>
          </el-popover>
        </div>

        <div class="toolbar-right">
          <template v-if="selectedIds.length > 0">
            <span class="selected-tip">已选 {{ selectedIds.length }} 条</span>
            <el-button size="small" type="danger" plain @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>删除
            </el-button>
            <el-divider direction="vertical" />
          </template>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>提交工单
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="list"
        style="width:100%"
        row-key="id"
        @selection-change="onSelectionChange"
        @row-click="handleDetail"
      >
        <el-table-column type="selection" width="46" @click.stop />
        <el-table-column prop="ticket_id" label="工单 ID" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="ticket-id">{{ row.ticket_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <span :class="['type-dot', `type-${row.ticket_type}`]" :title="row.ticket_type" />
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="72" align="center">
          <template #default="{ row }">
            <span :class="['pri-tag', `pri-${row.priority?.toLowerCase()}`]">{{ row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column label="当前进度" width="130">
          <template #default="{ row }">
            <span :class="['step-badge', stepBadgeClass(row.status)]">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="module_name" label="问题模块" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.module_name" class="module-tag">{{ row.module_name }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="当前处理人" width="120">
          <template #default="{ row }">
            <div v-if="row.assignee_name" class="user-cell">
              <el-avatar :size="20" :src="row.assignee_avatar || ''">
                <span>{{ String(row.assignee_name).charAt(0) }}</span>
              </el-avatar>
              <span>{{ row.assignee_name }}</span>
            </div>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="110">
          <template #default="{ row }">
            <div v-if="row.reporter_name" class="user-cell">
              <el-avatar :size="20" :src="row.reporter_avatar || ''">
                <span>{{ String(row.reporter_name).charAt(0) }}</span>
              </el-avatar>
              <span>{{ row.reporter_name }}</span>
            </div>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.created_at }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><Tickets /></el-icon>
            <p>暂无工单记录</p>
          </div>
        </template>
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
          @size-change="() => { currentPage = 1; fetchList(); }"
        />
      </div>
    </el-card>

    <TicketDialog
      v-model:visible="dialogVisible"
      :editing-row="editingRow"
      :user-list="userList"
      :test-user-list="testUserList"
      :dev-user-list="devUserList"
      @saved="fetchList"
    />

    <TicketDetailDrawer
      v-model:visible="detailVisible"
      :row="detailRow"
      @edit="handleEdit"
    />
  </div>
</template>

<script setup>
import {
  ref, computed, onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Filter, Plus, Delete, Tickets,
} from '@element-plus/icons-vue';
import { getTicketList, deleteTicket } from '@/api/ticket';
import { getUserList } from '@/api/user';
import { getModuleFlatList } from '@/api/module';
import UserCascader from '@/components/UserCascader.vue';
import { STEPS, typeOptions } from './ticketConstants';
import TicketDialog from './components/TicketDialog.vue';
import TicketDetailDrawer from './components/TicketDetailDrawer.vue';

const store = useStore();
const currentUserId = computed(() => store.state.user.id);

const list = ref([]);
const total = ref(0);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const userList = ref([]);
const testUserList = ref([]);
const devUserList = ref([]);
const moduleList = ref([]);
const selectedIds = ref([]);
const viewMode = ref('mine');

const defaultQuery = () => ({
  ticket_id: '',
  ticket_type: '',
  priority: '',
  status: '',
  module: null,
  assignee: null,
  test_assignee: null,
  dev_assignee: null,
  reporter: null,
});
const queryParams = ref(defaultQuery());

const stats = computed(() => ({
  total: total.value,
  mine: list.value.filter((t) => t.assignee === currentUserId.value).length,
  created: list.value.filter((t) => t.reporter === currentUserId.value).length,
  open: list.value.filter((t) => t.status !== '处理完成').length,
  urgent: list.value.filter((t) => t.priority === 'P0').length,
}));

const hasMoreFilter = computed(() => !!(
  queryParams.value.module
  || queryParams.value.assignee
  || queryParams.value.test_assignee
  || queryParams.value.dev_assignee
  || queryParams.value.reporter
));
const moreFilterCount = computed(() => [
  queryParams.value.module,
  queryParams.value.assignee,
  queryParams.value.test_assignee,
  queryParams.value.dev_assignee,
  queryParams.value.reporter,
].filter(Boolean).length);

const stepBadgeClass = (status) => {
  if (status === '处理完成') return 'done';
  if (['研发解决中', '测试验收中'].includes(status)) return 'progress';
  if (['测试完成待发布', '交付验收中'].includes(status)) return 'review';
  return 'pending';
};

async function fetchList() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    if (viewMode.value === 'mine') params.assignee = currentUserId.value;
    if (viewMode.value === 'created') params.reporter = currentUserId.value;
    if (viewMode.value === 'open') params.open = 'true';
    const res = await getTicketList(params);
    list.value = res.data?.list || res.data || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  const res = await getUserList();
  const all = (res.data || []).map((u) => ({
    id: u.id,
    label: u.first_name || u.username,
    avatar: u.avatar || '',
    dept: u.dept || '',
  }));
  userList.value = all;
  testUserList.value = all;
  devUserList.value = all;
}

async function fetchModules() {
  const res = await getModuleFlatList();
  moduleList.value = res.data || [];
}

onMounted(() => {
  fetchList();
  fetchUsers();
  fetchModules();
});

let debounceTimer = null;
function debounceFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchList();
  }, 300);
}

function switchView(mode) {
  viewMode.value = mode;
  currentPage.value = 1;
  fetchList();
}

function handleSearch() {
  currentPage.value = 1;
  fetchList();
}

function handleReset() {
  queryParams.value = defaultQuery();
  currentPage.value = 1;
  fetchList();
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id);
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedIds.value.length} 条工单吗？`,
    '批量删除',
    { type: 'warning' },
  );
  await Promise.all(selectedIds.value.map((id) => deleteTicket(id)));
  ElMessage.success('批量删除成功');
  selectedIds.value = [];
  fetchList();
}

const dialogVisible = ref(false);
const editingRow = ref(null);

function handleAdd() {
  editingRow.value = null;
  dialogVisible.value = true;
}

function handleEdit(row) {
  detailVisible.value = false;
  editingRow.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除工单「${row.title}」？`, '删除确认', { type: 'warning' });
  await deleteTicket(row.id);
  ElMessage.success('已删除');
  fetchList();
}

const detailVisible = ref(false);
const detailRow = ref(null);

function handleDetail(row) {
  detailRow.value = row;
  detailVisible.value = true;
}
</script>

<style scoped lang="scss">
.ticket-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 统计卡片 */
.stat-cards {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-top: 3px solid #e4e7ed;

  &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }

  &.active { box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15); }

  &.primary { border-top-color: #409eff; }
  &.primary.active { border-top-color: #409eff; }
  &.info { border-top-color: #909399; }
  &.warning { border-top-color: #e6a23c; }
  &.danger { border-top-color: #f56c6c; }

  &.active { border-top-color: #409eff; }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
  }
}

/* 主卡片 */
.main-card {
  :deep(.el-card__body) { padding: 16px; }
}

/* 工具栏 */
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-tip {
  font-size: 13px;
  color: #606266;
}

.filter-badge {
  margin-left: 4px;
  :deep(.el-badge__content) { top: -2px; }
}

/* 表格内容 */
.ticket-id {
  font-size: 12px;
  color: #409eff;
  font-family: monospace;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.type-问题 { background: #f56c6c; }
  &.type-需求 { background: #409eff; }
  &.type-咨询 { background: #e6a23c; }
  &.type-其他 { background: #909399; }
}

.title-text {
  font-size: 14px;
  color: #303133;
}

.pri-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;

  &.pri-p0 { background: #fef0f0; color: #f56c6c; }
  &.pri-p1 { background: #fdf6ec; color: #e6a23c; }
  &.pri-p2 { background: #ecf5ff; color: #409eff; }
  &.pri-p3 { background: #f4f4f5; color: #909399; }
}

.step-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;

  &.done    { background: #f0f9eb; color: #67c23a; }
  &.progress { background: #fdf6ec; color: #e6a23c; }
  &.review  { background: #ecf5ff; color: #409eff; }
  &.pending { background: #f4f4f5; color: #909399; }
}

.module-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #f4f4f5;
  color: #606266;
  border-radius: 3px;
  font-size: 12px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.empty-text {
  color: #c0c4cc;
  font-size: 13px;
}

.time-text {
  font-size: 13px;
  color: #606266;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #909399;

  p { margin-top: 12px; font-size: 14px; }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
