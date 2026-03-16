<template>
  <el-drawer
    :model-value="visible"
    size="680px"
    direction="rtl"
    :before-close="() => $emit('update:visible', false)"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="drawer-header">
        <el-tag
          :type="methodTagType(api?.method)"
          size="small"
          effect="plain"
          class="method-tag"
        >{{ api?.method }}</el-tag>
        <span class="drawer-title">{{ api?.name }}</span>
      </div>
    </template>

    <div v-if="api" class="detail-body">
      <!-- 基本信息 -->
      <div class="section-title">基本信息</div>
      <div class="desc-grid">
        <span class="label">接口路径</span>
        <span class="value path-value">
          <el-tag :type="methodTagType(api.method)" size="small" effect="plain" class="method-inline">{{ api.method }}</el-tag>
          <code class="path-code">{{ api.path }}</code>
          <el-button link size="small" :icon="CopyDocument" @click="copyPath" />
        </span>
        <span class="label">所属服务</span>
        <span class="value">
          <el-tag v-if="api.service_name" size="small" type="info" effect="plain">{{ api.service_name }}</el-tag>
          <span v-else class="empty-val">未分配</span>
        </span>
        <span class="label">描述</span>
        <span class="value">{{ api.description || '-' }}</span>
        <span class="label">创建时间</span>
        <span class="value">{{ api.created_at || '-' }}</span>
      </div>

      <!-- 请求参数 -->
      <div class="section-title" style="margin-top: 20px">请求参数</div>
      <el-tabs v-model="activeTab" class="param-tabs">
        <el-tab-pane label="Query" name="query">
          <div v-if="queryParams.length > 0" class="param-table">
            <div class="param-header">
              <span>Key</span><span>Value</span><span>描述</span>
            </div>
            <div v-for="(row, i) in queryParams" :key="i" class="param-row">
              <span class="param-key">{{ row.key }}</span>
              <span class="param-val">{{ row.value || '-' }}</span>
              <span class="param-desc">{{ row.description || '-' }}</span>
            </div>
          </div>
          <el-empty v-else description="无 Query 参数" :image-size="60" />
        </el-tab-pane>
        <el-tab-pane label="Header" name="header">
          <div v-if="headerParams.length > 0" class="param-table">
            <div class="param-header">
              <span>Key</span><span>Value</span><span>描述</span>
            </div>
            <div v-for="(row, i) in headerParams" :key="i" class="param-row">
              <span class="param-key">{{ row.key }}</span>
              <span class="param-val">{{ row.value || '-' }}</span>
              <span class="param-desc">{{ row.description || '-' }}</span>
            </div>
          </div>
          <el-empty v-else description="无 Header 参数" :image-size="60" />
        </el-tab-pane>
        <el-tab-pane label="Body" name="body">
          <div v-if="bodyType !== 'none'">
            <el-tag size="small" type="info" effect="plain" class="body-type-tag">{{ bodyType }}</el-tag>
            <!-- JSON 字段列表 -->
            <div v-if="bodyType === 'json' && jsonFields.length > 0" class="param-table" style="margin-top: 10px">
              <div class="param-header json-header">
                <span>字段名</span><span>类型</span><span>必填</span><span>描述</span>
              </div>
              <div v-for="(f, i) in jsonFields" :key="i" class="param-row json-row">
                <span class="param-key">{{ f.key }}</span>
                <span class="param-val"><el-tag size="small" effect="plain">{{ f.type }}</el-tag></span>
                <span class="param-val">
                  <el-icon v-if="f.required" color="#67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else color="#c0c4cc"><CircleClose /></el-icon>
                </span>
                <span class="param-desc">{{ f.description || '-' }}</span>
              </div>
            </div>
            <!-- form-data 键值对 -->
            <div v-else-if="formBodyRows.length > 0" class="param-table" style="margin-top: 10px">
              <div class="param-header">
                <span>Key</span><span>Value</span><span>描述</span>
              </div>
              <div v-for="(row, i) in formBodyRows" :key="i" class="param-row">
                <span class="param-key">{{ row.key }}</span>
                <span class="param-val">{{ row.value || '-' }}</span>
                <span class="param-desc">{{ row.description || '-' }}</span>
              </div>
            </div>
            <!-- 文本类型 -->
            <pre v-else-if="bodyText" class="body-text">{{ bodyText }}</pre>
            <el-empty v-else description="无 Body 内容" :image-size="60" />
          </div>
          <el-empty v-else description="无 Body 参数" :image-size="60" />
        </el-tab-pane>
      </el-tabs>

      <!-- 响应示例 -->
      <div v-if="api.response_example" class="section-title" style="margin-top: 20px">响应示例</div>
      <pre v-if="api.response_example" class="response-pre">{{ api.response_example }}</pre>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button :icon="Delete" type="danger" plain @click="$emit('delete', api)">删除</el-button>
        <div class="footer-right">
          <el-button :icon="VideoPlay" @click="$emit('debug', api)">调试</el-button>
          <el-button :icon="Edit" type="primary" @click="$emit('edit', api)">编辑</el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  Edit, Delete, VideoPlay, CopyDocument, CircleCheck, CircleClose,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: { type: Boolean, default: false },
  api: { type: Object, default: null },
});
defineEmits(['update:visible', 'edit', 'delete', 'debug']);

