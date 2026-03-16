<template>
  <el-drawer
    :model-value="visible"
    :title="editingId ? '编辑接口' : '新增接口'"
    size="600px"
    direction="rtl"
    :before-close="handleClose"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      label-position="left"
    >
      <el-form-item label="接口名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入接口名称" clearable />
      </el-form-item>
      <el-form-item label="所属服务">
        <el-select v-model="form.service" placeholder="请选择服务（选填）" clearable style="width: 100%">
          <el-option v-for="svc in serviceList" :key="svc.id" :label="svc.name" :value="svc.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="HTTP Method" prop="method">
        <el-select v-model="form.method" placeholder="请选择请求方法" style="width: 100%">
          <el-option v-for="m in HTTP_METHODS" :key="m" :label="m" :value="m">
            <el-tag :type="methodTagType(m)" size="small" effect="plain">{{ m }}</el-tag>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="接口路径" prop="path">
        <el-input v-model="form.path" placeholder="例如：/api/users/{id}" clearable />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="接口描述（选填）" />
      </el-form-item>

      <!-- 请求参数区域 -->
      <div class="section-header" @click="paramsExpanded = !paramsExpanded">
        <span class="section-title">请求参数</span>
        <el-icon class="toggle-icon" :class="{ 'is-expanded': paramsExpanded }"><ArrowRight /></el-icon>
      </div>
      <div class="collapsible-section" :class="{ 'is-expanded': paramsExpanded }">
        <div class="section-content">
          <el-tabs v-model="activeParamTab">
            <el-tab-pane label="Query" name="query">
              <div class="param-table">
                <div v-for="(row, idx) in form.parameters.query" :key="idx" class="param-row">
                  <el-input v-model="row.key" placeholder="Key" size="small" />
                  <el-input v-model="row.value" placeholder="Value" size="small" />
                  <el-input v-model="row.description" placeholder="描述" size="small" />
                  <el-button size="small" type="danger" link @click="removeParam('query', idx)">删除</el-button>
                </div>
                <el-button size="small" type="primary" link @click="addParam('query')">+ 添加参数</el-button>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Header" name="header">
              <div class="param-table">
                <div v-for="(row, idx) in form.parameters.header" :key="idx" class="param-row">
                  <el-input v-model="row.key" placeholder="Key" size="small" />
                  <el-input v-model="row.value" placeholder="Value" size="small" />
                  <el-input v-model="row.description" placeholder="描述" size="small" />
                  <el-button size="small" type="danger" link @click="removeParam('header', idx)">删除</el-button>
                </div>
                <el-button size="small" type="primary" link @click="addParam('header')">+ 添加参数</el-button>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Body" name="body">
              <!-- Body 类型选择栏 -->
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
              <div v-if="bodyType === 'none'" class="body-none-tip">
                该请求没有 Body 参数
              </div>
              <!-- form-data / x-www-form-urlencoded：键值对 -->
              <div v-else-if="isFormBodyType" class="param-table">
                <div v-for="(row, idx) in currentBodyRows" :key="idx" class="param-row">
                  <el-input v-model="row.key" placeholder="Key" size="small" />
                  <el-input v-model="row.value" placeholder="Value" size="small" />
                  <el-input v-model="row.description" placeholder="描述" size="small" />
                  <el-button size="small" type="danger" link @click="removeBodyRow(idx)">删除</el-button>
                </div>
                <el-button size="small" type="primary" link @click="addBodyRow">+ 添加参数</el-button>
              </div>
              <!-- JSON：树形字段编辑器 -->
              <div v-else-if="bodyType === 'json'">
                <div class="json-field-header">
                  <span class="col-name">字段名</span>
                  <span class="col-type">类型</span>
                  <span class="col-required">必填</span>
                  <span class="col-desc">描述</span>
                  <span class="col-action" />
                </div>
                <div
                  v-for="(field, idx) in bodyStore.json"
                  :key="idx"
                  class="json-field-row"
                >
                  <el-input v-model="field.key" placeholder="字段名" size="small" class="col-name" />
                  <el-select v-model="field.type" size="small" class="col-type">
                    <el-option v-for="t in FIELD_TYPES" :key="t" :label="t" :value="t" />
                  </el-select>
                  <el-checkbox v-model="field.required" class="col-required" />
                  <el-input v-model="field.description" placeholder="描述" size="small" class="col-desc" />
                  <el-button size="small" type="danger" link class="col-action" @click="removeJsonField(idx)">删除</el-button>
                </div>
                <el-button size="small" type="primary" link @click="addJsonField">+ 添加字段</el-button>
              </div>
              <!-- XML / Text / Binary：文本编辑器 -->
              <div v-else>
                <el-input
                  v-model="bodyStore[bodyType]"
                  type="textarea"
                  :rows="8"
                  :placeholder="bodyPlaceholder(bodyType)"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 响应示例区域 -->
      <div class="section-header" @click="responseExpanded = !responseExpanded">
        <span class="section-title">响应示例</span>
        <el-icon class="toggle-icon" :class="{ 'is-expanded': responseExpanded }"><ArrowRight /></el-icon>
      </div>
      <div class="collapsible-section" :class="{ 'is-expanded': responseExpanded }">
        <div class="section-content">
          <el-input v-model="form.response_example" type="textarea" :rows="6" placeholder="粘贴响应示例 JSON（选填）" />
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import {
  ref, reactive, computed, watch
} from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  createApi, getApiDetail, updateApi, getServiceList,
} from '@/api/apiManage';

