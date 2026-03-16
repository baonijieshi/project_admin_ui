<template>
  <div class="api-manage-view">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="{ 'is-active': activeCard === card.key }"
        :style="{ '--card-color': card.color }"
        @click="handleCardClick(card)"
      >
        <div class="card-value">{{ card.value }}</div>
        <div class="card-label">{{ card.label }}</div>
      </div>
    </div>

    <!-- 主体布局 -->
    <div class="main-layout">
      <!-- 左侧面板 -->
      <div class="side-panel">
        <!-- 服务列表 -->
        <div class="panel-section">
          <div class="panel-section-header">
            <span class="panel-section-title">服务</span>
            <el-button :icon="Plus" size="small" circle @click="openServiceDialog(null)" />
          </div>
          <ul class="nav-list">
            <li
              class="nav-item"
              :class="{ 'is-active': selectedServiceId === null }"
              @click="selectService(null)"
            >
              <el-icon class="nav-icon"><Grid /></el-icon>
              <span class="nav-name">全部接口</span>
              <span class="nav-badge">{{ totalAll }}</span>
            </li>
            <li
              v-for="svc in serviceList"
              :key="svc.id"
              class="nav-item"
              :class="{ 'is-active': selectedServiceId === svc.id }"
              @click="selectService(svc.id)"
            >
              <el-icon class="nav-icon"><Folder /></el-icon>
              <span class="nav-name" :title="svc.name">{{ svc.name }}</span>
              <span class="nav-badge">{{ svc.api_count }}</span>
              <span class="nav-actions">
                <el-icon @click.stop="openServiceDialog(svc)"><Edit /></el-icon>
                <el-icon class="danger" @click.stop="handleDeleteService(svc)"><Delete /></el-icon>
              </span>
            </li>
          </ul>
        </div>

        <div class="panel-divider" />

        <!-- 环境管理 -->
        <div class="panel-section">
          <div class="panel-section-header">
            <span class="panel-section-title">环境</span>
            <el-button :icon="Plus" size="small" circle @click="openEnvDialog(null)" />
          </div>
          <ul class="nav-list">
            <li
              v-for="env in envList"
              :key="env.id"
              class="nav-item env-item"
              :class="{ 'is-active': activeEnvId === env.id }"
              @click="setActive(env.id)"
            >
              <el-icon class="nav-icon"><Connection /></el-icon>
              <span class="nav-name" :title="env.url">{{ env.name }}</span>
              <span v-if="activeEnvId === env.id" class="env-active-dot" />
              <span class="nav-actions">
                <el-icon @click.stop="openEnvDialog(env)"><Edit /></el-icon>
                <el-icon class="danger" @click.stop="handleDeleteEnv(env)"><Delete /></el-icon>
              </span>
            </li>
            <li v-if="envList.length === 0" class="nav-empty">暂无环境</li>
          </ul>
        </div>
      </div>

      <!-- 右侧接口列表 -->
      <div class="api-panel">
        <ApiList
          :list="apiList"
          :loading="loading"
          :total="total"
          :page="page"
          :page-size="pageSize"
          :service-list="serviceList"
          @row-click="handleRowClick"
          @edit="handleEdit"
          @delete="handleDelete"
          @bulk-delete="handleBulkDelete"
          @bulk-set-service="handleBulkSetService"
          @debug="handleDebug"
          @search="handleSearch"
          @filter-method="handleFilterMethod"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
          @add="handleAdd"
          @import="importVisible = true"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <ApiDetailDrawer
      v-model:visible="detailVisible"
      :api="detailApi"
      @edit="handleEdit"
      @delete="handleDelete"
      @debug="handleDebug"
    />

    <ApiForm
      v-model:visible="formVisible"
      :editing-id="editingId"
      :default-service-id="selectedServiceId"
      @saved="onApiSaved"
    />

    <SwaggerImportDialog
      v-model:visible="importVisible"
      :import-progress="importProgress"
      @import-confirm="handleImportConfirm"
    />

    <DuplicateConfirmDialog
      v-model:visible="duplicateVisible"
      :duplicates="duplicateData.duplicates"
      :total="duplicateData.total"
      :duplicate-count="duplicateData.duplicateCount"
      @confirm="handleDuplicateConfirm"
      @cancel="pendingApis = null"
    />

    <ApiDebugger
      v-model:visible="debuggerVisible"
      :api="debuggingApi"
      :base-url="activeBaseUrl"
    />

    <!-- 服务弹窗 -->
    <el-dialog
      v-model="serviceDialogVisible"
      :title="editingService ? '编辑服务' : '新增服务'"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form ref="serviceFormRef" :model="serviceForm" :rules="serviceRules" label-width="80px">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="serviceForm.name" placeholder="请输入服务名称" clearable />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="serviceForm.description" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="serviceSaving" @click="handleSaveService">保存</el-button>
      </template>
    </el-dialog>

    <!-- 环境弹窗 -->
    <el-dialog
      v-model="envDialogVisible"
      :title="editingEnv ? '编辑环境' : '新增环境'"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form ref="envFormRef" :model="envForm" :rules="envRules" label-width="80px">
        <el-form-item label="环境名称" prop="name">
          <el-input v-model="envForm.name" placeholder="如：开发环境、测试环境" clearable />
        </el-form-item>
        <el-form-item label="Base URL" prop="url">
          <el-input v-model="envForm.url" placeholder="如：https://api.example.com" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="envDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEnv">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Plus, Edit, Delete, Grid, Folder, Connection,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import useApiManage from '@/composables/useApiManage';
