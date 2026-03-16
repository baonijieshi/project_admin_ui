<template>
  <div class="bug-view">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card" :class="{ active: viewMode === 'all' }" @click="switchView('all')">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">全部 Bug</div>
      </div>
      <div class="stat-card danger" :class="{ active: viewMode === 'mine' }" @click="switchView('mine')">
        <div class="stat-value">{{ stats.mine }}</div>
        <div class="stat-label">指派给我</div>
      </div>
      <div class="stat-card info" :class="{ active: viewMode === 'created' }" @click="switchView('created')">
        <div class="stat-value">{{ stats.created }}</div>
        <div class="stat-label">我创建的</div>
      </div>
      <div class="stat-card warning" :class="{ active: viewMode === 'open' }" @click="switchView('open')">
        <div class="stat-value">{{ stats.open }}</div>
        <div class="stat-label">未关闭</div>
      </div>
      <div class="stat-card fatal">
        <div class="stat-value">{{ stats.fatal }}</div>
        <div class="stat-label">致命/严重</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.resolved }}</div>
        <div class="stat-label">已解决</div>
      </div>
    </div>

    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.title"
            placeholder="搜索 Bug 标题..."
            clearable
            style="width:220px"
            @input="debounceFetch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="queryParams.severity" placeholder="严重程度" clearable style="width:110px" @change="handleSearch">
            <el-option v-for="s in severityOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width:110px" @change="handleSearch">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="queryParams.priority" placeholder="优先级" clearable style="width:100px" @change="handleSearch">
            <el-option label="P0" value="P0" />
            <el-option label="P1" value="P1" />
            <el-option label="P2" value="P2" />
            <el-option label="P3" value="P3" />
          </el-select>

          <!-- 更多筛选 -->
          <el-popover placement="bottom-start" :width="360" trigger="click">
            <template #reference>
              <el-button :type="hasMoreFilter ? 'primary' : 'default'" plain>
                <el-icon><Filter /></el-icon>更多
                <el-badge v-if="moreFilterCount > 0" :value="moreFilterCount" class="filter-badge" />
              </el-button>
            </template>
            <el-form :model="queryParams" label-width="80px" size="small">
              <el-form-item label="关联版本">
                <el-select v-model="queryParams.versionId" placeholder="全部" clearable filterable style="width:100%">
                  <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.id" />
                </el-select>
              </el-form-item>
              <div style="text-align:right; margin-top:4px">
                <el-button size="small" @click="handleReset">重置</el-button>
                <el-button size="small" type="primary" @click="handleSearch">应用</el-button>
              </div>
            </el-form>
          </el-popover>

          <el-tag v-if="projectFilter" closable type="info" @close="clearProjectFilter">
            项目：{{ projectFilter }}
          </el-tag>
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
            <el-icon><Plus /></el-icon>提交 Bug
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="paginatedData"
        v-loading="loading"
        style="width:100%"
        row-key="id"
        row-class-name="bug-row"
        @selection-change="onSelectionChange"
        @row-click="(row) => handleDetail(row)"
      >
        <el-table-column type="selection" width="46" @click.stop />
        <el-table-column prop="title" label="Bug 标题" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="bug-title-cell">
              <span :class="['severity-dot', `sev-${row.severity}`]" :title="row.severity" />
              <span class="bug-title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="72" align="center">
          <template #default="{ row }">
            <span :class="['priority-dot', `priority-${row.priority?.toLowerCase()}`]">{{ row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(val) => handleStatusChange(row, val)">
              <span :class="['status-badge', `status-${row.status}`]" @click.stop>
                {{ row.status }}<el-icon style="margin-left:2px; font-size:10px"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu @click.stop>
                  <el-dropdown-item v-for="s in statusOptions" :key="s" :command="s">
                    <span :class="['status-badge', `status-${s}`]">{{ s }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column label="指派给" width="120">
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
        <el-table-column label="创建人" width="110">
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
        <el-table-column prop="version_name" label="版本" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.version_name" class="version-tag">{{ row.version_name }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.created_at }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="!['已解决', '已关闭'].includes(row.status)"
              size="small" link type="success"
              @click.stop="handleResolve(row)"
            >解决</el-button>
            <el-button
              v-else
              size="small" link type="warning"
              @click.stop="handleActivate(row)"
            >激活</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><WarningFilled /></el-icon>
            <p>暂无 Bug 记录</p>
          </div>
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredList.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <BugDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :initial-form="editingForm"
      :user-list="userList"
      :project-list="projectList"
      :version-options="versionOptions"
      @saved="fetchList"
    />

    <BugDetailDrawer
      v-model:visible="detailVisible"
      :bug="detailBug"
      @edit="handleEdit"
      @resolve="handleResolve"
      @activate="handleActivate"
    />

    <BugResolveDialog
      v-model:visible="resolveVisible"
      :bug-id="resolvingBugId"
      @saved="fetchList"
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
  Search, Filter, Plus, Delete, ArrowDown, WarningFilled,
} from '@element-plus/icons-vue';
import {
  getBugList, updateBug, activateBug, deleteBug, batchDeleteBug,
} from '@/api/bug';
import { getUserList } from '@/api/user';
import { getProjectList } from '@/api/project';
import { getVersionList } from '@/api/version';
import BugDialog from './components/BugDialog.vue';
import BugDetailDrawer from './components/BugDetailDrawer.vue';
import BugResolveDialog from './components/BugResolveDialog.vue';

const store = useStore();
const currentUserId = computed(() => store.getters.userId);

const severityOptions = ['致命', '严重', '一般', '轻微', '建议'];
const statusOptions = ['待处理', '处理中', '已解决', '已关闭', '已拒绝'];

const bugList = ref([]);
const loading = ref(false);
const userList = ref([]);
const projectList = ref([]);
const versionOptions = ref([]);

const viewMode = ref('all');
const queryParams = ref({
  title: '',
  severity: '',
  status: '',
  priority: '',
  versionId: null,
});
const projectFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const selectedIds = ref([]);

const dialogVisible = ref(false);
const editingId = ref(null);
const editingForm = ref(null);
const detailVisible = ref(false);
const detailBug = ref(null);
const resolveVisible = ref(false);
const resolvingBugId = ref(null);

const debounceTimer = ref(null);
function debounceFetch() {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    currentPage.value = 1;
    fetchList();
  }, 300);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getBugList();
    const d = res.data;
    bugList.value = Array.isArray(d) ? d : (d?.list || d?.results || []);
  } finally {
    loading.value = false;
  }
}

