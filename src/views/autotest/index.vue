<template>
  <div class="autotest-view">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ total }}</div>
        <div class="stat-label">全部场景</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.passed }}</div>
        <div class="stat-label">通过</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.failed }}</div>
        <div class="stat-label">失败</div>
      </div>
      <div class="stat-card info">
        <div class="stat-value">{{ stats.pending }}</div>
        <div class="stat-label">未执行</div>
      </div>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.name"
            placeholder="搜索场景名称..."
            clearable
            style="width:220px"
            @input="debounceFetch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select
            v-model="query.status"
            placeholder="全部状态"
            clearable
            style="width:130px"
            @change="fetchScenes"
          >
            <el-option label="未执行" value="未执行" />
            <el-option label="通过" value="通过" />
            <el-option label="失败" value="失败" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="openSceneDialog(null)">新建场景</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="scenes"
        v-loading="loading"
        style="width:100%"
        row-class-name="scene-row"
        @row-click="(row) => openReportDrawer(row)"
      >
        <el-table-column prop="name" label="场景名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="step_count" label="步骤数" width="75" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" round>{{ row.step_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近状态" width="95" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.last_status)" size="small">{{ row.last_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近执行" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.last_run_at || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="90" />
        <el-table-column prop="created_at" label="创建时间" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.created_at }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center" @click.stop>
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click.stop="openSceneDialog(row)">编辑</el-button>
            <el-button size="small" link type="success" :loading="runningId === row.id" @click.stop="handleRun(row)">
              {{ runningId === row.id ? '执行中' : '执行' }}
            </el-button>
            <el-button size="small" link type="info" @click.stop="openReportDrawer(row)">报告</el-button>
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><DocumentChecked /></el-icon>
            <p>暂无测试场景</p>
            <el-button type="primary" size="small" :icon="Plus" @click="openSceneDialog(null)">新建第一个场景</el-button>
          </div>
        </template>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="(v) => { page = v; fetchScenes(); }"
          @size-change="(v) => { pageSize = v; page = 1; fetchScenes(); }"
        />
      </div>
    </el-card>

    <!-- 场景编辑弹窗 -->
    <el-dialog
      v-model="sceneDialogVisible"
      :title="editingScene ? '编辑场景' : '新建场景'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <SceneEditor ref="sceneEditorRef" :scene="editingScene" />
      <template #footer>
        <el-button @click="sceneDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveScene">保存</el-button>
      </template>
    </el-dialog>

    <!-- 执行弹窗 -->
    <el-dialog v-model="runDialogVisible" title="执行场景" width="460px" :close-on-click-modal="false">
      <el-form label-width="90px" style="margin-top:8px">
        <el-form-item label="执行环境">
          <el-select v-model="runForm.envId" placeholder="选择环境（可选）" clearable style="width:100%" @change="onEnvChange">
            <el-option v-for="e in envList" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL">
          <el-input v-model="runForm.base_url" placeholder="如 https://api.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="runDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="running" @click="confirmRun">开始执行</el-button>
      </template>
    </el-dialog>

    <!-- 报告抽屉 -->
    <el-drawer
      v-model="reportDrawerVisible"
      :title="`「${reportScene?.name}」执行报告`"
      size="780px"
      destroy-on-close
    >
      <div class="report-drawer-body">
        <!-- 报告列表 -->
        <div v-if="!currentReport" class="report-list-panel">
          <div v-if="reportLoading" class="report-loading">
            <el-skeleton :rows="4" animated />
          </div>
          <div v-else-if="reports.length === 0" class="report-empty">
            <el-empty description="暂无执行记录" :image-size="80" />
          </div>
          <div v-else class="report-list">
            <div
              v-for="r in reports"
              :key="r.id"
              class="report-item"
              @click="viewReportDetail(r)"
            >
              <div class="report-item-left">
                <el-tag :type="statusTagType(r.status)" size="small">{{ r.status }}</el-tag>
                <span class="report-time">{{ r.created_at }}</span>
                <span v-if="r.env_name" class="report-env">{{ r.env_name }}</span>
              </div>
              <div class="report-item-right">
                <el-progress
                  :percentage="r.pass_rate"
                  :status="r.pass_rate === 100 ? 'success' : 'exception'"
                  :stroke-width="6"
                  style="width:80px"
                />
                <span class="report-steps">{{ r.passed_steps }}/{{ r.total_steps }} 步</span>
                <span class="report-duration">{{ r.duration_ms }}ms</span>
                <el-button size="small" link type="danger" @click.stop="handleDeleteReport(r)">删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 报告详情 -->
        <div v-else class="report-detail-panel">
          <div class="detail-nav">
            <el-button link :icon="ArrowLeft" @click="currentReport = null">返回列表</el-button>
          </div>
          <ReportDetail :report="currentReport" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Plus, Search, ArrowLeft, DocumentChecked,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getSceneList, createScene, updateScene, deleteScene, runScene,
  getReportList, getReportDetail, deleteReport,
} from '@/api/autotest';
import { getEnvList } from '@/api/apiManage';
import SceneEditor from './components/SceneEditor.vue';
import ReportDetail from './components/ReportDetail.vue';

// ── 列表 ──────────────────────────────────────────────────────
const scenes = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const query = ref({ name: '', status: '' });

const stats = computed(() => ({
  passed: scenes.value.filter((s) => s.last_status === '通过').length,
  failed: scenes.value.filter((s) => s.last_status === '失败').length,
  pending: scenes.value.filter((s) => s.last_status === '未执行').length,
}));

let searchTimer = null;
function debounceFetch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchScenes, 300);
}

