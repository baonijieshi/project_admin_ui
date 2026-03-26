<template>
  <el-dialog
    :model-value="visible"
    :title="step === 'input' ? '从飞书导入' : '预览并创建需求'"
    width="800px"
    @update:model-value="handleDialogClose"
  >
    <!-- 第一步：输入飞书文档链接 -->
    <div v-if="step === 'input'">
      <!-- 未授权提示 -->
      <el-alert
        v-if="!userToken"
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #default>
          需要授权飞书账号才能访问文档。
          <el-button type="primary" link :loading="authorizing" @click="handleAuthorize">
            {{ authorizing ? '等待授权...' : '立即授权' }}
          </el-button>
        </template>
      </el-alert>
      <el-alert
        v-else
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #default>
          飞书已授权，可直接解析文档。
          <el-button type="primary" link @click="clearToken">重新授权</el-button>
        </template>
      </el-alert>

      <el-form ref="urlFormRef" :model="urlForm" :rules="urlRules" label-width="0">
        <el-form-item prop="docUrl">
          <el-input
            v-model="urlForm.docUrl"
            placeholder="请粘贴飞书文档链接，如 https://xxx.feishu.cn/docx/xxx"
            clearable
            :disabled="parsing"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <div v-if="parsing" class="parsing-tip">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在解析文档...</span>
      </div>
    </div>

    <!-- 第二步：预览编辑表单 -->
    <el-form v-if="step === 'preview'" ref="formRef" :model="form" :rules="formRules" label-width="80px">
      <el-form-item label="需求标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入需求标题" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属产品" prop="product">
            <el-select v-model="form.product" placeholder="请选择产品" clearable style="width: 100%">
              <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择" style="width: 100%">
              <el-option label="高" value="高" />
              <el-option label="中" value="中" />
              <el-option label="低" value="低" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="激活" value="激活" />
              <el-option label="开发中" value="开发中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="已关闭" value="已关闭" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="指派给">
            <UserCascader v-model="form.assignee" :user-list="userList" placeholder="请选择" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="描述">
        <div class="doc-preview" v-html="form.description" />
      </el-form-item>
    </el-form>

    <template #footer>
      <template v-if="step === 'input'">
        <el-button @click="handleDialogClose(false)">取消</el-button>
        <el-button type="primary" :loading="parsing" :disabled="parsing || !userToken" @click="handleParse">解析</el-button>
      </template>
      <template v-else>
        <el-button @click="handleDialogClose(false)">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认创建</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup>
import {
  ref, watch, getCurrentInstance,
} from 'vue';
import { ElMessage } from 'element-plus';
import { Link, Loading } from '@element-plus/icons-vue';
import {
  parseFeishuDoc, createStory, getFeishuAuthUrl, exchangeFeishuToken,
} from '@/api/story';
import UserCascader from '@/components/UserCascader.vue';

const FEISHU_URL_REGEX = /https?:\/\/[\w.-]+\.(feishu\.cn|larkoffice\.com)\/(docx|wiki|docs)\/([\w-]+)/;
const TOKEN_KEY = 'feishu_user_access_token';
const TOKEN_EXPIRE_KEY = 'feishu_user_token_expire';

const props = defineProps({
  visible: Boolean,
  productList: { type: Array, default: () => [] },
  userList: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'imported']);

const instance = getCurrentInstance();

const step = ref('input');
const parsing = ref(false);
const creating = ref(false);
const authorizing = ref(false);

// user_access_token 存 sessionStorage，页面关闭即清除
const userToken = ref('');

function loadToken() {
  const expire = parseInt(sessionStorage.getItem(TOKEN_EXPIRE_KEY) || '0', 10);
  if (expire && Date.now() < expire) {
    userToken.value = sessionStorage.getItem(TOKEN_KEY) || '';
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRE_KEY);
    userToken.value = '';
  }
}

function saveToken(token, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRE_KEY, String(Date.now() + expiresIn * 1000 - 60000));
  userToken.value = token;
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRE_KEY);
  userToken.value = '';
}

// 监听 OAuth 回调 postMessage
let oauthWindow = null;

function handleOAuthMessage(event) {
  if (event.data?.type !== 'feishu_oauth_callback') return;
  const { code, error } = event.data;
  if (error) {
    ElMessage.error('飞书授权失败：' + error);
    authorizing.value = false;
    return;
  }
  if (!code) return;
  // 用 code 换 token
  const redirectUri = `${window.location.origin}/feishu-callback.html`;
  exchangeFeishuToken({ code, redirect_uri: redirectUri }).then((res) => {
    if (!instance?.isMounted) return;
    if (res.code === 200 && res.data?.access_token) {
      saveToken(res.data.access_token, res.data.expires_in || 7200);
      ElMessage.success('飞书授权成功');
    } else {
      ElMessage.error(res.message || '授权失败，请重试');
    }
  }).catch(() => {
    if (!instance?.isMounted) return;
    ElMessage.error('授权失败，请重试');
  }).finally(() => {
    if (!instance?.isMounted) return;
    authorizing.value = false;
    if (oauthWindow) { oauthWindow.close(); oauthWindow = null; }
  });
}