import useEnv from '@/composables/useEnv';
import {
  importApis, getServiceList, createService, updateService, deleteService,
  bulkDeleteApis, bulkSetService,
} from '@/api/apiManage';
import ApiList from './components/ApiList.vue';
import ApiForm from './components/ApiForm.vue';
import SwaggerImportDialog from './components/SwaggerImportDialog.vue';
import DuplicateConfirmDialog from './components/DuplicateConfirmDialog.vue';
import ApiDebugger from './components/ApiDebugger.vue';
import ApiDetailDrawer from './components/ApiDetailDrawer.vue';

const {
  apiList, total, loading, page, pageSize, searchKeyword, filterMethod, serviceId, fetchList, deleteApi,
} = useApiManage();

const {
  envList, activeEnvId, activeBaseUrl, loadEnvs, addEnv, editEnv, removeEnv, setActive,
} = useEnv();

// 统计卡片
const activeCard = ref('all');
const statCards = computed(() => {
  const list = apiList.value;
  return [
    {
      key: 'all',
      label: '全部接口',
      value: total.value,
      color: '#409eff',
    },
    {
      key: 'GET',
      label: 'GET',
      value: list.filter((a) => a.method === 'GET').length,
      color: '#67c23a',
    },
    {
      key: 'POST',
      label: 'POST',
      value: list.filter((a) => a.method === 'POST').length,
      color: '#409eff',
    },
    {
      key: 'PUT',
      label: 'PUT',
      value: list.filter((a) => a.method === 'PUT').length,
      color: '#e6a23c',
    },

    {
      key: 'DELETE',
      label: 'DELETE',
      value: list.filter((a) => a.method === 'DELETE').length,
      color: '#f56c6c',
    },
  ];
});

function handleCardClick(card) {
  activeCard.value = card.key;
  filterMethod.value = card.key === 'all' ? '' : card.key;
  page.value = 1;
  fetchList();
}

// 服务列表
const serviceList = ref([]);
const selectedServiceId = ref(null);
const totalAll = ref(0);

async function loadServices() {
  const res = await getServiceList();
  if (res.code === 200) serviceList.value = res.data || [];
}

function selectService(id) {
  selectedServiceId.value = id;
  serviceId.value = id;
  page.value = 1;
  fetchList().then(() => {
    if (id === null) totalAll.value = total.value;
  });
}

