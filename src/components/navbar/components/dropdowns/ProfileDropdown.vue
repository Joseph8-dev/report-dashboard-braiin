<template>
  <div class="profile-dropdown-wrapper">
    <VaDropdown v-model="isShown" :offset="[9, 0]" class="profile-dropdown" stick-to-edges>
      <template #anchor>
        <VaButton preset="secondary" color="textPrimary">
          <span class="profile-dropdown__anchor min-w-max">
            {{ t('Admin') }}
            <VaAvatar :size="32" color="warning"> 🧑‍💻 </VaAvatar>
          </span>
        </VaButton>
      </template>

      <VaDropdownContent
        class="profile-dropdown__content md:w-60 px-0 py-4 w-full"
        :style="{ '--hover-color': hoverColor }"
      >
        <VaList>
          <VaListItem
            class="menu-item px-4 text-base cursor-pointer h-8"
            @click="logout"
          >
            <VaIcon name="mso-logout" class="pr-1" color="secondary" />
            {{ t('user.logout') }}
          </VaListItem>
        </VaList>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useColors } from 'vuestic-ui'
import {
  VaDropdown,
  VaDropdownContent,
  VaList,
  VaListItem,
  VaButton,
  VaAvatar,
  VaIcon,
} from 'vuestic-ui'

const router = useRouter()
const { t } = useI18n()
const { colors, setHSLAColor } = useColors()
const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }))

const isShown = ref(false)

const logout = () => {
  // Clear stored JWT and user info
  localStorage.removeItem('report_token')
  localStorage.removeItem('report_user')

  // Optionally clear sessionStorage as well
  sessionStorage.clear()

  // Redirect to login
  router.push({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.profile-dropdown {
  cursor: pointer;

  &__content {
    .menu-item:hover {
      background: var(--hover-color);
    }
  }

  &__anchor {
    display: inline-block;
  }
}
</style>