const props = defineProps({
  visible: { type: Boolean, default: false },
  editingId: { type: [Number, String], default: null },
  defaultServiceId: { type: [Number, String], default: null },
});
const emit = defineEmits(['update:visible', 'saved']);

const serviceList = ref([]);
async function loadServices() {
  const res = await getServiceList();
  if (res.code === 200) serviceList.value = res.data || [];
}
loadServices();

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
const FORM_TYPES = ['form-data', 'x-www-form-urlencoded'];
const FIELD_TYPES = ['string', 'integer', 'number', 'boolean', 'object', 'array'];
const METHOD_TAG_TYPE = {
  GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'info', DELETE: 'danger',
};
const methodTagType = (m) => METHOD_TAG_TYPE[m] || '';

function bodyPlaceholder(type) {
  if (type === 'xml') return '<root>\n  <key>value</key>\n</root>';
  if (type === 'binary') return '（Binary 类型请在调试面板中上传文件）';
  return '请输入内容';
}

const formRef = ref(null);
const saving = ref(false);
const paramsExpanded = ref(false);
const responseExpanded = ref(false);
const activeParamTab = ref('query');

// body 类型独立存储
// json 存字段数组 [{ key, type, required, description }]
// 其他文本类型存字符串
const bodyType = ref('none');
const bodyStore = reactive({
  'form-data': [],
  'x-www-form-urlencoded': [],
  json: [], // 字段列表
  xml: '',
  text: '',
  binary: '',
});

const isFormBodyType = computed(() => FORM_TYPES.includes(bodyType.value));
const currentBodyRows = computed(() => bodyStore[bodyType.value] || []);

function switchBodyType(newType) {
  bodyType.value = newType;
}

function addBodyRow() {
  const key = bodyType.value;
  if (!Array.isArray(bodyStore[key])) bodyStore[key] = [];
  bodyStore[key].push({ key: '', value: '', description: '' });
}
function removeBodyRow(index) {
  const key = bodyType.value;
  if (Array.isArray(bodyStore[key])) bodyStore[key].splice(index, 1);
}

// JSON 字段编辑器操作
function addJsonField() {
  bodyStore.json.push({
    key: '', type: 'string', required: false, description: '',
  });
}
function removeJsonField(index) {
  bodyStore.json.splice(index, 1);
}

function serializeBody() {
  if (bodyType.value === 'none') return { type: 'none', content: '' };
  if (FORM_TYPES.includes(bodyType.value)) {
    return { type: bodyType.value, content: bodyStore[bodyType.value] };
  }
  return { type: bodyType.value, content: bodyStore[bodyType.value] };
}

