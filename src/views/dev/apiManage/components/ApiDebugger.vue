<template>
  <el-drawer
    :model-value="visible"
    title="接口调试"
    size="800px"
    direction="rtl"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="request-bar">
      <el-select
        v-if="envList.length > 0"
        :model-value="activeEnvId"
        placeholder="选择环境"
        class="env-select"
        @change="onEnvChange"
      >
        <el-option v-for="env in envList" :key="env.id" :label="env.name" :value="env.id">
          <span>{{ env.name }}</span>
          <span class="env-url-hint">{{ env.url }}</span>
        </el-option>
      </el-select>
      <el-input v-model="baseUrl" placeholder="Base URL（如 https://api.example.com）" class="base-url-input" clearable />
      <el-select v-model="method" class="method-select">
        <el-option v-for="m in HTTP_METHODS" :key="m" :label="m" :value="m">
          <el-tag :type="methodTagType(m)" size="small" effect="plain">{{ m }}</el-tag>
        </el-option>
      </el-select>
      <el-input v-model="url" placeholder="接口路径，如 /api/users/{id}" class="path-input" clearable />
      <el-button type="primary" :loading="loading" :disabled="loading" @click="sendRequest">发送请求</el-button>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon closable class="error-alert" @close="error = ''" />

    <el-tabs v-model="activeTab" class="param-tabs">
      <el-tab-pane label="Query" name="query">
        <div class="param-table">
          <div v-for="(row, idx) in queryParams" :key="idx" class="param-row">
            <el-input v-model="row.key" placeholder="Key" size="small" />
            <el-input v-model="row.value" placeholder="Value" size="small" />
            <el-button size="small" type="danger" link @click="removeParam('query', idx)">删除</el-button>
          </div>
          <el-button size="small" type="primary" link @click="addParam('query')">+ 添加参数</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Header" name="header">
        <div class="param-table">
          <div v-for="(row, idx) in headerParams" :key="idx" class="param-row">
            <el-input v-model="row.key" placeholder="Key" size="small" />
            <el-input v-model="row.value" placeholder="Value" size="small" />
            <el-button size="small" type="danger" link @click="removeParam('header', idx)">删除</el-button>
          </div>
          <el-button size="small" type="primary" link @click="addParam('header')">+ 添加参数</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Body" name="body">
        <div class="body-type-bar">
          <span
            v-for="t in BODY_TYPES"
            :key="t.value"
            class="body-type-item"
            :class="{ 'is-active': bodyType === t.value }"
            @click="switchBodyType(t.value)"
          >{{ t.label }}</span>
        </div>
        <!-- none -->
        <div v-if="bodyType === 'none'" class="body-none-tip">该请求没有 Body 参数</div>
        <!-- form-data / x-www-form-urlencoded -->
        <div v-else-if="isFormBodyType" class="param-table">
          <div v-for="(row, idx) in currentBodyRows" :key="idx" class="param-row">
            <el-input v-model="row.key" placeholder="Key" size="small" />
            <el-input v-model="row.value" placeholder="Value" size="small" />
            <el-button size="small" type="danger" link @click="removeBodyRow(idx)">删除</el-button>
          </div>
          <el-button size="small" type="primary" link @click="addBodyRow">+ 添加参数</el-button>
        </div>
        <!-- JSON / XML / Text / Binary -->
        <div v-else>
          <JsonEditor
            v-model="bodyStore[bodyType]"
            :placeholder="bodyPlaceholder(bodyType)"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane label="前置操作" name="pre">
        <div class="hook-tab-tip">发送请求前执行：可设置变量或发送前置 HTTP 请求（如获取 Token）</div>
        <HookEditor v-model="preHooks" />
      </el-tab-pane>
      <el-tab-pane label="后置操作" name="post">
        <div class="hook-tab-tip">请求完成后执行：可提取响应变量或发送清理请求</div>
        <HookEditor v-model="postHooks" />
      </el-tab-pane>
    </el-tabs>

    <div v-if="response.status_code !== null" class="response-section">
      <div class="response-meta">
        <span class="response-label">响应状态：</span>
        <el-tag :type="statusTagType(response.status_code)" size="small" effect="plain">{{ response.status_code }}</el-tag>
        <span class="response-label" style="margin-left:16px">耗时：</span>
        <span class="response-time">{{ response.elapsed_ms }} ms</span>
      </div>
      <div class="response-body">
        <pre class="json-highlight" v-html="highlightJson(response.body)" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import {
  ref, reactive, computed, watch,
} from 'vue';
import useDebugger from '@/composables/useDebugger';
import useEnv from '@/composables/useEnv';
import JsonEditor from '@/views/autotest/components/JsonEditor.vue';
import HookEditor from '@/views/autotest/components/HookEditor.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  api: { type: Object, default: null },
  baseUrl: { type: String, default: '' },
});
defineEmits(['update:visible']);

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const BODY_TYPES = [
  { label: 'none', value: 'none' },
  { label: 'form-data', value: 'form-data' },
  { label: 'x-www-form-urlencoded', value: 'x-www-form-urlencoded' },
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'Text', value: 'text' },
  { label: 'Binary', value: 'binary' },
];
const METHOD_TAG_TYPE = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'info', DELETE: 'danger',
};
const methodTagType = (m) => METHOD_TAG_TYPE[m] || '';
const activeTab = ref('query');

