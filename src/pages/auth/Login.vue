<template>
  <div class="notranslate" translate="no">
    <VaForm
      ref="form"
      class="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300"
      @submit.prevent="submit"
    >
      <h1 class="font-semibold text-4xl mb-6 text-center">{{ text_loginTitle }}</h1>

      <VaInput
        v-model="formData.email"
        :rules="[validators.required]"
        class="mb-4"
        :label="text_userLabel"
        type="text"
        rounded
        border
        :placeholder="text_userPlaceholder"
      />

      <VaValue v-slot="isPasswordVisible" :default-value="false">
        <VaInput
          v-model="formData.password"
          :rules="[validators.required]"
          :type="isPasswordVisible.value ? 'text' : 'password'"
          class="mb-4"
          :label="text_passwordLabel"
          rounded
          border
          :placeholder="text_passwordPlaceholder"
          @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
        >
          <template #appendInner>
            <VaIcon
              :name="isPasswordVisible.value ? iconHidden : iconVisible"
              class="cursor-pointer"
              color="secondary"
            />
          </template>
        </VaInput>
      </VaValue>

      <div class="flex justify-center mb-6">
        <VaCheckbox
          v-model="formData.keepLoggedIn"
          :label="text_keepLoggedIn"
        />
      </div>

      <div class="flex justify-center">
        <VaButton
          class="w-full py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all"
          @click="submit"
        >
          {{ text_loginButton }}
        </VaButton>
      </div>
    </VaForm>
  </div>
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

/* Prevent Chrome Translate from breaking icon names */
const iconVisible = 'mso-' + 'visibility'
const iconHidden = 'mso-' + 'visibility_off'

/* Protect all text from Chrome Translator by using JS variables */
const text_loginTitle = 'Iniciar sesión'
const text_userLabel = 'Usuario'
const text_userPlaceholder = 'Ingresa tu nombre de usuario'
const text_passwordLabel = 'Contraseña'
const text_passwordPlaceholder = 'Ingresa tu contraseña'
const text_keepLoggedIn = 'Mantenerme conectado en este dispositivo'
const text_loginButton = 'Iniciar sesión'

/* Your existing logic */


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
    init({ message: "Has iniciado sesión correctamente", color: 'success' })
    router.push({ name: 'dashboard' })
  } else {
    init({ message: data.error || 'Credenciales inválidas', color: 'danger' })
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