async function handleAuthorize() {
  authorizing.value = true;
  try {
    const redirectUri = `${window.location.origin}/feishu-callback.html`;
    const res = await getFeishuAuthUrl(redirectUri);
    if (res.code !== 200 || !res.data?.auth_url) {
      ElMessage.error('获取授权链接失败');
      authorizing.value = false;
      return;
    }
    // 弹出授权窗口
    oauthWindow = window.open(res.data.auth_url, 'feishu_oauth', 'width=600,height=700,left=200,top=100');
    if (!oauthWindow) {
      ElMessage.error('弹窗被拦截，请允许弹窗后重试');
      authorizing.value = false;
    }
  } catch {
    ElMessage.error('获取授权链接失败');
    authorizing.value = false;
  }
}

const urlFormRef = ref(null);
const urlForm = ref({ docUrl: '' });

const validateDocUrl = (_rule, value, callback) => {
  if (!value || !value.trim()) {
    callback(new Error('请输入飞书文档链接'));
  } else if (!FEISHU_URL_REGEX.test(value.trim())) {
    callback(new Error('请输入有效的飞书文档链接'));
  } else {
    callback();
  }
};

const urlRules = {
  docUrl: [{ validator: validateDocUrl, trigger: 'blur' }],
};

const formRef = ref(null);

const defaultForm = () => ({
  title: '',
  description: '',
  product: null,
  priority: '中',
  status: '激活',
  assignee: null,
  estimate: '',
});

const form = ref(defaultForm());

const formRules = {
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
};

watch(() => props.visible, (val) => {
  if (val) {
    loadToken();
    step.value = 'input';
    urlForm.value = { docUrl: '' };
    form.value = defaultForm();
    parsing.value = false;
    creating.value = false;
    window.addEventListener('message', handleOAuthMessage);
  } else {
    window.removeEventListener('message', handleOAuthMessage);
    if (oauthWindow) { oauthWindow.close(); oauthWindow = null; }
  }
});

const handleDialogClose = (val) => { emit('update:visible', val); };

const handleParse = async () => {
  if (!urlFormRef.value) return;
  try {
    await urlFormRef.value.validate();
  } catch {
    return;
  }
  parsing.value = true;
  try {
    const payload = { url: urlForm.value.docUrl.trim() };
    if (userToken.value) payload.user_access_token = userToken.value;
    const res = await parseFeishuDoc(payload);
    if (res.code === 200 && res.data) {
      form.value.title = res.data.title || '';
      form.value.description = res.data.content || '';
      step.value = 'preview';
    } else {
      const msg = res.message || '解析失败，请重试';
      ElMessage.error(msg);
      if (msg.includes('权限') || msg.includes('授权')) {
        clearToken();
      }
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '解析失败，请重试';
    ElMessage.error(msg);
    // 权限不足时清除旧 token，引导重新授权
    if (msg.includes('权限') || msg.includes('授权')) {
      clearToken();
    }
  } finally {
    parsing.value = false;
  }
};

const handleCreate = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  creating.value = true;
  try {
    await createStory(form.value);
    ElMessage.success('导入成功');
    emit('update:visible', false);
    emit('imported');
  } catch {
    ElMessage.error('创建需求失败，请重试');
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped lang="scss">
.parsing-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  color: #909399;
  font-size: 14px;
}

.doc-preview {
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.7;
  color: #303133;

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 12px 0 6px;
    font-weight: 600;
  }
  :deep(p) { margin: 4px 0; }
  :deep(ul), :deep(ol) { padding-left: 20px; margin: 4px 0; }
  :deep(li) { margin: 2px 0; }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }
  :deep(th), :deep(td) {
    border: 1px solid #dcdfe6;
    padding: 6px 10px;
    vertical-align: top;
  }
  :deep(th) { background: #f5f7fa; font-weight: 600; }
  :deep(blockquote) {
    border-left: 3px solid #dcdfe6;
    margin: 6px 0;
    padding: 4px 12px;
    color: #606266;
  }
  :deep(pre) {
    background: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
  }
  :deep(hr) { border: none; border-top: 1px solid #dcdfe6; margin: 10px 0; }
  :deep(img) { max-width: 100%; }
}
</style>