const stats = computed(() => {
  const list = bugList.value;
  return {
    total: list.length,
    mine: list.filter((b) => b.assignee === currentUserId.value).length,
    created: list.filter((b) => b.reporter === currentUserId.value).length,
    open: list.filter((b) => !['已解决', '已关闭'].includes(b.status)).length,
    fatal: list.filter((b) => ['致命', '严重'].includes(b.severity)).length,
    resolved: list.filter((b) => b.status === '已解决').length,
  };
});

const filteredList = computed(() => {
  let list = Array.isArray(bugList.value) ? [...bugList.value] : [];
  if (viewMode.value === 'mine') {
    list = list.filter((b) => b.assignee === currentUserId.value);
  } else if (viewMode.value === 'created') {
    list = list.filter((b) => b.reporter === currentUserId.value);
  } else if (viewMode.value === 'open') {
    list = list.filter((b) => !['已解决', '已关闭'].includes(b.status));
  }
  const q = queryParams.value;
  if (q.title) list = list.filter((b) => b.title?.includes(q.title));
  if (q.severity) list = list.filter((b) => b.severity === q.severity);
  if (q.status) list = list.filter((b) => b.status === q.status);
  if (q.priority) list = list.filter((b) => b.priority === q.priority);
  if (q.versionId) list = list.filter((b) => b.version === q.versionId);
  if (projectFilter.value) list = list.filter((b) => b.project_name === projectFilter.value);
  return list;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

const hasMoreFilter = computed(() => !!queryParams.value.versionId);
const moreFilterCount = computed(() => (queryParams.value.versionId ? 1 : 0));

function switchView(mode) {
  viewMode.value = mode;
  currentPage.value = 1;
}

function handleSearch() {
  currentPage.value = 1;
}

function handleReset() {
  queryParams.value = {
    title: '',
    severity: '',
    status: '',
    priority: '',
    versionId: null,
  };
  currentPage.value = 1;
  fetchList();
}

function clearProjectFilter() {
  projectFilter.value = '';
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id);
}

function handleAdd() {
  editingId.value = null;
  editingForm.value = null;
  dialogVisible.value = true;
}

function handleEdit(row) {
  detailVisible.value = false;
  editingId.value = row.id;
  editingForm.value = {
    title: row.title,
    module: row.module,
    bugType: row.bug_type,
    severity: row.severity,
    priority: row.priority,
    assignee: row.assignee,
    project: row.project,
    versionId: row.version,
    caseId: row.case,
    stepsToReproduce: row.steps_to_reproduce,
    remark: row.remark,
  };
  dialogVisible.value = true;
}

function handleDetail(row) {
  detailBug.value = row;
  detailVisible.value = true;
}

function handleResolve(row) {
  detailVisible.value = false;
  resolvingBugId.value = row.id;
  resolveVisible.value = true;
}

async function handleActivate(row) {
  try {
    await activateBug(row.id);
    ElMessage.success('Bug已激活');
    fetchList();
  } catch {
    // 激活失败
  }
}

async function handleStatusChange(row, val) {
  if (val === '已解决') {
    handleResolve(row);
    return;
  }
  try {
    await updateBug(row.id, { status: val });
    row.status = val;
    ElMessage.success('状态已更新');
  } catch {
    // 更新失败
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除 Bug「${row.title}」吗？`, '删除确认', { type: 'warning' });
  await deleteBug(row.id);
  ElMessage.success('已删除');
  fetchList();
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条 Bug 吗？`, '批量删除', { type: 'warning' });
  await batchDeleteBug(selectedIds.value);
  ElMessage.success('批量删除成功');
  selectedIds.value = [];
  fetchList();
}

onMounted(async () => {
  fetchList();
  const [uRes, pRes, vRes] = await Promise.all([
    getUserList(),
    getProjectList(),
    getVersionList(),
  ]);
  userList.value = (uRes.data || []).map((u) => ({
    id: u.id,
    label: u.username || u.name,
    avatar: u.avatar,
  }));
  projectList.value = pRes.data?.list || pRes.data || [];
  versionOptions.value = vRes.data?.list || vRes.data || [];
});
</script>

<style scoped lang="scss">
.bug-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-top-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  }

  &.danger { border-top-color: #f56c6c; }
  &.warning { border-top-color: #e6a23c; }
  &.info { border-top-color: #909399; }
  &.fatal { border-top-color: #f56c6c; }
  &.success { border-top-color: #67c23a; }

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

.main-card {
  :deep(.el-card__body) { padding: 16px; }
}

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

.bug-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.severity-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.sev-致命 { background: #f56c6c; }
  &.sev-严重 { background: #e6a23c; }
  &.sev-一般 { background: #409eff; }
  &.sev-轻微 { background: #67c23a; }
  &.sev-建议 { background: #909399; }
}

.bug-title {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-dot {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;

  &.priority-p0 {
    background: #fef0f0;
    color: #f56c6c;
  }

  &.priority-p1 {
    background: #fdf6ec;
    color: #e6a23c;
  }

  &.priority-p2 {
    background: #ecf5ff;
    color: #409eff;
  }

  &.priority-p3 {
    background: #f4f4f5;
    color: #909399;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &.status-待处理 { background: #f4f4f5; color: #909399; }
  &.status-处理中 { background: #fdf6ec; color: #e6a23c; }
  &.status-已解决 { background: #f0f9eb; color: #67c23a; }
  &.status-已关闭 { background: #f4f4f5; color: #606266; }
  &.status-已拒绝 { background: #fef0f0; color: #f56c6c; }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
}

.version-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 3px;
  font-size: 12px;
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

.bug-row {
  cursor: pointer;

  &:hover td { background: #f5f7fa !important; }
}
</style>