const activeTab = ref('query');

const METHOD_TAG_TYPE = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'info', DELETE: 'danger',
};
const methodTagType = (m) => METHOD_TAG_TYPE[(m || '').toUpperCase()] || '';

const queryParams = computed(() => {
  const p = props.api?.parameters || {};
  return Array.isArray(p.query) ? p.query : [];
});
const headerParams = computed(() => {
  const p = props.api?.parameters || {};
  return Array.isArray(p.header) ? p.header : [];
});
const bodyType = computed(() => {
  const body = props.api?.parameters?.body;
  return body?.type || 'none';
});
const jsonFields = computed(() => {
  const body = props.api?.parameters?.body;
  if (body?.type === 'json' && Array.isArray(body.content)) return body.content;
  return [];
});
const formBodyRows = computed(() => {
  const body = props.api?.parameters?.body;
  const formTypes = ['form-data', 'x-www-form-urlencoded'];
  if (formTypes.includes(body?.type) && Array.isArray(body.content)) return body.content;
  return [];
});
const bodyText = computed(() => {
  const body = props.api?.parameters?.body;
  if (typeof body?.content === 'string') return body.content;
  return '';
});

function copyPath() {
  const text = props.api?.path || '';
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('路径已复制');
  });
}
</script>

<style scoped lang="scss">
.drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  .method-tag { font-weight: 700; letter-spacing: 0.5px; }
  .drawer-title { font-size: 16px; font-weight: 600; color: #303133; }
}

.detail-body { padding-bottom: 20px; }

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f2f5;
}

.desc-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px 12px;
  align-items: start;

  .label {
    font-size: 13px;
    color: #909399;
    padding-top: 2px;
  }
  .value {
    font-size: 13px;
    color: #303133;
    word-break: break-all;
  }
  .empty-val { color: #c0c4cc; }
}

.path-value {
  display: flex;
  align-items: center;
  gap: 6px;
  .method-inline { font-weight: 700; }
  .path-code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    color: #303133;
  }
}

.param-tabs { margin-top: 4px; }

.param-table {
  .param-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    gap: 8px;
    font-size: 12px;
    color: #909399;
    padding: 4px 8px 6px;
    border-bottom: 1px solid #f0f2f5;
    margin-bottom: 4px;
    &.json-header { grid-template-columns: 1.5fr 1fr 0.6fr 1.5fr; }
  }
  .param-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    gap: 8px;
    font-size: 13px;
    padding: 6px 8px;
    border-radius: 4px;
    &:nth-child(even) { background: #fafafa; }
    &.json-row { grid-template-columns: 1.5fr 1fr 0.6fr 1.5fr; }
  }
  .param-key { font-weight: 500; color: #303133; font-family: monospace; }
  .param-val { color: #606266; }
  .param-desc { color: #909399; }
}

.body-type-tag { margin-bottom: 8px; }

.body-text {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
  margin: 8px 0 0;
}

.response-pre {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
  margin: 0;
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .footer-right { display: flex; gap: 8px; }
}
</style>
