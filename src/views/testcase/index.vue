<template>
  <div class="testcase-container">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ totalCount }}</div>
        <div class="stat-label">全部用例</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.p0 }}</div>
        <div class="stat-label">P0 用例</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.passed }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.failed }}</div>
        <div class="stat-label">失败/阻塞</div>
      </div>
      <div class="stat-card info">
        <div class="stat-value">{{ stats.pending }}</div>
        <div class="stat-label">未执行</div>
      </div>
    </div>

    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.title"
            placeholder="搜索用例标题..."
            clearable
            style="width:220px"
            @input="debounceFetch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <!-- 快捷筛选 -->
          <el-select v-model="queryParams.priority" placeholder="优先级" clearable style="width:100px" @change="handleSearch">
            <el-option label="P0" value="P0" />
            <el-option label="P1" value="P1" />
            <el-option label="P2" value="P2" />
            <el-option label="P3" value="P3" />
          </el-select>
          <el-select v-model="queryParams.lastResult" placeholder="执行结果" clearable style="width:110px" @change="handleSearch">
            <el-option label="通过" value="通过" />
            <el-option label="失败" value="失败" />
            <el-option label="阻塞" value="阻塞" />
            <el-option label="未执行" value="未执行" />
          </el-select>
          <el-select v-model="queryParams.module" placeholder="所属模块" clearable filterable style="width:130px" @change="handleSearch">
            <el-option v-for="m in moduleOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>

          <!-- 更多筛选展开 -->
          <el-popover placement="bottom-start" :width="480" trigger="click">
            <template #reference>
              <el-button :type="hasMoreFilter ? 'primary' : 'default'" plain size="default">
                <el-icon><Filter /></el-icon>
                更多筛选
                <el-badge v-if="moreFilterCount > 0" :value="moreFilterCount" class="filter-badge" />
              </el-button>
            </template>
            <el-form :model="queryParams" label-width="80px" size="small">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="关联版本">
                    <el-select v-model="queryParams.version" placeholder="全部" clearable style="width:100%">
                      <el-option v-for="v in versionOptions" :key="v.id" :label="v.name" :value="v.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="用例类型">
                    <el-select v-model="queryParams.type" placeholder="全部" clearable style="width:100%">
                      <el-option label="功能测试" value="功能测试" />
                      <el-option label="性能测试" value="性能测试" />
                      <el-option label="接口测试" value="接口测试" />
                      <el-option label="安全测试" value="安全测试" />
                      <el-option label="兼容性测试" value="兼容性测试" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="创建人">
                    <el-select v-model="queryParams.creator" placeholder="全部" clearable style="width:100%">
                      <el-option v-for="u in userOptions" :key="u.label" :label="u.label" :value="u.label">
                        <div class="user-option">
                          <el-avatar :size="20" :src="u.avatar || ''">{{ u.label ? u.label.charAt(0) : '' }}</el-avatar>
                          <span>{{ u.label }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="关联需求">
                    <el-select v-model="queryParams.storyId" placeholder="全部" clearable filterable style="width:100%">
                      <el-option v-for="s in storyOptions" :key="s.id" :label="s.title" :value="s.id" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <div style="text-align:right; margin-top:4px">
                <el-button size="small" @click="handleReset">重置</el-button>
                <el-button size="small" type="primary" @click="handleSearch">应用</el-button>
              </div>
            </el-form>
          </el-popover>
        </div>

        <div class="toolbar-right">
          <!-- 批量操作（有选中时显示） -->
          <template v-if="selectedIds.length > 0">
            <span class="selected-tip">已选 {{ selectedIds.length }} 条</span>
            <el-button size="small" type="success" @click="handleBatchRun">
              <el-icon><VideoPlay /></el-icon>批量执行
            </el-button>
            <el-button size="small" type="primary" plain @click="batchStoryVisible = true">
              <el-icon><Link /></el-icon>关联需求
            </el-button>
            <el-button size="small" type="danger" plain @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>删除
            </el-button>
            <el-divider direction="vertical" />
          </template>
          <el-button type="warning" plain @click="importDialogVisible = true">
            <el-icon><Upload /></el-icon>导入 XMind
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新建用例
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="testcases"
        style="width:100%"
        row-key="id"
        @selection-change="onSelectionChange"
        @row-click="(row) => handleDetail(row)"
        row-class-name="case-row"
      >
        <el-table-column type="selection" width="46" @click.stop />
        <el-table-column prop="title" label="用例标题" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="case-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="72" align="center">
          <template #default="{ row }">
            <span :class="['priority-dot', `priority-${row.priority?.toLowerCase()}`]">{{ row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="module" label="模块" width="130" show-overflow-tooltip />
        <el-table-column prop="versionName" label="版本" width="130" show-overflow-tooltip />
        <el-table-column label="执行结果" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="resultType(row.lastResult)" size="small">{{ row.lastResult }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            <div class="creator-cell">
              <el-avatar :src="row.creatorAvatar" :size="20">{{ row.creator?.charAt(0) }}</el-avatar>
              <span>{{ row.creator }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button size="small" link type="success" @click.stop="handleRunSingle(row)">执行</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><DocumentChecked /></el-icon>
            <p>暂无测试用例</p>
            <el-button type="primary" size="small" :icon="Plus" @click="handleAdd">新建第一个用例</el-button>
          </div>
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="fetchList"
          @size-change="() => { currentPage = 1; fetchList(); }"
        />
      </div>
    </el-card>

    <!-- 子组件 -->
    <TestcaseDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :initial-form="editingForm"
      :version-options="versionOptions"
      :story-options="storyOptions"
      :module-options="moduleOptions"
      @saved="fetchList"
    />

    <TestcaseRunDialog
      v-model:visible="runDialogVisible"
      :run-case="runCase"
      :run-steps="runSteps"
      :batch-queue="batchRunQueue"
      :batch-index="batchRunIndex"
      @next="handleBatchNext"
      @done="handleBatchDone"
      @submit-bug-from-step="handleSubmitBugFromStep"
      @submit-bug-from-run="handleSubmitBugFromRun"
    />

    <TestcaseBugDialog
      v-model:visible="bugDialogVisible"
      :initial-form="bugInitialForm"
      :run-case-id="runCase ? runCase.id : null"
      :user-options="userOptions"
    />

    <TestcaseDetailDrawer
      v-model:visible="detailVisible"
      :testcase="detailCase"
      @run="(row) => { detailVisible = false; handleRunSingle(row); }"
    />

    <TestcaseImportDialog
      v-model:visible="importDialogVisible"
      @imported="fetchList"
    />

    <!-- 批量关联需求 -->
    <el-dialog v-model="batchStoryVisible" title="批量关联需求" width="400px" destroy-on-close>
      <el-form label-width="80px" style="margin-top:8px">
        <el-form-item label="关联需求">
          <el-select v-model="batchStoryId" placeholder="请选择需求" filterable clearable style="width:100%">
            <el-option v-for="s in storyOptions" :key="s.id" :label="s.title" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <span style="color:#909399; font-size:13px">已选 {{ selectedIds.length }} 条用例</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchStoryVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchStory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Filter, Plus, VideoPlay, Link, Delete, Upload, DocumentChecked,
} from '@element-plus/icons-vue';
import { getTestcaseList, updateTestcase, deleteTestcase } from '@/api/testcase';
import { getUserList } from '@/api/user';
import { getStoryList } from '@/api/story';
import { getVersionList } from '@/api/version';
import { getModuleFlatList } from '@/api/module';
import TestcaseDialog from './components/TestcaseDialog.vue';
import TestcaseRunDialog from './components/TestcaseRunDialog.vue';
import TestcaseBugDialog from './components/TestcaseBugDialog.vue';
import TestcaseDetailDrawer from './components/TestcaseDetailDrawer.vue';
import TestcaseImportDialog from './components/TestcaseImportDialog.vue';

// ── 选项数据 ──────────────────────────────────────────────────
const versionOptions = ref([]);
const userOptions = ref([]);
const storyOptions = ref([]);
const moduleOptions = ref([]);

const fetchOptions = async () => {
  try {
    const [userRes, storyRes, versionRes, moduleRes] = await Promise.all([
      getUserList(),
      getStoryList({ page: 1, pageSize: 999 }),
      getVersionList({ page: 1, pageSize: 999 }),
      getModuleFlatList(),
    ]);
    userOptions.value = (userRes.data || []).map((u) => ({
      id: u.id,
      label: u.first_name || u.username,
      avatar: u.avatar || '',
    }));
    storyOptions.value = (storyRes.data.list || []).map((s) => ({ id: s.id, title: s.title }));
    versionOptions.value = (versionRes.data.list || []).map((v) => ({ id: v.id, name: v.name }));
    moduleOptions.value = (moduleRes.data || []).map((m) => ({ id: m.id, name: m.fullName }));
  } catch { /* ignore */ }
};

// ── 列表 ──────────────────────────────────────────────────────
const testcases = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const queryParams = ref({
  title: '',
  version: null,
  module: null,
  priority: '',
  type: '',
  lastResult: '',
  creator: '',
  storyId: null,
});

// 统计（当前页数据）
const stats = computed(() => ({
  p0: testcases.value.filter((t) => t.priority === 'P0').length,
  passed: testcases.value.filter((t) => t.lastResult === '通过').length,
  failed: testcases.value.filter((t) => ['失败', '阻塞'].includes(t.lastResult)).length,
  pending: testcases.value.filter((t) => t.lastResult === '未执行').length,
}));

// 更多筛选是否有值
const hasMoreFilter = computed(() => !!(
  queryParams.value.version || queryParams.value.type
  || queryParams.value.creator || queryParams.value.storyId
));
const moreFilterCount = computed(() => [
  queryParams.value.version, queryParams.value.type,
  queryParams.value.creator, queryParams.value.storyId,
].filter(Boolean).length);

let searchTimer = null;
function debounceFetch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(handleSearch, 300);
}

const fetchList = async () => {
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value };
    const q = queryParams.value;
    if (q.title) params.title = q.title;
    if (q.version) params.version = q.version;
    if (q.module) params.module = q.module;
    if (q.priority) params.priority = q.priority;
    if (q.type) params.type = q.type;
    if (q.lastResult) params.lastResult = q.lastResult;
    if (q.creator) params.creator = q.creator;
    if (q.storyId) params.story = q.storyId;
    const res = await getTestcaseList(params);
    testcases.value = (res.data.list || []).map((tc) => ({
      ...tc,
      lastResult: tc.last_result || '未执行',
      createTime: tc.created_at || '',
      creator: tc.creator_name || '',
      creatorAvatar: tc.creator_avatar || '',
      versionName: tc.version_name || '',
      module: tc.module || '',
      storyId: tc.story || null,
      steps: tc.steps || [],
    }));
    totalCount.value = res.data.total || 0;
  } catch { /* ignore */ }
};

const handleSearch = () => { currentPage.value = 1; fetchList(); };
const handleReset = () => {
  queryParams.value = {
    title: '',
    version: null,
    module: null,
    priority: '',
    type: '',
    lastResult: '',
    creator: '',
    storyId: null,
  };
  currentPage.value = 1;
  fetchList();
};

// ── 选择 ──────────────────────────────────────────────────────
const selectedIds = ref([]);
const onSelectionChange = (rows) => { selectedIds.value = rows.map((r) => r.id); };

// ── 新建 / 编辑 ───────────────────────────────────────────────
const dialogVisible = ref(false);
const editingId = ref(null);
const editingForm = ref(null);

const handleAdd = () => { editingId.value = null; editingForm.value = null; dialogVisible.value = true; };
const handleEdit = (row) => {
  editingId.value = row.id;
  editingForm.value = {
    versionId: row.version || null,
    module: row.module || '',
    type: row.type,
    title: row.title,
    priority: row.priority,
    storyId: row.storyId,
    precondition: row.precondition,
    steps: row.steps.map((s) => ({ ...s })),
    remark: row.remark,
  };
  dialogVisible.value = true;
};

// ── 删除 ──────────────────────────────────────────────────────
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除用例「${row.title}」？`, '提示', { type: 'warning' })
    .then(async () => { await deleteTestcase(row.id); ElMessage.success('已删除'); fetchList(); })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条用例？`, '提示', { type: 'warning' })
    .then(async () => {
      await Promise.all(selectedIds.value.map((id) => deleteTestcase(id)));
      selectedIds.value = [];
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

// ── 批量关联需求 ──────────────────────────────────────────────
const batchStoryVisible = ref(false);
const batchStoryId = ref(null);

const handleBatchStory = async () => {
  if (!batchStoryId.value) { ElMessage.warning('请选择需求'); return; }
  try {
    await Promise.all(selectedIds.value.map((id) => updateTestcase(id, { story: batchStoryId.value })));
    ElMessage.success('批量关联需求成功');
    batchStoryVisible.value = false;
    batchStoryId.value = null;
    fetchList();
  } catch { ElMessage.error('操作失败'); }
};

// ── 执行 ──────────────────────────────────────────────────────
const runDialogVisible = ref(false);
const runCase = ref(null);
const runSteps = ref([]);
const batchRunQueue = ref([]);
const batchRunIndex = ref(0);

const handleRun = (row) => {
  runCase.value = row;
  runSteps.value = row.steps.map((s) => ({
    desc: s.desc,
    expect: s.expect,
    actual: '',
    result: '',
  }));
  runDialogVisible.value = true;
};

const handleRunSingle = (row) => { batchRunQueue.value = []; batchRunIndex.value = 0; handleRun(row); };
const handleBatchRun = () => {
  const queue = testcases.value.filter((t) => selectedIds.value.includes(t.id));
  if (!queue.length) return;
  batchRunQueue.value = queue;
  batchRunIndex.value = 0;
  handleRun(queue[0]);
};
const handleBatchNext = (nextIndex) => { batchRunIndex.value = nextIndex; handleRun(batchRunQueue.value[nextIndex]); fetchList(); };
const handleBatchDone = () => { batchRunQueue.value = []; batchRunIndex.value = 0; fetchList(); };

// ── 提交 Bug ──────────────────────────────────────────────────
const bugDialogVisible = ref(false);
const bugInitialForm = ref(null);

const buildStepsText = (failedIndexes) => {
  const lines = [`[用例] ${runCase.value.title}`];
  if (runCase.value.precondition) lines.push(`[前置条件] ${runCase.value.precondition}`);
  lines.push('', '[重现步骤]');
  runSteps.value.forEach((step, i) => {
    lines.push(`步骤${i + 1}: ${step.desc}`, `  预期: ${step.expect}`);
    if (step.actual) lines.push(`  实际: ${step.actual}`);
    if (failedIndexes.includes(i)) lines.push('  >>> 此步骤执行失败 <<<');
  });
  return lines.join('\n');
};

const handleSubmitBugFromStep = (stepIndex) => {
  const step = runSteps.value[stepIndex];
  bugInitialForm.value = {
    title: `[用例#${runCase.value.id}] 步骤${stepIndex + 1}失败: ${step.desc}`,
    stepsToReproduce: buildStepsText([stepIndex]),
  };
  bugDialogVisible.value = true;
};

const handleSubmitBugFromRun = () => {
  const failedIndexes = runSteps.value.reduce((acc, s, i) => { if (s.result === '失败') acc.push(i); return acc; }, []);
  bugInitialForm.value = {
    title: `[用例#${runCase.value.id}] ${runCase.value.title} - 执行失败`,
    stepsToReproduce: buildStepsText(failedIndexes),
  };
  bugDialogVisible.value = true;
};

// ── 详情 ──────────────────────────────────────────────────────
const detailVisible = ref(false);
const detailCase = ref(null);
const handleDetail = (row) => { detailCase.value = row; detailVisible.value = true; };

// ── 导入 ──────────────────────────────────────────────────────
const importDialogVisible = ref(false);

// ── 工具函数 ──────────────────────────────────────────────────
const resultType = (r) => {
  const map = {
    通过: 'success', 失败: 'danger', 阻塞: 'warning', 未执行: 'info',
  };
  return map[r] || 'info';
};

onMounted(() => { fetchOptions(); fetchList(); });
</script>

<style scoped lang="scss">
.testcase-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

// ── 统计卡片 ──────────────────────────────────────────────────
.stat-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #dcdfe6;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  &.danger  { border-left-color: #f56c6c; .stat-value { color: #f56c6c; } }
  &.success { border-left-color: #67c23a; .stat-value { color: #67c23a; } }
  &.warning { border-left-color: #e6a23c; .stat-value { color: #e6a23c; } }
  &.info    { border-left-color: #909399; .stat-value { color: #909399; } }

  .stat-value { font-size: 26px; font-weight: 700; line-height: 1; color: #303133; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 5px; }
}

// ── 主卡片 ────────────────────────────────────────────────────
.main-card {
  :deep(.el-card__body) { padding: 16px 20px; }
}

// ── 工具栏 ────────────────────────────────────────────────────
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;

  .toolbar-left  { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .toolbar-right { display: flex; gap: 8px; align-items: center; }
}

.selected-tip {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.filter-badge {
  :deep(.el-badge__content) { top: -2px; right: -6px; }
}

// ── 表格 ──────────────────────────────────────────────────────
:deep(.case-row) {
  cursor: pointer;
  &:hover td { background: #f5f7ff !important; }
}

.case-title {
  color: #303133;
  font-size: 13px;

  &:hover { color: var(--el-color-primary); }
}

// 优先级色块
.priority-dot {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;

  &.priority-p0 { background: #fef0f0; color: #f56c6c; }
  &.priority-p1 { background: #fdf6ec; color: #e6a23c; }
  &.priority-p2 { background: #ecf5ff; color: #409eff; }
  &.priority-p3 { background: #f0f9eb; color: #67c23a; }
}

.creator-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.time-text { font-size: 12px; color: #909399; }

// ── 空状态 ────────────────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 0;
  color: #909399;

  p { margin: 0; font-size: 14px; }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