function bodyPlaceholder(type) {
  if (type === 'xml') return '<root>\n  <key>value</key>\n</root>';
  if (type === 'binary') return '（Binary 类型暂不支持文本输入）';
  if (type === 'text') return '请输入文本内容';
  return '';
}

const {
  method, url, baseUrl, queryParams, headerParams,
  loading, response, error, addParam, removeParam,
} = useDebugger();

const { envList, activeEnvId, setActive } = useEnv();

// 与 ApiForm 一致：每种 body 类型独立存储，互不干扰
const bodyType = ref('none');
const bodyStore = reactive({
  'form-data': [],
  'x-www-form-urlencoded': [],
  json: '',
  xml: '',
  text: '',
  binary: '',
});

const preHooks = ref([]);
const postHooks = ref([]);

const FORM_TYPES = ['form-data', 'x-www-form-urlencoded'];
const isFormBodyType = computed(() => FORM_TYPES.includes(bodyType.value));
const currentBodyRows = computed(() => bodyStore[bodyType.value] || []);

function switchBodyType(newType) {
  bodyType.value = newType;
}

function addBodyRow() {
  const key = bodyType.value;
  if (!Array.isArray(bodyStore[key])) bodyStore[key] = [];
  bodyStore[key].push({ key: '', value: '' });
}

function removeBodyRow(idx) {
  const key = bodyType.value;
  if (Array.isArray(bodyStore[key])) bodyStore[key].splice(idx, 1);
}

function onEnvChange(id) {
  setActive(id);
  const env = envList.value.find((e) => e.id === id);
  if (env) baseUrl.value = env.url;
}

watch(() => props.api, (val) => {
  if (!val) return;
  if (val.method) method.value = val.method;
  if (val.path) url.value = val.path;
  if (props.baseUrl) baseUrl.value = props.baseUrl;

  const p = val.parameters || {};

  const query = Array.isArray(p.query) ? p.query : [];
  queryParams.value = query.length
    ? query.map((item) => ({ key: item.key || '', value: item.value || '' }))
    : [{ key: '', value: '' }];

  const header = Array.isArray(p.header) ? p.header : [];
  headerParams.value = header.length
    ? header.map((item) => ({ key: item.key || '', value: item.value || '' }))
    : [{ key: '', value: '' }];

  // 重置所有 body 存储
  bodyStore['form-data'] = [];
  bodyStore['x-www-form-urlencoded'] = [];
  bodyStore.json = '';
  bodyStore.xml = '';
  bodyStore.text = '';
  bodyStore.binary = '';

  preHooks.value = [];
  postHooks.value = [];

  const body = p.body || {};
  const bType = body.type || 'none';
  bodyType.value = bType;

  if (FORM_TYPES.includes(bType)) {
    const rows = Array.isArray(body.content) ? body.content : [];
    bodyStore[bType] = rows.length
      ? rows.map((item) => ({ key: item.key || '', value: '' }))
      : [{ key: '', value: '' }];
  } else if (bType === 'json') {
    const fields = Array.isArray(body.content) ? body.content : [];
    if (fields.length) {
      const obj = {};
      fields.forEach((f) => { if (f.key) obj[f.key] = ''; });
      bodyStore.json = JSON.stringify(obj, null, 2);
    }
  }
}, { immediate: true });