// 服务弹窗
const serviceDialogVisible = ref(false);
const editingService = ref(null);
const serviceForm = ref({ name: '', description: '' });
const serviceRules = { name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }] };
const serviceFormRef = ref(null);
const serviceSaving = ref(false);

function openServiceDialog(svc) {
  editingService.value = svc;
  serviceForm.value = { name: svc?.name || '', description: svc?.description || '' };
  serviceDialogVisible.value = true;
}

async function handleSaveService() {
  const valid = await serviceFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  serviceSaving.value = true;
  try {
    if (editingService.value) {
      await updateService(editingService.value.id, serviceForm.value);
      ElMessage.success('服务已更新');
    } else {
      await createService(serviceForm.value);
      ElMessage.success('服务已创建');
    }
    serviceDialogVisible.value = false;
    await loadServices();
  } finally {
    serviceSaving.value = false;
  }
}

async function handleDeleteService(svc) {
  try {
    await ElMessageBox.confirm(
      `确定删除服务「${svc.name}」吗？接口不会被删除，但会解除关联。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
    await deleteService(svc.id);
    ElMessage.success('已删除');
    if (selectedServiceId.value === svc.id) selectService(null);
    await loadServices();
  } catch { /* 取消 */ }
}

// 环境弹窗
const envDialogVisible = ref(false);
const editingEnv = ref(null);
const envForm = ref({ name: '', url: '' });
const envFormRef = ref(null);
const envRules = {
  name: [{ required: true, message: '请输入环境名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入环境地址', trigger: 'blur' }],
};

function openEnvDialog(env) {
  editingEnv.value = env;
  envForm.value = { name: env?.name || '', url: env?.url || '' };
  envDialogVisible.value = true;
}

async function handleSaveEnv() {
  const valid = await envFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (editingEnv.value) {
    await editEnv(editingEnv.value.id, envForm.value);
    ElMessage.success('环境已更新');
  } else {
    await addEnv(envForm.value);
    ElMessage.success('环境已添加');
  }
  envDialogVisible.value = false;
}

async function handleDeleteEnv(env) {
  try {
    await ElMessageBox.confirm(`确定删除环境「${env.name}」吗？`, '删除确认', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    await removeEnv(env.id);
  } catch { /* 取消 */ }
}

// 接口操作
const formVisible = ref(false);
const editingId = ref(null);
const importVisible = ref(false);
const importProgress = ref(-1);
const duplicateVisible = ref(false);
const duplicateData = ref({ duplicates: [], total: 0, duplicateCount: 0 });
const pendingApis = ref(null);
const debuggerVisible = ref(false);
const debuggingApi = ref(null);
const detailVisible = ref(false);
const detailApi = ref(null);

function handleAdd() { editingId.value = null; formVisible.value = true; }

function handleRowClick(row) {
  detailApi.value = row;
  detailVisible.value = true;
}

function handleEdit(api) {
  detailVisible.value = false;
  editingId.value = api.id;
  formVisible.value = true;
}

async function handleDelete(api) {
  try {
    await ElMessageBox.confirm(
      `确定要删除接口「${api.name}」吗？此操作不可撤销。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
    await deleteApi(api.id);
    detailVisible.value = false;
    await loadServices();
  } catch { /* 取消 */ }
}

async function handleBulkDelete(ids) {
  try {
    await bulkDeleteApis(ids);
    ElMessage.success(`已删除 ${ids.length} 个接口`);
    await onApiSaved();
  } catch { /* request.js 统一处理 */ }
}

async function handleBulkSetService({ ids, serviceId: sid }) {
  try {
    await bulkSetService(ids, sid);
    ElMessage.success(`已更新 ${ids.length} 个接口的所属服务`);
    await onApiSaved();
  } catch { /* request.js 统一处理 */ }
}

function handleDebug(api) {
  detailVisible.value = false;
  debuggingApi.value = api;
  debuggerVisible.value = true;
}

function handleSearch(keyword) { searchKeyword.value = keyword; page.value = 1; fetchList(); }
function handleFilterMethod(method) { filterMethod.value = method; page.value = 1; fetchList(); }
function handlePageChange(val) { page.value = val; fetchList(); }
function handleSizeChange(val) { pageSize.value = val; page.value = 1; fetchList(); }

async function onApiSaved() {
  await fetchList();
  await loadServices();
  if (selectedServiceId.value === null) totalAll.value = total.value;
}

// 导入
function startProgress() {
  importProgress.value = 0;
  const timer = setInterval(() => {
    if (importProgress.value < 85) {
      importProgress.value = Math.min(85, importProgress.value + Math.floor(Math.random() * 12) + 4);
    }
  }, 200);
  return () => clearInterval(timer);
}

function finishProgress(cb) {
  importProgress.value = 100;
  setTimeout(() => { importProgress.value = -1; if (cb) cb(); }, 600);
}

async function handleImportConfirm(apis) {
  pendingApis.value = apis;
  await doImport(apis, null);
}

async function doImport(apis, conflictStrategy) {
  const stopProgress = startProgress();
  try {
    const payload = { apis };
    if (conflictStrategy) payload.conflict_strategy = conflictStrategy;
    const res = await importApis(payload);
    stopProgress();
    const { created = 0, overwritten = 0, skipped = 0 } = res.data || {};
    finishProgress(() => {
      importVisible.value = false;
      pendingApis.value = null;
      ElMessage.success(`导入完成：新增 ${created} 个，覆盖 ${overwritten} 个，跳过 ${skipped} 个`);
      onApiSaved();
    });
  } catch (err) {
    stopProgress();
    importProgress.value = -1;
    const resData = err?.response?.data;
    if (resData?.code === 409) {
      const d = resData.data || {};
      duplicateData.value = {
        duplicates: d.duplicates || [],
        total: d.total ?? apis.length,
        duplicateCount: d.duplicate_count ?? 0,
      };
      duplicateVisible.value = true;
    }
  }
}

async function handleDuplicateConfirm(strategy) {
  if (!pendingApis.value) return;
  duplicateVisible.value = false;
  await doImport(pendingApis.value, strategy);
}

onMounted(async () => {
  await loadServices();
  await fetchList();
  totalAll.value = total.value;
  await loadEnvs();
});
</script>

<style scoped lang="scss">
.api-manage-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

// 统计卡片
.stat-cards {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  border-top: 3px solid var(--card-color);
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); transform: translateY(-1px); }
  &.is-active { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); }

  .card-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--card-color);
    line-height: 1;
    margin-bottom: 6px;
  }
  .card-label {
    font-size: 12px;
    color: #909399;
  }
}