async function fetchScenes() {
  loading.value = true;
  try {
    const res = await getSceneList({ ...query.value, page: page.value, pageSize: pageSize.value });
    scenes.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

// ── 场景编辑 ──────────────────────────────────────────────────
const sceneDialogVisible = ref(false);
const editingScene = ref(null);
const saving = ref(false);
const sceneEditorRef = ref(null);

function openSceneDialog(scene) {
  editingScene.value = scene;
  sceneDialogVisible.value = true;
}

async function handleSaveScene() {
  const data = sceneEditorRef.value?.getData();
  if (!data) { ElMessage.error('请修复步骤中的 JSON 格式错误后再保存'); return; }
  if (!data.name?.trim()) { ElMessage.warning('请输入场景名称'); return; }
  saving.value = true;
  try {
    if (editingScene.value) {
      await updateScene(editingScene.value.id, data);
    } else {
      await createScene(data);
    }
    ElMessage.success('保存成功');
    sceneDialogVisible.value = false;
    fetchScenes();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除场景「${row.name}」吗？`, '删除确认', { type: 'warning' });
  await deleteScene(row.id);
  ElMessage.success('已删除');
  fetchScenes();
}

// ── 执行 ──────────────────────────────────────────────────────
const runDialogVisible = ref(false);
const running = ref(false);
const runningId = ref(null);
const runningScene = ref(null);
const runForm = ref({ envId: null, base_url: '', env_name: '' });
const envList = ref([]);

async function handleRun(row) {
  runningScene.value = row;
  runForm.value = { envId: null, base_url: '', env_name: '' };
  const res = await getEnvList();
  envList.value = res.data || [];
  runDialogVisible.value = true;
}

function onEnvChange(id) {
  const env = envList.value.find((e) => e.id === id);
  if (env) {
    runForm.value.base_url = env.url;
    runForm.value.env_name = env.name;
  }
}

async function confirmRun() {
  running.value = true;
  runningId.value = runningScene.value.id;
  runDialogVisible.value = false;
  try {
    const res = await runScene(runningScene.value.id, {
      base_url: runForm.value.base_url,
      env_name: runForm.value.env_name,
    });
    const r = res.data;
    // 直接更新列表行状态，无需整页刷新
    const target = scenes.value.find((s) => s.id === runningScene.value.id);
    if (target) {
      target.last_status = r.status;
      target.last_run_at = r.created_at;
    }
    ElMessage[r.status === '通过' ? 'success' : 'error'](
      `执行完成：${r.passed_steps}/${r.total_steps} 步通过，耗时 ${r.duration_ms}ms`,
    );
  } finally {
    running.value = false;
    runningId.value = null;
  }
}

// ── 报告抽屉 ──────────────────────────────────────────────────
const reportDrawerVisible = ref(false);
const reportLoading = ref(false);
const reports = ref([]);
const reportScene = ref(null);
const currentReport = ref(null);

async function openReportDrawer(row) {
  reportScene.value = row;
  currentReport.value = null;
  reportDrawerVisible.value = true;
  reportLoading.value = true;
  try {
    const res = await getReportList({ scene_id: row.id, pageSize: 50 });
    reports.value = res.data.list || [];
  } finally {
    reportLoading.value = false;
  }
}

async function viewReportDetail(row) {
  const res = await getReportDetail(row.id);
  currentReport.value = res.data;
}

async function handleDeleteReport(row) {
  await ElMessageBox.confirm('确定删除该报告吗？', '删除确认', { type: 'warning' });
  await deleteReport(row.id);
  ElMessage.success('已删除');
  reports.value = reports.value.filter((r) => r.id !== row.id);
}

function statusTagType(status) {
  const map = {
    通过: 'success', 失败: 'danger', 执行中: 'warning', 未执行: 'info',
  };
  return map[status] || 'info';
}

onMounted(fetchScenes);
</script>

<style scoped lang="scss">
.autotest-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── 统计卡片 ──────────────────────────────────────────────────
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #dcdfe6;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

  &.success { border-left-color: #67c23a; .stat-value { color: #67c23a; } }
  &.danger  { border-left-color: #f56c6c; .stat-value { color: #f56c6c; } }
  &.info    { border-left-color: #909399; .stat-value { color: #909399; } }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    color: #303133;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 6px;
  }
}

// ── 主卡片 ────────────────────────────────────────────────────
.main-card {
  :deep(.el-card__body) { padding: 16px 20px; }
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 10px;
  }
}

// ── 表格 ──────────────────────────────────────────────────────
:deep(.scene-row) {
  cursor: pointer;
  &:hover td { background: #f5f7ff !important; }
}

.time-text {
  font-size: 12px;
  color: #909399;
}

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

// ── 报告抽屉 ──────────────────────────────────────────────────
.report-drawer-body {
  height: 100%;
  overflow-y: auto;
}

.report-loading { padding: 16px; }

.report-empty {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: #f5f7ff;
  }

  .report-item-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .report-item-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .report-time { font-size: 13px; color: #606266; }
  .report-env  { font-size: 12px; color: #909399; background: #f5f7fa; padding: 1px 6px; border-radius: 3px; }
  .report-steps { font-size: 12px; color: #606266; white-space: nowrap; }
  .report-duration { font-size: 12px; color: #909399; white-space: nowrap; }
}

.detail-nav {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}
</style>
