<template>
  <div class="report-view">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ total }}</div>
        <div class="stat-label">全部报告</div>
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
        <div class="stat-value">{{ stats.avgRate }}<span class="stat-unit">%</span></div>
        <div class="stat-label">平均通过率</div>
      </div>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.scene_name"
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
            @change="fetchReports"
          >
            <el-option label="通过" value="通过" />
            <el-option label="失败" value="失败" />
            <el-option label="执行中" value="执行中" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:240px"
            value-format="YYYY-MM-DD"
            @change="fetchReports"
          />
        </div>
        <el-button
          v-if="selectedRows.length > 0"
          type="danger"
          plain
          size="small"
          @click="handleBatchDelete"
        >
          删除选中 ({{ selectedRows.length }})
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="reports"
        v-loading="loading"
        style="width:100%"
        row-class-name="report-row"
        @selection-change="selectedRows = $event"
        @row-click="(row) => viewDetail(row)"
      >
        <el-table-column type="selection" width="46" @click.stop />
        <el-table-column prop="scene_name" label="场景名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通过率" width="130" align="center">
          <template #default="{ row }">
            <div class="pass-rate-cell">
              <el-progress
                :percentage="row.pass_rate"
                :color="rateColor(row.pass_rate)"
                :stroke-width="6"
                :show-text="false"
                style="flex:1"
              />
              <span class="rate-text" :style="{ color: rateColor(row.pass_rate) }">
                {{ row.pass_rate }}%
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="步骤" width="90" align="center">
          <template #default="{ row }">
            <span class="step-text">
              <span class="step-pass">{{ row.passed_steps }}</span>
              <span class="step-sep">/</span>
              <span>{{ row.total_steps }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.duration_ms }}ms</span>
          </template>
        </el-table-column>
        <el-table-column prop="env_name" label="环境" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.env_name" class="env-tag">{{ row.env_name }}</span>
            <span v-else class="time-text">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="executor_name" label="执行人" width="90" />
        <el-table-column label="执行时间" width="155">
          <template #default="{ row }">
            <span class="time-text">{{ row.created_at }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <el-icon size="48" color="#dcdfe6"><DataAnalysis /></el-icon>
            <p>暂无执行报告</p>
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
          @current-change="(v) => { page = v; fetchReports(); }"
          @size-change="(v) => { pageSize = v; page = 1; fetchReports(); }"
        />
      </div>
    </el-card>

    <!-- 报告详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="报告详情"
      size="820px"
      destroy-on-close
    >
      <ReportDetail v-if="currentReport" :report="currentReport" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, DataAnalysis } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReportList, getReportDetail, deleteReport } from '@/api/autotest';
import ReportDetail from './components/ReportDetail.vue';

const reports = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const query = ref({ status: '', scene_name: '' });
const dateRange = ref(null);
const selectedRows = ref([]);

// 统计（基于当前页数据，直观反映筛选结果）
const stats = computed(() => {
  const passed = reports.value.filter((r) => r.status === '通过').length;
  const failed = reports.value.filter((r) => r.status === '失败').length;
  const rates = reports.value.map((r) => r.pass_rate).filter((v) => v != null);
  const avgRate = rates.length
    ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
    : 0;
  return { passed, failed, avgRate };
});

let searchTimer = null;
function debounceFetch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchReports, 300);
}

async function fetchReports() {
  loading.value = true;
  try {
    const params = {
      ...query.value,
      page: page.value,
      pageSize: pageSize.value,
    };
    if (dateRange.value) {
      [params.date_start, params.date_end] = dateRange.value;
    }
    const res = await getReportList(params);
    reports.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

// 详情抽屉
const detailVisible = ref(false);
const currentReport = ref(null);

async function viewDetail(row) {
  const res = await getReportDetail(row.id);
  currentReport.value = res.data;
  detailVisible.value = true;
}

// 删除
async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该报告吗？', '删除确认', { type: 'warning' });
  await deleteReport(row.id);
  ElMessage.success('已删除');
  reports.value = reports.value.filter((r) => r.id !== row.id);
  total.value -= 1;
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedRows.value.length} 条报告吗？`,
    '批量删除',
    { type: 'warning' },
  );
  await Promise.all(selectedRows.value.map((r) => deleteReport(r.id)));
  ElMessage.success('已删除');
  fetchReports();
}

function statusTagType(s) {
  return { 通过: 'success', 失败: 'danger', 执行中: 'warning' }[s] || 'info';
}

function rateColor(rate) {
  if (rate === 100) return '#67c23a';
  if (rate >= 60) return '#e6a23c';
  return '#f56c6c';
}

onMounted(fetchReports);
</script>

<style scoped lang="scss">
.report-view {
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
  &.info    { border-left-color: #409eff; .stat-value { color: #409eff; } }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    color: #303133;

    .stat-unit { font-size: 14px; font-weight: 400; margin-left: 2px; }
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

  .toolbar-left { display: flex; gap: 10px; align-items: center; }
}

// ── 表格 ──────────────────────────────────────────────────────
:deep(.report-row) {
  cursor: pointer;
  &:hover td { background: #f5f7ff !important; }
}

.pass-rate-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .rate-text {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    min-width: 34px;
    text-align: right;
  }
}

.step-text {
  font-size: 13px;

  .step-pass { color: #67c23a; font-weight: 600; }
  .step-sep  { color: #dcdfe6; margin: 0 1px; }
}

.time-text { font-size: 12px; color: #909399; }

.env-tag {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 1px 6px;
  border-radius: 3px;
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
</style>