// 主体布局
.main-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

// 左侧面板
.side-panel {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 12px;
  overflow-y: auto;
}

.panel-section { margin-bottom: 4px; }

.panel-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 4px;
  .panel-section-title {
    font-size: 11px;
    font-weight: 700;
    color: #909399;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.panel-divider {
  height: 1px;
  background: #f0f2f5;
  margin: 10px 0;
}

.nav-list { list-style: none; margin: 0; padding: 0; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: background 0.15s;
  position: relative;

  &:hover {
    background: #f5f7fa;
    .nav-actions { opacity: 1; }
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
  }

  .nav-icon { font-size: 13px; flex-shrink: 0; color: #c0c4cc; }
  .nav-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nav-badge {
    flex-shrink: 0;
    font-size: 11px;
    color: #909399;
    background: #f0f2f5;
    border-radius: 10px;
    padding: 1px 6px;
  }
  .nav-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
    .el-icon {
      font-size: 13px;
      color: #909399;
      &:hover { color: var(--el-color-primary); }
      &.danger:hover { color: var(--el-color-danger); }
    }
  }
}

.env-active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67c23a;
  flex-shrink: 0;
}

.nav-empty {
  font-size: 12px;
  color: #c0c4cc;
  padding: 6px 8px;
  text-align: center;
}

// 右侧
.api-panel {
  flex: 1;
  min-width: 0;
}
</style>