async function sendRequest() {
  error.value = '';
  response.status_code = null;
  response.elapsed_ms = null;
  response.body = null;

  const fullUrl = baseUrl.value ? baseUrl.value.replace(/\/$/, '') + url.value : url.value;
  const params = {};
  queryParams.value.forEach(({ key, value }) => { if (key) params[key] = value; });
  const headers = {};
  headerParams.value.forEach(({ key, value }) => { if (key) headers[key] = value; });

  let body = null;
  if (bodyType.value !== 'none' && ['POST', 'PUT', 'PATCH'].includes(method.value.toUpperCase())) {
    if (isFormBodyType.value) {
      const fd = {};
      currentBodyRows.value.forEach(({ key, value }) => { if (key) fd[key] = value; });
      body = Object.keys(fd).length ? fd : null;
    } else {
      body = bodyStore[bodyType.value] || null;
    }
  }

  const { proxyRequest } = await import('@/api/apiManage');

  // 执行前置操作
  const hookCtx = {};
  await runHooks(preHooks.value, hookCtx, proxyRequest);

  loading.value = true;
  try {
    const res = await proxyRequest({
      url: fullUrl, method: method.value.toUpperCase(), headers, params, body,
    });
    if (res.code === 200) {
      response.status_code = res.data.status_code;
      response.elapsed_ms = res.data.elapsed_ms;
      response.body = res.data.body;

      // 执行后置操作（可从响应中提取变量）
      await runHooks(postHooks.value, hookCtx, proxyRequest, res.data.body);
    } else {
      error.value = res.message || '请求失败';
    }
  } catch (e) {
    error.value = e?.message || '请求失败';
  } finally {
    loading.value = false;
  }
}

function resolveTpl(str, ctx) {
  return (str || '').replace(/\$\{([^}]+)\}/g, (m, key) => (key in ctx ? ctx[key] : m));
}

async function runHooks(hooks, ctx, proxyRequest, responseBody) {
  await (hooks || []).reduce(async (prev, hook) => {
    await prev;
    if (hook.type === 'set_var' && hook.var_name) {
      ctx[hook.var_name] = resolveTpl(hook.value, ctx);
    } else if (hook.type === 'http' && hook.url) {
      try {
        const res = await proxyRequest({
          url: resolveTpl(hook.url, ctx),
          method: (hook.method || 'GET').toUpperCase(),
          headers: {},
          params: {},
          body: hook.body ? resolveTpl(hook.body, ctx) : null,
        });
        if (res.code === 200 && hook.extract?.var_name && hook.extract?.path) {
          const data = res.data.body;
          const val = hook.extract.path.split('.').reduce(
            (acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined),
            data,
          );
          if (val !== undefined) ctx[hook.extract.var_name] = String(val);
        }
      } catch { /* ignore hook errors */ }
    } else if (hook.type === 'http' && !hook.url && responseBody && hook.extract?.var_name && hook.extract?.path) {
      const val = hook.extract.path.split('.').reduce(
        (acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined),
        responseBody,
      );
      if (val !== undefined) ctx[hook.extract.var_name] = String(val);
    }
  }, Promise.resolve());
}

function statusTagType(code) {
  if (!code) return '';
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'primary';
  if (code >= 400 && code < 500) return 'warning';
  return 'danger';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJson(data) {
  if (data === null || data === undefined) return 'null';
  let str;
  try {
    str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    str = JSON.stringify(JSON.parse(str), null, 2);
  } catch { return escapeHtml(String(data)); }
  return escapeHtml(str).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-boolean';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    },
  );
}
</script>

<style scoped lang="scss">
.request-bar {
  display: flex; gap: 8px; align-items: center; margin-bottom: 16px;
  .env-select { width: 130px; flex-shrink: 0; }
  .base-url-input { flex: 2; }
  .method-select { width: 120px; flex-shrink: 0; }
  .path-input { flex: 3; }
}
.env-url-hint {
  margin-left: 8px;
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
}
.error-alert { margin-bottom: 12px; }
.param-tabs { margin-bottom: 16px; }
.param-table {
  padding: 8px 0;
  .param-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; .el-input { flex: 1; } }
}
.body-type-bar {
  display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #ebeef5; padding-bottom: 8px;
  .body-type-item {
    padding: 3px 10px; border-radius: 4px; font-size: 13px; cursor: pointer; color: #606266;
    transition: color 0.15s, background 0.15s;
    &:hover { color: var(--el-color-primary); }
    &.is-active { color: var(--el-color-primary); font-weight: 600; background: var(--el-color-primary-light-9); }
  }
}
.body-none-tip { font-size: 13px; color: #909399; padding: 12px 0; }
.hook-tab-tip { font-size: 12px; color: #909399; margin-bottom: 10px; }
.response-section {
  border-top: 1px solid var(--el-border-color-light); padding-top: 16px;
  .response-meta { display: flex; align-items: center; margin-bottom: 12px; font-size: 13px; gap: 6px; }
  .response-label { color: var(--el-text-color-secondary); }
  .response-time { font-weight: 500; }
  .response-body {
    background: #1e1e1e; border-radius: 6px; padding: 12px; overflow: auto; max-height: 400px;
    .json-highlight {
      margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.6; white-space: pre; color: #d4d4d4;
      :deep(.json-key) { color: #9cdcfe; }
      :deep(.json-string) { color: #ce9178; }
      :deep(.json-number) { color: #b5cea8; }
      :deep(.json-boolean) { color: #569cd6; }
      :deep(.json-null) { color: #569cd6; }
    }
  }
}
</style>