// 从 JSON Schema 对象解析为字段列表（兼容 Swagger 导入的旧格式）
function schemaToFields(schema) {
  if (!schema || typeof schema !== 'object') return [];
  const props = schema.properties || {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  return Object.entries(props).map(([k, v]) => ({
    key: k,
    type: v.type || 'string',
    required: required.includes(k),
    description: v.title || v.description || '',
  }));
}

function restoreBody(rawBody) {
  bodyStore['form-data'] = [];
  bodyStore['x-www-form-urlencoded'] = [];
  bodyStore.json = [];
  bodyStore.xml = '';
  bodyStore.text = '';
  bodyStore.binary = '';

  if (!rawBody) { bodyType.value = 'none'; return; }
  if (Array.isArray(rawBody)) {
    bodyType.value = 'form-data';
    bodyStore['form-data'] = rawBody;
    return;
  }
  const t = rawBody.type || 'none';
  bodyType.value = t;
  if (t === 'none') return;
  if (FORM_TYPES.includes(t)) {
    bodyStore[t] = Array.isArray(rawBody.content) ? rawBody.content : [];
  } else if (t === 'json') {
    const { content } = rawBody;
    if (Array.isArray(content)) {
      // 新格式：字段列表
      bodyStore.json = content;
    } else if (typeof content === 'string' && content.trim()) {
      // 旧格式：JSON Schema 字符串，尝试解析
      try {
        bodyStore.json = schemaToFields(JSON.parse(content));
      } catch {
        bodyStore.json = [];
      }
    } else if (content && typeof content === 'object') {
      // 旧格式：JSON Schema 对象
      bodyStore.json = schemaToFields(content);
    }
  } else {
    bodyStore[t] = typeof rawBody.content === 'string' ? rawBody.content : '';
  }
}

const form = reactive({
  name: '',
  method: '',
  path: '',
  description: '',
  service: null,
  parameters: { query: [], header: [] },
  response_example: '',
});

const rules = {
  name: [{ required: true, message: '请输入接口名称', trigger: 'blur' }],
  method: [{ required: true, message: '请选择 HTTP Method', trigger: 'change' }],
  path: [{ required: true, message: '请输入接口路径', trigger: 'blur' }],
};

function addParam(tab) { form.parameters[tab].push({ key: '', value: '', description: '' }); }
function removeParam(tab, index) { form.parameters[tab].splice(index, 1); }

function resetForm() {
  form.name = '';
  form.method = '';
  form.path = '';
  form.description = '';
  form.service = props.defaultServiceId ?? null;
  form.parameters.query = [];
  form.parameters.header = [];
  form.response_example = '';
  restoreBody(null);
  paramsExpanded.value = false;
  responseExpanded.value = false;
  activeParamTab.value = 'query';
  formRef.value?.clearValidate();
}

watch(() => props.visible, async (val) => {
  if (val) {
    resetForm();
    if (props.editingId) {
      try {
        const res = await getApiDetail(props.editingId);
        if (res?.data) {
          const d = res.data;
          form.name = d.name || '';
          form.method = d.method || '';
          form.path = d.path || '';
          form.description = d.description || '';
          form.service = d.service ?? null;
          form.response_example = d.response_example || '';
          const p = d.parameters || {};
          form.parameters.query = Array.isArray(p.query) ? p.query : [];
          form.parameters.header = Array.isArray(p.header) ? p.header : [];
          restoreBody(p.body);
        }
      } catch { ElMessage.error('获取接口详情失败'); }
    }
  }
});

function handleClose() { emit('update:visible', false); }

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      method: form.method,
      path: form.path,
      description: form.description,
      service: form.service,
      parameters: {
        query: form.parameters.query,
        header: form.parameters.header,
        body: serializeBody(),
      },
      response_example: form.response_example,
    };
    if (props.editingId) {
      await updateApi(props.editingId, payload);
      ElMessage.success('接口已更新');
    } else {
      await createApi(payload);
      ElMessage.success('接口已保存');
    }
    emit('update:visible', false);
    emit('saved');
  } catch { /* request.js 拦截器统一处理 */ } finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  user-select: none;
  &:hover { color: var(--el-color-primary); }
  .section-title { font-size: 14px; font-weight: 600; }
  .toggle-icon { transition: transform 200ms ease; &.is-expanded { transform: rotate(90deg); } }
}
.collapsible-section {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease;
  &.is-expanded { max-height: 800px; }
  .section-content { padding: 12px 0 8px; }
}
.param-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; .el-input { flex: 1; } }
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

// JSON 字段编辑器
.json-field-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0 6px;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 6px;
}
.json-field-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.col-name { flex: 2; min-width: 0; }
.col-type { flex: 1.2; min-width: 90px; }
.col-required { flex: 0 0 40px; display: flex; justify-content: center; }
.col-desc { flex: 2; min-width: 0; }
.col-action { flex: 0 0 36px; }

.drawer-footer { display: flex; justify-content: flex-end; gap: 8px; }
</style>
