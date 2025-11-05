<template>
  <VaForm
    ref="form"
    class="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300"
    @submit.prevent="submit"
  >
    <h1 class="font-semibold text-4xl mb-6 text-center">Log in</h1>

    <VaInput
      v-model="formData.email"
      :rules="[validators.required]"
      class="mb-4"
      label="Username"
      type="text"
      rounded
      border
      placeholder="Enter your username"
    />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="formData.password"
        :rules="[validators.required]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Password"
        rounded
        border
        placeholder="Enter your password"
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="secondary"
          />
        </template>
      </VaInput>
    </VaValue>

    <div class="flex justify-center mb-6">
      <VaCheckbox v-model="formData.keepLoggedIn" label="Keep me signed in on this device" />
    </div>

    <div class="flex justify-center">
      <VaButton
        class="w-full py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all"
        @click="submit"
      >
        Login
      </VaButton>
    </div>
  </VaForm>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, useToast } from 'vuestic-ui'
import { validators } from '../../services/utils'

const { validate } = useForm('form')
const router = useRouter()
const { init } = useToast()

const formData = reactive({
  email: '',
  password: '',
  keepLoggedIn: false,
})

const submit = async () => {
  if (!validate()) return

  const response = await fetch('https://dev-sec.app/api/report-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: formData.email,
      password: formData.password,
    }),
  })

  const data = await response.json()

  if (data.success) {
    localStorage.setItem('report_token', data.token)
    localStorage.setItem('report_user', JSON.stringify(data.user))
    init({ message: "You've successfully logged in", color: 'success' })
    router.push({ name: 'dashboard' })
  } else {
    init({ message: data.error || 'Invalid credentials', color: 'danger' })
  }
}
</script>

<style scoped>
body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
}

/* Enhance card shadow and hover effect */
.va-form {
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.va-form:hover {
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.2),
    0 6px 16px rgba(0, 0, 0, 0.12);
}
</style>
