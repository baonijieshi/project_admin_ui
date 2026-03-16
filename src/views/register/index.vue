<template>
  <div class="register-container">
    <el-form
      ref="registerFormRef"
      :model="registerForm"
      :rules="registerRules"
      class="register-form"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">用户注册</h3>
      </div>

      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          placeholder="用户名"
          name="username"
          type="text"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="email">
        <el-input
          v-model="registerForm.email"
          placeholder="邮箱"
          name="email"
          type="email"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="phone">
        <el-input
          v-model="registerForm.phone"
          placeholder="请输入飞书注册的手机号"
          name="phone"
          type="text"
        >
          <template #prefix>
            <el-icon><Phone /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          :type="passwordType"
          placeholder="密码"
          name="password"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
          <template #suffix>
            <el-icon class="show-pwd" @click="showPwd">
              <component :is="passwordType === 'password' ? 'View' : 'Hide'" />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="确认密码"
          name="confirmPassword"
          @keyup.enter="handleRegister"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="agree">
        <el-checkbox v-model="registerForm.agree">
          我已阅读并同意
          <a href="#" class="link">《用户协议》</a>
          和
          <a href="#" class="link">《隐私政策》</a>
        </el-checkbox>
      </el-form-item>

      <el-button
        :loading="loading"
        type="primary"
        style="width: 100%; margin-bottom: 20px"
        @click.prevent="handleRegister"
      >
        注册
      </el-button>

      <div class="login-link">
        已有账号？
        <router-link to="/login">立即登录</router-link>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const registerFormRef = ref(null);

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'));
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'));
  } else {
    if (registerForm.confirmPassword !== '') {
      registerFormRef.value.validateField('confirmPassword');
    }
    callback();
  }
};

const validateConfirmPass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

const validateAgree = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议'));
  } else {
    callback();
  }
};

const registerForm = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false,
});

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur'
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPass, trigger: 'blur' }],
  agree: [{ validator: validateAgree, trigger: 'change' }],
};

const passwordType = ref('password');
const loading = ref(false);

const showPwd = () => {
  passwordType.value = passwordType.value === 'password' ? '' : 'password';
};

const handleRegister = async () => {
  await registerFormRef.value.validate();
  loading.value = true;
  try {
    // 这里应该调用注册API
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
    ElMessage.success('注册成功，请登录');
    router.push('/login');
  } catch (error) {
    ElMessage.error('注册失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  width: 100%;
  background-image: url('@/assets/think.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8%;
  position: relative;

  .register-form {
    position: relative;
    width: 420px;
    max-width: 90%;
    padding: 40px 35px 30px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
    z-index: 1;

    .title-container {
      position: relative;
      text-align: center;
      margin-bottom: 35px;

      .title {
        font-size: 28px;
        color: #d4825f;
        margin: 0 auto 10px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(212, 130, 95, 0.15);
      }
    }

    .el-form-item {
      margin-bottom: 20px;
    }

    .link {
      color: #d4825f;
      text-decoration: none;
      transition: all 0.3s;

      &:hover {
        color: #e8956f;
        text-decoration: underline;
      }
    }

    .login-link {
      text-align: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;

      a {
        color: #d4825f;
        text-decoration: none;
        margin-left: 5px;
        font-weight: 500;
        transition: all 0.3s;

        &:hover {
          color: #e8956f;
          text-decoration: underline;
        }
      }
    }

    .show-pwd {
      cursor: pointer;
      user-select: none;
      transition: color 0.3s;

      &:hover {
        color: #d4825f;
      }
    }

    :deep(.el-button--primary) {
      background: linear-gradient(135deg, #e8956f 0%, #d4825f 100%);
      border: none;
      border-radius: 25px;
      height: 45px;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(232, 149, 111, 0.4);
      }
    }

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}
</style>
