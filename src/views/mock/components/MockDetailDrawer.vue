<template>
  <el-drawer
    :model-value="visible"
    title="Mock 详情"
    size="560px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <template v-if="mock">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Snow ID">
          <el-tag size="small" type="info">{{ mock.snow_id }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="应用名称">{{ mock.app_name }}</el-descriptions-item>
        <el-descriptions-item label="接口地址">
          <code class="path-code">{{ mock.path }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ mock.creator || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ mock.create_time }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ mock.update_time }}</el-descriptions-item>
      </el-descriptions>

      <!-- 调用说明 -->
      <div class="usage-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>如何使用此 Mock</span>
        </div>
        <div class="usage-desc">
          将请求发送到平台地址，在 Header 中携带
          <code>x-auth-mockid</code> 即可返回 Mock 数据。
        </div>
        <div class="usage-example">
          <div class="example-header">
            <span>cURL 示例</span>
            <el-button size="small" text type="primary" @click="copyCurl">
              复制
            </el-button>
          </div>
          <pre class="example-code">{{ curlExample }}</pre>
        </div>
      </div>

      <!-- 返回值 JSON -->
      <div class="json-section">
        <div class="json-header">
          <span>返回值 JSON</span>
          <el-button size="small" text type="primary" @click="copyJson">
            复制
          </el-button>
        </div>
        <pre class="json-preview">{{ formattedJson }}</pre>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean,
  mock: { type: Object, default: null },
});

defineEmits(['update:visible']);

const baseUrl = computed(() => process.env.VUE_APP_MOCK_SERVER || window.location.origin);

const curlExample = computed(() => {
  if (!props.mock) return '';
  const path = props.mock.path || '/your/api/path';
  return `curl -X GET "${baseUrl.value}${path}" \\
  -H "x-auth-mockid: ${props.mock.snow_id}"`;
});

const formattedJson = computed(() => {
  if (!props.mock?.re_data) return '';
  try {
    return JSON.stringify(JSON.parse(props.mock.re_data), null, 2);
  } catch {
    return props.mock.re_data;
  }
});

function copyText(text) {
  if (!text) return;
  // navigator.clipboard 仅在 HTTPS/localhost 下可用，HTTP 环境用 fallback
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('已复制到剪贴板');
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success('已复制到剪贴板');
  }
}

function copyCurl() { copyText(curlExample.value); }
function copyJson() { copyText(formattedJson.value); }
</script>

<style scoped>
.path-code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
  color: #303133;
}

.usage-section {
  margin-top: 20px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 6px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #67c23a;
  margin-bottom: 8px;
}

.usage-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.usage-desc code {
  background: #fff;
  border: 1px solid #e4e7ed;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
  color: #e6a23c;
}

.example-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.example-code {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-section {
  margin-top: 20px;
}

.json-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.json-preview {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  overflow: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
