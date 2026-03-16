<template>
  <el-card class="api-list-card">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索接口名称或路径"
          clearable
          style="width: 260px"
          @input="handleSearchInput"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedMethod"
          placeholder="全部方法"
          clearable
          style="width: 130px"
          @change="handleMethodChange"
        >
          <el-option v-for="m in HTTP_METHODS" :key="m" :label="m" :value="m">
            <el-tag :type="METHOD_TAG_TYPE[m]" size="small" effect="plain">{{ m }}</el-tag>
          </el-option>
        </el-select>
        <template v-if="selectedIds.length > 0">
          <el-button type="primary" plain size="small" @click="bulkSetServiceVisible = true">
            批量设置服务 ({{ selectedIds.length }})
          </el-button>
          <el-button type="danger" plain size="small" :icon="Delete" @click="handleBulkDelete">
            批量删除 ({{ selectedIds.length }})
          </el-button>
        </template>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="$emit('add')">新增接口</el-button>
        <el-button :icon="Upload" @click="$emit('import')">导入 Swagger</el-button>
      </div>
    </div>

    <!-- 批量设置服务弹窗 -->
    <el-dialog
      v-model="bulkSetServiceVisible"
      title="批量设置所属服务"
      width="360px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="所属服务">
          <el-select
            v-model="bulkServiceId"
            placeholder="请选择服务（留空则清除）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="svc in serviceList"
              :key="svc.id"
              :label="svc.name"
              :value="svc.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bulkSetServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBulkSetService">确认</el-button>
      </template>
    </el-dialog>

    <!-- 骨架屏 -->
    <el-skeleton v-if="loading" :rows="6" animated style="padding: 16px 0" />

    <!-- 接口表格 -->
    <el-table
      v-else
      ref="tableRef"
      :data="list"
      style="width: 100%"
      row-key="id"
      row-class-name="clickable-row"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <el-table-column type="selection" width="46" @click.stop />

      <el-table-column label="Method" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="METHOD_TAG_TYPE[row.method]" size="small" effect="plain" class="method-tag">
            {{ row.method }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="接口名称" min-width="180" show-overflow-tooltip />

      <el-table-column prop="path" label="接口路径" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <code class="path-code">{{ row.path }}</code>
        </template>
      </el-table-column>

      <el-table-column label="所属服务" width="130" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-if="row.service_name" size="small" type="info" effect="plain">{{ row.service_name }}</el-tag>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.description">{{ row.description }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="success"
            @click.stop="$emit('debug', row)"
          >调试</el-button>
          <el-button
            size="small"
            link
            type="primary"
            @click.stop="$emit('edit', row)"
          >编辑</el-button>
          <el-button
            size="small"
            link
            type="danger"
            @click.stop="$emit('delete', row)"
          >删除</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-state">
          <el-empty description="暂无接口，点击「导入 Swagger」或「新增接口」开始添加" :image-size="100" />
        </div>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="!loading && total > 0" class="pagination-wrapper">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="(val) => $emit('page-change', val)"
        @size-change="(val) => $emit('size-change', val)"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
import {
  Search, Delete, Plus, Upload,
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

defineProps({
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  serviceList: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'row-click', 'edit', 'delete', 'bulk-delete', 'bulk-set-service',
  'debug', 'search', 'filter-method', 'page-change', 'size-change',
  'add', 'import',
]);

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const METHOD_TAG_TYPE = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'info', DELETE: 'danger',
};

const searchKeyword = ref('');
const selectedMethod = ref('');
const selectedIds = ref([]);
const tableRef = ref(null);
const bulkSetServiceVisible = ref(false);
const bulkServiceId = ref(null);

let searchTimer = null;

function handleSearchInput(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { emit('search', val); }, 300);
}

function handleMethodChange(val) {
  emit('filter-method', val);
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id);
}

function handleRowClick(row) {
  emit('row-click', row);
}

async function handleBulkDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个接口吗？此操作不可撤销。`,
      '批量删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
    emit('bulk-delete', [...selectedIds.value]);
    selectedIds.value = [];
    tableRef.value?.clearSelection();
  } catch { /* 取消 */ }
}

function handleBulkSetService() {
  emit('bulk-set-service', { ids: [...selectedIds.value], serviceId: bulkServiceId.value ?? null });
  bulkSetServiceVisible.value = false;
  bulkServiceId.value = null;
  selectedIds.value = [];
  tableRef.value?.clearSelection();
}
</script>

<style scoped lang="scss">
.api-list-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .toolbar-right { display: flex; gap: 8px; }
}

.path-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #606266;
}

.method-tag { font-weight: 700; letter-spacing: 0.5px; }

.empty-text { color: #c0c4cc; }
.empty-state { padding: 40px 0; }

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  flex-shrink: 0;
}

:deep(.clickable-row) {
  cursor: pointer;
  &:hover td { background: #f5f7fa !important; }
}
</style>
